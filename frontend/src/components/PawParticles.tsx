"use client";

import { useEffect, useRef } from "react";

const MAX_DPR = 1.5;
const TINTS = [
  "rgba(16,185,129,ALPHA)", // emerald
  "rgba(56,189,248,ALPHA)", // sky
  "rgba(251,191,36,ALPHA)", // amber
];

type Mote = {
  x: number;
  y: number;
  size: number;
  vy: number;
  wobbleAmp: number;
  wobbleSpeed: number;
  phase: number;
  alpha: number;
  tint: string;
  kind: "paw" | "dust";
};

function drawPaw(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  const r = s * 0.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.32, r * 0.44, r * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
  const toes: [number, number][] = [
    [cx - r * 0.36, cy - r * 0.06],
    [cx - r * 0.12, cy - r * 0.28],
    [cx + r * 0.12, cy - r * 0.28],
    [cx + r * 0.36, cy - r * 0.06],
  ];
  for (const [tx, ty] of toes) {
    ctx.beginPath();
    ctx.arc(tx, ty, r * 0.17, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function PawParticles({ count = 16 }: { count?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let motes: Mote[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;

    const seed = () => {
      motes = Array.from({ length: count }, (_, i) => {
        const isPaw = i % 4 === 0;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          size: isPaw ? 22 + Math.random() * 16 : 3 + Math.random() * 5,
          vy: (isPaw ? 0.12 : 0.18) + Math.random() * 0.14,
          wobbleAmp: 6 + Math.random() * 12,
          wobbleSpeed: 0.4 + Math.random() * 0.8,
          phase: Math.random() * Math.PI * 2,
          alpha: 0.08 + Math.random() * 0.16,
          tint: TINTS[i % TINTS.length],
          kind: isPaw ? "paw" : "dust",
        };
      });
    };

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const frame = (t: number) => {
      const time = t / 1000;
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.y -= m.vy;
        if (m.y < -40) {
          m.y = h + 40;
          m.x = Math.random() * w;
        }
        const x = m.x + Math.sin(time * m.wobbleSpeed + m.phase) * m.wobbleAmp;
        const twinkle = m.alpha * (0.6 + 0.4 * Math.sin(time * 1.2 + m.phase));
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = m.tint.replace("ALPHA", twinkle.toFixed(3));
        if (m.kind === "paw") drawPaw(ctx, x, m.y, m.size);
        else {
          ctx.beginPath();
          ctx.arc(x, m.y, m.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    if (!reduced) raf = requestAnimationFrame(frame);

    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      const nowVisible = entry.isIntersecting;
      if (nowVisible && !visible && !reduced) raf = requestAnimationFrame(frame);
      if (!nowVisible && visible) cancelAnimationFrame(raf);
      visible = nowVisible;
    });
    io.observe(wrap);

    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (visible && !reduced) raf = requestAnimationFrame(frame);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [count]);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
