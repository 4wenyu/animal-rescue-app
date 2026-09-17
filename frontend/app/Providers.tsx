"use client";

import { SessionProvider } from "next-auth/react";
import { MotionConfig } from "framer-motion";
import { useI18n } from "@/src/lib/useI18n";

export function Providers({ children }: { children: React.ReactNode }) {
  // Writes the locale cookie so SSR `<html lang>` matches the last choice.
  useI18n();
  return (
    <MotionConfig reducedMotion="user">
      <SessionProvider>{children}</SessionProvider>
    </MotionConfig>
  );
}