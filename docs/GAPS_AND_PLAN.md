# Gaps and build plan

Last updated: 2026-09-19. This supersedes the August review docs in `docs/archive/`.

## Closed in this pass

| Gap | Approach |
|---|---|
| Find My Pet client `EARN` 403 | New `POST /api/tokens/sponsor-search` mints + spends **on the server** after a 5s 513(i) acknowledgment. Preview register still grants +100. |
| LLM locked to Gemini | `lib/llm/provider.ts` routes TeamoRouter → FreeLLMAPI → Gemini. Keys stay in env, never git. |
| No staff share review UI | `/shares/review` + `PATCH /api/shares/[id]`. Ten verified shares still grant a free search. |
| Oscar page mixed language / 4 equal CTAs | Photo hero, translated breed/personality/dates, one primary Adopt, quieter Foster/Share/Donate, sticky mobile bar, next-steps copy, share poster. |
| Stay-loop too thin | Two-door hero, daily streak banner, opt-in ambient (never autoplay), kennel walk + today animal already existed. |
| Dual roster | `getPublicRoster()` prefers Prisma `roster-*` rows; seed copies `dogs.json`. |
| Fake live donations | Preview pledges labeled; live without Stripe returns 503; Stripe Checkout + `/api/fundraising/confirm` when `STRIPE_SECRET_KEY` is set. |
| Outreach “region matching not implemented” | Token overlap on `city` / `regionLabel`; sourceNote stays honest. |
| Epic 4 crawler | Staff `POST /api/admin/petfinder-sync` — no-op 503 until Petfinder keys exist. |
| No LICENSE / SaaS README | Apache-2.0 + mission README. |
| Stale D+ reviews | Moved to `docs/archive/`. |

## Still operator / legal (not code)

1. Put TeamoRouter / FreeLLMAPI / Gemini keys in `frontend/.env.local` and Cursor Models (see `CURSOR_AND_LLM_SETUP.md`). Rotate any key that ever sat in chat.
2. `npm run db:seed` with strong `SEED_*_PASSWORD` values; change them before a shared preview URL.
3. Set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` or accept record-only outreach.
4. File nonprofit articles, EIN, Form 1023-EZ — see `NONPROFIT_SETUP.md`.
5. Real shelter photos and hours, not `placedog.net`.
6. Redis rate limits before more than one server instance.
7. Sentry / error monitoring.

## Next engineering (after the loop is true with one shelter)

1. Persist lost-pet chat drafts server-side (highest remaining UX risk).
2. Staff UI for share evidence that is more than a URL.
3. SMS/Telegram **radius** alerts (Epic 3 backlog) using last-seen lat/lng — not cold DMs.
4. Petfinder/Shelterluv as the roster source of truth; drop JSON fallback in live mode.
5. Stripe webhooks instead of success-URL confirm.
6. PWA, then Expo — website stays canonical.

Do **not** add arcade games, autoplay music, or social crawling next. Those fight the mission and the 513(i) / ToS constraints.
