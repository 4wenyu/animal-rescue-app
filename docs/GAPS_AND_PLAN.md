# Gaps and build plan

Last updated: 2026-09-20. This supersedes the August review docs in `docs/archive/`.

**Board:** root `RescueHub Kanban.md` (Obsidian Kanban). **Roles:** `docs/AGENT_ROLES.md`.

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
| Epic 4 crawler stub | Staff `POST /api/admin/petfinder-sync` — no-op until a feed exists. **Petfinder public API decommissioned Dec 2025** — no new self-serve keys. |
| No LICENSE / SaaS README | Apache-2.0 + mission README. |
| Stale D+ reviews | Moved to `docs/archive/`. |
| Lost-pet drafts die on refresh | **N1 done:** `LostPetIntakeDraft` + `GET/PUT/DELETE /api/lost-pet-drafts` for signed-in users; localStorage still backs anonymous / offline. |

## Still operator / legal (not code)

1. Put TeamoRouter / FreeLLMAPI / Gemini keys in `frontend/.env.local` (see `CURSOR_AND_LLM_SETUP.md`). Cursor Desktop API Keys are optional and do **not** power the site. Rotate any key that ever sat in chat.
2. `npm run db:seed` with strong `SEED_*_PASSWORD` values; change them before a shared preview URL.
3. Set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` or accept record-only outreach.
4. File nonprofit articles, EIN, Form 1023-EZ — see `NONPROFIT_SETUP.md`.
5. Real shelter photos and hours, not `placedog.net`.
6. Redis rate limits before more than one server instance.
7. Sentry / error monitoring.
8. **Pilot shelter** — emails sent to Riverside DAS (`shelterinfo@rivco.org`), SB City (`sbcitypets@sbcity.org`), Kitty Devore (`admin@kittydevorerescue.org`). Await CSV / partner export / Rescue Track access.

## Next engineering (highest leverage)

| # | Move | Epic | Status |
|---|---|---|---|
| **N0** | **Pilot roster data path** | 4 | In progress (outreach). Not Petfinder keys — public API is gone. |
| **N1** | Persist lost-pet chat drafts server-side | 3 | **Done** 2026-09-20 |
| N2 | Richer staff share-evidence UI | 2/ops | Next code card after N0 replies or in parallel |
| N3 | SMS/Telegram **radius** alerts | 3 backlog | Last-seen lat/lng — not cold DMs |
| N4 | Stripe webhooks | ops | Replace success-URL confirm |
| N5 | Operator hardening | ops | Photos/hours; Telegram; Sentry; Redis |

### How to get “real” roster data (N0) — updated

1. ~~Petfinder Partners self-serve API~~ — **decommissioned Dec 2025**.
2. **Pilot partnership** — county Chameleon/PetPoint/24Pet or foster rescue CSV / weekly export.
3. **Shelterluv** — only if a partner already uses it and grants access.
4. **County transfer form** — `/intake/county` for one-off ACO handoffs (not a bulk feed).
5. Keep **`dogs.json` seed** until a live feed lands.

Do **not** add arcade games, autoplay music, or social crawling next. Those fight the mission and the 513(i) / ToS constraints.
