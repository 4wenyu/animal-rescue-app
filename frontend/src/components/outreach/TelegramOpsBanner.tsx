/**
 * Honest banner when neither SMS nor Telegram can deliver (N5 + SMS).
 * Server Component — env checked at render time.
 */
export function TelegramOpsBanner({
  configured,
  smsConfigured = false,
}: {
  configured: boolean;
  smsConfigured?: boolean;
}) {
  if (configured || smsConfigured) return null;
  return (
    <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      No delivery channel is configured. Approving drafts still records{" "}
      <strong>SENT</strong> with an honest{" "}
      <code className="text-xs">delivered: none</code> note — set Twilio{" "}
      <code className="text-xs">TWILIO_*</code> and/or{" "}
      <code className="text-xs">TELEGRAM_BOT_TOKEN</code> +{" "}
      <code className="text-xs">TELEGRAM_CHAT_ID</code> for live delivery.
    </p>
  );
}
