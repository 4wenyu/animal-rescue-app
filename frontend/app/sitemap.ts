import type { MetadataRoute } from "next";
import dogs from "../data/dogs.json";
import { isPreviewMode } from "@/lib/siteMode";

/**
 * Sitemap — public marketing routes plus every adoption profile in the
 * static roster (dogs.json), so search engines can index the adoptable
 * animals. Staff routes are excluded via robots.txt.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (isPreviewMode()) return [];

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/today`, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/lost-pet-intake`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/intake/public`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/fundraising`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const animalRoutes: MetadataRoute.Sitemap = dogs.map((dog) => ({
    url: `${base}/adopt/${dog.id}`,
    lastModified: dog.intakeTimestamp,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...animalRoutes];
}
