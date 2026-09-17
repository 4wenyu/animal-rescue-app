"use client";

/**
 * AdoptProfileView — adopter-facing profile (Sprint B #2).
 *
 * Photo-led, dignified adoption story with an always-visible CTA row:
 *   - Adopt / Foster → inline application form → POST /api/adoption-interest
 *     (both CTAs are disabled while the animal is on statutory hold)
 *   - Donate → /fundraising/[animalId]
 *   - Contact shelter → mailto
 *
 * "Still available" badge + "Needs a home by {date}" copy are derived from
 * the animal's real hold/risk data (no fake countdown, no legal jargon on
 * a public adoption surface).
 *
 * Presentation is split across sibling files: AdoptHero, AdoptDetails,
 * AdoptCtaRow, AdoptionForm; this file owns the form state machine.
 */

import { useState } from "react";

import { AdoptCtaRow } from "./AdoptCtaRow";
import { AdoptDetails } from "./AdoptDetails";
import { AdoptHero } from "./AdoptHero";
import { AdoptionForm } from "./AdoptionForm";
import { formatDate, type Dog, type FormStatus, type InterestType } from "./adoptTypes";

export default function AdoptProfileView({ animal }: { animal: Dog }) {
  const [interestType, setInterestType] = useState<InterestType>("ADOPT");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>("idle");

  const available = animal.statutoryHoldCleared;
  const homeByDate = formatDate(animal.strayHoldExpiresAt);

  const startApplication = (type: InterestType) => {
    setInterestType(type);
    setStatus("idle");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setStatus("idle");
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
      <AdoptHero animal={animal} available={available} />
      <div className="p-6 sm:p-8">
        <AdoptDetails
          animal={animal}
          available={available}
          homeByDate={homeByDate}
        />
        <AdoptCtaRow
          animal={animal}
          available={available}
          onStartApplication={startApplication}
        />
        {showForm && (
          <AdoptionForm
            animal={animal}
            interestType={interestType}
            status={status}
            submitting={submitting}
            onClose={closeForm}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
