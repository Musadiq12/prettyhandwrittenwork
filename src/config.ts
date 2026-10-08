// ============================================================
//  EDIT EVERYTHING HERE — all business values live in this file.
// ============================================================

// 👉 REPLACE with your WhatsApp number: country code + number, digits only (no +, spaces or dashes).
//    Example: "919876543210"
export const WHATSAPP_NUMBER = "91XXXXXXXXXX";

// 👉 REPLACE with your UPI ID (shown in FAQ / payment info). Example: "yourname@okaxis"
export const UPI_ID = "yourname@upi";

export const BRAND_NAME = "Pretty Handwritten Work";

// Limited-time offer on Basic handwriting. Set to false to show normal price.
export const OFFER_ACTIVE = true;

export const PRICES = {
  basic: 10, // ₹ per page (regular)
  basicOffer: 8, // ₹ per page while OFFER_ACTIVE
  cursive: 20, // ₹ per page
  beautiful: 20, // ₹ per page
  fileCover: 60, // ₹ per cover
  projectFrom: 350, // ₹ starting price
  scanAddOnPerPage: 1, // ₹ per page for Physical + PDF
};

export const BULK_DISCOUNT = {
  threshold: 1500, // ₹ — discount applies when estimate exceeds this
  percent: 5,
};

export const SHIPPING_TEXT =
  "Shipping is charged separately — usually ₹60–₹120 depending on weight and location, confirmed on WhatsApp.";

export const basicRate = () => (OFFER_ACTIVE ? PRICES.basicOffer : PRICES.basic);

// 👉 REPLACE these sample images with photos of your own work.
export const SAMPLE_IMAGES = [
  { src: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80&auto=format", alt: "Handwritten notes in a notebook" },
  { src: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=80&auto=format", alt: "Open notebook with a pen" },
  { src: "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?w=800&q=80&auto=format", alt: "Writing in a journal" },
  { src: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&q=80&auto=format", alt: "Person writing notes at a desk" },
  { src: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80&auto=format", alt: "Hand writing on paper" },
  { src: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=800&q=80&auto=format", alt: "Neat planner pages" },
];

export const waLink = (text?: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
