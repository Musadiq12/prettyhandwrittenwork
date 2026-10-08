import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getCustomerPdfs } from "@/lib/pdf.functions";

export const Route = createFileRoute("/my-pdf")({
  head: () => ({
    meta: [
      { title: "Download your PDF | Pretty Handwritten Work" },
      { name: "description", content: "Download the scanned PDF of your handwritten order using your order code." },
      { property: "og:title", content: "Download your PDF | Pretty Handwritten Work" },
      { property: "og:description", content: "Download the scanned PDF of your handwritten order using your order code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyPdf,
});

function MyPdf() {
  const fetchPdfs = useServerFn(getCustomerPdfs);
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setFiles([]);
    if (!/^[6-9]\d{9}$/.test(phone.trim()) || code.trim().length < 4) {
      setMsg("Please enter your order code and the 10-digit WhatsApp number you ordered with.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetchPdfs({ data: { code, phone } });
      if (!r.found) setMsg("We couldn't find an order with that code and number.");
      else if (r.files.length === 0) setMsg("Your PDF isn't ready yet. We'll message you on WhatsApp when it is.");
      else setFiles(r.files);
    } catch {
      setMsg("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="ruled min-h-screen px-5 py-16">
      <div className="mx-auto max-w-md rounded-2xl border bg-card p-6 shadow-paper">
        <h1 className="font-hand text-4xl font-bold">Download your PDF</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter the order code we sent you and your WhatsApp number.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><Label htmlFor="code">Order code</Label><Input id="code" className="h-12 uppercase" placeholder="PHW-XXXXXX" value={code} onChange={(e) => setCode(e.target.value)} /></div>
          <div><Label htmlFor="phone">WhatsApp number</Label><Input id="phone" className="h-12" inputMode="numeric" maxLength={10} placeholder="10 digits" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <Button type="submit" size="lg" className="h-12 w-full rounded-full" disabled={busy}>{busy ? "Checking…" : "Find my PDF"}</Button>
        </form>
        {msg && <p role="status" className="mt-4 rounded-lg bg-secondary p-3 text-sm">{msg}</p>}
        {files.length > 0 && (
          <ul className="mt-5 space-y-2">
            {files.map((f) => (
              <li key={f.url}>
                <a href={f.url} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted">
                  <span className="flex items-center gap-2 text-sm"><FileText className="size-4" />{f.name}</span>
                  <Download className="size-4" />
                </a>
              </li>
            ))}
            <li className="text-xs text-muted-foreground">Links expire after 10 minutes.</li>
          </ul>
        )}
        <Link to="/" className="mt-6 inline-block text-sm underline underline-offset-4">← Back to home</Link>
      </div>
    </main>
  );
}
