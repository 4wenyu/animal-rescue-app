import { NextResponse } from "next/server";
import { sendTelegramMessage, notifyIntake } from "@/src/lib/telegram";

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
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { intakeType, details } = body;

    if (!intakeType || !details) {
      return NextResponse.json(
        { error: "Missing required fields: intakeType, details" },
        { status: 400 },
      );
    }

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