// Editable public-site defaults. Database-backed settings may override operational rates.
// Replace the placeholders below before publishing.
export const WHATSAPP_NUMBER = "91XXXXXXXXXX"; // Country code + number, digits only.
export const UPI_ID = "yourname@upi";
export const BRAND_NAME = "Pretty Handwritten Work";
export const INSTAGRAM_URL = "https://instagram.com/yourusername";
export const CONTACT_EMAIL = "hello@example.com";
export const EXPERIENCE_YEARS = 2;
export const ORDERS_DELIVERED = 100;
export const ABOUT_STORY =
  "I started this service to help students who need clear, carefully organised handwritten work without the last-minute stress. Every order is prepared with attention to legibility, neat presentation, and the instructions you provide.";

export const OFFER_END_DATE: string | null = null; // ISO 8601 date/time with timezone; null hides the offer.
export const HANDWRITING_SAMPLE_SLOTS = [
  { label: "Basic Running", src: "/samples/basic-running--a4-ruled.jpg" },
  { label: "Cursive", src: "/samples/cursive--a4-ruled.jpg" },
  { label: "Beautiful & Neat", src: "/samples/beautiful-neat--a4-ruled.jpg" },
  { label: "File Cover", src: "/samples/file-cover--cover.jpg" },
  { label: "Projects", src: "/samples/project--sample-page.jpg" },
] as const;

export const FAQ_ITEMS = [
  ["How long does it take?", "Turnaround is 2–5 days for up to 30 pages. Larger orders and your deadline are confirmed on WhatsApp."],
  ["Which ink colours can I choose?", "Blue and black ink are standard. Other colours are available on request."],
  ["What paper do you use?", "We use A4 ruled paper. Plain paper is available on request."],
  ["Can you draw diagrams and tables?", "Yes, we can neatly include diagrams and tables."],
  ["How does payment work?", "Pay 50% in advance via UPI. The remaining balance is due before dispatch."],
  ["What if there is a mistake?", "We correct our own mistakes free of charge."],
  ["Can I cancel and get a refund?", "Refunds are possible for cancellations made before work starts. Once work has started, contact us to discuss the order."],
  ["How long does courier delivery take?", "Courier delivery usually takes 3–7 days after dispatch, depending on your location in India."],
] as const;

export const DEFAULT_SETTINGS = {
  whatsapp_number: WHATSAPP_NUMBER,
  upi_id: UPI_ID,
  offer_active: true,
  price_basic: 8,
  price_basic_offer: 6,
  price_cursive: 12,
  price_neat: 18,
  price_cover: 50,
  price_project_from: 250,
  pdf_addon_per_page: 1,
  shipping_min: 50,
  shipping_max: 100,
  free_shipping_threshold: 800,
  bulk_discount_percent: 0,
  bulk_discount_threshold: 1500,
};
export type SiteSettings = typeof DEFAULT_SETTINGS;

// Optional captions keyed by filename. Otherwise captions are derived from style--page-type filenames.
export const SAMPLE_CAPTIONS: Record<string, { style: string; pageType: string }> = {};

// Placeholder testimonials — replace with genuine customer feedback before publishing.
export const TESTIMONIALS = [
  { name: "Student name", education: "Class / school", quote: "Replace with a genuine customer quote about an assignment." },
  { name: "Student name", education: "Course / college", quote: "Replace with a genuine customer quote about a practical record." },
  { name: "Student name", education: "Class / college", quote: "Replace with a genuine customer quote about a project." },
];

export const waLinkTo = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/\\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
