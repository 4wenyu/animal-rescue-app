/**
 * Outreach Delivery — the "SENT" leg of Tier 1.7.
 * =========================================================================
 *
 * Until now, approving a draft in /outreach/review only stamped
 * `status=SENT, sentAt` in the database — nothing was ever actually
 * delivered. This module closes that gap.
 *
 * Delivery channels (both fire when the helper opted in and env is set):
 *   1. SMS — helper phoneE164 + TWILIO_ACCOUNT_SID / AUTH_TOKEN / FROM_NUMBER.
 *   2. TELEGRAM — helper chat or TELEGRAM_CHAT_ID, plus TELEGRAM_BOT_TOKEN.
 *   3. NONE — graceful degradation: the draft is still marked SENT (the
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
import { buildOutreachSms, sendSms, twilioConfigured } from "@/lib/sms/twilio";
import { sendTelegramMessage } from "@/src/lib/telegram";

export type DeliveryChannel = "telegram" | "sms" | "sms+telegram" | "none";

/** Result of an approve-and-deliver transition. */
export type DeliveryOutcome =
  | { kind: "delivered"; channel: Exclude<DeliveryChannel, "none"> }
  | { kind: "recorded-only"; channel: DeliveryChannel; reason: "channel-not-configured" | "send-failed" }
  | { kind: "already-processed"; channel: "none" }
  | { kind: "not-found"; channel: "none" };

function successChannel(
  sms: boolean,
  telegram: boolean,
): Exclude<DeliveryChannel, "none"> {
  if (sms && telegram) return "sms+telegram";
  if (sms) return "sms";
  return "telegram";
}

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
        select: { regionLabel: true, telegramChatId: true, phoneE164: true },
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

  // ── 3. Deliver opted-in SMS and/or Telegram; else record-only ──────
  const helperChat = draft.profile?.telegramChatId?.trim() || undefined;
  const helperPhone = draft.profile?.phoneE164?.trim() || undefined;
  const smsReady = Boolean(helperPhone && twilioConfigured());
  const telegramReady = Boolean(
    process.env.TELEGRAM_BOT_TOKEN &&
      (helperChat || process.env.TELEGRAM_CHAT_ID),
  );

  const notes: string[] = [];
  let smsOk = false;
  let telegramOk = false;

  if (smsReady && helperPhone) {
    const ok = await sendSms(
      helperPhone,
      buildOutreachSms({
        subject: draft.subject,
        body: draft.body,
        shelterName,
      }),
    );
    smsOk = ok;
    notes.push(ok ? "sms" : "sms-attempt-failed");
  }

  if (telegramReady) {
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
    telegramOk = ok;
    notes.push(
      ok
        ? `telegram${helperChat ? " (helper chat)" : ""}`
        : "telegram-attempt-failed",
    );
  }

  if (notes.length > 0) {
    await prisma.outreachDraft.update({
      where: { draftId },
      data: { sourceNote: `${draft.sourceNote} — delivered: ${notes.join(", ")}` },
    });
    if (smsOk || telegramOk) {
      return { kind: "delivered", channel: successChannel(smsOk, telegramOk) };
    }
    return {
      kind: "recorded-only",
      channel: successChannel(smsReady, telegramReady),
      reason: "send-failed",
    };
  }

  await prisma.outreachDraft.update({
    where: { draftId },
    data: { sourceNote: `${draft.sourceNote} — delivered: none (channel not configured)` },
  });
  console.warn(
    `[outreach/delivery] draft ${draftId} approved by ${reviewerId} marked SENT but no delivery channel configured`,
  );
  return { kind: "recorded-only", channel: "none", reason: "channel-not-configured" };
}
