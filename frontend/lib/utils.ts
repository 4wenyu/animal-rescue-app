import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes safely.
 *
 * Combines `clsx` (conditional class logic) with `tailwind-merge`
 * (intelligent dedup of conflicting Tailwind utilities) so that
 * later classes override earlier ones correctly.
 *
 * @example
 *   cn("px-4 py-2", isActive && "bg-blue-500", "px-6")
 *   // → "py-2 bg-blue-500 px-6"   (px-6 wins over px-4)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}