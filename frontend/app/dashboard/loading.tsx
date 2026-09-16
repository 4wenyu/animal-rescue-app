import { PawPrint } from "lucide-react";

/** Dashboard loading state — matches the (main) group skeleton style. */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3 text-slate-600">
        <PawPrint className="h-5 w-5 animate-pulse" />
        <p className="text-sm font-medium">Loading dashboard…</p>
      </div>
    </div>
  );
}
