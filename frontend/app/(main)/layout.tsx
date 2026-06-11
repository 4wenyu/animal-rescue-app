import type { ReactNode } from "react";
import { Sidebar } from "@/src/components/Sidebar";

/**
 * (main) route group layout.
 *
 * Wraps all app pages (Dashboard, Intake, Medical, Fundraising)
 * with the persistent dark sidebar and a scrollable main content
 * area.  This ensures the sidebar is always visible regardless
 * of which route the user navigates to.
 */
export default function MainLayout({
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