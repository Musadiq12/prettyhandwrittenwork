import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ABOUT_STORY, BRAND_NAME, CONTACT_EMAIL, EXPERIENCE_YEARS, INSTAGRAM_URL, ORDERS_DELIVERED, OFFER_END_DATE, HANDWRITING_SAMPLE_SLOTS, FAQ_ITEMS } from "@/config";

export type SiteContent = {
  brandName: string;
  instagramUrl: string;
  contactEmail: string;
  experienceYears: number;
  ordersDelivered: number;
  aboutStory: string;
  aboutPhotoUrl: string;
  faviconUrl: string;
  headerLogoUrl: string;
  offerEndDate: string;
  minimumOrder: number;
  freeShippingThreshold: number;
  heroEyebrow: string;
  heroHeading: string;
  heroDescription: string;
  heroImages: { src: string; alt: string }[];
  seoTitle: string;
  seoDescription: string;
  services: { name: string; icon: string }[];
  whyChooseUs: string[];
  faqItems: { question: string; answer: string }[];
  testimonials: { name: string; education: string; quote: string }[];
  gallerySamples: { src: string; style: string; pageType: string }[];
  pricingSamples: { label: string; src: string }[];
  pricingLabels: { basic: string; cursive: string; neat: string; cover: string; project: string };
};

const image = (id: string) => `https://images.unsplash.com/${id}?w=640&q=75&auto=format`;

export const DEFAULT_SITE_CONTENT: SiteContent = {
  brandName: BRAND_NAME,
  instagramUrl: INSTAGRAM_URL,
  contactEmail: CONTACT_EMAIL,
  experienceYears: EXPERIENCE_YEARS,
  ordersDelivered: ORDERS_DELIVERED,
  aboutStory: ABOUT_STORY,
  aboutPhotoUrl: "",
  faviconUrl: "/favicon.svg",
  headerLogoUrl: "",
  offerEndDate: OFFER_END_DATE ?? "",
  minimumOrder: 120,
  freeShippingThreshold: 800,
  heroEyebrow: "Handwritten assignments in India",
  heroHeading: "Handwritten assignments in India, beautifully done.",
  heroDescription: "Neat, consistent handwriting for school, college and university work — with clear pricing and delivery options.",
  heroImages: [
    { src: image("photo-1455390582262-044cdead277a"), alt: "Handwritten notes in an open notebook" },
    { src: image("photo-1517842645767-c639042777db"), alt: "Notebook and pen on a desk" },
    { src: image("photo-1456735190827-d1262f71b8a3"), alt: "Colourful pens and stationery" },
    { src: image("photo-1503676260728-1c00da094a0b"), alt: "Student studying with books" },
    { src: image("photo-1434030216411-0b793f4b4173"), alt: "Hand writing on lined paper" },
    { src: image("photo-1488190211105-8b0e65b80b4e"), alt: "Writing notes at a desk" },
  ],
  seoTitle: "Pretty Handwritten Work | Handwritten Assignments in India",
  seoDescription: "Neat, pretty handwritten assignments in India, records, notes and projects for students — delivered anywhere in India, with optional scanned PDF. Order on WhatsApp.",
  services: [
    { name: "School Assignments", icon: "book-open" },
    { name: "College & University Assignments", icon: "graduation-cap" },
    { name: "Practical Record Writing", icon: "flask-conical" },
    { name: "Project Writing", icon: "folder-kanban" },
    { name: "Notes, Copywriting & Handwritten Questions and Answers", icon: "message-square-text" },
    { name: "Cursive and Beautiful Handwriting", icon: "feather" },
    { name: "File Covers and Decorative Titles", icon: "palette" },
    { name: "Custom Written Work according to your requirements", icon: "sparkles" },
  ],
  whyChooseUs: [
    "Neat & consistent handwriting",
    "Affordable prices",
    "Careful packaging",
    "On-time delivery",
    "Pan-India shipping",
    "Privacy of your work",
  ],
  faqItems: FAQ_ITEMS.map(([question, answer]) => ({ question, answer })),
  testimonials: [
    { name: "Student name", education: "Class / school", quote: "Replace with a genuine customer quote about an assignment." },
    { name: "Student name", education: "Course / college", quote: "Replace with a genuine customer quote about a practical record." },
    { name: "Student name", education: "Class / college", quote: "Replace with a genuine customer quote about a project." },
  ],
  gallerySamples: [],
  pricingSamples: HANDWRITING_SAMPLE_SLOTS.map((sample) => ({ ...sample })),
  pricingLabels: { basic: "Basic Running Handwriting", cursive: "Cursive Handwriting", neat: "Beautiful & Neat Handwriting", cover: "File Cover", project: "Projects" },
};

