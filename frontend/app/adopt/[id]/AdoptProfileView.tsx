"use client";

/**
 * AdoptProfileView — adopter-facing profile (Sprint B #2).
 *
 * Photo-led, dignified adoption story with an always-visible CTA row:
 *   - Adopt / Foster → inline application form → POST /api/adoption-interest
 *   - Donate → /fundraising/[animalId]
 *   - Contact shelter → mailto
 *
 * "Still available" badge + "Needs a home by {date}" copy are derived from
 * the animal's real hold/risk data (no fake countdown, no legal jargon on
 * a public adoption surface).
 */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Home,
  Mail,
  MapPin,
  PawPrint,
  Send,
  ShieldCheck,
} from "lucide-react";

import { useI18n } from "@/src/lib/useI18n";
import { AnimalPhoto } from "@/src/components/ui/AnimalPhoto";

type Dog = {
  id: number;
  name: string;
  breed: string;
  age: number;
  medicalStatus: string;
  euthanasia_risk_status: "SAFE" | "AT_RISK" | "IMMEDIATE_BEHAVIORAL";
  statutoryHoldCleared: boolean;
  strayHoldExpiresAt: string;
  intakeTimestamp: string;
  imageUrl?: string;
  sex?: "Male" | "Female";
  personality?: string;
};

type InterestType = "ADOPT" | "FOSTER";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdoptProfileView({ animal }: { animal: Dog }) {
  const { tr } = useI18n();
  const [interestType, setInterestType] = useState<InterestType>("ADOPT");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const available = animal.statutoryHoldCleared;
  const homeByDate = formatDate(animal.strayHoldExpiresAt);

  const startApplication = (type: InterestType) => {
    setInterestType(type);
    setStatus("idle");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus("idle");
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch("/api/adoption-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalId: String(animal.id),
          animalName: animal.name,
          interestType,
          fullName: String(data.get("fullName") ?? "").trim(),
          email: String(data.get("email") ?? "").trim(),
          phone: String(data.get("phone") ?? "").trim(),
          message: String(data.get("message") ?? "").trim(),
        }),
      });
      if (!res.ok) throw new Error("submit failed");
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
      {/* ── Photo-led hero ─────────────────────────────────────────── */}
      <div className="relative h-80 w-full bg-slate-100 sm:h-96">
        <AnimalPhoto
          src={animal.imageUrl}
          alt={animal.name}
          priority
          roundedClassName=""
          sizes="(min-width: 1024px) 50vw, 100vw"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-800 shadow-sm">
            {available ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {tr("adoption_feed.still_available")}
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                {tr("adoption_feed.on_hold")}
              </>
            )}
          </span>
          <h1 className="mt-2 text-4xl font-bold text-white drop-shadow-sm">
            {tr("adoption_feed.meet_name", { name: animal.name })}
          </h1>
          <p className="mt-1 text-sm font-medium text-white/90">{animal.breed}</p>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {/* ── Chips ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
            <PawPrint className="h-3.5 w-3.5 text-slate-400" />
            {animal.age} {animal.age === 1 ? tr("common.year") : tr("common.years")}
          </span>
          {animal.sex && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 font-medium text-violet-700">
              {animal.sex === "Female"
                ? tr("adopt.sex_female")
                : tr("adopt.sex_male")}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${
              animal.medicalStatus === "Healthy"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {animal.medicalStatus}
          </span>
          {homeByDate && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {tr("adoption_feed.needs_home_by", { date: homeByDate })}
            </span>
          )}
        </div>

        {/* ── Story ─────────────────────────────────────────────────── */}
        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
          {animal.personality && (
            <>
              <h2 className="text-sm font-bold text-slate-900">
                {tr("adopt.personality_label", { name: animal.name })}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {animal.personality}
              </p>
            </>
          )}
          <p
            className={`text-sm leading-relaxed text-slate-600 ${
              animal.personality ? "mt-3" : ""
            }`}
          >
            {tr("adopt.story", { name: animal.name })}
          </p>
          {!available && homeByDate && (
            <p className="mt-3 text-xs font-medium text-slate-500">
              {tr("adopt.hold_note", { name: animal.name, date: homeByDate })}
            </p>
          )}
        </div>

        {/* ── CTA row ───────────────────────────────────────────────── */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => startApplication("ADOPT")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-500 active:scale-[0.98]"
          >
            <Home className="h-4 w-4" />
            {tr("adoption_feed.adopt")} {animal.name}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => startApplication("FOSTER")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50 active:scale-[0.98]"
          >
            <Heart className="h-4 w-4" />
            {tr("adoption_feed.foster")} {animal.name}
          </button>
          <Link
            href={`/fundraising/${animal.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-400 active:scale-[0.98]"
          >
            <Heart className="h-4 w-4" />
            {tr("adoption_feed.donate")}
          </Link>
          <a
            href={`mailto:adopt@rescuehub.org?subject=${encodeURIComponent(
              `Interested in ${animal.name} (${animal.id})`,
            )}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            <Mail className="h-4 w-4" />
            {tr("adoption_feed.contact_shelter")}
          </a>
        </div>

        {/* ── Application form ──────────────────────────────────────── */}
        {showForm && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6">
            <h2 className="text-base font-bold text-slate-900">
              {interestType === "ADOPT"
                ? tr("adopt.apply_to_adopt", { name: animal.name })
                : tr("adopt.apply_to_foster", { name: animal.name })}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {tr("adopt.apply_note")}
            </p>
            {status === "success" && (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                {tr("adopt.form_success")}
              </p>
            )}
            {status === "error" && (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {tr("adopt.form_error")}
              </p>
            )}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    {tr("adopt.form_name")} *
                  </span>
                  <input
                    name="fullName"
                    required
                    minLength={2}
                    placeholder={tr("adopt.form_name_ph")}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-600">
                    {tr("adopt.form_email")} *
                  </span>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  {tr("adopt.form_phone")}
                </span>
                <input
                  name="phone"
                  type="tel"
                  placeholder={tr("adopt.form_phone_ph")}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-600">
                  {tr("adopt.form_message")}
                </span>
                <textarea
                  name="message"
                  rows={3}
                  placeholder={tr("adopt.form_message_ph")}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {submitting ? tr("adopt.form_submitting") : tr("adopt.form_submit")}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
