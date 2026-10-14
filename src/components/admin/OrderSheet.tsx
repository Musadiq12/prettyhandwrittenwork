import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, ExternalLink, FileUp, Trash2, Eye, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { STATUSES, STATUS_CLASS, inr, fmtDate, type Order, type OrderStatus } from "@/lib/admin";
import { DELIVERY_LABELS, STYLE_LABELS, useSiteSettings } from "@/lib/settings";
import { waLinkTo } from "@/config";

const MAX_PDFS = 3;
const MAX_BYTES = 20 * 1024 * 1024;

export function OrderSheet({ order, onClose }: { order: Order | null; onClose: () => void }) {
  return (
    <Sheet open={!!order} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        {order && <SheetBody key={order.id} order={order} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4 py-1.5 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{v}</dd></div>;
}

function SheetBody({ order, onClose }: { order: Order; onClose: () => void }) {
  const qc = useQueryClient();
  const st = useSiteSettings();
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-orders"] });

  const update = async (patch: Partial<Order>, okMsg: string) => {
    const { error } = await supabase.from("orders").update(patch).eq("id", order.id);
    if (error) { toast.error("Couldn't save: " + error.message); return false; }
    toast.success(okMsg);
    await refresh();
    return true;
  };

  // Editable fields
  const [adminNotes, setAdminNotes] = useState(order.admin_notes ?? "");
  const [finalPrice, setFinalPrice] = useState(order.final_price?.toString() ?? "");
  const [advance, setAdvance] = useState(order.advance_paid);
  const [tracking, setTracking] = useState(order.tracking_info ?? "");
  const saveDetails = async () => {
    const fp = finalPrice.trim() === "" ? null : Number(finalPrice);
    if (fp !== null && (!Number.isFinite(fp) || fp < 0)) { toast.error("Final price must be a positive number."); return; }
    if (adminNotes.length > 2000 || tracking.length > 300) { toast.error("Text is too long."); return; }
    await update({ admin_notes: adminNotes.trim() || null, final_price: fp, advance_paid: advance, tracking_info: tracking.trim() || null }, "Saved");
  };

  // WhatsApp shortcuts
  const price = order.final_price ?? order.estimated_total;
  const site = typeof window !== "undefined" ? window.location.origin : "";
  const templates = {
    confirmed: `Hi ${order.name}! Order confirmed (${order.order_code}): your total is ₹${price}. Please pay 50% advance (₹${Math.ceil(Number(price) / 2)}) on UPI ${st.upi_id}.`,
    ready: `Hi ${order.name}! Your work for order ${order.order_code} is ready ✍️`,
    pdf: `Hi ${order.name}! Your PDF is ready. Download at ${site}/my-pdf with code ${order.order_code} and your WhatsApp number.`,
    dispatched: `Hi ${order.name}! Order ${order.order_code} has been dispatched. Tracking: ${order.tracking_info ?? "(add tracking)"}`,
  };
  const [msg, setMsg] = useState<string | null>(null);
  const customerNumber = `91${order.phone}`;

  return (
    <div className="space-y-6 pb-10">
      <SheetHeader className="text-left">
        <SheetTitle className="font-hand text-3xl">{order.order_code}</SheetTitle>
        <SheetDescription>Created {fmtDate(order.created_at)}</SheetDescription>
      </SheetHeader>

      <section>
        <Label className="mb-1 block">Status</Label>
        <Select value={order.status} onValueChange={(v) => void update({ status: v as OrderStatus }, `Status changed to ${v}`)}>
          <SelectTrigger className={`h-11 capitalize ${STATUS_CLASS[order.status]}`}><SelectValue /></SelectTrigger>
          <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
        </Select>
      </section>

      <section className="rounded-xl border bg-card p-4">
        <h3 className="mb-2 font-semibold">Order details</h3>
        <dl className="divide-y">
          <Row k="Name" v={order.name} />
          <Row k="WhatsApp" v={<a className="underline" href={waLinkTo(customerNumber)} target="_blank" rel="noreferrer">{order.phone}</a>} />
          <Row k="Work type" v={order.work_type} />
          <Row k="Writing style" v={STYLE_LABELS[order.writing_style as keyof typeof STYLE_LABELS] ?? order.writing_style} />
          <Row k="Pages" v={order.pages} />
          <Row k="File covers" v={order.covers} />
          <Row k="Delivery" v={DELIVERY_LABELS[order.delivery_type as keyof typeof DELIVERY_LABELS] ?? order.delivery_type} />
          <Row k="Address" v={[order.city, order.state, order.pin].filter(Boolean).join(", ")} />
          <Row k="Deadline" v={fmtDate(order.deadline)} />
          <Row k="Estimated total" v={inr(order.estimated_total)} />
          {order.notes && <div className="py-2 text-sm"><dt className="text-muted-foreground">Customer notes</dt><dd className="mt-1 whitespace-pre-wrap">{order.notes}</dd></div>}
        </dl>
      </section>

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h3 className="font-semibold">Payment & tracking</h3>
        <div><Label htmlFor="fp">Final price (₹)</Label><Input id="fp" type="number" min={0} inputMode="decimal" className="h-11" value={finalPrice} onChange={(e) => setFinalPrice(e.target.value)} /></div>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={advance} onCheckedChange={(v) => setAdvance(v === true)} />Advance received</label>
        <div><Label htmlFor="tr">Tracking (courier + number)</Label><Input id="tr" className="h-11" value={tracking} onChange={(e) => setTracking(e.target.value)} /></div>
        <div><Label htmlFor="an">Internal notes (only you see this)</Label><Textarea id="an" rows={3} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} /></div>
        <Button onClick={() => void saveDetails()}>Save</Button>
      </section>

      <PdfSection order={order} refresh={refresh}
        onUploaded={() => {
          toast("PDF uploaded", {
            action: { label: "Mark ready + message", onClick: () => { void update({ status: "ready" }, "Marked ready"); setMsg(templates.pdf); } },
            duration: 10000,
          });
        }} />

      <section className="space-y-3 rounded-xl border bg-card p-4">
        <h3 className="font-semibold">WhatsApp messages</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => setMsg(templates.confirmed)}>Order confirmed</Button>
          <Button variant="outline" size="sm" onClick={() => setMsg(templates.ready)}>Work ready</Button>
          <Button variant="outline" size="sm" onClick={() => setMsg(templates.pdf)}>PDF ready</Button>
          <Button variant="outline" size="sm" onClick={() => setMsg(templates.dispatched)}>Dispatched</Button>
        </div>
        {msg !== null && (
          <div className="space-y-2">
            <Textarea rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} aria-label="Message" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { void navigator.clipboard.writeText(msg); toast.success("Copied"); }}><Copy className="size-4" />Copy</Button>
              <Button size="sm" asChild><a href={waLinkTo(customerNumber, msg)} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Open WhatsApp</a></Button>
            </div>
          </div>
        )}
      </section>

      <DeleteOrder order={order} onDeleted={async () => { await refresh(); onClose(); }} />
    </div>
  );
}

