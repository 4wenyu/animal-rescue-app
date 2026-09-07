/**
 * Public landing page — /p/[shareId]
 * ================================
 * When an unauthenticated visitor clicks a `trackingUrl` minted by
 * /api/shares in the dashboard, they land here.
 *
 * Behavior (V1, dgram):
 *   1. Resolve `params.shareId` → ViralShareVerification row.
 *   2. If the share is not PENDING/VERIFIED → 404.
 *   3. Increment `observedAt` (first visitor wins) for analytics.
 *   4. Read `relatedAnimalId` from `evidenceSnapshot.relatedAnimalId`
 *      and render a minimal public profile pulled from `data/dogs.json`.
 *
 * This is a Server Component so we have request-level `headers()`. V1
 * uses the dashboard's mock-data animal fixture.
 *
 * NOTE: no token is minted on this page. GET requests must not mutate the
 * ledger — the per-visit +5 reward was moved off this public, spoofable
 * path. The sharer is instead rewarded when their shares are VERIFIED and
 * via the milestone grant, both behind authenticated endpoints.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { PawPrint, ShieldCheck, Heart } from "lucide-react";

import { prisma } from "@/lib/prisma";
import dogsData from "../../../data/dogs.json";
import { AnimalPhoto } from "@/src/components/ui/AnimalPhoto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tiny types just for this page's local mock-data pull-through.
type DogRecord = {
  id: number;
  name: string;
  breed: string;
  age: number;
  medicalStatus: string;
  imageUrl?: string;
};

const DOGS = dogsData as DogRecord[];

interface PageProps {
  params: Promise<{ shareId: string }>;
}

export default async function ShareLandingPage({
  params,
}: PageProps): Promise<ReactNode> {
  const { shareId } = await params;

  // ── 1. Resolve share row ──────────────────────────────────────
  const share = await prisma.viralShareVerification.findUnique({
    where: { shareId },
  });

  if (!share || (share.status !== "PENDING" && share.status !== "VERIFIED")) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <ShieldCheck className="h-5 w-5 text-slate-500" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            Share not found or no longer active
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            The link you followed is expired or has been withdrawn by the
            publisher. Head back to the public site to find others.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Browse the public adoption feed
          </Link>
        </div>
      </main>
    );
  }

  // ── 2. Bump observedAt (best effort, fail-quiet) ──────────────
  //     Real "observers" streak: this is the first-visit stamp. The
  //     verifier cron (future) flips observedAt→now when the upstream
  //     platform reports a real hit.
  if (!share.observedAt) {
    try {
      await prisma.viralShareVerification.update({
        where: { shareId },
        data: { observedAt: new Date() },
      });
    } catch (err) {
      console.warn(`[/p/${shareId}] observedAt bump failed`, err);
    }
  }

  // ── 3. Resolve the animal profile stub from dogs.json ──────────
  const evidence = (share.evidenceSnapshot as Record<string, unknown> | null) ?? null;
  const relatedAnimalId =
    typeof evidence?.relatedAnimalId === "string" ? evidence.relatedAnimalId : null;
  const animal: DogRecord | null =
    relatedAnimalId !== null
      ? DOGS.find((d) => String(d.id) === relatedAnimalId) ?? null
    : null;

  // ── 4. Render ──────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* hero strip */}
      <header className="border-b border-slate-200/60 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900"
          >
            <PawPrint className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold">RescueHub</span>
          </Link>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
              share.status === "VERIFIED"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {share.status === "VERIFIED" ? "Verified share" : "Share link active"}
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-10">
        {/* Title */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {animal ? `Help ${animal.name}` : "Help an animal in need"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Shared by a RescueHub community member · references a{" "}
            {animal?.breed ?? "stray"} in care
          </p>
        </div>

        {/* Animal profile stub */}
        {animal && (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl">
                <AnimalPhoto
                  src={animal.imageUrl}
                  alt={animal.name}
                  roundedClassName="rounded-2xl"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {animal.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {animal.breed} · {animal.age}{" "}
                  {animal.age === 1 ? "year" : "years"} old
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  <Heart className="h-3 w-3" />
                  {animal.medicalStatus}
                </p>
              </div>
            </div>
          </article>
        )}

        {!animal && (
          <p className="mt-4 text-center text-sm text-slate-500">
            Animal profile not available — but your visit has been recorded. 💛
          </p>
        )}

        <p className="mt-8 text-center text-[10px] uppercase tracking-wider text-slate-400">
          shareId&#61;{share.shareId}
        </p>
      </section>
    </main>
  );
}
