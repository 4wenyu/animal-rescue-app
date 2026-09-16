import { PawPrint } from "lucide-react";

/** Lost-pet intake loading state — calm, no urgency cues. */
export default function LostPetIntakeLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-600">
        <PawPrint className="h-6 w-6 animate-pulse" />
        <p className="text-sm font-medium">Getting the assistant ready…</p>
      </div>
    </div>
  );
}
