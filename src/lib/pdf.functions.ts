import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const input = z.object({
  code: z.string().trim().min(4).max(20),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/),
});

// Public: customer proves ownership with order code + WhatsApp number.
export const getCustomerPdfs = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"]!;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const pub = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (i, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(i, { ...init, headers: h });
        },
      },
    });
    const { data: paths, error } = await pub.rpc("lookup_order_pdfs", { _code: data.code, _phone: data.phone });
    if (error) throw new Error("Lookup failed");
    if (!paths) return { found: false as const, files: [] };
    if (paths.length === 0) return { found: true as const, files: [] };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const files: { name: string; url: string }[] = [];
    for (const [i, p] of paths.entries()) {
      const { data: s } = await supabaseAdmin.storage.from("order-pdfs").createSignedUrl(p, 600, {
        download: `${data.code.toUpperCase()}-${i + 1}.pdf`,
      });
      if (s?.signedUrl) files.push({ name: `${data.code.toUpperCase()} – part ${i + 1}`, url: s.signedUrl });
    }
    return { found: true as const, files };
  });
