/**
 * Staff-facing integration honesty (N5). Booleans only — never secrets.
 */
import { hasAnyLlmKey } from "@/lib/llm/provider";
import { rateLimitBackend } from "@/lib/rate-limit";
import { hasSentryDsn } from "@/lib/ops/sentry";
import { isPreviewMode } from "@/lib/siteMode";

export type IntegrationStatus = {
  siteMode: "preview" | "live";
  telegramConfigured: boolean;
  llmConfigured: boolean;
  stripeConfigured: boolean;
  stripeWebhookConfigured: boolean;
  rateLimitBackend: "redis" | "memory";
  sentryConfigured: boolean;
  shelterHoursConfigured: boolean;
  placeholderPhotos: boolean;
};

export function getIntegrationStatus(): IntegrationStatus {
  return {
    siteMode: isPreviewMode() ? "preview" : "live",
    telegramConfigured: Boolean(
      process.env.TELEGRAM_BOT_TOKEN?.trim() &&
        process.env.TELEGRAM_CHAT_ID?.trim(),
    ),
    llmConfigured: hasAnyLlmKey(),
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    stripeWebhookConfigured: Boolean(
      process.env.STRIPE_WEBHOOK_SECRET?.trim(),
    ),
    rateLimitBackend: rateLimitBackend(),
    sentryConfigured: hasSentryDsn(),
    shelterHoursConfigured: Boolean(
      process.env.NEXT_PUBLIC_SHELTER_HOURS?.trim(),
    ),
    // Roster seed still uses placedog until real assets land (operator).
    placeholderPhotos: true,
  };
}
