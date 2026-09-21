# Changelog

## v3.3.3 — Richer staff share review (N2) (2026-09-20)

### Added
- `/shares/review` evidence panel: tracking link `/p/{shareId}`, safe posted URL, linked radar/animal, platform post ID, optional reject note → `reviewerNote`.

### Docs
- Kanban / GAPS — N2 done; N0 still awaiting pilot replies; N3 next engineering after N0 idle.

---
## v3.3.2 — Lost-pet draft persistence + pilot N0 retarget (2026-09-20)

### Added
- Server-side lost-pet intake drafts: Prisma `LostPetIntakeDraft`, migration `20260920_lost_pet_intake_draft`, `GET/PUT/DELETE /api/lost-pet-drafts`.
- Client merges localStorage + server by `savedAt`; anonymous users stay local-only; activate search clears both.

### Docs
- `RescueHub Kanban.md` / `GAPS_AND_PLAN.md` — N1 done; N0 retargeted (Petfinder public API gone; SoCal pilot emails in flight).

---
## v3.3.1 — Sprint board, agent roles, repo cleanup (2026-09-19)

### Added
- Obsidian Kanban at root `RescueHub Kanban.md` (vault = this repo).
- Agent roles: Project Manager + Lead Engineer/Architect (`.cursor/rules/*.mdc`, `docs/AGENT_ROLES.md`).
- Next-up sequence **N0–N5** with **N0 Petfinder live roster** as the immediate card (`docs/GAPS_AND_PLAN.md`).
- Cleanup record: `docs/CLEANUP_2026-09-19.md`.

### Removed / cleaned
- Root `node_modules` (~318 MB), root `package.json` / lockfile (dual lockfile confused Next; install from `frontend/` only).
- Leftover `generated/` Prisma dump, unused root `src/` calculator, `server-3200.txt`, `unzip.bat`, deploy-skill `Archive.zip`.
- Duplicate archive review (identical to `PRODUCT_UX_MVP_TEAM_REVIEW.md`); screenshots moved to `docs/archive/screenshots/`.

### Docs
- `ROADMAP.md` — active phase = N0 Petfinder; Epic 4 marked stub-in / keys pending.
- Epic status unchanged in substance: 1–2 done; 3 foundation + radius backlog; 4 ready pending keys.

---
## v3.3.0 — MVP loop close (2026-09-19)

### Added
- Server-side `POST /api/tokens/sponsor-search` (513(i) acknowledgment → +100 / −100). Clients no longer mint.
- TeamoRouter / FreeLLMAPI / Gemini router for `/api/chat` and `/api/chat-intake`.
- Staff share review at `/shares/review` (10 verified shares still grant a free search).
- Adopt profile conversion pass, share poster, sticky Adopt, translated personalities.
- Home two-door CTAs, daily streak, opt-in ambient sound.
- Roster prefers Prisma; seed copies `dogs.json`. Petfinder sync stub. Stripe checkout when keyed.
- Apache-2.0 LICENSE, nonprofit + LLM setup docs, gap plan. Stale reviews archived.

### Fixed
- Find My Pet funding path that posted client `EARN` against a SPEND-only API.
- Fundraising live mode no longer pretends a card was charged without Stripe.

---
## v3.2.0 — Docs-Compliance Review & EPIC 3 Foundation Hardening (2026-08-23)

### Fixed
- **`npm run build` / `/dashboard` runtime 500** — `ReferenceError: useI18n is not defined` in `src/components/dashboard/TokenWalletCard.client.tsx`: the component called `useI18n()` but never imported it. Added `import { useI18n } from "@/src/lib/useI18n";`. Build is green again and the dashboard renders after login.
- **`POST /api/chat-intake` 500** — `TypeError: INTAKE_SYSTEM_PROMPT.join is not a function`: `INTAKE_SYSTEM_PROMPT` is built with `.join("\n")` (a string), then `.join(" ")` was called on it at line 507. Now concatenated with `"\n"` + the locale directive.
- **Next 16 `params` contract** — `app/hold-profile/[id]/page.tsx` read `params.id` synchronously; `params` is now a `Promise` and is awaited (`params: Promise<{ id: string }>`).

