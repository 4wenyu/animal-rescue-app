"use client";

import Image from "next/image";
import { useState } from "react";
import { PawPrint } from "lucide-react";

// 1x1 emerald blur placeholder (tiny data-URI, no network).
const BLUR_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="#d1fae5"/></svg>'
  );

type AnimalPhotoProps = {
  src?: string | null;
  alt: string;
  /** Tailwind classes for sizing/rounding. Parent must be `relative` when using `fill`. */
  className?: string;
  /** Optimize the LCP / above-the-fold image (skips lazy loading). */
  priority?: boolean;
  /** Responsive sizes hint for the Image optimizer. */
  sizes?: string;
  roundedClassName?: string;
};

/**
 * Photo-first animal image. Uses next/image (remote-optimized, blurred
 * placeholder while loading) and falls back to a paw glyph when the animal
 * has no photo OR the image fails to load (broken URL / shelter photo not
 * yet uploaded). Parent must supply `relative` + dimensions.
 */
export function AnimalPhoto({
  src,
  alt,
  className = "",
  priority = false,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  roundedClassName = "rounded-xl",
}: AnimalPhotoProps) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-slate-100 ${roundedClassName}`}
      >
        <PawPrint className="h-1/2 w-1/2 text-slate-300" aria-hidden="true" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL={BLUR_PLACEHOLDER}
      onError={() => setImageError(true)}
      className={`object-cover ${roundedClassName} ${className}`}
    />
  );
}
