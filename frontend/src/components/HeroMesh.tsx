"use client";

import {
  Dog,
  Cat,
  Heart,
  Bone,
  Hexagon,
  PawPrint,
} from "lucide-react";

/**
 * Premium 2D CSS Animated Mesh Gradient — Hybrid Theme Edition.
 *
 * Indigo-to-Teal background with 3 neon blobs (Magenta, Cyan, Amber)
 * using mix-blend-screen and massive blur. Lucide icons positioned around
 * the edges with float animations and blob-matching colors.
 */

export function HeroMesh() {
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-3deg); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(4deg); }
        }
      `}</style>
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-br from-[#312E81] to-[#134E4A] z-0">
        {/* ── Neon Blobs with mix-blend-screen ──────────────── */}
        <div className="absolute w-[40rem] h-[40rem] bg-[#EC4899]/30 rounded-full blur-[140px] bottom-[-10%] left-[30%] mix-blend-screen animate-pulse" />
        <div className="absolute w-[35rem] h-[35rem] bg-[#06B6D4]/30 rounded-full blur-[140px] bottom-[-5%] left-[-10%] mix-blend-screen" />
        <div className="absolute w-[30rem] h-[30rem] bg-[#F97316]/30 rounded-full blur-[140px] top-[-5%] right-[-5%] mix-blend-screen" />

        {/* ── Edge-Spread Icon Pack ─────────────────────────── */}
        {/* Dog — top-left (Cyan tint) */}
        <Dog
          className="absolute top-[5%] left-[4%] w-48 h-48 opacity-20 text-[#06B6D4] rotate-12 pointer-events-none"
          style={{ animation: "float 18s ease-in-out infinite" }}
          strokeWidth={2}
        />

        {/* Cat — top-right (Amber tint) */}
        <Cat
          className="absolute top-[8%] right-[5%] w-56 h-56 opacity-20 text-[#F97316] -rotate-6 scale-x-[-1] pointer-events-none"
          style={{ animation: "float 20s ease-in-out infinite reverse" }}
          strokeWidth={2}
        />

        {/* Dog — bottom-left (Cyan tint) */}
        <Dog
          className="absolute bottom-[10%] left-[8%] w-64 h-64 opacity-20 text-[#06B6D4] -rotate-12 pointer-events-none"
          style={{ animation: "float 15s ease-in-out infinite" }}
          strokeWidth={2}
        />

        {/* Cat — bottom-right (Magenta tint) */}
        <Cat
          className="absolute bottom-[5%] right-[8%] w-40 h-40 opacity-20 text-[#EC4899] rotate-6 pointer-events-none"
          style={{ animation: "float 17s ease-in-out infinite" }}
          strokeWidth={2}
        />

        {/* Paw Print — far left center (Cyan tint) */}
        <PawPrint
          className="absolute top-[45%] left-[2%] w-24 h-24 opacity-20 text-[#06B6D4] rotate-45 pointer-events-none"
          style={{ animation: "float 12s ease-in-out infinite" }}
          strokeWidth={2}
        />

        {/* Bone — lower-left center (Magenta tint) */}
        <Bone
          className="absolute bottom-[35%] left-[4%] w-16 h-16 opacity-20 text-[#EC4899] -rotate-45 pointer-events-none"
          style={{ animation: "float 14s ease-in-out infinite reverse" }}
          strokeWidth={2}
        />

        {/* Heart — top-center-right (Amber tint) */}
        <Heart
          className="absolute top-[6%] right-[35%] w-20 h-20 opacity-20 text-[#F97316] rotate-12 pointer-events-none"
          style={{ animation: "float 16s ease-in-out infinite" }}
          strokeWidth={2}
        />

        {/* Hexagon — far right center (Magenta tint) */}
        <Hexagon
          className="absolute bottom-[40%] right-[3%] w-32 h-32 opacity-20 text-[#EC4899] -rotate-12 pointer-events-none"
          style={{ animation: "float 22s ease-in-out infinite" }}
          strokeWidth={2}
        />

        {/* ── Premium SVG Noise Overlay ─────────────────────── */}
        <div
          className="absolute inset-0 z-10 opacity-[0.06] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
          }}
        />
      </div>
    </>
  );
}