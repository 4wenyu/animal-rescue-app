import Link from "next/link";
import { PawPrint, Home } from "lucide-react";

/**
 * Root 404 — branded, warm, with a path home. Previously Next's default
 * unstyled page rendered for unknown routes (Sprint D quality floor).
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-slate-50 to-white px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
        <PawPrint className="h-7 w-7 text-emerald-500" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Page not found
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-slate-500">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has moved. Let&rsquo;s get
        you back to the animals.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-500"
      >
        <Home className="h-4 w-4" />
        Back to home
      </Link>
    </main>
  );
}
