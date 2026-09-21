import type { ReactNode } from "react";
import Link from "next/link";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { RosterCsvImportForm } from "@/src/components/staff/RosterCsvImportForm";

export const dynamic = "force-dynamic";

export default async function StaffRosterPage(): Promise<ReactNode> {
  const session = await auth();
  const role = (session?.user as unknown as Record<string, unknown> | undefined)
    ?.role as string | undefined;

  if (!session?.user?.id || (role !== "STAFF" && role !== "ADMIN")) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Staff only</h1>
        <p className="mt-2 text-sm text-slate-600">
          Pilot CSV import is limited to STAFF/ADMIN.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pilot roster CSV</h1>
        <p className="mt-2 text-sm text-slate-600">
          N0 path while Petfinder public API is gone — upload or paste a
          shelter export, dry-run preview, then import. Animals appear as{" "}
          <code className="text-xs">roster-&#123;id&#125;</code> on the public
          feed.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <RosterCsvImportForm />
      </div>
      <p className="text-xs text-slate-500">
        Ops status:{" "}
        <Link href="/staff/ops" className="underline">
          /staff/ops
        </Link>
      </p>
    </div>
  );
}
