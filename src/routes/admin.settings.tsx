import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery } from "@/lib/settings";
import type { SiteSettings } from "@/config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/settings")({ component: SettingsPage });

const pos = z.coerce.number().min(0, "Must be 0 or more").max(1_000_000);
const schema = z.object({
  whatsapp_number: z.string().trim().regex(/^91[6-9]\d{9}$/, "Use 91 + your 10-digit number, e.g. 919876543210"),
  upi_id: z.string().trim().regex(/^[\w.\-]{2,}@[\w.\-]{2,}$/, "Enter a valid UPI ID, e.g. name@okaxis"),
  offer_active: z.boolean(),
  price_basic: pos, price_basic_offer: pos, price_cursive: pos, price_neat: pos, price_cover: pos,
  price_project_from: pos, pdf_addon_per_page: pos, shipping_min: pos, shipping_max: pos,
  bulk_discount_percent: z.coerce.number().min(0).max(100), bulk_discount_threshold: pos,
});

const GROUPS: { title: string; fields: [keyof SiteSettings, string][] }[] = [
  { title: "Contact & payment", fields: [["whatsapp_number", "WhatsApp number"], ["upi_id", "UPI ID"]] },
  { title: "Prices (₹)", fields: [["price_basic", "Basic / page"], ["price_basic_offer", "Basic offer / page"], ["price_cursive", "Cursive / page"], ["price_neat", "Beautiful & Neat / page"], ["price_cover", "File cover"], ["price_project_from", "Projects from"], ["pdf_addon_per_page", "PDF add-on / page"]] },
  { title: "Shipping (₹)", fields: [["shipping_min", "Minimum"], ["shipping_max", "Maximum"]] },
  { title: "Bulk discount", fields: [["bulk_discount_percent", "Discount %"], ["bulk_discount_threshold", "Over amount (₹)"]] },
];

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(settingsQuery);
  const [form, setForm] = useState<Record<string, string | boolean> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data && !form) setForm(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === "boolean" ? v : String(v)]))); }, [data, form]);

  const save = async (override?: Record<string, string | boolean>) => {
    const f = override ?? form!;
    const r = schema.safeParse(f);
    if (!r.success) {
      const errs = Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
      setErrors(errs);
      const firstKey = String(r.error.issues[0]?.path[0] ?? "");
      requestAnimationFrame(() => {
        const el = document.getElementById(firstKey);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus({ preventScroll: true });
      });
      toast.error("Please fix the highlighted fields.");
      return;
    }
    if (r.data.shipping_min > r.data.shipping_max) { setErrors({ shipping_max: "Must be ≥ minimum" }); { toast.error("Shipping max must be at least the minimum."); return; } }
    setErrors({});
    setBusy(true);
    const { error } = await supabase.from("site_settings").update(r.data).eq("id", 1);
    setBusy(false);
    if (error) { toast.error("Couldn't save: " + error.message); return; }
    toast.success("Settings saved");
    await qc.invalidateQueries({ queryKey: ["site-settings"] });
  };

  if (isLoading || !form) return <div className="space-y-3"><Skeleton className="h-10 w-40" /><Skeleton className="h-24" /><Skeleton className="h-64" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-hand text-4xl font-bold">Settings</h1>
      <div className="flex items-center justify-between rounded-xl border bg-secondary p-5">
        <div>
          <p className="text-lg font-semibold">Limited-time offer</p>
          <p className="text-sm text-muted-foreground">{form["offer_active"] ? "ON. Basic shows the offer price." : "OFF. Basic shows the normal price."}</p>
        </div>
        <Switch aria-label="Limited-time offer" className="scale-150" checked={form["offer_active"] as boolean}
          onCheckedChange={(v) => { const f = { ...form, offer_active: v }; setForm(f); void save(f); }} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="space-y-5">
        {GROUPS.map((g) => (
          <fieldset key={g.title} className="rounded-xl border bg-card p-4">
            <legend className="px-1 font-semibold">{g.title}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {g.fields.map(([k, label]) => (
                <div key={k}>
                  <Label htmlFor={k}>{label}</Label>
                  <Input id={k} className="h-11" inputMode={k === "upi_id" ? "text" : "numeric"} value={form[k] as string}
                    onChange={(e) => setForm({ ...form, [k]: e.target.value })} aria-invalid={!!errors[k]} />
                  {errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>}
                </div>
              ))}
            </div>
          </fieldset>
        ))}
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button>
      </form>

      <ChangePassword />
    </div>
  );
}

function ChangePassword() {
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) { toast.error("New password needs at least 8 characters."); return; }
    if (pw !== pw2) { toast.error("Passwords don't match."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: cur } as { password: string });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password changed");
    setCur(""); setPw(""); setPw2("");
  };
  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-card p-4">
      <h2 className="font-semibold">Change password</h2>
      <div><Label htmlFor="cpw">Current password</Label><Input id="cpw" type="password" autoComplete="current-password" className="h-11" value={cur} onChange={(e) => setCur(e.target.value)} /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label htmlFor="npw">New password</Label><Input id="npw" type="password" autoComplete="new-password" className="h-11" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <div><Label htmlFor="npw2">Confirm new password</Label><Input id="npw2" type="password" autoComplete="new-password" className="h-11" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
      </div>
      <Button type="submit" variant="outline" disabled={busy}>{busy ? "Saving…" : "Change password"}</Button>
    </form>
  );
}
