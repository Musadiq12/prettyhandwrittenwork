import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  BookOpen, GraduationCap, FlaskConical, FolderKanban, NotebookPen, MessageSquareText,
  Feather, Palette, Sparkles, Truck, FileText, Layers, Package, Clock, MapPin, ShieldCheck,
  IndianRupee, MessageCircle, Instagram, Mail,
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
import { BRAND_NAME, INSTAGRAM_URL, FAQ_ITEMS, WHATSAPP_NUMBER, waLinkTo } from "@/config";
import { useSiteContent } from "@/lib/site-content";
import { supabase } from "@/integrations/supabase/client";
import {
  useSiteSettings, rateFor, STYLE_LABELS as STYLES, DELIVERY_LABELS as DELIVERY,
  type StyleKey, type DeliveryKey,
} from "@/lib/settings";

const TITLE = "Pretty Handwritten Work | Handwritten Assignments in India";
const DESC = "Neat, pretty handwritten assignments in India, records, notes and projects for students — delivered anywhere in India, with optional scanned PDF. Order on WhatsApp.";

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
          url: "https://prettyhandwrittenwork.lovable.app/", description: DESC, areaServed: { "@type": "Country", name: "India" }, sameAs: [INSTAGRAM_URL] },
        { "@type": "FAQPage", mainEntity: FAQ_ITEMS.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
      ],
    }) }],
  }),
  component: Index,
});

const bundledSamplePaths = Object.keys(import.meta.glob("/public/samples/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}")).map((path) => path.replace(/^\/public/, "")).sort();
const imageAvailable = (src: string) => /^https?:\/\//i.test(src) || bundledSamplePaths.includes(src);
const SERVICE_ICONS: Record<string, typeof BookOpen> = {
  "book-open": BookOpen, "graduation-cap": GraduationCap, "flask-conical": FlaskConical,
  "folder-kanban": FolderKanban, "message-square-text": MessageSquareText, feather: Feather,
  palette: Palette, sparkles: Sparkles,
};

function useWa(number: string) {
  return (text?: string) => waLinkTo(number || WHATSAPP_NUMBER, text);
}

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

