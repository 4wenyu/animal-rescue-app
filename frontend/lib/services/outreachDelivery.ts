/**
 * Outreach Delivery — the "SENT" leg of Tier 1.7.
 * =========================================================================
 *
 * Until now, approving a draft in /outreach/review only stamped
 * `status=SENT, sentAt` in the database — nothing was ever actually
 * delivered. This module closes that gap.
 *
 * Delivery channels, in priority order:
 *   1. TELEGRAM (only if TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID are set).
 *   2. NONE — graceful degradation: the draft is still marked SENT (the
 *      human decision is real and must not be lost), but the sourceNote
 *      records that no channel was configured. Logged server-side.
 *
 * Guarantees:
 *   - CALLED ONLY AFTER the human gate. Callers pass an already-approved
 *     draft; this module never flips DRAFT → SENT by itself.
 *   - RACE-SAFE. The claim transition uses a conditional updateMany on
 *     status="DRAFT" inside a transaction — a double-click or two
 *     concurrent reviewers can only ever deliver once.
 *   - HONEST. Telegram copy keeps the autonomous-agent disclosure and
 *     names the approving shelter.
 */

import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/src/lib/telegram";

/** Result of an approve-and-deliver transition. */
export type DeliveryOutcome =
  | { kind: "delivered"; channel: "telegram" }
  | { kind: "recorded-only"; channel: "telegram" | "none"; reason: "channel-not-configured" | "send-failed" }
  | { kind: "already-processed"; channel: "none" }
  | { kind: "not-found"; channel: "none" };

/**
 * Claim the draft for delivery and deliver it.
 *
 * The claim is the transactional gate: `updateMany({ where: { draftId,
 * status: "APPROVED" } })` flips APPROVED → SENT exactly once. If it matches
 * zero rows, someone else already processed (or the draft was undone)
 * and we do NOT deliver.
 *
 * @param draftId     the approved draft
 * @param reviewerId  staff user id, persisted as `reviewedByUserId`
 * @param shelterName display name used in the Telegram copy
 */
export async function deliverApprovedDraft(
  draftId: string,
  reviewerId: string,
  shelterName = "RescueHub partner shelter",
): Promise<DeliveryOutcome> {
  // ── 1. Transactional claim: DRAFT → SENT exactly once ──────────────
  const claimed = await prisma.$transaction(async (tx) => {
    const draft = await tx.outreachDraft.findUnique({
      where: { draftId },
      select: { draftId: true, status: true },
    });
    if (!draft) return null;

    // Conditional transition — the race gate. The reviewer is stamped in the
    // same write as the status flip: a delivered message must always name the
    // human who authorized it (the SKIPPED paths already do this).
    const reviewedAt = new Date();
    const flipped = await tx.outreachDraft.updateMany({
      where: { draftId, status: "APPROVED" },
      data: {
        status: "SENT",
        sentAt: reviewedAt,
        reviewedByUserId: reviewerId,
        reviewedAt,
      },
    });
    return flipped.count === 1 ? draft : undefined;
  });

  if (claimed === null) return { kind: "not-found", channel: "none" };
  if (claimed === undefined) return { kind: "already-processed", channel: "none" };

  // ── 2. Load the full draft + profile for honest copy ────────────────
  const draft = await prisma.outreachDraft.findUnique({
    where: { draftId },
    select: {
      subject: true,
      body: true,
      helpAsk: true,
      sourceNote: true,
      animalId: true,
      lostPetSearchId: true,
      profile: {
        select: { regionLabel: true, telegramChatId: true },
      },
    },
  });

  // Draft vanished between claim and load — record the anomaly; the
  // SENT stamp already committed and must not be silently reverted.
  if (!draft) {
    console.error(
      `[outreach/delivery] draft ${draftId} claimed by ${reviewerId} but vanished before delivery`,
    );
    return { kind: "already-processed", channel: "none" };
  }

  // ── 3. Deliver (Telegram when configured; else record-only) ─────────
  const helperChat = draft.profile?.telegramChatId?.trim() || undefined;
  const telegramConfigured = Boolean(
    process.env.TELEGRAM_BOT_TOKEN &&
      (helperChat || process.env.TELEGRAM_CHAT_ID),
  );

  if (telegramConfigured) {
    const region = draft.profile?.regionLabel
      ? ` — ${draft.profile.regionLabel}`
      : "";
    const text = [
      `🐾 *${draft.subject}*${region}`,
      "",
      draft.body,
      "",
      `_Automated outreach approved by ${shelterName} staff._`,
    ].join("\n");

    const ok = await sendTelegramMessage(text, "Markdown", helperChat);
    if (ok) {
      await prisma.outreachDraft.update({
        where: { draftId },
        data: {
          sourceNote: `${draft.sourceNote} — delivered: telegram${helperChat ? " (helper chat)" : ""}`,
        },
      });
      return { kind: "delivered", channel: "telegram" };
    }
    // Send failed (API error or network failure) — the human decision
    // stands; annotate honestly so reviewers can see the delivery failed.
    await prisma.outreachDraft.update({
      where: { draftId },
      data: {
        sourceNote: `${draft.sourceNote} — delivered: telegram-attempt-failed`,
      },
    });
    return { kind: "recorded-only", channel: "telegram", reason: "send-failed" };
  }

  // No channel configured: the approval is real, the delivery is honestly
  // absent. Annotate so reviewers can see why nothing went out.
  await prisma.outreachDraft.update({
    where: { draftId },
    data: { sourceNote: `${draft.sourceNote} — delivered: none (channel not configured)` },
  });
  console.warn(
    `[outreach/delivery] draft ${draftId} approved by ${reviewerId} marked SENT but no delivery channel configured`,
  );
  return { kind: "recorded-only", channel: "none", reason: "channel-not-configured" };
}
