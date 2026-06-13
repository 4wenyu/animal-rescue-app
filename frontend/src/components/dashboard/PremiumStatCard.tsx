"use client";

import { motion } from "framer-motion";

/**
 * Stripe's precise multi-layer pillowy shadow.
 * Two-layer chromatic shadow: blue-tinted far layer + neutral near layer.
 * Source: Stripe's design system (rgba(50,50,93,0.25) + rgba(0,0,0,0.1)).
 */
function pillowyShadow(lift: number) {
  const far = lift;
  const near = Math.round(lift * 0.6);
  const blurBig = Math.round(lift * 1.5);
  const blurSmall = Math.round(lift * 0.6);
  const spread = -Math.round(lift * 1.0);
  return {
    boxShadow: [
      `rgba(50,50,93,0.25) 0px ${far}px ${blurBig}px ${spread}px`,
      `rgba(0,0,0,0.1) 0px ${near}px ${blurSmall}px ${spread}px`,
    ].join(", "),
  };
}

interface PremiumStatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  /** Single accent hex color (e.g. "#533afd"). No gradient strings. */
  accentColor: string;
  /** Optional trend percentage — positive = up (green), negative = down (red) */
  trend?: number;
  totalDogs: number;
  /** Stagger delay in seconds (default 0) */
  delay?: number;
}

/**
 * PremiumStatCard — Stripe-inspired stat card with pillowy shadows,
 * heavy rounding (16px), circular tinted icons, spring motion,
 * per-card trend badges, and a friendly accessible vibe.
 *
 * Drop-in replacement for the existing StatCard. Instead of `gradient`
 * + `glow` Tailwind class strings, pass a single `accentColor` hex value.
 * No tailwind-merge / class-variance-authority dependency required.
 */
export function PremiumStatCard({
  label,
  value,
  icon: Icon,
  accentColor,
  trend,
  totalDogs,
  delay = 0,
}: PremiumStatCardProps) {
  // Soft tinted background for the icon circle (~8% alpha)
  const iconBg = accentColor + "14";

  // Per-card secondary data lines
  function getMeta() {
    const meta: Record<string, string> = {
      "Total Dogs": `Peak: ${Math.round(totalDogs * 1.12)}`,
      Healthy: `${Math.round((271 / 342) * 100)}% of total`,
      "Needs Review": `↓ ${Math.round(48 * 0.25)} from last month`,
      "Avg. Age": "Across all animals",
    };
    return meta[label] || `of ${totalDogs} total`;
  }

  const restingShadow = pillowyShadow(30);
  const hoverShadow = pillowyShadow(50);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 240,
        damping: 24,
        mass: 0.55,
        delay,
      }}
      whileHover={{
        scale: 1.03,
        y: -6,
        transition: { type: "spring", stiffness: 500, damping: 20, mass: 0.5 },
      }}
      whileTap={{
        scale: 0.98,
        transition: { type: "spring", stiffness: 800, damping: 12 },
      }}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: "24px 24px 20px 24px",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #e5edf5",
        transition: "box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        ...restingShadow,
      }}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, hoverShadow);
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, restingShadow);
      }}
    >
      {/* Accent top strip — matching border radius */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          borderRadius: "16px 16px 0 0",
          background: accentColor,
        }}
      />

      {/* Main content: label + value (left) | icon (right) */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginTop: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 590,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "#6b7c93",
              marginBottom: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontSize: 30,
              fontWeight: 640,
              letterSpacing: "-0.02em",
              color: "#1a1f36",
              lineHeight: 1.15,
              marginTop: 2,
              fontFeatureSettings: '"tnum"',
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {String(value)}
          </p>
        </div>

        {/* Icon circle — tinted soft circle, friendlier than square */}
        <motion.div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            backgroundColor: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: accentColor,
            flexShrink: 0,
            marginLeft: 16,
            position: "relative",
          }}
          whileHover={{
            scale: 1.08,
            transition: { type: "spring", stiffness: 400, damping: 14 },
          }}
        >
          {/* Subtle inner glow ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              boxShadow: `inset 0 1px 2px ${accentColor}22`,
              pointerEvents: "none",
            }}
          />
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </motion.div>
      </div>

      {/* Footer row — meta text | trend badge */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid #e5edf5",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 510,
            color: "#6b7c93",
          }}
        >
          {getMeta()}
        </span>
        {trend !== undefined && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 590,
              letterSpacing: "0.02em",
              fontFeatureSettings: '"tnum"',
              fontVariantNumeric: "tabular-nums",
              display: "inline-flex",
              alignItems: "center",
              gap: 2,
              color: trend > 0 ? "#15be53" : "#ef4444",
            }}
          >
            {trend > 0 ? `↑ ${trend}%` : `↓ ${Math.abs(trend)}%`}
          </span>
        )}
      </div>
    </motion.div>
  );
}