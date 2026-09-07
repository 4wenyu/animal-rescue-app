/**
 * Server-side Telegram Bot notification utility.
 *
 * Sends a structured message to a configured Telegram chat channel
 * via the standard Bot API.  All configuration comes from environment
 * variables so the bot token is never exposed to the client.
 *
 * Environment variables:
 *   TELEGRAM_BOT_TOKEN — the bot token from @BotFather
 *   TELEGRAM_CHAT_ID   — the target chat / channel ID (numeric or @username)
 */

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

function getConfig(): { token: string; chatId: string } {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error(
      "Telegram notification is not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in your environment.",
    );
  }

  return { token, chatId };
}

/**
 * Supported parse modes for the message text.
 */
export type ParseMode = "HTML" | "MarkdownV2" | "Markdown";

/**
 * Send a plain-text message to the configured Telegram channel.
 *
 * @param text   — The message body (up to 4096 characters).
 * @param parse  — Optional parse mode (HTML, MarkdownV2, Markdown).
 *
 * This function wraps the network call in a try/catch and will
 * never throw — failures are logged to console.error so they never
 * block the caller (e.g. a database write or user-facing response).
 */
export async function sendTelegramMessage(
  text: string,
  parse?: ParseMode,
): Promise<boolean> {
  try {
    const { token, chatId } = getConfig();

    const body: Record<string, string> = {
      chat_id: chatId,
      text,
    };

    if (parse) {
      body.parse_mode = parse;
    }

    const response = await fetch(`${TELEGRAM_API_BASE}${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "unknown");
      console.error(
        `[telegram] API returned ${response.status}: ${errorBody}`,
      );
      return false;
    }
    return true;
  } catch (err) {
    // Fail gracefully — never let a notification break the primary flow.
    console.error("[telegram] Failed to send notification:", err);
    return false;
  }
}

/**
 * Send a structured intake notification to the Telegram channel.
 *
 * Produces a formatted message with emoji indicators and a consistent
 * layout suitable for a shelter operations channel.
 */
export async function notifyIntake(
  intakeType: "PUBLIC_STRAY" | "OWNER_SURRENDER" | "MUNICIPAL_TRANSFER",
  details: {
    animalId?: string;
    surrenderType?: string;
    esignHash?: string;
    officerBadgeNumber?: string;
    departmentId?: string;
  },
): Promise<void> {
  const emoji =
    intakeType === "MUNICIPAL_TRANSFER"
      ? "🏛️"
      : intakeType === "OWNER_SURRENDER"
        ? "📝"
        : "🐾";

  const header = `${emoji} *New Intake: ${formatIntakeType(intakeType)}*`;
  const lines = [header, ""];

  if (details.animalId) {
    lines.push(`• Animal ID: \`${details.animalId}\``);
  }
  if (details.surrenderType) {
    lines.push(`• Type: ${details.surrenderType.replace(/_/g, " ")}`);
  }
  if (details.esignHash) {
    lines.push(
      `• ESIGN Hash: \`${details.esignHash.slice(0, 16)}…\``,
    );
  }
  if (details.officerBadgeNumber) {
    lines.push(`• Officer Badge: \`${details.officerBadgeNumber}\``);
  }
  if (details.departmentId) {
    lines.push(`• Department: \`${details.departmentId}\``);
  }

  lines.push("", `🕐 ${new Date().toISOString()}`);

  await sendTelegramMessage(lines.join("\n"), "Markdown");
}

function formatIntakeType(
  t: "PUBLIC_STRAY" | "OWNER_SURRENDER" | "MUNICIPAL_TRANSFER",
): string {
  switch (t) {
    case "PUBLIC_STRAY":
      return "Found Stray";
    case "OWNER_SURRENDER":
      return "Owner Surrender";
    case "MUNICIPAL_TRANSFER":
      return "Municipal Transfer (County)";
  }
}