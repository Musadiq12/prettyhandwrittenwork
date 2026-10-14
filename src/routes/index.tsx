import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  BookOpen, GraduationCap, FlaskConical, FolderKanban, NotebookPen, MessageSquareText,
  Feather, Palette, Sparkles, Truck, FileText, Layers, Package, Clock, MapPin, ShieldCheck,
  IndianRupee, MessageCircle,
} from "lucide-react";
import { ImageStreamHero } from "@/components/ui/image-stream-hero";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { BRAND_NAME, FAQ_ITEMS, OFFER_END_DATE, SAMPLE_CAPTIONS, TESTIMONIALS, waLinkTo } from "@/config";
import { supabase } from "@/integrations/supabase/client";
import {
  useSiteSettings, basicRateOf, rateFor, STYLE_LABELS as STYLES, DELIVERY_LABELS as DELIVERY,
  type StyleKey, type DeliveryKey,
} from "@/lib/settings";

const TITLE = "Pretty Handwritten Work | Handwritten Assignments Delivered Across India";
const DESC = "Neat, pretty handwritten assignments, records, notes and projects for students — delivered anywhere in India, with optional scanned PDF. Order on WhatsApp.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://prettyhandwrittenwork.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://prettyhandwrittenwork.lovable.app/" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify({
      "@context": "https://schema.org", "@graph": [
        { "@type": "LocalBusiness", "@id": "https://prettyhandwrittenwork.lovable.app/#business", name: BRAND_NAME,
          url: "https://prettyhandwrittenwork.lovable.app/", description: DESC, areaServed: { "@type": "Country", name: "India" } },
        { "@type": "FAQPage", mainEntity: FAQ_ITEMS.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
      ],
    }) }],
  }),
  component: Index,
});

const u = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80&auto=format`;
const HERO_IMAGES = [
  { src: u("photo-1455390582262-044cdead277a"), alt: "Handwritten notes in an open notebook" },
  { src: u("photo-1517842645767-c639042777db"), alt: "Notebook and pen on a desk" },
  { src: u("photo-1456735190827-d1262f71b8a3"), alt: "Colourful pens and stationery" },
  { src: u("photo-1503676260728-1c00da094a0b"), alt: "Student studying with books" },
  { src: u("photo-1434030216411-0b793f4b4173"), alt: "Hand writing on lined paper" },
  { src: u("photo-1488190211105-8b0e65b80b4e"), alt: "Writing notes at a desk" },
];

const samplePaths = Object.keys(import.meta.glob("/public/samples/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}")).sort();
const sampleImages = samplePaths.map((path) => {
  const filename = path.split("/").at(-1) ?? "";
  const [style = "Handwriting", pageType = "Assignment page"] = filename.replace(/\.[^.]+$/, "").split("--").map((part) => part.replace(/[-_]/g, " "));
  const caption = SAMPLE_CAPTIONS[filename] ?? { style, pageType };
  return { src: path.replace(/^\/public/, ""), alt: `${caption.style} — ${caption.pageType}`, ...caption };
});

function useLimitedOffer() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!OFFER_END_DATE) return;
    const end = Date.parse(OFFER_END_DATE);
    const update = () => setActive(Number.isFinite(end) && end > Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return active;
}

const SERVICES = [
  { icon: BookOpen, name: "School Assignments" },
  { icon: GraduationCap, name: "College & University Assignments" },
  { icon: FlaskConical, name: "Practical Record Writing" },
  { icon: FolderKanban, name: "Project Writing" },
  { icon: NotebookPen, name: "Notes & Copywriting" },
  { icon: MessageSquareText, name: "Handwritten Questions and Answers" },
  { icon: Feather, name: "Cursive and Beautiful Handwriting" },
  { icon: Palette, name: "File Covers and Decorative Titles" },
  { icon: Sparkles, name: "Custom Written Work according to your requirements" },
];

function useWa() {
  const s = useSiteSettings();
  return (text?: string) => waLinkTo(s.whatsapp_number, text);
}

const ORDER_MSG = "Hi! I'd like to order handwritten work from Pretty Handwritten Work ✍️";

function Section({ id, title, children, ruled }: { id?: string; title: string; children: React.ReactNode; ruled?: boolean }) {
  return (
    <section id={id} className={`scroll-mt-4 px-5 py-14 md:py-20 ${ruled ? "ruled" : ""}`}>
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-8 text-center font-hand text-4xl font-bold md:text-5xl">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border bg-card p-5 shadow-paper ${className}`}>{children}</div>;
}