### Added
- **`SponsorshipCheckoutModal` (Epic 2 sponsor-gateway) mounted into `/dashboard`** — previously dead code. A "Find My Pet" header button opens the IRC § 513(i) neutral-acknowledgment modal; on grant it issues `SPONSOR_VIEW_CREDIT_EARN` (+50) + `LOST_PET_SEARCH_SPEND` (-100) and routes to `/lost-pet-intake?credit=…&spend=…&newBalance=…`.
- **Prisma schema reconciled with the deployed Neon DB** — added `LostPetSearch` model (`LostPetSearchStatus` enum) + `SPONSOR_VIEW_CREDIT_EARN` / `LOST_PET_SEARCH_SPEND` `TokenAction` values to `prisma/schema.prisma` (and mirror them in `lib/schemas/token.ts` `TokenActionSchema`). Previously the checked-in schema lacked these while the generated client and Neon DB already had them — `prisma generate` would have silently broken `/api/searches` and the sponsorship flow.

### Docs
- `ROADMAP.md` — EPIC 3 marked foundation-merged (2026-08-16); i18n key count corrected 283 → 391; fixed duplicated `v3.0.0` section in this changelog; added this entry.

---
## v3.1.0 — EPIC 1 Pass 2: UI Polish & Global Localization (2026-06-17)

### Added
- **`scripts/auto_sync_locales.py`** — Lightweight (~95 lines) parity translator. Reads `locales/en.json`, diffs each other 6 locales, translates missing keys via `deep-translator` (Google) on the fly. Guards `{interpolation}` tokens against translation rejection. Idempotent.
- **283 i18n keys** spanning 7 locales (`en`, `es`, `zh`, `zh-TW`, `zh-CN`, `ja`, `ko`) at **100% parity**. Every `{count}`, `{id}`, `{name}`, `{pct}`, `{kb}`, `{error}`, etc. token preserved across all languages.
- **Per-surface translations** (all 6 locales + SSR-safe English fallbacks):
  - `/intake`, `/intake/public`, `/intake/document-scan` (Public Surrender Portal + Electronic Waiver + AI Document Scan)
  - `/medical` (Records hub) + `/medical/[animalId]` (ASPCA/CART-aligned Intake Checksheet, including 10 emergency-sign medical terms)
  - `/fundraising` (Campaign list) + `/fundraising/[animalId]` (animal ledger w/ donation form, allocation toggle, transaction history, restriction warning)
  - `ESIGNLiabilityWaiver` (Owner Surrender + Found Stray variants, consent label, signature flow, both error messages)
  - `BatchUpload` (AI Document Scan drag-drop, file staging, submit, results, empty-state banner, full AnimalCard subcomponent)
  - `FloatingChatbot` (Lost Pet Intake — title, labels, greeting, error message with `{error}` token)
  - `LiveTimer` upgraded from 3-locale to 6-locale
  - `AnimalTable` `MedicalBadge` now resolves localized status

### Changed
- **`dogs.json` Mock Timer band refreshed** — 12 `intakeTimestamp` values rewritten relative to today (UTC). Distribution: 2 overdue (Max 0.5h, Rex 1.5h past 72h limit), 2 actively ticking (Luna 60h, Rocky 70h remaining), 8 cleared (1–14d ago). Compliance async-band rendering verified.
- **`app/page.tsx`** — fixed About dropdown ghosting (was rendering English even with Chinese selected) by converting the hardcoded `HAMBURGER_LINKS` array to `labelKey`-driven `tr()` lookups. Hamburger menu + hero CTAs also localized.

### Removed
- **Stale locale files** — Deleted orphan `frontend/ja.json` and `frontend/ko.json` (leftover from earlier i18n architecture). Authoritative files at `frontend/locales/{ja,ko}.json`.

### Verification
- `npx tsc --noEmit --skipLibCheck` filtered to `^(app|src|lib|test-)/`: **0 errors** in any touched file.
- Locale parity check: all 7 locales at 283/283 keys matching. Token drift: 0 mismatches.
- Compliance sentences (IRC § 513(i), ESIGN/UETA, Hayden Act, GDPR/CCPA, SOC 2, Charleston Principles, ASPCA/CART) preserved verbatim across all 7 languages.

### Carry-over
- Sidebar Sign-In / Sign-Out labels still hardcoded English (deferred UI polish).
- `requirements.txt` for `deep-translator` dep — follow-up.

### Next Sprint
- **EPIC 2 — The Viral Token & Brand Sponsorship Gateway** (Phase 7): Stripe integration, social-share viral loop verification, token consumption logic.

---
## v3.0.0 — Phase 6: Conversational UI & Lost Pet Chatbot (2026-06-15)

### Added
- **Native React Chat Component (`FloatingChatbot.tsx`)** — Complete rewrite of the conversational AI interface. Replaced the broken `@ai-sdk/react` `useChat` hook with pure React state management using `useState` + `useCallback`. The component initializes with the assistant's empathetic greeting and manages messages, input, and loading state entirely through local state.

