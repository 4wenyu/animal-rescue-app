"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Variant styles ──────────────────────────────────────────────
const variants = {
  primary:
    "bg-neutral-900 text-white hover:bg-neutral-800 border-neutral-700",
  outline:
    "bg-transparent text-neutral-900 hover:bg-neutral-100 border-neutral-300",
  ghost:
    "bg-transparent text-neutral-600 hover:bg-neutral-100 border-transparent",
} as const;

type GlowButtonVariant = keyof typeof variants;

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GlowButtonVariant;
  children: ReactNode;
}

/**
 * GlowButton — animated CTA with a subtle framer-motion pulse glow.
 *
 * Uses the project's `cn()` utility for safe Tailwind merging and
 * `framer-motion` for the hover/tap animation layer.
 */
export function GlowButton({
  variant = "primary",
  className,
  children,
  ...props
}: GlowButtonProps): ReactNode {
  return (
    <motion.button
      whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(59,130,246,0.4)" }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        // Base shape
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "transition-colors duration-150",
        // Variant
        variants[variant],
        // Caller overrides
        className,
      )}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </motion.button>
  );
}