function mergeContent(raw: unknown): SiteContent {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return DEFAULT_SITE_CONTENT;
  const value = raw as Partial<SiteContent>;
  return {
    ...DEFAULT_SITE_CONTENT,
    ...value,
    heroImages: Array.isArray(value.heroImages) ? value.heroImages : DEFAULT_SITE_CONTENT.heroImages,
    services: Array.isArray(value.services) ? value.services : DEFAULT_SITE_CONTENT.services,
    whyChooseUs: Array.isArray(value.whyChooseUs) ? value.whyChooseUs : DEFAULT_SITE_CONTENT.whyChooseUs,
    faqItems: Array.isArray(value.faqItems) ? value.faqItems : DEFAULT_SITE_CONTENT.faqItems,
    testimonials: Array.isArray(value.testimonials) ? value.testimonials : DEFAULT_SITE_CONTENT.testimonials,
    gallerySamples: Array.isArray(value.gallerySamples) ? value.gallerySamples : DEFAULT_SITE_CONTENT.gallerySamples,
    pricingSamples: Array.isArray(value.pricingSamples) ? value.pricingSamples : DEFAULT_SITE_CONTENT.pricingSamples,
    pricingLabels: value.pricingLabels && typeof value.pricingLabels === "object" ? { ...DEFAULT_SITE_CONTENT.pricingLabels, ...value.pricingLabels } : DEFAULT_SITE_CONTENT.pricingLabels,
  };
}

const SITE_CONTENT_CACHE_KEY = "pretty-handwritten-work:site-content:v1";

function readCachedSiteContent(): { content: SiteContent; savedAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SITE_CONTENT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { content?: unknown; savedAt?: unknown };
    if (!parsed.content || typeof parsed.content !== "object" || Array.isArray(parsed.content)) return null;
    return {
      content: mergeContent(parsed.content),
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
    };
  } catch {
    return null;
  }
}

function cacheSiteContent(content: SiteContent): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SITE_CONTENT_CACHE_KEY, JSON.stringify({ content, savedAt: Date.now() }));
  } catch {
    // Storage may be disabled or full; the site still works without this cache.
  }
}

export const siteContentQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: async (): Promise<SiteContent> => {
    try {
      const { data, error } = await supabase.from("site_content").select("content").eq("id", 1).maybeSingle() as {
        data: { content: unknown } | null; error: { message: string } | null;
      };
      if (error || !data?.content) return readCachedSiteContent()?.content ?? DEFAULT_SITE_CONTENT;
      const content = mergeContent(data.content);
      cacheSiteContent(content);
      return content;
    } catch {
      return readCachedSiteContent()?.content ?? DEFAULT_SITE_CONTENT;
    }
  },
  staleTime: 60_000,
});

export function useSiteContent(): SiteContent {
  const cached = readCachedSiteContent();
  const { data } = useQuery({
    ...siteContentQuery,
    initialData: cached?.content ?? DEFAULT_SITE_CONTENT,
    initialDataUpdatedAt: cached?.savedAt || 0,
    refetchOnMount: "always",
  });
  return data ?? DEFAULT_SITE_CONTENT;
}

/** Share-page links (not the image file itself) that browsers cannot display in an <img>. */
const SHARE_PAGE_HOSTS = /^(ibb\.co|imgbb\.com|imgur\.com|www\.imgur\.com|drive\.google\.com|photos\.google\.com|photos\.app\.goo\.gl|www\.instagram\.com|instagram\.com|www\.dropbox\.com|dropbox\.com|postimg\.cc)$/i;

/** Empty, a site path like /samples/me.jpg, or an https link pointing straight at an image file. */
export function isDirectImageUrl(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  if (v.startsWith("/") && !v.startsWith("//")) return true;
  try {
    const url = new URL(v);
    return url.protocol === "https:" && !SHARE_PAGE_HOSTS.test(url.hostname);
  } catch { return false; }
}
