import { PawPrint } from "lucide-react";

/**
 * /adopt/[id] loading — calm skeleton while the adoption profile hydrates
 * (Sprint D quality floor).
 */
export default function AdoptLoading() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-6">
      <div className="flex items-center gap-3 text-slate-400">
        <PawPrint className="h-5 w-5 animate-pulse" />
        <p className="text-sm font-medium">Loading this pet…</p>
      </div>
    </div>
  );
}
