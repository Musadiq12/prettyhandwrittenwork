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

// Set an ISO date with timezone to advertise a limited-time offer; null hides the label.
export const OFFER_END_DATE: string | null = null;

export const FAQ_ITEMS = [
  ["How long does it take?", "Turnaround is 2–5 days for up to 30 pages. Larger orders and your deadline are confirmed on WhatsApp."],
  ["Which ink colours can I choose?", "Blue and black ink are standard. Other colours are available on request."],
  ["What paper do you use?", "We use A4 ruled paper. Plain paper is available on request."],
  ["Can you draw diagrams and tables?", "Yes, we include neat diagrams and tables. Share your references so we can confirm the price."],
  ["How does payment work?", "Pay 50% advance via UPI after price confirmation, and the remaining balance before dispatch."],
  ["What if there is a mistake?", "We correct our own mistakes free of charge."],
  ["What is the cancellation and refund policy?", "Cancel before work starts for a full refund of your advance. Once work has started, cancellation and refunds are not available."],
  ["How long does courier delivery take?", "Courier delivery takes 3–7 days after dispatch, depending on your location in India."],
] as const;

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

// Optional captions keyed by filename. Otherwise use style--page-type.jpg filenames.
export const SAMPLE_CAPTIONS: Record<string, { style: string; pageType: string }> = {};

// REPLACE all three placeholders with genuine customer testimonials before publishing.
export const TESTIMONIALS = [
  { name: "Student name", education: "Class / school", quote: "Your customer's feedback on their handwritten assignment goes here." },
  { name: "Student name", education: "Course / college", quote: "Your customer's feedback on their practical records goes here." },
  { name: "Student name", education: "Class / college", quote: "Your customer's feedback on their handwritten project goes here." },
];

export const waLinkTo = (number: string, text?: string) =>
  `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
