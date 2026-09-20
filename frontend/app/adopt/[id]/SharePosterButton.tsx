"use client";

import { Download } from "lucide-react";

import { useI18n } from "@/src/lib/useI18n";

import type { Dog } from "./adoptTypes";

export function SharePosterButton({ animal }: { animal: Dog }) {
  const { tr } = useI18n();

  const download = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ecfdf5";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#047857";
    ctx.font = "bold 64px sans-serif";
    ctx.fillText(tr("adoption_feed.meet_name", { name: animal.name }), 72, 140);
    ctx.fillStyle = "#334155";
    ctx.font = "36px sans-serif";
    ctx.fillText(tr(`breeds.${animal.breed}`), 72, 210);
    ctx.font = "32px sans-serif";
    const story = tr("adopt.story", { name: animal.name });
    wrapText(ctx, story, 72, 300, 936, 44);
    ctx.fillStyle = "#059669";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText("rescuehub.org", 72, 1260);
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${animal.name.toLowerCase()}-rescuehub.png`;
    a.click();
  };

  return (
    <button
      id="adopt-share-poster"
      type="button"
      onClick={() => void download()}
      className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
    >
      <Download className="h-4 w-4" />
      {tr("adopt.poster")}
    </button>
  );
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let cursor = y;
  for (const word of words) {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth) {
      ctx.fillText(line, x, cursor);
      line = `${word} `;
      cursor += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, cursor);
}
