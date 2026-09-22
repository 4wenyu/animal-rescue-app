/**
 * Staff-gated SMS via Twilio REST. Env-only — no SDK, no secrets in the client.
 *
 * TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER (E.164).
 */

const TWILIO_API = "https://api.twilio.com/2010-04-01/Accounts";

export function twilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim(),
  );
}

export function buildOutreachSms(input: {
  subject: string;
  body: string;
  shelterName: string;
}): string {
  const origin = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    ""
  ).replace(/\/$/, "");
  const body = origin
    ? input.body.replace(
        /(^|\s)(\/radar\/[A-Za-z0-9_-]+)/g,
        `$1${origin}$2`,
      )
    : input.body;
  const text = [
    input.subject,
    "",
    body,
    "",
    `Approved by ${input.shelterName} staff. Reply STOP to opt out.`,
  ].join("\n");
  return text.length > 1500 ? `${text.slice(0, 1497)}...` : text;
}

/** Never throws. Returns false when Twilio is missing or the API rejects the send. */
export async function sendSms(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!sid || !token || !from) {
    console.error("[sms] missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_NUMBER");
    return false;
  }

  try {
    const payload = new URLSearchParams({ To: to, From: from, Body: body });
    const response = await fetch(`${TWILIO_API}/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
    });
    if (!response.ok) {
      const tail = to.slice(-4);
      console.error(`[sms] Twilio ${response.status} for …${tail}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[sms] send failed:", err);
    return false;
  }
}
