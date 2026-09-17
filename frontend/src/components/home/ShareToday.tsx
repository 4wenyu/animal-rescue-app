"use client";

import { useState } from "react";
import { CalendarPlus, Link2 } from "lucide-react";
import { useHomeLocale } from "./locale-store";

function tomorrowNineLocal(): { start: string; end: string } {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const end = new Date(d.getTime() + 15 * 60 * 1000);
  const stamp = (value: Date) =>
    `${value.getFullYear()}${String(value.getMonth() + 1).padStart(2, "0")}${String(value.getDate()).padStart(2, "0")}T${String(value.getHours()).padStart(2, "0")}${String(value.getMinutes()).padStart(2, "0")}00`;
  return { start: stamp(d), end: stamp(end) };
}

function downloadIcs(url: string, title: string) {
  const { start, end } = tomorrowNineLocal();
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = "rescuehub-kennel-walk.ics";
  a.click();
  URL.revokeObjectURL(href);
}

export function ShareToday({
  name,
  sharePath = "/today",
}: {
  name: string;
  sharePath?: string;
}) {
  const { tr } = useHomeLocale();
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(sharePath, window.location.origin).toString();
    const text = tr("today.share_text", { name, url });
    try {
      if (navigator.share) {
        await navigator.share({ title: tr("today.share_title", { name }), text, url });
        return;
      }
    } catch {
      // User cancelled — fall through to copy.
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => void share()}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
      >
        <Link2 className="h-4 w-4" aria-hidden="true" />
        {copied ? tr("today.copied") : tr("today.share", { name })}
      </button>
      <button
        type="button"
        onClick={() =>
          downloadIcs(
            new URL("/today", window.location.origin).toString(),
            tr("today.calendar_title"),
          )
        }
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
      >
        <CalendarPlus className="h-4 w-4" aria-hidden="true" />
        {tr("today.calendar")}
      </button>
    </div>
  );
}
