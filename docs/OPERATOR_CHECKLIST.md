# Operator checklist (N5)

Use with the staff page `/staff/ops` (env presence only — no secrets shown).

## Before a shared preview / live launch

1. **LLM keys** — Put TeamoRouter / FreeLLMAPI / Gemini in `frontend/.env.local` (see `CURSOR_AND_LLM_SETUP.md`). Rotate any key that ever sat in chat.
2. **Seed passwords** — `npm run db:seed` with strong `SEED_*_PASSWORD`; change before sharing a preview URL.
3. **Telegram** — Set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`, or accept record-only outreach (`delivered: none` on approve).
4. **Nonprofit** — Articles / EIN / Form 1023-EZ — see `NONPROFIT_SETUP.md`.
5. **Photos & hours** — Replace `placedog.net` seed images; set `NEXT_PUBLIC_SHELTER_HOURS` for public hours copy.
6. **Redis** — Before more than one server instance, set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` so rate limits are shared.
7. **Sentry** — Set `SENTRY_DSN` so unhandled errors are reported (minimal store ingest).
8. **Stripe (live)** — `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`; Dashboard webhook → `POST /api/fundraising/webhooks/stripe` (`checkout.session.completed`).
9. **Pilot roster (N0)** — Await shelter CSV / partner feed; keep `dogs.json` until then.

## Multi-instance warning

In-memory rate limits are **per process**. Without Upstash, two instances each allow the full limit.
