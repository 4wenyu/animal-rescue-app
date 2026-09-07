import Link from "next/link";
import { PawPrint } from "lucide-react";

/**
 * (main) route-group 404 — unknown staff routes. Renders inside the (main)
 * layout (sidebar stays), with a path back to the dashboard.
 */
export default function MainNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
        <PawPrint className="h-6 w-6 text-emerald-500" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">Page not found</h1>
      <p className="max-w-md text-sm text-slate-500">
        This page doesn&rsquo;t exist in the RescueHub workspace.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500"
      >
        <PawPrint className="h-4 w-4" />
        Back to dashboard
      </Link>
    </div>
  );
}
