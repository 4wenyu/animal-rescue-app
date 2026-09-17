/**
 * Pre-launch vs live site mode.
 *
 * Unset or any value other than "live" is preview. That fail-closed default
 * keeps a Vercel deploy from looking like a municipal shelter until someone
 * explicitly sets NEXT_PUBLIC_SITE_MODE=live.
 */
export type SiteMode = "preview" | "live";

export function getSiteMode(
  raw: string | undefined = process.env.NEXT_PUBLIC_SITE_MODE,
): SiteMode {
  return raw === "live" ? "live" : "preview";
}

export function isPreviewMode(
  raw: string | undefined = process.env.NEXT_PUBLIC_SITE_MODE,
): boolean {
  return getSiteMode(raw) === "preview";
}
