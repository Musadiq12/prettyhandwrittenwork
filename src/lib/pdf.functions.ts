import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const input = z.object({
  code: z.string().trim().min(4).max(20),
  phone: z.string().trim().regex(/^[6-9]\\d{9}$/),
});

async function hashClientIp(): Promise<string> {
  // Cloudflare overwrites this header at the edge. x-real-ip is a fallback for
  // trusted reverse proxies; do not rely on arbitrary client-supplied headers.
  const ip =
    getRequestHeader("cf-connecting-ip")?.trim() ||
    getRequestHeader("x-real-ip")?.trim() ||
    "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(ip),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

// Public endpoint: order code + WhatsApp number are required to retrieve files.
// Database-backed throttling works across server instances, unlike an in-memory counter.
export const getCustomerPdfs = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const keyHash = await hashClientIp();

    const { data: allowed, error: rateLimitError } = await supabaseAdmin.rpc(
      "consume_pdf_lookup_rate_limit",
      { _key_hash: keyHash },
    );
    if (rateLimitError) {
      console.error("PDF lookup rate-limit check failed.");
      throw new Error("Download service temporarily unavailable.");
    }
    if (!allowed) {
      // Do not reveal whether an order code/phone combination exists.
      return { found: false as const, files: [] };
    }

    const { data: paths, error } = await supabaseAdmin.rpc("lookup_order_pdfs", {
      _code: data.code,
      _phone: data.phone,
    });
    if (error) {
      console.error("PDF order lookup failed.");
      throw new Error("Download service temporarily unavailable.");
    }
    if (!paths || paths.length === 0) return { found: false as const, files: [] };

    const files: { name: string; url: string }[] = [];
    for (const [i, path] of paths.entries()) {
      const { data: signed, error: signError } = await supabaseAdmin.storage
        .from("order-pdfs")
        .createSignedUrl(path, 600, {
          download: `${data.code.trim().toUpperCase()}-${i + 1}.pdf`,
        });
      if (signError) {
        console.error("PDF signed URL creation failed.");
        throw new Error("Download service temporarily unavailable.");
      }
      if (signed?.signedUrl) {
        files.push({
          name: `${data.code.trim().toUpperCase()} – part ${i + 1}`,
          url: signed.signedUrl,
        });
      }
    }
    return { found: files.length > 0, files };
  });
