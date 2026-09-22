"use client";

const HELP_AREAS = [
  { value: "DONATE", icon: "💝" },
  { value: "FOSTER", icon: "🏠" },
  { value: "ADOPT", icon: "🐾" },
  { value: "VOLUNTEER", icon: "🙋" },
  { value: "SHARE", icon: "📣" },
  { value: "TRANSPORT", icon: "🚗" },
] as const;

export function OutreachHelpAreas({
  selected,
  onToggle,
  tr,
}: {
  selected: string[];
  onToggle: (value: string) => void;
  tr: (key: string) => string;
}) {
  return (
    <>
      <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-500">
        {tr("outreach.help_areas_label")}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {HELP_AREAS.map((area) => {
          const active = selected.includes(area.value);
          return (
            <button
              key={area.value}
              type="button"
              onClick={() => onToggle(area.value)}
              aria-pressed={active}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                active
                  ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-base">{area.icon}</span>
              <span>{tr(`outreach.area_${area.value.toLowerCase()}`)}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
