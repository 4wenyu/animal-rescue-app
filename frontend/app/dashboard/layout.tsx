import type { ReactNode } from "react";
import { Sidebar } from "@/src/components/Sidebar";

/**
 * Dashboard route layout.
 *
 * Renders the internal shelter dashboard with the persistent dark
 * sidebar and scrollable main content area — same pattern as the
 * (main) route group, but mounted at /dashboard for external access
 * from the public landing page.
 */
export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): ReactNode {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100/80 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-10 py-10">{children}</div>
      </main>
    </div>
  );
}