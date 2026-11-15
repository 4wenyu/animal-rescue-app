"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdoptionQueueRow = {
  interestId: string;
  animalId: string;
  animalName: string;
  interestType: string;
  fullName: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  createdLabel: string;
};

const NEXT_STATUS = ["CONTACTED", "CLOSED"] as const;

export function AdoptionQueue({ rows }: { rows: AdoptionQueueRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(interestId: string, status: string) {
    setPendingId(interestId);
    setError(null);
    try {
      const res = await fetch(`/api/adoption-interest/${interestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setError("Could not update that request.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not update that request.");
    } finally {
      setPendingId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        No adoption requests yet. New ones land here as soon as someone
        submits the public form.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.interestId}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  {row.fullName}{" "}
                  <span className="font-normal text-slate-500">
                    · {row.interestType} · {row.animalName || "Unnamed"}
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {row.email}
                  {row.phone ? ` · ${row.phone}` : ""}
                </p>
                {row.message ? (
                  <p className="mt-2 line-clamp-3 text-sm text-slate-700">{row.message}</p>
                ) : null}
                <p className="mt-2 text-xs text-slate-400">
                  {row.status} · {row.createdLabel} · {row.animalId}
                </p>
              </div>
              <div className="flex gap-2">
                {NEXT_STATUS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={pendingId === row.interestId || row.status === status}
                    onClick={() => setStatus(row.interestId, status)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {status === "CONTACTED" ? "Mark contacted" : "Close"}
                  </button>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
