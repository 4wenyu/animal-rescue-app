/**
 * /radar/[searchId] — Suspense wrapper.
 *
 * The actual UI lives in `RadarView.tsx` (a "use client" component that
 * reads `useParams()` and `useEffect`-fetches the search row). Next 16
 * requires client components that call `useParams()` to be wrapped in a
 * Suspense boundary so static prerender doesn't bail out.
 *
 * Mirrors the pattern used by /lost-pet-intake/page.tsx.
 */

import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import RadarView from "./RadarView";

export default function RadarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-8 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="mx-auto max-w-3xl">
            <div className="flex h-[60vh] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center gap-3 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-sm font-medium">Loading radar…</p>
              </div>
            </div>
          </div>
        }
      >
        <RadarView />
      </Suspense>
    </div>
  );
}