function Index() {
  const st = useSiteSettings();
  const content = useSiteContent();
  const showLaunchPrice = st.offer_active && Boolean(content.offerEndDate && Number.isFinite(Date.parse(content.offerEndDate)) && Date.parse(content.offerEndDate) > Date.now());
  const SHIPPING_TEXT = `Shipping is charged separately — usually ₹${st.shipping_min}–₹${st.shipping_max} depending on weight and location, confirmed on WhatsApp.`;

  useEffect(() => {
    document.title = content.seoTitle;
    let icon = document.head.querySelector('link[rel~="icon"]') as HTMLLinkElement | null;
    if (!icon) { icon = document.createElement("link"); icon.rel = "icon"; document.head.appendChild(icon); }
    if (content.faviconUrl.trim()) icon.href = content.faviconUrl;
    const setMeta = (selector: string, name: string, value: string) => {
      let element = document.head.querySelector(selector) as HTMLMetaElement | null;
      if (!element) { element = document.createElement("meta"); element.setAttribute("name", name); document.head.appendChild(element); }
      element.setAttribute(name, value);
    };
    setMeta('meta[name="description"]', "name", content.seoDescription);
    setMeta('meta[property="og:title"]', "property", content.seoTitle);
    setMeta('meta[property="og:description"]', "property", content.seoDescription);
    const structured = document.head.querySelector('script[type="application/ld+json"]');
    if (structured) structured.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": [
      { "@type": "LocalBusiness", "@id": "https://prettyhandwrittenwork.lovable.app/#business", name: content.brandName, url: "https://prettyhandwrittenwork.lovable.app/", description: content.seoDescription, areaServed: { "@type": "Country", name: "India" }, sameAs: [content.instagramUrl] },
      { "@type": "FAQPage", mainEntity: content.faqItems.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
    ] });
  }, [content]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="relative z-10 border-b border-border/70 bg-background/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a href="#top" className="flex min-w-0 items-center gap-3" aria-label={content.brandName + " home"}>
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-secondary text-foreground" aria-hidden>
              <BookOpen className="size-6" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-tight sm:text-base">{content.brandName}</span>
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
      <ImageStreamHero images={content.heroImages}>
        <div className="fade-up mx-4 max-w-2xl rounded-3xl border border-white/30 bg-background/85 p-7 text-center shadow-xl backdrop-blur-md md:p-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{content.heroEyebrow}</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">{content.heroHeading}</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground md:text-base">{content.heroDescription}</p>
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

      <Section title="About our handwritten assignments in India" ruled>
        <div className="grid items-center gap-6 md:grid-cols-[220px_1fr]">
          <div className="overflow-hidden rounded-2xl border bg-card">
            {content.aboutPhotoUrl ? <img src={content.aboutPhotoUrl} alt={content.brandName + " owner"} loading="lazy" width={600} height={750} className="aspect-[4/5] w-full object-cover" /> : <div className="grid aspect-[4/5] place-items-center p-5 text-center text-sm text-muted-foreground"><div><NotebookPen className="mx-auto mb-3 size-8" aria-hidden /><span>Personal photo slot</span><span className="mt-1 block text-xs">Add a photo URL in Admin → Website</span></div></div>}
          </div>
          <div>
            <p className="text-lg leading-8">{content.aboutStory}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Card className="text-center"><p className="font-hand text-4xl font-bold">{content.experienceYears}+</p><p className="text-sm text-muted-foreground">Years of experience</p></Card>
              <Card className="text-center"><p className="font-hand text-4xl font-bold">{content.ordersDelivered}+</p><p className="text-sm text-muted-foreground">Orders delivered</p></Card>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Handwritten assignment services in India">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {content.services.map(({ icon, name }, i) => { const Icon = SERVICE_ICONS[icon] ?? [BookOpen, GraduationCap, FlaskConical, FolderKanban, MessageSquareText, Feather, Palette, Sparkles][i % 8]!; return (
            <Card key={name} className="flex flex-col items-center gap-3 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-secondary"><Icon className="size-6" aria-hidden /></span>
              <span className="text-sm font-medium md:text-base">{name}</span>
            </Card>
          ); })}
        </div>
      </Section>

      <Section id="prices" title="Prices" ruled>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PriceCard name={content.pricingLabels.basic} unit="/page" price={showLaunchPrice ? st.price_basic_offer : st.price_basic} was={showLaunchPrice ? st.price_basic : undefined} limitedOffer={showLaunchPrice} offerEndDate={content.offerEndDate} sample={content.pricingSamples[0] ?? { label: content.pricingLabels.basic, src: "" }} />
          <PriceCard name={content.pricingLabels.cursive} unit="/page" price={st.price_cursive} sample={content.pricingSamples[1] ?? { label: content.pricingLabels.cursive, src: "" }} />
          <PriceCard name={content.pricingLabels.neat} unit="/page" price={st.price_neat} sample={content.pricingSamples[2] ?? { label: content.pricingLabels.neat, src: "" }} />
          <PriceCard name={content.pricingLabels.cover} unit="/cover" price={st.price_cover} sample={content.pricingSamples[3] ?? { label: content.pricingLabels.cover, src: "" }} />
          <PriceCard name={content.pricingLabels.project} prefix="Starting from " price={st.price_project_from} sample={content.pricingSamples[4] ?? { label: content.pricingLabels.project, src: "" }} />
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-muted-foreground">Prices are per page unless noted. Minimum order ₹{content.minimumOrder}; shipping is free above ₹{content.freeShippingThreshold}. Projects are quoted based on requirements.</p>
      </Section>

      <Section title="Delivery options">
        <div className="grid gap-4 md:grid-cols-3">
          <Card><Truck className="mb-3 size-7 text-ink" aria-hidden /><h3 className="font-hand text-3xl font-bold">Physical Delivery</h3><p className="mt-2 text-sm">Handwritten pages couriered all over India. {SHIPPING_TEXT} Orders above ₹{content.freeShippingThreshold} ship free.</p></Card>
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
          {content.testimonials.map((item, i) => (
            // Replace each placeholder with permissioned, genuine customer feedback before publishing.
            <Card key={i}>
              {(item.name === "Student name" || item.quote.startsWith("Replace with a genuine")) && <p className="mb-3 text-xs text-muted-foreground">Placeholder — awaiting customer feedback</p>}
              <blockquote className="text-sm leading-6">“{item.quote}”</blockquote>
              <p className="mt-4 font-semibold">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.education}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Why choose us">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {content.whyChooseUs.map((t, i) => { const Icons = [Feather, IndianRupee, Package, Clock, MapPin, ShieldCheck]; const I = Icons[i % Icons.length]!;
            return <Card key={t} className="flex items-center gap-3"><I className="size-6 shrink-0" aria-hidden /><span className="text-sm font-medium">{t}</span></Card>;
          })}
        </div>
      </Section>

      <Section title="FAQ" ruled>
        <Accordion type="single" collapsible={false} defaultValue="q0" className="mx-auto max-w-2xl rounded-2xl border bg-card px-5 shadow-paper">
          {content.faqItems.map(({ question: q, answer: a }, i) => (
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
          <p className="text-lg font-bold tracking-tight">{content.brandName}</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-5">
          <a href="#order" className="font-medium underline underline-offset-4">Place your order</a>
          <a href={content.instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm underline underline-offset-4"><Instagram className="size-4" aria-hidden />Instagram</a>
          <a href={`mailto:${content.contactEmail}`} className="inline-flex items-center gap-2 text-sm underline underline-offset-4"><Mail className="size-4" aria-hidden />Email</a>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">© {new Date().getFullYear()} {content.brandName}</p>
        <p className="mx-auto mt-3 max-w-md text-xs text-muted-foreground">We provide handwriting and copying services only for content you submit yourself.</p>
      </footer>

      <a href={waLinkTo(st.whatsapp_number, "Hi! I have a question about handwritten assignments.")} target="_blank" rel="noreferrer" aria-label="Chat with us on WhatsApp"
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-whatsapp text-whatsapp-foreground shadow-xl transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-6 sm:right-6">
        <MessageCircle className="size-7" aria-hidden />
      </a>
      </div>
    </div>
  );
}

function PriceCard({ name, price, unit = "", was, prefix = "", limitedOffer = false, offerEndDate, sample }: {
  name: string; price: number; unit?: string; was?: number; prefix?: string; limitedOffer?: boolean;
  offerEndDate?: string | null; sample: { label: string; src: string };
}) {
  const sampleExists = imageAvailable(sample.src);
  const showOffer = limitedOffer && Boolean(offerEndDate && Date.parse(offerEndDate) > Date.now()) && was !== undefined && was !== price;
  return (
    <Card className="relative">
      {showOffer && <Badge className="absolute -top-3 right-4 bg-blush text-ink">Launch offer ₹{price}</Badge>}
      <h3 className="font-hand text-2xl font-bold">{name}</h3>
      <p className="mt-2 text-3xl font-semibold">
        {showOffer && was !== undefined && <s className="mr-2 text-lg text-muted-foreground">₹{was}</s>}
        <span className="text-base font-normal">{prefix}</span>₹{price}<span className="text-base font-normal text-muted-foreground">{unit}</span>
      </p>
      {showOffer && offerEndDate && <p className="mt-1 text-xs text-muted-foreground">Ends {new Date(offerEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>}
      <div className="mt-4 overflow-hidden rounded-xl border border-dashed border-border bg-secondary/60">
        {sampleExists ? <img src={sample.src} alt={`${sample.label} handwriting sample`} width={400} height={260} loading="lazy" className="h-32 w-full object-cover" /> :
          <div className="grid h-32 place-items-center px-3 text-center text-xs text-muted-foreground"><NotebookPen className="mb-1 size-5" aria-hidden />Sample slot: {sample.label}<span>{sample.src}</span></div>}
      </div>
    </Card>
  );
}

const selectCls = "flex h-12 w-full rounded-md border border-input bg-card px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Estimator() {
  const st = useSiteSettings();
  const content = useSiteContent();
  const [style, setStyle] = useState<StyleKey>("basic");
  const [pages, setPages] = useState(10);
  const [covers, setCovers] = useState(0);
  const [delivery, setDelivery] = useState<DeliveryKey>("physical");
  const offerValid = st.offer_active && Boolean(content.offerEndDate && Number.isFinite(Date.parse(content.offerEndDate)) && Date.parse(content.offerEndDate) > Date.now());
  const calc = useMemo(() => {
    const p = Math.max(0, pages || 0), c = Math.max(0, covers || 0);
    const writing = p * (style === "basic" ? (offerValid ? st.price_basic_offer : st.price_basic) : rateFor(st, style));
    const coverCost = c * st.price_cover;
    const scan = delivery === "both" ? p * st.pdf_addon_per_page : 0;
    const sub = writing + coverCost + scan;
    const minimumAdjustment = Math.max(0, content.minimumOrder - sub);
    const subtotal = Math.max(content.minimumOrder, sub);
    const shipping = delivery === "pdf" || subtotal > content.freeShippingThreshold ? 0 : st.shipping_min;
    return { writing, coverCost, scan, minimumAdjustment, shipping, total: subtotal + shipping };
  }, [style, pages, covers, delivery, st, content, offerValid]);

  return (
    <Section id="estimate" title="Price estimator" ruled>
      <Card className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div><Label htmlFor="e-style">Writing style</Label>
            <select id="e-style" className={selectCls} value={style} onChange={(e) => setStyle(e.target.value as StyleKey)}>
              {Object.entries(STYLES).map(([k, v]) => <option key={k} value={k}>{v} (₹{k === "basic" ? (offerValid ? st.price_basic_offer : st.price_basic) : rateFor(st, k as StyleKey)}/page)</option>)}
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
            {calc.minimumAdjustment > 0 && <div className="flex justify-between"><dt>Minimum order adjustment</dt><dd>₹{calc.minimumAdjustment}</dd></div>}
            {delivery !== "pdf" && <div className="flex justify-between"><dt>{calc.shipping === 0 ? `Shipping (free over ₹${content.freeShippingThreshold})` : "Estimated shipping"}</dt><dd>{calc.shipping === 0 ? "Free" : `₹${calc.shipping}`}</dd></div>}
          </dl>
          <div className="mt-4 border-t border-ink/20 pt-4">
            <p className="text-sm">Estimated total</p>
            <p className="font-hand text-5xl font-bold">₹{calc.total}</p>
            <p className="mt-1 text-sm">{delivery === "pdf" ? "No shipping for PDF." : calc.shipping === 0 ? `Free shipping on orders above ₹${content.freeShippingThreshold}.` : "Estimated shipping; final fee confirmed on WhatsApp."}</p>
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
  const st = useSiteSettings();
  const content = useSiteContent();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { style: "basic", delivery: "physical", pages: 10, covers: 0, work: "", city: "", state: "", pin: "" },
  });
  const delivery = watch("delivery");
  const waLink = useWa(st.whatsapp_number);
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
      "Hi! New order for Pretty Handwritten Work", "",
      code ? `*Order code:* ${code}` : null,
      `*Name:* ${d.name}`, `*WhatsApp:* ${d.phone}`, `*Work type:* ${d.work}`,
      `*Writing style:* ${STYLES[d.style]}`, `*Approx. pages:* ${d.pages}`, `*File covers:* ${d.covers}`,
      `*Delivery:* ${DELIVERY[d.delivery]}`,
      `*City:* ${d.delivery === "pdf" ? "Not required (PDF only)" : d.city}`,
      `*State:* ${d.delivery === "pdf" ? "Not required (PDF only)" : d.state}`,
      `*PIN code:* ${d.delivery === "pdf" ? "Not required (PDF only)" : d.pin}`,
      `*Deadline:* ${d.deadline}`, `*Notes:* ${d.notes || "None"}`, `*Scan add-on:* ${d.delivery === "both" ? `₹${st.pdf_addon_per_page}/page` : "No"}`, `*Location:* ${d.delivery === "pdf" ? "Digital delivery only" : `${d.city}, ${d.state} ${d.pin}`}`, "",
      `*Price note:* Minimum order ₹${content.minimumOrder}. Shipping is free only above ₹${content.freeShippingThreshold}; final shipping is confirmed on WhatsApp.`, "",
      "I will share reference files in this chat.",
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
            <select id="f-work" className={selectCls} {...register("work")}><option value="">Select…</option>{content.services.map((s) => <option key={s.name}>{s.name}</option>)}</select>
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
  const content = useSiteContent();
  const [open, setOpen] = useState<number | null>(null);
  const sampleImages = content.gallerySamples.length ? content.gallerySamples.filter((x) => x.src.trim()).map((x) => ({ ...x, alt: `${x.style} — ${x.pageType}` })) : bundledSamplePaths.map((src) => {
    const filename = src.split("/").at(-1) ?? "";
    const [style = "Handwriting", pageType = "Assignment page"] = filename.replace(/\.[^.]+$/, "").split("--").map((part) => part.replace(/[-_]/g, " "));
    return { src, style, pageType, alt: `${style} — ${pageType}` };
  });
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
