"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { PawPrint, Dog, Cat, Heart } from "lucide-react";

const NOISE_OVERLAY =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * HeroMesh — calm brand aurora + parallax depth layers.
 * 2D only (GPU-cheap pre-blurred radial gradients, no filter: blur on huge
 * elements, no neon). Honors prefers-reduced-motion via MotionConfig in Providers.
 */
export function HeroMesh() {
  const { scrollY } = useScroll();
  const yFar = useTransform(scrollY, [0, 700], [0, 45]);
  const yMid = useTransform(scrollY, [0, 700], [0, 100]);
  const yNear = useTransform(scrollY, [0, 700], [0, 170]);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Base — soft brand wash */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50" />

      {/* Far layer — aurora glows (pre-blurred radial gradients) */}
      <motion.div style={{ y: yFar }} className="absolute inset-0">
        <div className="absolute -top-1/4 -left-1/4 h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.28),transparent_65%)]" />
        <div className="absolute top-1/3 -right-1/5 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.22),transparent_65%)]" />
        <div className="absolute -bottom-1/3 left-1/3 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.18),transparent_65%)]" />
      </motion.div>

      {/* Mid layer — large silhouettes, slow drift */}
      <motion.div style={{ y: yMid }} className="absolute inset-0">
        <motion.span
          className="absolute left-[6%] top-[16%]"
          animate={{ y: [0, -12, 0], rotate: [12, 16, 12] }}
          transition={{ repeat: Infinity, duration: 16, ease: "easeInOut" }}
        >
          <PawPrint className="h-40 w-40 text-emerald-200/70" strokeWidth={1.5} />
        </motion.span>
        <motion.span
          className="absolute right-[7%] top-[10%]"
          animate={{ y: [0, -10, 0], rotate: [-6, -2, -6] }}
          transition={{ repeat: Infinity, duration: 19, ease: "easeInOut" }}
        >
          <Dog className="h-52 w-52 scale-x-[-1] text-sky-200/60" strokeWidth={1.5} />
        </motion.span>
        <motion.span
          className="absolute bottom-[14%] left-[11%]"
          animate={{ y: [0, -14, 0], rotate: [-12, -8, -12] }}
          transition={{ repeat: Infinity, duration: 21, ease: "easeInOut" }}
        >
          <Cat className="h-48 w-48 text-amber-200/60" strokeWidth={1.5} />
        </motion.span>
      </motion.div>

      {/* Near layer — small accents, more motion */}
      <motion.div style={{ y: yNear }} className="absolute inset-0">
        <motion.span
          className="absolute right-[17%] top-[38%]"
          animate={{ y: [0, -8, 0], rotate: [12, 16, 12] }}
          transition={{ repeat: Infinity, duration: 13, ease: "easeInOut" }}
        >
          <Heart className="h-16 w-16 text-emerald-300/50" strokeWidth={1.5} />
        </motion.span>
        <motion.span
          className="absolute bottom-[10%] right-[9%]"
          animate={{ y: [0, -10, 0], rotate: [-45, -39, -45] }}
          transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
        >
          <PawPrint className="h-20 w-20 text-sky-300/50" strokeWidth={1.5} />
        </motion.span>
      </motion.div>

      {/* Film grain */}
      <div
        className="absolute inset-0 z-10 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: NOISE_OVERLAY }}
      />
    </div>
  );
}
