import type { ReactNode } from "react";
import Link from "next/link";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { AdoptionQueue } from "@/src/components/staff/AdoptionQueue";

export const dynamic = "force-dynamic";

function createdLabel(date: Date): string {
  return date.toISOString().slice(0, 16).replace("T", " ");
}

export default async function StaffAdoptionsPage(): Promise<ReactNode> {
  const session = await auth();
  const role = (session?.user as unknown as Record<string, unknown> | undefined)
    ?.role as string | undefined;

  if (!session?.user?.id || (role !== "STAFF" && role !== "ADMIN")) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Staff only</h1>
        <p className="mt-2 text-sm text-slate-600">
          Adoption requests are limited to STAFF/ADMIN.
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

  const rows = await prisma.adoptionInterest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Adoption requests</h1>
        <p className="mt-2 text-sm text-slate-600">
          Applications saved from the public adopt form, newest first. A
          Telegram note is sent only when the ops bot is configured. The
          request is kept here either way.
        </p>
      </div>
      <AdoptionQueue
        rows={rows.map((row) => ({
          interestId: row.interestId,
          animalId: row.animalId,
          animalName: row.animalName,
          interestType: row.interestType,
          fullName: row.fullName,
          email: row.email,
          phone: row.phone,
          message: row.message,
          status: row.status,
          createdLabel: createdLabel(row.createdAt),
        }))}
      />
    </div>
  );
}
