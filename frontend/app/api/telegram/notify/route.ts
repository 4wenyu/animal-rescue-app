import { NextResponse } from "next/server";
import { z } from "zod";
import { notifyIntake } from "@/src/lib/telegram";

import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/telegram/notify
 *
 * Fires a structured Telegram notification for an intake event.
 * The bot token and chat ID are read from server-side env vars
 * and never touch the client bundle.
 *
 * Request body (JSON):
 * {
 *   intakeType: "PUBLIC_STRAY" | "OWNER_SURRENDER" | "MUNICIPAL_TRANSFER",
 *   details: { animalId?, surrenderType?, esignHash?,
 *              officerBadgeNumber?, departmentId? }
 * }
 */

/* Whitelist mirrors the fields notifyIntake() actually renders. */
const NotifySchema = z.object({
  intakeType: z.enum(["PUBLIC_STRAY", "OWNER_SURRENDER", "MUNICIPAL_TRANSFER"]),
  details: z
    .object({
      animalId: z.string().max(64).optional(),
      surrenderType: z.string().max(64).optional(),
      esignHash: z.string().max(128).optional(),
      officerBadgeNumber: z.string().max(64).optional(),
      departmentId: z.string().max(64).optional(),
    })
    .default({}),
});

export async function POST(request: Request): Promise<NextResponse> {
  // Public by necessity: the citizen intake and municipal handoff forms are
  // reachable without a session, so this cannot require auth. It writes
  // straight to the shelter's ops channel, though, so the budget is sized to
  // real behaviour — one intake submission, not five a minute. Anything above
  // a handful per hour from one address is abuse, not a surrender.
  //
  // Failing closed here is safe: notification is fire-and-forget and the
  // intake record itself is persisted by /api/animals/intake, so a throttled
  // alert never loses animal data.
  const ip = getClientIp(request);
  const { ok, retryAfterSeconds } = checkRateLimit(
    `telegram-notify:${ip}`,
    10,
    60 * 60 * 1000,
  );
  if (!ok) {
    return NextResponse.json(
      { error: "Too Many Requests", message: "Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      // Empty / non-JSON body — a client bug, not a server fault.
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid JSON body." },
        { status: 400 },
      );
    }

    const parsed = NotifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }

    const { intakeType, details } = parsed.data;

    // Fire-and-forget — the notification runs in the background and its
    // failure is swallowed so it never blocks the user's response.
    // We await it here because the API handler will time out otherwise,
    // but the client-side fetch is also fire-and-forget.
    await notifyIntake(intakeType, details);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/telegram/notify] Error:", err);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 },
    );
  }
}