- **Manual Streaming via `fetch` + `ReadableStream`** — User messages are sent with `fetch('/api/chat', { method: 'POST', body: JSON.stringify({ messages }) })`. The response is processed through `ReadableStream.getReader()` and `TextDecoder`, appending assistant responses chunk by chunk as they stream in, providing real-time character-by-character feedback.

- **Gemini 3.5 Flash Backend (`app/api/chat/route.ts`)** — Server-side API route using `@ai-sdk/google` `streamText()` with `google("gemini-3.5-flash")`. Handles streaming text generation with a calming RescueHub system prompt. Returns `result.toTextStreamResponse()` for native ReadableStream consumption by the frontend.

### Fixed
- **`@ai-sdk/react` `useChat` Hook Failure** — The Vercel AI SDK's `useChat` hook was failing to initialize silently in the Next.js 15 environment. This manifested as the chat being completely dead — inputs swallowed, no responses generated, no console errors. Replaced entirely with native React state management, bypassing the SDK dependency layer entirely.

- **Next.js 15 Server Action Hijack** — The rewrite avoids any Server Action interception by using a standard `fetch()` POST to the `/api/chat` route, keeping the streaming connection in the client-side rendering path.

### Architecture
- `frontend/src/components/chat/FloatingChatbot.tsx` — Pure React component, no external AI SDK dependencies. Uses `useState<Message[]>`, `useState(input)`, `useState(isLoading)`, and `useCallback(sendMessage)`.
- `frontend/app/api/chat/route.ts` — Node.js runtime, `force-dynamic`, 60s max duration. Accepts `{ messages }` body, streams via `google("gemini-3.5-flash")`.

### Compliance & UX
- Assistant greeting provides empathetic, calming language to distressed pet owners per EPIC 1 requirements.
- Typing indicator (bouncing dots) during streaming, smooth-scroll to newest message.
- Inline error messages appended to chat on fetch failure — no silent failures.

### Next Sprint
- EPIC 2 (Phase 7): Viral Growth & Token Gateway

## v2.1.0 — Phase 1: Public Home Page (2026-06-11)

### Added
- **Public-Facing Home Page** (`app/page.tsx`) — A premium, standalone landing page outside the staff sidebar layout. Serves as the platform's public entry point with four compliance-enforced sections.

- **Adoption Broadcast Feed** — Displays adoptable animals from the roster. Structurally excludes any animal flagged with `euthanasia_risk_status: IMMEDIATE_BEHAVIORAL` via the `getAdoptableAnimals()` data-layer filter (§ 1.1 Behavioral Euthanasia Exception compliance).

- **Corporate Sponsor Section** — Strict NEUTRAL_ACKNOWLEDGMENT mode (IRC § 513(i) Qualified Sponsorship Payment). Four sponsors displayed with static logo placeholders, value-neutral factual descriptions, and zero calls to action. Includes a compliance footnote documenting the tax-exempt classification.

- **Public Surrender Navigation Entry Point** — Hero card + navbar link pointing to `/intake/public`. Links to the existing ESIGN/UETA-compliant public surrender workflow.

- **Emergency Crowdfunding Navigation Entry Point** — Hero CTA + quick-action card pointing to `/fundraising`. Links to the existing fundraising campaign pages.

### Changed
- **`dogs.json`** — Expanded from 5 to 12 animals. Added `euthanasia_risk_status` field (enum: `SAFE`, `AT_RISK`, `IMMEDIATE_BEHAVIORAL`) required for the adoption feed compliance filter.

- **`app/layout.tsx`** — Updated metadata title and description to reflect the platform's broader scope as a compliance engine, not just a dashboard.

### Compliance Rules Implemented
1. **§ 1.1 Behavioral Euthanasia Exception** — `IMMEDIATE_BEHAVIORAL`-flagged animals are structurally excluded from the public adoption broadcast feed at the data layer. They never reach the render tree.
2. **§ 3.2 NEUTRAL_ACKNOWLEDGMENT (UBIT-safe)** — Sponsor section uses only value-neutral descriptions, static logo placeholders, and zero calls to action. No pricing, savings, endorsements, or inducement language — satisfying IRC § 513(i) QSP safe harbor.
3. **Charleston Principles** — Footer includes jurisdictional disclosure for multi-state charitable solicitation compliance.
4. **Chain of Custody** — Surrender portal link preserves the existing ESIGN/UETA waiver chain of custody for property rights transfer.

### Next Sprint
- Phase 2: Dashboard Triage Table — Kanban-style triage board on the internal dashboard with intake status, stray hold clock, behavioral risk level, and medical priority.