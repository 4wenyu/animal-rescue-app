"use client";

import { useI18n } from "@/src/lib/useI18n";

export type ListingDraft = {
  name: string;
  city: string;
  photoUrl: string;
};

const fieldClass =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30";

export function PublicIntakeListingFields({
  value,
  onChange,
}: {
  value: ListingDraft;
  onChange: (next: ListingDraft) => void;
}) {
  const { tr } = useI18n();
  return (
    <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <label className="text-sm font-semibold text-slate-700">
        {tr("public_intake.listing_name")}
        <input
          value={value.name}
          maxLength={80}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          placeholder={tr("public_intake.listing_name_ph")}
          className={fieldClass}
        />
      </label>
      <label className="text-sm font-semibold text-slate-700">
        {tr("public_intake.listing_city")}
        <input
          value={value.city}
          maxLength={80}
          onChange={(event) => onChange({ ...value, city: event.target.value })}
          placeholder={tr("public_intake.listing_city_ph")}
          className={fieldClass}
        />
      </label>
      <label className="text-sm font-semibold text-slate-700">
        {tr("public_intake.listing_photo")}
        <input
          value={value.photoUrl}
          maxLength={500}
          inputMode="url"
          onChange={(event) => onChange({ ...value, photoUrl: event.target.value })}
          placeholder="https://"
          className={fieldClass}
        />
        <span className="mt-1 block text-xs font-normal text-slate-500">
          {tr("public_intake.listing_photo_hint")}
        </span>
      </label>
    </div>
  );
}
