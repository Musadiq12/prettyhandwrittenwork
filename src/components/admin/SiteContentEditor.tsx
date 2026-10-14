import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Save, Globe, Images, MessageSquareQuote, CircleHelp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { siteContentQuery, type SiteContent } from "@/lib/site-content";


function Field({ id, label, value, onChange, multiline = false, type = "text", hint }: {
  id: string; label: string; value: string | number; onChange: (value: string) => void;
  multiline?: boolean; type?: string; hint?: string;
}) {
  return <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    {multiline
      ? <Textarea id={id} value={String(value)} onChange={(e) => onChange(e.target.value)} rows={4} className="min-h-24" />
      : <Input id={id} type={type} value={String(value)} onChange={(e) => onChange(e.target.value)} className="h-11" />}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>;
}

function Panel({ title, description, icon: Icon, children }: {
  title: string; description: string; icon: typeof Globe; children: React.ReactNode;
}) {
  return <section className="overflow-hidden rounded-2xl border bg-card">
    <div className="flex items-start gap-3 border-b p-4 sm:p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary"><Icon className="size-5" /></span>
      <div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
    </div>
    <div className="space-y-4 p-4 sm:p-5">{children}</div>
  </section>;
}

export function SiteContentEditor() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery(siteContentQuery);
  const [form, setForm] = useState<SiteContent | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data && !form) setForm(structuredClone(data)); }, [data, form]);
  useEffect(() => { if (error) toast.error("Couldn't load website content. Check the site_content database migration."); }, [error]);

  const patch = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => {
    setForm((old) => old ? { ...old, [key]: value } : old);
  };
  const save = async () => {
    if (!form) return;
    if (!form.brandName.trim() || !form.heroHeading.trim() || !form.seoTitle.trim() || !form.seoDescription.trim()) {
      toast.error("Brand name, hero heading, SEO title and SEO description are required.");
      return;
    }
    if (!Number.isFinite(Number(form.experienceYears)) || Number(form.experienceYears) < 0 ||
        !Number.isFinite(Number(form.ordersDelivered)) || Number(form.ordersDelivered) < 0 ||
        Number(form.minimumOrder) < 0 || Number(form.freeShippingThreshold) < 0) {
      toast.error("Stats and order thresholds must be zero or greater.");
      return;
    }
    if (form.instagramUrl && !/^https:\/\//i.test(form.instagramUrl)) {
      toast.error("Instagram URL must start with https://");
      return;
    }
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      toast.error("Enter a valid contact email.");
      return;
    }
    if (form.offerEndDate && !Number.isFinite(Date.parse(form.offerEndDate))) {
      toast.error("Offer end date must be a valid date/time.");
      return;
    }
    if (form.heroImages.length > 6) {
      toast.error("Use up to 6 hero images to keep the homepage fast.");
      return;
    }
    if (form.heroImages.some((x) => !x.src.trim() || !x.alt.trim())) {
      toast.error("Every hero image needs both a URL and descriptive alt text.");
      return;
    }
    if (form.faqItems.some((x) => !x.question.trim() || !x.answer.trim())) {
      toast.error("Every FAQ needs a question and answer.");
      return;
    }
    setBusy(true);
    const { data: rows, error: saveError } = await supabase.from("site_content").update({
      content: form as unknown as import("@/integrations/supabase/types").Json,
      updated_at: new Date().toISOString(),
    }).eq("id", 1).select("id");
    setBusy(false);
    if (saveError) {
      toast.error("Website content wasn't saved: " + saveError.message);
      return;
    }
    if (!rows?.length) {
      toast.error("No content row was updated. Apply the site-content migration and sign in with an admin account.");
      return;
    }
    qc.setQueryData(["site-content"], form);
    await qc.invalidateQueries({ queryKey: ["site-content"] });
    toast.success("Website content saved. The public site will use the updated content.");
  };

  if (isLoading || !form) return <div className="space-y-3"><Skeleton className="h-12" /><Skeleton className="h-48" /><Skeleton className="h-64" /></div>;

  const addHero = () => patch("heroImages", [...form.heroImages, { src: "", alt: "" }]);
  const addService = () => patch("services", [...form.services, { name: "", icon: "sparkles" }]);
  const addReason = () => patch("whyChooseUs", [...form.whyChooseUs, ""]);
  const addFaq = () => patch("faqItems", [...form.faqItems, { question: "", answer: "" }]);
  const addTestimonial = () => patch("testimonials", [...form.testimonials, { name: "", education: "", quote: "" }]);
  const addSample = () => patch("gallerySamples", [...form.gallerySamples, { src: "", style: "", pageType: "" }]);
  const addPriceSample = () => patch("pricingSamples", [...form.pricingSamples, { label: "", src: "" }]);

  return <div className="space-y-5">
    <div className="flex flex-col justify-between gap-3 rounded-2xl border bg-secondary/60 p-4 sm:flex-row sm:items-center sm:p-5">
      <div><p className="text-lg font-semibold">Website content manager</p><p className="mt-1 text-sm text-muted-foreground">Edit the public homepage here. Changes are saved to the shared database, not just this browser.</p></div>
      <Button onClick={() => void save()} disabled={busy} size="lg" className="min-h-11 shrink-0"><Save className="mr-2 size-4" />{busy ? "Saving…" : "Save website changes"}</Button>
    </div>

    <Panel title="Brand, contact & about" description="These values appear in the site header, footer, About section and contact links." icon={Globe}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="content-brand" label="Brand name" value={form.brandName} onChange={(v) => patch("brandName", v)} />
        <Field id="content-instagram" label="Instagram URL" value={form.instagramUrl} onChange={(v) => patch("instagramUrl", v)} />
        <Field id="content-email" label="Contact email" value={form.contactEmail} onChange={(v) => patch("contactEmail", v)} type="email" />
        <Field id="content-photo" label="About photo URL" value={form.aboutPhotoUrl} onChange={(v) => patch("aboutPhotoUrl", v)} hint="Paste an image URL. Leave blank to show the existing photo placeholder." />
      </div>
      <Field id="content-story" label="About story" value={form.aboutStory} onChange={(v) => patch("aboutStory", v)} multiline />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="content-years" label="Years of experience" value={form.experienceYears} onChange={(v) => patch("experienceYears", Number(v))} type="number" />
        <Field id="content-orders" label="Orders delivered" value={form.ordersDelivered} onChange={(v) => patch("ordersDelivered", Number(v))} type="number" />
      </div>
    </Panel>

    <Panel title="Hero section & SEO" description="Control the first screen visitors see and the main search/social metadata." icon={Sparkles}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="content-eyebrow" label="Hero eyebrow" value={form.heroEyebrow} onChange={(v) => patch("heroEyebrow", v)} />
        <Field id="content-heading" label="Main H1 heading" value={form.heroHeading} onChange={(v) => patch("heroHeading", v)} />
      </div>
      <Field id="content-description" label="Hero description" value={form.heroDescription} onChange={(v) => patch("heroDescription", v)} multiline />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="content-seo-title" label="SEO page title" value={form.seoTitle} onChange={(v) => patch("seoTitle", v)} />
        <Field id="content-seo-description" label="SEO meta description" value={form.seoDescription} onChange={(v) => patch("seoDescription", v)} multiline />
      </div>
      <div className="flex items-center justify-between gap-3"><div><p className="font-medium">Hero marquee images ({form.heroImages.length}/6)</p><p className="text-xs text-muted-foreground">Use image URLs with descriptive alt text. Maximum 6 images.</p></div><Button type="button" variant="outline" size="sm" onClick={addHero} disabled={form.heroImages.length >= 6}><Plus className="mr-1 size-4" />Add image</Button></div>
      {form.heroImages.map((item, i) => <div key={i} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_1fr_auto]">
        <Field id={`hero-src-${i}`} label={`Image ${i + 1} URL`} value={item.src} onChange={(v) => patch("heroImages", form.heroImages.map((x, n) => n === i ? { ...x, src: v } : x))} />
        <Field id={`hero-alt-${i}`} label="Alt text" value={item.alt} onChange={(v) => patch("heroImages", form.heroImages.map((x, n) => n === i ? { ...x, alt: v } : x))} />
        <div className="flex items-end"><Button type="button" variant="ghost" size="icon" aria-label="Remove hero image" onClick={() => patch("heroImages", form.heroImages.filter((_, n) => n !== i))}><Trash2 className="size-4" /></Button></div>
      </div>)}
    </Panel>

    <Panel title="Services & selling points" description="Manage the service cards and the reasons-to-choose-us section." icon={Sparkles}>
      <div className="flex items-center justify-between"><h4 className="font-medium">Services</h4><Button type="button" variant="outline" size="sm" onClick={addService}><Plus className="mr-1 size-4" />Add service</Button></div>
      {form.services.map((item, i) => <div key={i} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_180px_auto]">
        <Field id={`service-name-${i}`} label={`Service ${i + 1}`} value={item.name} onChange={(v) => patch("services", form.services.map((x, n) => n === i ? { ...x, name: v } : x))} />
        <div className="space-y-1.5"><Label htmlFor={`service-icon-${i}`}>Icon</Label><select id={`service-icon-${i}`} value={item.icon} onChange={(e) => patch("services", form.services.map((x, n) => n === i ? { ...x, icon: e.target.value } : x))} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="book-open">Book</option><option value="graduation-cap">Graduation</option><option value="flask-conical">Practical</option><option value="folder-kanban">Project</option><option value="message-square-text">Notes</option><option value="feather">Feather</option><option value="palette">Palette</option><option value="sparkles">Sparkles</option></select></div>
        <div className="flex items-end"><Button type="button" variant="ghost" size="icon" aria-label="Remove service" onClick={() => patch("services", form.services.filter((_, n) => n !== i))}><Trash2 className="size-4" /></Button></div>
      </div>)}
      <div className="flex items-center justify-between"><h4 className="font-medium">Why choose us</h4><Button type="button" variant="outline" size="sm" onClick={addReason}><Plus className="mr-1 size-4" />Add point</Button></div>
      {form.whyChooseUs.map((reason, i) => <div key={i} className="flex gap-2"><div className="flex-1"><Field id={`reason-${i}`} label={`Point ${i + 1}`} value={reason} onChange={(v) => patch("whyChooseUs", form.whyChooseUs.map((x, n) => n === i ? v : x))} /></div><div className="flex items-end"><Button type="button" variant="ghost" size="icon" aria-label="Remove point" onClick={() => patch("whyChooseUs", form.whyChooseUs.filter((_, n) => n !== i))}><Trash2 className="size-4" /></Button></div></div>)}
    </Panel>

    <Panel title="Pricing display & delivery thresholds" description="Operational rates stay in Settings above. These control public-facing minimum-order and free-shipping messages, plus sample cards." icon={Images}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="content-min-order" label="Minimum order (₹)" value={form.minimumOrder} onChange={(v) => patch("minimumOrder", Number(v))} type="number" />
        <Field id="content-free-shipping" label="Free shipping above (₹)" value={form.freeShippingThreshold} onChange={(v) => patch("freeShippingThreshold", Number(v))} type="number" />
        <Field id="content-offer-end" label="Launch offer end date/time" value={form.offerEndDate} onChange={(v) => patch("offerEndDate", v)} hint="ISO date/time with timezone, e.g. 2026-12-31T23:59:00+05:30. Leave blank to hide the countdown/launch offer." />
      </div>
      <div className="flex items-center justify-between"><h4 className="font-medium">Price-card samples</h4><Button type="button" variant="outline" size="sm" onClick={addPriceSample}><Plus className="mr-1 size-4" />Add sample</Button></div>
      {form.pricingSamples.map((item, i) => <div key={i} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_1fr_auto]">
        <Field id={`price-sample-label-${i}`} label="Sample label" value={item.label} onChange={(v) => patch("pricingSamples", form.pricingSamples.map((x, n) => n === i ? { ...x, label: v } : x))} />
        <Field id={`price-sample-src-${i}`} label="Image URL or /samples/path" value={item.src} onChange={(v) => patch("pricingSamples", form.pricingSamples.map((x, n) => n === i ? { ...x, src: v } : x))} />
        <div className="flex items-end"><Button type="button" variant="ghost" size="icon" aria-label="Remove pricing sample" onClick={() => patch("pricingSamples", form.pricingSamples.filter((_, n) => n !== i))}><Trash2 className="size-4" /></Button></div>
      </div>)}
      <div className="flex items-center justify-between"><h4 className="font-medium">Sample work gallery</h4><Button type="button" variant="outline" size="sm" onClick={addSample}><Plus className="mr-1 size-4" />Add gallery image</Button></div>
      <p className="text-xs text-muted-foreground">Add image URLs to publish the gallery. If no images are listed, the public gallery stays hidden.</p>
      {form.gallerySamples.map((item, i) => <div key={i} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-3">
        <Field id={`gallery-src-${i}`} label="Image URL" value={item.src} onChange={(v) => patch("gallerySamples", form.gallerySamples.map((x, n) => n === i ? { ...x, src: v } : x))} />
        <Field id={`gallery-style-${i}`} label="Style caption" value={item.style} onChange={(v) => patch("gallerySamples", form.gallerySamples.map((x, n) => n === i ? { ...x, style: v } : x))} />
        <div className="flex gap-2"><div className="flex-1"><Field id={`gallery-page-${i}`} label="Page type" value={item.pageType} onChange={(v) => patch("gallerySamples", form.gallerySamples.map((x, n) => n === i ? { ...x, pageType: v } : x))} /></div><div className="flex items-end"><Button type="button" variant="ghost" size="icon" aria-label="Remove gallery image" onClick={() => patch("gallerySamples", form.gallerySamples.filter((_, n) => n !== i))}><Trash2 className="size-4" /></Button></div></div>
      </div>)}
    </Panel>

    <Panel title="Frequently asked questions" description="These entries feed both the visible FAQ accordion and FAQ structured data." icon={CircleHelp}>
      <div className="flex justify-end"><Button type="button" variant="outline" size="sm" onClick={addFaq}><Plus className="mr-1 size-4" />Add FAQ</Button></div>
      {form.faqItems.map((item, i) => <div key={i} className="space-y-3 rounded-xl border p-3">
        <div className="flex items-start gap-2"><div className="flex-1"><Field id={`faq-q-${i}`} label={`Question ${i + 1}`} value={item.question} onChange={(v) => patch("faqItems", form.faqItems.map((x, n) => n === i ? { ...x, question: v } : x))} /></div><Button type="button" variant="ghost" size="icon" aria-label="Remove FAQ" onClick={() => patch("faqItems", form.faqItems.filter((_, n) => n !== i))}><Trash2 className="size-4" /></Button></div>
        <Field id={`faq-a-${i}`} label="Answer" value={item.answer} onChange={(v) => patch("faqItems", form.faqItems.map((x, n) => n === i ? { ...x, answer: v } : x))} multiline />
      </div>)}
    </Panel>

    <Panel title="Testimonials" description="Publish only real customer feedback you have permission to use." icon={MessageSquareQuote}>
      <div className="flex justify-end"><Button type="button" variant="outline" size="sm" onClick={addTestimonial}><Plus className="mr-1 size-4" />Add testimonial</Button></div>
      {form.testimonials.map((item, i) => <div key={i} className="space-y-3 rounded-xl border p-3">
        <div className="grid gap-3 sm:grid-cols-2"><Field id={`testimonial-name-${i}`} label="Name" value={item.name} onChange={(v) => patch("testimonials", form.testimonials.map((x, n) => n === i ? { ...x, name: v } : x))} /><Field id={`testimonial-edu-${i}`} label="Class / course" value={item.education} onChange={(v) => patch("testimonials", form.testimonials.map((x, n) => n === i ? { ...x, education: v } : x))} /></div>
        <Field id={`testimonial-quote-${i}`} label="Customer quote" value={item.quote} onChange={(v) => patch("testimonials", form.testimonials.map((x, n) => n === i ? { ...x, quote: v } : x))} multiline />
        <div className="flex justify-end"><Button type="button" variant="ghost" size="sm" onClick={() => patch("testimonials", form.testimonials.filter((_, n) => n !== i))}><Trash2 className="mr-1 size-4" />Remove</Button></div>
      </div>)}
    </Panel>

    <div className="flex justify-end border-t pt-4"><Button onClick={() => void save()} disabled={busy} size="lg" className="min-h-12 w-full sm:w-auto"><Save className="mr-2 size-4" />{busy ? "Saving…" : "Save website changes"}</Button></div>
  </div>;
}
