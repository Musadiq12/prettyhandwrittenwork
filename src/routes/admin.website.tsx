import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { siteContentQuery, useSiteContent } from "@/lib/site-content";
import { SiteContentEditor } from "@/components/admin/SiteContentEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/website")({
  component: WebsiteContentPage,
});

function WebsiteContentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-hand text-4xl font-bold">Website</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage the public homepage, images, contact links, SEO, services, pricing messages, FAQ and testimonials.</p>
      </div>
      <HeaderLogoEditor />
      <SiteContentEditor />
    </div>
  );
}

function HeaderLogoEditor() {
  const content = useSiteContent();
  const qc = useQueryClient();
  const [url, setUrl] = useState(content.headerLogoUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [imageStatus, setImageStatus] = useState<"idle" | "loading" | "valid" | "invalid">("idle");

  useEffect(() => setUrl(content.headerLogoUrl ?? ""), [content.headerLogoUrl]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = url.trim();
    if (value && !value.startsWith("/") && !/^https:\/\//i.test(value)) {
      toast.error("Use an https image URL or a site path such as /images/logo.png.");
      return;
    }
    if (value && imageStatus !== "valid") {
      toast.error("Please wait for the logo preview to load successfully. Use a direct image-file URL, not a sharing page link.");
      return;
    }
    setBusy(true);
    try {
      const { data: row, error: readError } = await supabase
        .from("site_content").select("content").eq("id", 1).maybeSingle();
      if (readError) throw readError;
      const existing = row?.content && typeof row.content === "object" && !Array.isArray(row.content)
        ? row.content as Record<string, unknown> : {};
      const { data: saved, error } = await supabase.from("site_content")
        .update({ content: { ...existing, headerLogoUrl: value }, updated_at: new Date().toISOString() })
        .eq("id", 1).select("content").maybeSingle();
      if (error) throw error;
      if (!saved) throw new Error("No settings row was updated. Check administrator permissions.");
      await qc.invalidateQueries({ queryKey: siteContentQuery.queryKey });
      toast.success("Header logo saved.");
    } catch (err) {
      toast.error("Could not save header logo: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4 rounded-xl border bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold">Header logo / Home button</h2>
        <p className="mt-1 text-sm text-muted-foreground">Paste a direct image URL or a path to an image uploaded to the website. Leave blank to use the default book icon.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="header-logo-url">Logo image URL or path</Label>
        <Input id="header-logo-url" type="text" placeholder="https://example.com/logo.png or /images/logo.png" value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      {url.trim() && <div className="flex items-center gap-3 rounded-lg border p-3">
        <img src={url.trim()} alt="Header logo preview" className="size-12 rounded-lg border object-contain" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
        <span className="text-sm text-muted-foreground">Logo preview</span>
      </div>}
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save header logo"}</Button>
    </form>
  );
}
