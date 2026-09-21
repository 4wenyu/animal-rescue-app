"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { useI18n } from "@/src/lib/useI18n";

import {
  parseShareEvidence,
  safeHttpUrl,
} from "./shareEvidence";

type Props = {
  shareId: string;
  contentUrl: string | null;
  platformPostId: string | null;
  evidenceSnapshot: unknown;
};

export function ShareEvidenceLinks({
  shareId,
  contentUrl,
  platformPostId,
  evidenceSnapshot,
}: Props) {
  const { tr } = useI18n();
  const evidence = parseShareEvidence(evidenceSnapshot);
  const proofUrl = safeHttpUrl(contentUrl);

  return (
    <dl className="mt-4 space-y-2 text-xs text-slate-700">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <dd>
          <Link
            href={`/p/${shareId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-emerald-700 underline-offset-2 hover:underline"
          >
            {tr("shares.review_tracking")}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </Link>
        </dd>
        {proofUrl ? (
          <dd>
            <a
              href={proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1 truncate font-medium text-emerald-700 underline-offset-2 hover:underline"
            >
              {tr("shares.review_proof")}
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
            </a>
          </dd>
        ) : (
          <dd className="text-amber-700">{tr("shares.review_no_proof")}</dd>
        )}
      </div>

      {evidence.relatedSearchId ? (
        <div>
          <dt className="inline text-slate-500">{tr("shares.review_radar")}: </dt>
          <dd className="inline">
            <Link
              href={`/radar/${evidence.relatedSearchId}`}
              className="font-medium text-emerald-700 underline-offset-2 hover:underline"
            >
              {evidence.relatedSearchId.slice(0, 8)}…
            </Link>
          </dd>
        </div>
      ) : null}

      {evidence.relatedAnimalId ? (
        <div>
          <dt className="inline text-slate-500">{tr("shares.review_animal")}: </dt>
          <dd className="inline">
            <Link
              href={`/adopt/${evidence.relatedAnimalId}`}
              className="font-medium text-emerald-700 underline-offset-2 hover:underline"
            >
              {evidence.relatedAnimalId}
            </Link>
          </dd>
        </div>
      ) : null}

      {platformPostId ? (
        <div>
          <dt className="inline text-slate-500">{tr("shares.review_platform_id")}: </dt>
          <dd className="inline break-all font-mono text-[11px]">{platformPostId}</dd>
        </div>
      ) : null}

      {evidence.source ? (
        <div>
          <dt className="inline text-slate-500">{tr("shares.review_evidence")}: </dt>
          <dd className="inline">{evidence.source}</dd>
        </div>
      ) : null}
    </dl>
  );
}
