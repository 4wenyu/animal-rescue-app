import { PawPrint } from "lucide-react";

/**
 * (main) route-group loading — staff surfaces. Calm skeleton consistent
 * with the app's existing loading style (Sprint D quality floor).
 */
export default function MainLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 text-slate-400">
        <PawPrint className="h-5 w-5 animate-pulse" />
        <p className="text-sm font-medium">Loading…</p>
      </div>
    </div>
  );
}
