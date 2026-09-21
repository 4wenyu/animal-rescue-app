"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/src/lib/useI18n";

/**
 * Always-on honesty strip for private previews. Hidden on /preview itself
 * so the invite page is not redundant with its own headline.
 */
export function PreviewBanner() {
  const { tr } = useI18n();
  const pathname = usePathname();
  if (pathname === "/preview") return null;
  const hours = process.env.NEXT_PUBLIC_SHELTER_HOURS?.trim();

  return (
    <div className="sticky top-0 z-[60] border-b border-amber-200 bg-amber-50">
      <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-xs font-medium text-amber-950">
        <span>{tr("preview.banner")}</span>
        <span className="text-amber-800/80">
          Demo photos (placedog) until real shelter assets land.
        </span>
        {hours ? (
          <span className="text-amber-800/80">Hours: {hours}</span>
        ) : null}
        <Link
          href="/preview"
          className="font-semibold text-emerald-800 underline decoration-emerald-400 underline-offset-2 hover:text-emerald-700"
        >
          {tr("preview.banner_cta")}
        </Link>
      </p>
    </div>
  );
}
