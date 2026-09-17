import type { MetadataRoute } from "next";
import { isPreviewMode } from "@/lib/siteMode";

/**
 * Robots policy — preview deploys are noindex; live crawls public pages
 * and keeps staff/API surfaces out of search indexes.
 */
export default function robots(): MetadataRoute.Robots {
  if (isPreviewMode()) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/intake", "/medical", "/api/", "/login", "/register", "/preview"],
    },
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
