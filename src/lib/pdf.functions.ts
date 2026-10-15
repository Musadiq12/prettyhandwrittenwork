import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createHmac } from "node:crypto";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const input = z.object({
  code: z.string().trim().min(4).max(20),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/),
});

const WINDOW_MS = 15 * 60 * 1000;
const MAX_LOOKUPS_PER_WINDOW = 8;
const RETENTION_MS = 24 * 60 * 60 * 1000;

function hashLookupKey(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

async function isRateLimited(code: string, phone: string): Promise<boolean> {
  const request = getRequest();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const secret = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!secret) throw new Error("PDF lookup protection is not configured");

  // Only use proxy-specific headers whose values are set by the hosting edge.
  // Do not trust the caller-controlled X-Forwarded-For header.
  const trustedIp =
    request?.headers.get("cf-connecting-ip")?.trim() ||
    request?.headers.get("x-real-ip")?.trim();

  const keys = [
    hashLookupKey(secret, `phone:${phone}`),
    hashLookupKey(secret, `pair:${code.toUpperCase()}:${phone}`),
    ...(trustedIp ? [hashLookupKey(secret, `ip:${trustedIp}`)] : []),
  ];

  const cutoff = new Date(Date.now() - WINDOW_MS).toISOString();
  const retentionCutoff = new Date(Date.now() - RETENTION_MS).toISOString();

  // Keep the table bounded without storing raw personal data.
  await supabaseAdmin
    .from("pdf_lookup_attempts")
    .delete()
    .lt("attempted_at", retentionCutoff);

  const { error: insertError } = await supabaseAdmin
    .from("pdf_lookup_attempts")
    .insert(keys.map((client_key_hash) => ({ client_key_hash })));

  if (insertError) throw new Error("PDF lookup protection is unavailable");

  for (const key of keys) {
    const { count, error } = await supabaseAdmin
      .from("pdf_lookup_attempts")
      .select("id", { count: "exact", head: true })
      .eq("client_key_hash", key)
      .gte("attempted_at", cutoff);

    if (error) throw new Error("PDF lookup protection is unavailable");
    if ((count ?? 0) > MAX_LOOKUPS_PER_WINDOW) return true;
  }

  return false;
}

// Public entry point; throttled before it accesses order or file information.
export const getCustomerPdfs = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }) => {
    if (await isRateLimited(data.code, data.phone)) {
      return { found: false as const, files: [] };
    }

    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) throw new Error("PDF lookup is not configured");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: paths, error } = await supabaseAdmin.rpc("lookup_order_pdfs", {
      _code: data.code,
      _phone: data.phone,
    });

    if (error) throw new Error("Lookup failed");
    if (!paths) return { found: false as const, files: [] };
    if (paths.length === 0) return { found: true as const, files: [] };

    const files: { name: string; url: string }[] = [];
    for (const [i, path] of paths.entries()) {
      const { data: signed, error: signError } = await supabaseAdmin.storage
        .from("order-pdfs")
        .createSignedUrl(path, 600, {
          download: `${data.code.toUpperCase()}-${i + 1}.pdf`,
        });
      if (!signError && signed?.signedUrl) {
        files.push({ name: `${data.code.toUpperCase()} – part ${i + 1}`, url: signed.signedUrl });
      }
    }

    return { found: true as const, files };
  });
