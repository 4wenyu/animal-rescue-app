/**
 * Honest banner when Telegram is not configured (N5).
 * Server Component — env checked at render time.
 */
export function TelegramOpsBanner({ configured }: { configured: boolean }) {
  if (configured) return null;
  return (
    <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      Telegram is not configured. Approving drafts still records{" "}
      <strong>SENT</strong> with an honest{" "}
      <code className="text-xs">delivered: none</code> note — set{" "}
      <code className="text-xs">TELEGRAM_BOT_TOKEN</code> +{" "}
      <code className="text-xs">TELEGRAM_CHAT_ID</code> for live delivery.
    </p>
  );
}
