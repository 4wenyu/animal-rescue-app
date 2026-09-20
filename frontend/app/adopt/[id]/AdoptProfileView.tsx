"use client";

import { useState } from "react";

import { AdoptCtaRow } from "./AdoptCtaRow";
import { AdoptDetails } from "./AdoptDetails";
import { AdoptHero } from "./AdoptHero";
import { AdoptStickyBar } from "./AdoptStickyBar";
import { AdoptionForm } from "./AdoptionForm";
import { SharePosterButton } from "./SharePosterButton";
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
        <AdoptDetails animal={animal} available={available} homeByDate={homeByDate} />
        <AdoptCtaRow
          animal={animal}
          available={available}
          onStartApplication={startApplication}
          onShare={() => {
            const btn = document.getElementById("adopt-share-poster");
            btn?.click();
          }}
        />
        <div className="mt-3">
          <SharePosterButton animal={animal} />
        </div>
        {showForm && (
          <AdoptionForm
            animal={animal}
            interestType={interestType}
            status={status}
            submitting={submitting}
            onClose={() => {
              setShowForm(false);
              setStatus("idle");
            }}
            onSubmit={handleSubmit}
          />
        )}
      </div>
      <AdoptStickyBar
        animal={animal}
        available={available}
        onAdopt={() => startApplication("ADOPT")}
      />
    </div>
  );
}
