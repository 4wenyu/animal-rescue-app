/**
 * /lost-pet-intake — Suspense wrapper
 * ===================================
 * Mounted after a successful LOST_PET_SEARCH_SPEND (handled by the
 * SponsorshipCheckoutModal's parent dashboard).
 *
 * Structure:
 *   - This file is the App Router route entry. Keeping it as a thin
 *     server component that wraps the client view in a Suspense
 *     boundary, as Next 16 requires when child components call
 *     `useSearchParams` (which `LostPetIntakeView` does).
 *   - The actual UI lives in `LostPetIntakeView.tsx` (client component).
 *   - Lit-up fallback during static prerender is intentionally minimal:
 *     a soft typewriter placeholder so the route pre-renders without
 *     bailing out.
 */

import { Suspense } from "react";
import LostPetIntakeView from "./LostPetIntakeView";

export default function LostPetIntakePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-8 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl">
            <div className="flex h-[calc(100vh-6rem)] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center gap-3 text-slate-400">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-slate-300"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-slate-300"
                  style={{ animationDelay: "300ms" }}
                />
                <p className="ml-2 text-sm font-medium">
                  Loading intake assistant…
                </p>
              </div>
            </div>
          </div>
        }
      >
        <LostPetIntakeView />
      </Suspense>
    </div>
  );
}
