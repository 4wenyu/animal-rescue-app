# RescueHub

An open-source platform for **lost-pet search** and **at-risk shelter animals** — built for one pilot shelter first, then forked by other rescues.

RescueHub is not another Petfinder clone. It closes a specific loop:

1. An anxious owner reports a lost pet in chat (not a 12-field form).
2. A **server-side** token grant underwrites the search (sponsor acknowledgment or preview credit — never a client mint).
3. A radar page tracks the search. Sharing is real; staff verify posts; **10 verified shares = one free search**.
4. Citizens opt in to help. Staff approve every outreach message before anything is sent.
5. Adopters meet a real animal, apply in one click, and hear back within 24 hours.

## Who it is for

| Audience | Job |
|---|---|
| Lost-pet owners | Chat-first report, token-funded search, radar, share |
| Helpers | Adopt, foster, donate, volunteer — opt-in outreach only |
| Shelter staff | Intake, stray holds, medical, human gate on the agent |
| Sponsors | IRC § 513(i) **acknowledgment** (name/logo), not ads |

## What’s in this repo

- Next.js App Router (see `frontend/`) + Prisma/Postgres
- Public home, adopt profiles, daily animal, kennel-walk matcher
- Lost-pet chat (`/lost-pet-intake`) via TeamoRouter, FreeLLMAPI, or Gemini
- Token ledger, sponsor-funded search, viral shares + staff review
- Intake (public + county), medical logs, fundraising pledges
- Outreach opt-in → generate → review → deliver (Telegram or record-only)

Sample animals live in `frontend/data/dogs.json` and are seeded into Postgres (`roster-{id}`). The public feed prefers database rows when they exist. **Next:** live Petfinder roster for one pilot shelter — see `RescueHub Kanban.md` (N0) and `docs/GAPS_AND_PLAN.md`.

**Planning:** Obsidian vault = this repo → open `RescueHub Kanban.md`. Agent roles: `docs/AGENT_ROLES.md`.

## Quick start

Moving from a Cloud Agent to Cursor Desktop: fetch `cursor/rescuehub-mvp-loop-cfb0` (PR [#1](https://github.com/4wenyu/animal-rescue-app/pull/1)). Do not copy the cloud VM. Step-by-step: [`docs/CURSOR_AND_LLM_SETUP.md`](docs/CURSOR_AND_LLM_SETUP.md) §4.

```bash
cd frontend
cp .env.example .env.local   # then fill secrets locally — never commit them
npm install
npx prisma generate --schema=../prisma/schema.prisma
npm run db:seed              # needs SEED_ADMIN_PASSWORD + SEED_STAFF_PASSWORD
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Private-preview mode (`NEXT_PUBLIC_SITE_MODE=preview`) grants **+100 tokens** on register so Find My Pet works without a sponsor row.

Walk the citizen path: **home → adopt → daily play → lost-pet intake**.

## LLM compute (Find My Pet)

TeamoRouter and FreeLLMAPI pay for **model inference**, not wallet tokens.

Set **one** of these in `frontend/.env.local` (never in git, never in chat):

```
TEAMOROUTER_API_KEY=sk-teamo-…
TEAMOROUTER_BASE_URL=https://api.teamorouter.com/v1
TEAMOROUTER_MODEL=gemini-3.5-flash

# or
FREELLMAPI_API_KEY=freellmapi-…
FREELLMAPI_BASE_URL=http://localhost:3001/v1
FREELLMAPI_MODEL=auto

# or
GOOGLE_GENERATIVE_AI_API_KEY=…
```

Priority: TeamoRouter → FreeLLMAPI → Gemini. Cursor Desktop **API Keys** do not feed this app — only `.env.local` does. Official TeamoRouter host is `api.teamorouter.com/v1` (`.cc` does not resolve). Probe without printing secrets: `npm run llm:probe`. Full Desktop vs Cloud vs app map: `docs/CURSOR_AND_LLM_SETUP.md`.

## Quality gates

```bash
cd frontend
npm run lint
npm run typecheck
npm test
npm run build
```

## Docs

- [`PRODUCT.md`](PRODUCT.md) — purpose, audiences, design principles
- [`docs/GAPS_AND_PLAN.md`](docs/GAPS_AND_PLAN.md) — remaining gaps and the build order
- [`docs/NONPROFIT_SETUP.md`](docs/NONPROFIT_SETUP.md) — 501(c)(3) / EIN / 1023-EZ checklist
- [`docs/SHIP_READINESS_2026-09-15.md`](docs/SHIP_READINESS_2026-09-15.md) — last engineering readiness review
- [`LICENSE`](LICENSE) — Apache License 2.0

Stale August 2026 review grades (D+, failing build) are archived under `docs/archive/`. They do not describe this tree.

## License

Apache License 2.0. Other rescues may use this for their own causes. Do not treat it as legal advice, licensed shelter software, or a live municipal listing until `NEXT_PUBLIC_SITE_MODE=live` and a real roster is loaded.
