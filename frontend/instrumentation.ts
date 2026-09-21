import { captureException, hasSentryDsn } from "@/lib/ops/sentry";

/**
 * Next.js instrumentation hook (N5).
 * Registers a process-level unhandled rejection reporter when SENTRY_DSN is set.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!hasSentryDsn()) return;

  process.on("unhandledRejection", (reason) => {
    void captureException(reason, { source: "unhandledRejection" });
  });
  process.on("uncaughtException", (err) => {
    void captureException(err, { source: "uncaughtException" });
  });
}
