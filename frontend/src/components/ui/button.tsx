"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "./cn";

/**
 * Theme-token-driven button (Shadcn-style, dependency-free).
 * Variants map to the CSS variables in app/globals.css `@theme inline`
 * (--color-accent, --color-card, --color-muted, --color-text-*), so visual
 * theming happens in one place instead of per-CTA hex literals.
 */
type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-(--color-accent) text-white shadow-sm hover:opacity-90",
  secondary:
    "border border-(--color-card-border) bg-(--color-card) text-(--color-text-primary) hover:bg-(--color-muted)",
  ghost:
    "text-(--color-text-secondary) hover:bg-(--color-muted) hover:text-(--color-text-primary)",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps): ReactNode {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
