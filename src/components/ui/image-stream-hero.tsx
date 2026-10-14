import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface StreamImage {
  src: string;
  alt: string;
}

interface ImageStreamHeroProps {
  images: StreamImage[];
  children?: ReactNode;
  className?: string;
}

/** A perspective "corridor" of image rows streaming past. Pauses for prefers-reduced-motion. */
export function ImageStreamHero({ images, children, className }: ImageStreamHeroProps) {
  const rows = [0, 1, 2].map((r) => images.filter((_, i) => i % 3 === r));
  return (
    <section className={cn("relative h-[520px] overflow-hidden md:h-[560px]", className)}>
      <div className="absolute inset-0 flex flex-col justify-center gap-4 [perspective:900px]" aria-hidden="true">
        {rows.map((row, r) => (
          <div key={r} className="stream-row" style={{ transform: `rotateX(${(1 - r) * 8}deg)` }}>
            <div className={cn("stream-track", r % 2 && "stream-reverse")}>
              {[...row, ...row].map((img, i) => (
                <img
                  key={i}
                  src={img.src}
                  alt={i < row.length ? img.alt : ""}
                  loading="lazy"
                  width={320}
                  height={213}
                  className="h-36 w-52 shrink-0 rounded-xl object-cover shadow-paper md:h-40 md:w-60"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="hero-veil absolute inset-0" />
      <div className="relative z-10 flex h-full items-center justify-center px-5">{children}</div>
    </section>
  );
}

export default ImageStreamHero;