async function uploadWithProgress(path: string, file: File, onProgress: (p: number) => void) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in");

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${import.meta.env["VITE_SUPABASE_URL"]}/storage/v1/object/order-pdfs/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", String(import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]));
    xhr.setRequestHeader("Content-Type", "application/pdf");
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText || "Upload failed")));
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(file);
  });
}

function PdfSection({ order, refresh, onUploaded }: { order: Order; refresh: () => Promise<void>; onUploaded: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [last, setLast] = useState<{ name: string; size: number } | null>(null);
  const [replaceIdx, setReplaceIdx] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);
  const paths = order.pdf_paths;

  const handle = async (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("Only PDF files are allowed."); return; }
    if (file.size > MAX_BYTES) { toast.error("PDF must be 20 MB or smaller."); return; }
    if (replaceIdx === null && paths.length >= MAX_PDFS) { toast.error(`Up to ${MAX_PDFS} PDFs per order.`); return; }
    const path = `${order.id}/${Date.now()}.pdf`;
    setProgress(0);
    try {
      await uploadWithProgress(path, file, setProgress);
      const next = [...paths];
      const old = replaceIdx !== null ? next[replaceIdx] : undefined;
      if (replaceIdx !== null) next[replaceIdx] = path; else next.push(path);
      const { error } = await supabase.from("orders").update({ pdf_paths: next }).eq("id", order.id);
      if (error) { await supabase.storage.from("order-pdfs").remove([path]); throw error; }
      if (old) await supabase.storage.from("order-pdfs").remove([old]);
      setLast({ name: file.name, size: file.size });
      await refresh();
      onUploaded();
    } catch (e) {
      toast.error("Upload failed: " + (e instanceof Error ? e.message : "unknown error"));
    } finally {
      setProgress(null);
      setReplaceIdx(null);
      if (input.current) input.current.value = "";
    }
  };

  const preview = async (p: string) => {
    const w = window.open("", "_blank");
    const { data, error } = await supabase.storage.from("order-pdfs").createSignedUrl(p, 600);
    if (error || !data) { w?.close(); { toast.error("Couldn't create preview link."); return; } }
    if (w) w.location.href = data.signedUrl; else window.location.href = data.signedUrl;
  };
  const remove = async (i: number) => {
    const p = paths[i]!;
    const next = paths.filter((_, j) => j !== i);
    const { error } = await supabase.from("orders").update({ pdf_paths: next }).eq("id", order.id);
    if (error) { toast.error("Couldn't remove: " + error.message); return; }
    await supabase.storage.from("order-pdfs").remove([p]);
    toast.success("PDF removed");
    await refresh();
  };

  return (
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <h3 className="font-semibold">PDF ({paths.length}/{MAX_PDFS})</h3>
      {paths.length > 0 && (
        <ul className="space-y-2">
          {paths.map((p, i) => (
            <li key={p} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2 text-sm">
              <span>Part {i + 1} · {new Date(Number(p.split("/")[1]?.replace(".pdf", ""))).toLocaleString("en-IN")}</span>
              <span className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => void preview(p)}><Eye className="size-4" />Preview</Button>
                <Button variant="ghost" size="sm" onClick={() => { setReplaceIdx(i); input.current?.click(); }}><RefreshCw className="size-4" />Replace</Button>
                <Button variant="ghost" size="sm" onClick={() => void remove(i)}><X className="size-4" />Remove</Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {paths.length < MAX_PDFS && (
        <button type="button"
          onClick={() => { setReplaceIdx(null); input.current?.click(); }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); setReplaceIdx(null); void handle(e.dataTransfer.files[0]); }}
          className={`flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed p-6 text-sm ${drag ? "border-ring bg-secondary" : "border-border"}`}>
          <FileUp className="size-6" />Tap to pick or drop a PDF (max 20 MB)
        </button>
      )}
      <input ref={input} type="file" accept="application/pdf" className="hidden" onChange={(e) => void handle(e.target.files?.[0])} />
      {progress !== null && <div className="space-y-1"><Progress value={progress} /><p className="text-xs text-muted-foreground">Uploading… {progress}%</p></div>}
      {last && progress === null && <p className="text-xs text-muted-foreground">Uploaded {last.name} ({(last.size / 1024 / 1024).toFixed(1)} MB)</p>}
    </section>
  );
}

function DeleteOrder({ order, onDeleted }: { order: Order; onDeleted: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) setTyped(""); }, [open]);
  const del = async () => {
    setBusy(true);
    if (order.pdf_paths.length) {
      const { error } = await supabase.storage.from("order-pdfs").remove(order.pdf_paths);
      if (error) { setBusy(false); { toast.error("Couldn't delete PDFs: " + error.message); return; } }
    }
    const { error } = await supabase.from("orders").delete().eq("id", order.id);
    setBusy(false);
    if (error) { toast.error("Couldn't delete: " + error.message); return; }
    toast.success(`Order ${order.order_code} deleted`);
    setOpen(false);
    await onDeleted();
  };
  return (
    <>
      <Button variant="destructive" className="w-full" onClick={() => setOpen(true)}><Trash2 className="size-4" />Delete order</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {order.order_code}?</DialogTitle>
            <DialogDescription>This permanently deletes the order and its PDFs. Type the order code to confirm.</DialogDescription>
          </DialogHeader>
          <Input aria-label="Order code" placeholder={order.order_code} value={typed} onChange={(e) => setTyped(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" disabled={typed.trim().toUpperCase() !== order.order_code || busy} onClick={() => void del()}>{busy ? "Deleting…" : "Delete forever"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
