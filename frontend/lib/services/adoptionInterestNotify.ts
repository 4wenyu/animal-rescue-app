/**
 * One ops ping when an adoption request is saved.
 * Missing Telegram env is not an error — the row is already stored.
 */
import {
  sendTelegramMessage,
  telegramOpsConfigured,
} from "@/src/lib/telegram";

export type AdoptionRequestNotice = {
  animalId: string;
  animalName: string;
  interestType: string;
  fullName: string;
  email: string;
  phone: string | null;
};

export function adoptionRequestMessage(lead: AdoptionRequestNotice): string {
  const lines = [
    "New adoption request (status NEW)",
    `Animal: ${lead.animalName || "Unnamed"} (${lead.animalId})`,
    `Type: ${lead.interestType}`,
    `Name: ${lead.fullName}`,
    `Email: ${lead.email}`,
  ];
  if (lead.phone) lines.push(`Phone: ${lead.phone}`);
  lines.push("Queue: /staff/adoptions");
  return lines.join("\n").slice(0, 4000);
}

/** Returns false when Telegram is unset or the send fails. Never throws. */
export async function notifyAdoptionRequest(
  lead: AdoptionRequestNotice,
): Promise<boolean> {
  if (!telegramOpsConfigured()) return false;
  return sendTelegramMessage(adoptionRequestMessage(lead));
}
