/**
 * Minimal class-merge helper for ui primitives — dependency-free (no
 * tailwind-merge/clsx). Filters falsy entries and joins the rest.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