function WaButton({ className = "", children = "Order on WhatsApp" }: { className?: string; children?: React.ReactNode }) {
  const waLink = useWa();
  return (
    <a href={waLink(ORDER_MSG)} target="_blank" rel="noopener noreferrer"
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-whatsapp px-6 font-semibold text-whatsapp-foreground shadow-paper transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>
      <MessageCircle className="size-5" aria-hidden /> {children}
    </a>
  );
}

function Index() {
  const st = useSiteSettings();
  const waLink = useWa();
  const limitedOffer = useLimitedOffer();
  const SHIPPING_TEXT = `Shipping is charged separately — usually ₹${st.shipping_min}–₹${st.shipping_max} depending on weight and location, confirmed on WhatsApp.`;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="relative z-10 border-b border-border/70 bg-background/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a href="#top" className="flex min-w-0 items-center gap-3" aria-label={BRAND_NAME + " home"}>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-secondary text-foreground" aria-hidden>
              <BookOpen className="size-6" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-tight sm:text-base">{BRAND_NAME}</span>
              <span className="hidden text-xs text-muted-foreground sm:block">Handwritten work, made neat</span>
            </span>
          </a>
          <nav className="flex shrink-0 items-center gap-4 text-sm font-medium sm:gap-6">
            <a href="#prices" className="text-muted-foreground transition hover:text-foreground">Prices</a>
            <a href="#order" className="rounded-full bg-primary px-4 py-2.5 text-primary-foreground transition hover:opacity-90">Place your order</a>
          </nav>
        </div>
      </header>
      <div id="top">
      <ImageStreamHero images={HERO_IMAGES}>
        <div className="fade-up mx-4 max-w-2xl rounded-3xl border border-white/30 bg-background/85 p-7 text-center shadow-xl backdrop-blur-md md:p-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Handwritten work across India</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">Beautifully handwritten assignments, without the hassle.</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground md:text-base">Neat, consistent handwriting for school, college and university work — with clear pricing and delivery options.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="min-h-12 rounded-full px-7 shadow-sm">
              <a href="#order"><NotebookPen className="mr-2 size-5" aria-hidden />Place your order</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-h-12 rounded-full border-border bg-background/70 px-7">
              <a href="#prices">View pricing</a>
            </Button>
          </div>
        </div>
      </ImageStreamHero>

      <Section title="About us" ruled>
        <p className="mx-auto max-w-2xl pl-10 text-lg leading-8">
          Welcome to Pretty Handwritten Work! We provide neat, clean, and beautiful handwritten work for school, college, and university students. Our goal is to make written work look organized, attractive, and easy to read.
        </p>
      </Section>

      <Section title="Handwritten assignments in India — our services">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {SERVICES.map(({ icon: Icon, name }) => (
            <Card key={name} className="flex flex-col items-center gap-3 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-secondary"><Icon className="size-6" aria-hidden /></span>
              <span className="text-sm font-medium md:text-base">{name}</span>
            </Card>
          ))}
        </div>
      </Section>

      <Section id="prices" title="Prices" ruled>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PriceCard name="Basic Running Handwriting" unit="/page" price={basicRateOf(st)} was={st.offer_active ? st.price_basic : undefined} limitedOffer={st.offer_active && limitedOffer} />
          <PriceCard name="Cursive Handwriting" unit="/page" price={st.price_cursive} />
          <PriceCard name="Beautiful & Neat Handwriting" unit="/page" price={st.price_neat} />
          <PriceCard name="File Cover" unit="/cover" price={st.price_cover} />
          <PriceCard name="Projects" prefix="Starting from " price={st.price_project_from} />
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground">
          Final prices may vary depending on page count, complexity, diagrams, materials, and delivery requirements. Shipping charges are separate.
        </p>
      </Section>

      <Section title="Delivery options">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><Truck className="mb-3 size-7 text-ink" aria-hidden /><h3 className="font-hand text-3xl font-bold">Physical Delivery</h3><p className="mt-2 text-sm">Handwritten pages couriered all over India. {SHIPPING_TEXT}</p></Card>
          <Card><FileText className="mb-3 size-7" aria-hidden /><h3 className="font-hand text-3xl font-bold">PDF Only</h3><p className="mt-2 text-sm">A clear scan sent on WhatsApp or email. Same per-page rate, no shipping.</p></Card>
          <Card><Layers className="mb-3 size-7" aria-hidden /><h3 className="font-hand text-3xl font-bold">Physical + PDF</h3><p className="mt-2 text-sm">Get both the pages and a scan. Scan add-on of ₹{st.pdf_addon_per_page}/page.</p></Card>
        </div>
      </Section>

      <Estimator />

      <Section title="How it works">
        <ol className="grid gap-4 md:grid-cols-4">
          {["Fill the order form", "Confirm price on WhatsApp", "Pay 50% advance via UPI, rest before dispatch", "Receive your work by courier or PDF"].map((s, i) => (
            <li key={s}><Card className="h-full"><span className="font-hand text-5xl font-bold text-ring">{i + 1}</span><p className="mt-1 font-medium">{s}</p></Card></li>
          ))}
        </ol>
      </Section>

      <OrderForm />
      <Samples />

      <Section title="Testimonials">
        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((item, i) => (
            <Card key={i}>
              <p className="mb-3 text-xs text-muted-foreground">Placeholder — awaiting customer feedback</p>
              <blockquote className="text-sm leading-6">“{item.quote}”</blockquote>
              <p className="mt-4 font-semibold">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.education}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Why choose us">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            [Feather, "Neat & consistent handwriting"], [IndianRupee, "Affordable prices"], [Package, "Careful packaging"],
            [Clock, "On-time delivery"], [MapPin, "Pan-India shipping"], [ShieldCheck, "Privacy of your work"],
          ].map(([Icon, t]) => {
            const I = Icon as typeof Feather;
            return <Card key={t as string} className="flex items-center gap-3"><I className="size-6 shrink-0" aria-hidden /><span className="text-sm font-medium">{t as string}</span></Card>;
          })}
        </div>
      </Section>

      <Section title="FAQ" ruled>
        <Accordion type="single" collapsible defaultValue="q0" className="mx-auto max-w-2xl rounded-2xl border bg-card px-5 shadow-paper">
          {FAQ_ITEMS.map(([q, a], i) => (
            <AccordionItem key={q} value={`q${i}`}>
              <AccordionTrigger className="text-left">{q}</AccordionTrigger>
              <AccordionContent>{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      <footer className="border-t bg-card px-5 py-10 text-center">
        <div className="mx-auto flex max-w-xs items-center justify-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-border bg-secondary" aria-hidden><BookOpen className="size-5" /></span>
          <p className="text-lg font-bold tracking-tight">{BRAND_NAME}</p>
        </div>
        <a href="#order" className="mt-4 inline-block font-medium underline underline-offset-4">Place your order</a>
        <p className="mt-3 text-sm text-muted-foreground">© {new Date().getFullYear()} {BRAND_NAME}</p>
        <p className="mx-auto mt-3 max-w-md text-xs text-muted-foreground">We provide handwriting and copying services only for content you submit yourself.</p>
      </footer>

      <a href="#order" aria-label="Place your order"
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-xl transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-6 sm:right-6">
        <NotebookPen className="size-4" aria-hidden /> <span>Place your order</span>
      </a>
      </div>
    </div>
  );
}

function PriceCard({ name, price, unit = "", was, prefix = "", limitedOffer = false }: { name: string; price: number; unit?: string; was?: number | undefined; prefix?: string; limitedOffer?: boolean }) {
  return (
    <Card className="relative">
      {limitedOffer && <Badge className="absolute -top-3 right-4 bg-blush text-ink">Limited-time offer ₹{price}/page</Badge>}
      <h3 className="font-hand text-2xl font-bold">{name}</h3>
      <p className="mt-2 text-3xl font-semibold">
        {was && <s className="mr-2 text-lg text-muted-foreground">₹{was}</s>}
        <span className="text-base font-normal">{prefix}</span>₹{price}<span className="text-base font-normal text-muted-foreground">{unit}</span>
      </p>
    </Card>
  );
}

const selectCls = "flex h-12 w-full rounded-md border border-input bg-card px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Estimator() {
  const st = useSiteSettings();
  const [style, setStyle] = useState<StyleKey>("basic");
  const [pages, setPages] = useState(10);
  const [covers, setCovers] = useState(0);
  const [delivery, setDelivery] = useState<DeliveryKey>("physical");
  const calc = useMemo(() => {
    const p = Math.max(0, pages || 0), c = Math.max(0, covers || 0);
    const writing = p * rateFor(st, style);
    const coverCost = c * st.price_cover;
    const scan = delivery === "both" ? p * st.pdf_addon_per_page : 0;
    const sub = writing + coverCost + scan;
    const discount = sub > st.bulk_discount_threshold ? Math.round((sub * st.bulk_discount_percent) / 100) : 0;
    return { writing, coverCost, scan, discount, total: sub - discount };
  }, [style, pages, covers, delivery, st]);

  return (
    <Section id="estimate" title="Price estimator" ruled>
      <Card className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div><Label htmlFor="e-style">Writing style</Label>
            <select id="e-style" className={selectCls} value={style} onChange={(e) => setStyle(e.target.value as StyleKey)}>
              {Object.entries(STYLES).map(([k, v]) => <option key={k} value={k}>{v} (₹{rateFor(st, k as StyleKey)}/page)</option>)}
            </select></div>
          <div><Label htmlFor="e-pages">Number of pages</Label><Input id="e-pages" type="number" min={0} className="h-12" value={pages} onChange={(e) => setPages(+e.target.value)} /></div>
          <div><Label htmlFor="e-covers">File covers</Label><Input id="e-covers" type="number" min={0} className="h-12" value={covers} onChange={(e) => setCovers(+e.target.value)} /></div>
          <div><Label htmlFor="e-del">Delivery type</Label>
            <select id="e-del" className={selectCls} value={delivery} onChange={(e) => setDelivery(e.target.value as DeliveryKey)}>
              {Object.entries(DELIVERY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>
        </div>
        <div className="flex flex-col justify-between rounded-xl bg-secondary p-5" aria-live="polite">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Writing</dt><dd>₹{calc.writing}</dd></div>
            <div className="flex justify-between"><dt>File covers</dt><dd>₹{calc.coverCost}</dd></div>
            {delivery === "both" && <div className="flex justify-between gap-3"><dt>Scan add-on (₹{st.pdf_addon_per_page}/page)</dt><dd>₹{calc.scan}</dd></div>}
            <div className="flex justify-between"><dt>Bulk discount ({st.bulk_discount_percent}% over ₹{st.bulk_discount_threshold})</dt><dd>−₹{calc.discount}</dd></div>
          </dl>
          <div className="mt-4 border-t border-ink/20 pt-4">
            <p className="text-sm">Estimated total</p>
            <p className="font-hand text-5xl font-bold">₹{calc.total}</p>
            <p className="mt-1 text-sm">{delivery === "pdf" ? "No shipping for PDF." : "Shipping extra, confirmed on WhatsApp."}</p>
            <p className="mt-2 text-xs text-muted-foreground">Projects: starting from ₹{st.price_project_from}, chat for a quote.</p>
          </div>
        </div>
      </Card>
    </Section>
  );
}

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  work: z.string().min(1, "Choose a work type").max(100),
  style: z.enum(["basic", "cursive", "beautiful"]),
  pages: z.coerce.number().int().min(1, "At least 1 page").max(2000),
  covers: z.coerce.number().int().min(0).max(100),
  delivery: z.enum(["physical", "pdf", "both"]),
  city: z.string().trim().max(60).default(""),
  state: z.string().trim().max(60).default(""),
  pin: z.string().trim().max(6).optional(),
  deadline: z.string().min(1, "Pick a deadline"),
  notes: z.string().max(1000).optional(),
}).superRefine((d, ctx) => {
  if (d.delivery !== "pdf" && d.city.length < 2) ctx.addIssue({ code: "custom", path: ["city"], message: "Enter your city" });
  if (d.delivery !== "pdf" && d.state.length < 2) ctx.addIssue({ code: "custom", path: ["state"], message: "Enter your state" });
  if (d.delivery !== "pdf" && !/^[1-9]\d{5}$/.test(d.pin ?? "")) ctx.addIssue({ code: "custom", path: ["pin"], message: "Enter a valid 6-digit PIN code" });
});
type FormValues = z.input<typeof schema>;

function Field({ k, label, children, error }: { k: string; label: string; children: React.ReactNode; error?: string | undefined }) {
  return <div><Label htmlFor={`f-${k}`} className="mb-1 block">{label}</Label>{children}{error && <p role="alert" className="mt-1 text-sm text-destructive">{error}</p>}</div>;
}

function OrderForm() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { style: "basic", delivery: "physical", pages: 10, covers: 0, work: "", city: "", state: "", pin: "" },
  });
  const delivery = watch("delivery");
  const waLink = useWa();
  const [saving, setSaving] = useState(false);
  const onSubmit = async (raw: FormValues) => {
    const d = schema.parse(raw);
    setSaving(true);
    const { data: code, error } = await supabase.rpc("create_order", {
      _name: d.name, _phone: d.phone, _work_type: d.work, _style: d.style, _pages: d.pages, _covers: d.covers,
      _delivery: d.delivery, _city: d.delivery === "pdf" ? "" : d.city, _state: d.delivery === "pdf" ? "" : d.state, _pin: d.delivery === "pdf" ? "" : (d.pin ?? ""),
      _deadline: d.deadline, _notes: d.notes ?? "",
    });
    setSaving(false);
    if (error || !code) {
      toast.error("Couldn't save your order, but you can still send it on WhatsApp.");
    } else {
      toast.success(`Order ${code} saved! Opening WhatsApp…`);
    }
    const lines = [
      "Hi! New order for Pretty Handwritten Work ✍️", "",
      code ? `*Order code:* ${code}` : null,
      `*Name:* ${d.name}`, `*WhatsApp:* ${d.phone}`, `*Work type:* ${d.work}`,
      `*Writing style:* ${STYLES[d.style]}`, `*Approx. pages:* ${d.pages}`, `*File covers:* ${d.covers}`,
      `*Delivery:* ${DELIVERY[d.delivery]}`,
      `*City:* ${d.delivery === "pdf" ? "Not required (PDF only)" : d.city}`,
      `*State:* ${d.delivery === "pdf" ? "Not required (PDF only)" : d.state}`,
      `*PIN code:* ${d.delivery === "pdf" ? "Not required (PDF only)" : d.pin}`,
      `*Deadline:* ${d.deadline}`, `*Notes:* ${d.notes || "None"}`, "",
      "I'll share reference files in this chat.",
    ].filter((l) => l !== null);
    window.location.href = waLink(lines.join("\n"));
  };
  const F = (p: { k: keyof FormValues; label: string; children: React.ReactNode }) => Field({ ...p, error: errors[p.k]?.message as string | undefined });
  return (
    <Section id="order" title="Place your order" ruled>
      <Card className="mx-auto max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
          <F k="name" label="Name"><Input id="f-name" className="h-12" autoComplete="name" {...register("name")} /></F>
          <F k="phone" label="WhatsApp number"><Input id="f-phone" className="h-12" inputMode="numeric" maxLength={10} placeholder="10 digits" {...register("phone")} /></F>
          <F k="work" label="Subject / Work type">
            <select id="f-work" className={selectCls} {...register("work")}><option value="">Select…</option>{SERVICES.map((s) => <option key={s.name}>{s.name}</option>)}</select>
          </F>
          <F k="style" label="Writing style">
            <select id="f-style" className={selectCls} {...register("style")}>{Object.entries(STYLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </F>
          <F k="pages" label="Approx. pages"><Input id="f-pages" type="number" min={1} className="h-12" {...register("pages")} /></F>
          <F k="covers" label="File covers"><Input id="f-covers" type="number" min={0} className="h-12" {...register("covers")} /></F>
          <F k="delivery" label="Delivery type">
            <select id="f-delivery" className={selectCls} {...register("delivery")}>{Object.entries(DELIVERY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </F>
          <F k="deadline" label="Deadline"><Input id="f-deadline" type="date" className="h-12" {...register("deadline")} /></F>
          {delivery !== "pdf" && <>
            <F k="city" label="City"><Input id="f-city" className="h-12" required {...register("city")} /></F>
            <F k="state" label="State"><Input id="f-state" className="h-12" required {...register("state")} /></F>
            <F k="pin" label="PIN code"><Input id="f-pin" className="h-12" inputMode="numeric" required maxLength={6} {...register("pin")} /></F>
          </>}
          <div className="sm:col-span-2"><F k="notes" label="Notes / special instructions"><Textarea id="f-notes" rows={4} {...register("notes")} /></F></div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving} className="min-h-12 w-full rounded-full px-6 font-semibold shadow-sm">
              <MessageCircle className="size-5" aria-hidden /> {saving ? "Saving order…" : "Submit order & continue to WhatsApp"}
            </Button>
            <p className="mt-3 text-center text-sm text-muted-foreground">Your order details will be saved first, then WhatsApp will open with a pre-filled message. You can attach reference files there.</p>
          </div>
        </form>
      </Card>
    </Section>
  );
}

function Samples() {
  const [open, setOpen] = useState<number | null>(null);
  const current = open !== null ? sampleImages[open] : undefined;
  if (sampleImages.length === 0) return null;
  return (
    <Section title="Sample work">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {sampleImages.map((img, i) => (
          <figure key={img.src}>
            <Button variant="ghost" onClick={() => setOpen(i)} className="h-auto w-full overflow-hidden rounded-xl p-0 shadow-paper" aria-label={`View ${img.alt}`}>
              <img src={img.src} alt={img.alt} loading="lazy" width={800} height={800} className="aspect-square w-full object-cover transition duration-300 hover:scale-105" />
            </Button>
            <figcaption className="mt-2 text-center text-sm">{img.style} · {img.pageType}</figcaption>
          </figure>
        ))}
      </div>
      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="px-3 pt-2">{current?.alt ?? "Sample"}</DialogTitle>
          <DialogDescription className="sr-only">Full-size sample of handwritten work.</DialogDescription>
          {current && <img src={current.src} alt={current.alt} width={800} height={1100} className="max-h-[80dvh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </Section>
  );
}
