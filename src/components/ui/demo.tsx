import { ImageStreamHero } from "@/components/ui/image-stream-hero";

const images = [
  { src: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80&auto=format", alt: "Notebook" },
  { src: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=800&q=80&auto=format", alt: "Pen" },
  { src: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=800&q=80&auto=format", alt: "Pens" },
];

export default function Demo() {
  return (
    <ImageStreamHero images={images}>
      <h1 className="font-hand text-5xl">Image Stream Hero</h1>
    </ImageStreamHero>
  );
}
