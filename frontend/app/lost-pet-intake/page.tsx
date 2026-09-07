/**
 * /lost-pet-intake — public route (Sprint B)
 * ==========================================
 * Moved OUT of the (main) route group: this is a public landing for
 * pet owners who lost an animal. It renders standalone (no staff
 * sidebar) so a first-time visitor is not greeted by the staff shell.
 *
 * Reached from:
 *   - Public hero / nav CTA ("I lost a pet")
 *   - Dashboard sponsor-grant redirect (?credit=&spend=&newBalance=)
 *
 * Structure: thin server component wrapping the client view in a
 * Suspense boundary (Next 16 requires it because the view reads
 * `useSearchParams`).
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
                <p className="ml-2 text-sm font-medium">Loading intake assistant…</p>
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
