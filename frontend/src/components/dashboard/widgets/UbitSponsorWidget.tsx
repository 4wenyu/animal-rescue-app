"use client";

import { motion } from "framer-motion";
import { DollarSign, ShieldCheck, TrendingUp, TrendingDown } from "lucide-react";

/**
 * Revenue Compliance (IRC § 513(i)) widget.
 * Visually compares Qualified Sponsorships vs Public Donations
 * to demonstrate UBIT-safe revenue separation.
 */
export function UbitSponsorWidget() {
  const qualified = 42500;
  const donations = 18200;

  const maxVal = Math.max(qualified, donations);
  const qualifiedPct = (qualified / maxVal) * 100;
  const donationsPct = (donations / maxVal) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Revenue Compliance
            </h3>
            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
              IRC § 513(i)
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
          <ShieldCheck className="h-2.5 w-2.5" />
          UBIT SAFE
        </span>
      </div>

      {/* Bar: Qualified Sponsorships */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-medium text-slate-700">Qualified Sponsorships</span>
          <span className="font-semibold text-emerald-700">
            ${qualified.toLocaleString()}
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
            style={{ width: `${qualifiedPct}%` }}
          />
        </div>
      </div>

      {/* Bar: Public Donations */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-medium text-slate-700">Public Donations</span>
          <span className="font-semibold text-amber-600">
            ${donations.toLocaleString()}
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-slate-100">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
            style={{ width: `${donationsPct}%` }}
          />
        </div>
      </div>

      {/* Footer metric */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px]">
        <span className="text-slate-400">Sponsorship Revenue Ratio</span>
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
          <TrendingUp className="h-3 w-3" />
          {(qualified / (qualified + donations) * 100).toFixed(0)}%
        </span>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
        Qualified sponsorship payments (IRC § 513(i)) are excluded from UBIT.
        Public donations remain tax-deductible under § 170.
      </p>
    </motion.div>
  );
}

export function EsignStatsWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <DollarSign className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              ESIGN / UETA Compliance
            </h3>
            <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
              Electronic Signature Records
            </p>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
            <ShieldCheck className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-emerald-800 text-sm">
            100% Compliance
          </span>
        </div>
        <p className="mt-2 text-[11px] text-emerald-600 leading-relaxed">
          All intake ESIGN waivers are cryptographically hashed and stored
          immutably. 100% audit-ready.
        </p>
      </div>

      {/* Active hashes */}
      <div className="flex items-center justify-between py-2 border-b border-slate-100">
        <span className="text-xs text-slate-600">Active SHA-256 Hashes</span>
        <span className="text-lg font-bold text-slate-900">342</span>
      </div>
      <div className="flex items-center justify-between py-2 border-b border-slate-100">
        <span className="text-xs text-slate-600">Intakes This Month</span>
        <span className="text-lg font-bold text-slate-900">47</span>
      </div>
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-600">Verification Rate</span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
          <TrendingUp className="h-3.5 w-3.5" />
          100%
        </span>
      </div>
    </motion.div>
  );
}