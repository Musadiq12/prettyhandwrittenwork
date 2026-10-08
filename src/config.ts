// ============================================================
//  FALLBACK DEFAULTS. Live values are edited in /admin → Settings
//  and stored in the database. These are used only if loading fails.
// ============================================================

// 👉 REPLACE with your WhatsApp number (also set it in /admin → Settings).
//    Country code + number, digits only. Example: "919876543210"
export const WHATSAPP_NUMBER = "91XXXXXXXXXX";

// 👉 REPLACE with your UPI ID (also set it in /admin → Settings).
export const UPI_ID = "yourname@upi";

export const BRAND_NAME = "Pretty Handwritten Work";

export const DEFAULT_SETTINGS = {
  whatsapp_number: WHATSAPP_NUMBER,
  upi_id: UPI_ID,
  offer_active: true,
  price_basic: 8,
  price_basic_offer: 6,
  price_cursive: 15,
  price_neat: 15,
  price_cover: 40,
  price_project_from: 250,
  pdf_addon_per_page: 1,
  shipping_min: 50,
  shipping_max: 100,
  bulk_discount_percent: 5,
  bulk_discount_threshold: 1500,
};
export type SiteSettings = typeof DEFAULT_SETTINGS;

// 👉 REPLACE these sample images with photos of your own work.
export const SAMPLE_IMAGES = [
  { src: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80&auto=format", alt: "Handwritten notes in a notebook" },
  { src: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=80&auto=format", alt: "Open notebook with a pen" },
  { src: "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=800&q=80&auto=format", alt: "Writing in a journal" },
  { src: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&q=80&auto=format", alt: "Person writing notes at a desk" },
  { src: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80&auto=format", alt: "Hand writing on paper" },
  { src: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80&auto=format", alt: "Neat planner pages" },
];

export const waLinkTo = (number: string, text?: string) =>
  `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
