"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useHomeLocale } from "@/src/components/home/locale-store";

const STORAGE_KEY = "rescuehub_ambient_on";

export function AmbientToggle() {
  const { tr } = useHomeLocale();
  const [on, setOn] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    try {
      setOn(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setOn(false);
    }
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!on || reduced) {
      oscRef.current?.stop();
      oscRef.current = null;
      void ctxRef.current?.close();
      ctxRef.current = null;
      return;
    }
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 174;
    gain.gain.value = 0.015;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    ctxRef.current = ctx;
    oscRef.current = osc;
    return () => {
      osc.stop();
      void ctx.close();
    };
  }, [on]);

  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => {
        const next = !on;
        setOn(next);
        try {
          localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
        } catch {
          // ignore
        }
      }}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
    >
      {on ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
      {on ? tr("ambient.on") : tr("ambient.off")}
    </button>
  );
}
