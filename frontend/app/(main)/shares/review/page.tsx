import type { ReactNode } from "react";
import Link from "next/link";

import { auth } from "@/app/api/auth/[...nextauth]/auth";
import { prisma } from "@/lib/prisma";
import { ShareReviewQueue } from "@/src/components/shares/ShareReviewQueue";

export const dynamic = "force-dynamic";

export default async function ShareReviewPage(): Promise<ReactNode> {
  const session = await auth();
  const role = (session?.user as unknown as Record<string, unknown> | undefined)
    ?.role as string | undefined;

  if (!session?.user?.id || (role !== "STAFF" && role !== "ADMIN")) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Staff review required</h1>
        <p className="mt-2 text-sm text-slate-600">
          Only shelter STAFF/ADMIN can verify viral shares for the free-search milestone.
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

  const shares = await prisma.viralShareVerification.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      shareId: true,
      userId: true,
      platform: true,
      status: true,
      contentUrl: true,
      platformPostId: true,
      createdAt: true,
      evidenceSnapshot: true,
      user: { select: { email: true, displayName: true } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Share review</h1>
        <p className="mt-2 text-sm text-slate-600">
          Open the tracking link and any posted URL, then verify real community
          posts. Ten verified shares unlock a free search for that owner.
        </p>
      </div>
      <ShareReviewQueue
        initialShares={shares.map((row) => ({
          ...row,
          createdAt: row.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
