/**
 * Minimal Sentry event capture without @sentry/nextjs (N5).
 * When SENTRY_DSN is unset, this is a no-op.
 */
export function hasSentryDsn(): boolean {
  return Boolean(process.env.SENTRY_DSN?.trim());
}

function parseDsn(dsn: string): {
  publicKey: string;
  host: string;
  projectId: string;
} | null {
  try {
    const u = new URL(dsn);
    const projectId = u.pathname.replace(/^\//, "").split("/")[0];
    const publicKey = u.username;
    if (!projectId || !publicKey) return null;
    return { publicKey, host: u.host, projectId };
  } catch {
    return null;
  }
}

export async function captureException(
  err: unknown,
  context?: Record<string, string>,
): Promise<void> {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;
  const parsed = parseDsn(dsn);
  if (!parsed) return;

  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Error";
  const stack = err instanceof Error ? err.stack : undefined;

  const payload = {
    message,
    level: "error",
    platform: "node",
    timestamp: Date.now() / 1000,
    tags: context ?? {},
    exception: {
      values: [
        {
          type: err instanceof Error ? err.name : "Error",
          value: message,
          stacktrace: stack
            ? { frames: stack.split("\n").slice(0, 20).map((l) => ({ filename: l })) }
            : undefined,
        },
      ],
    },
  };

  const url = `https://${parsed.host}/api/${parsed.projectId}/store/`;
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${parsed.publicKey}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch (sendErr) {
    console.error("[sentry] failed to report:", sendErr);
  }
}
