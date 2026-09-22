# Operator checklist (N5 + N0)

Use with the staff page `/staff/ops` (env presence only — no secrets shown).

## Before a shared preview / live launch

1. **LLM keys** — Put TeamoRouter / FreeLLMAPI / Gemini in `frontend/.env.local` (see `CURSOR_AND_LLM_SETUP.md`). Rotate any key that ever sat in chat.
2. **Seed passwords** — `npm run db:seed` with strong `SEED_*_PASSWORD`; change before sharing a preview URL.
3. **Telegram** — Set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`, or accept record-only outreach (`delivered: none` on approve).
4. **SMS** — Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` (E.164). Helpers opt in with a mobile number on `/outreach`. Staff still approve before any text. Without Twilio, SMS is skipped.
5. **Nonprofit** — Articles / EIN / Form 1023-EZ — see `NONPROFIT_SETUP.md`.
6. **Photos & hours** — Replace `placedog.net` seed images; set `NEXT_PUBLIC_SHELTER_HOURS` on Vercel (Production + Preview), e.g. `Mon–Sat 10am–6pm`.
7. **Redis** — Before more than one server instance, set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` so rate limits are shared.
8. **Sentry** — Set `SENTRY_DSN` so unhandled errors are reported (minimal store ingest).
9. **Stripe (live)** — `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`; Dashboard webhook → `POST /api/fundraising/webhooks/stripe` (`checkout.session.completed`).
10. **Google login** — `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`, and `AUTH_URL` on Vercel. Google Cloud redirect URI must include  
   `https://animal-rescue-app-4wenyu-8643.vercel.app/api/auth/callback/google` (plus any amber alias you share).
11. **Friend smoke test** — Open production `/login` → Continue with Google → land on `/dashboard` (must not hit “Log in to Vercel”).
12. **Pilot roster (N0)** — When a shelter sends CSV, import at `/staff/roster` (dry-run first). Await Riverside DAS / SB City / Kitty Devore; keep `dogs.json` until then.

## Multi-instance warning

In-memory rate limits are **per process**. Without Upstash, two instances each allow the full limit.
