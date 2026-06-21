---
kanban-plugin: basic
---

# RescueHub — Roadmap & Epic Status Board

> **Current Active Phase:** **CLOSEOUT EPIC 2 — Viral Token & Brand Sponsorship Gateway** (Phase 7)
> **Next Active Phase:** **EPIC 3 — Autonomous Outreach Engine** (Phase 8)
> **Last Updated:** 2026-06-20

| Epic | Status | Active Task |
|---|---|---|
| EPIC 1 — UI Polish & Global Localization | ✅ **COMPLETE** (2026-06-17) | All sub-tasks closed; 283 i18n keys at 100% parity across 7 locales |
| EPIC 2 — Viral Token & Brand Sponsorship Gateway | ✅ **CLOSING** (2026-06-20) | Closed: viral-share loop live, intake path mints +50, rate-limited landing rewards +5 |
| EPIC 3 — Autonomous Outreach Engine | ⚪ Ready | Geolocation & SMS radius alerts |
| EPIC 4 — Wide-Net Search Engine | ⚪ Ready | Live shelter API/scraping crawler |

## ✅ Done — EPIC 1: UI Polish & Global Localization (2026-06-17, complete)

283 unique i18n keys across 7 locales (`en`, `es`, `zh`, `zh-TW`, `zh-CN`, `ja`, `ko`) at 100% parity. All `{interpolation}` tokens preserved across rounds. New `scripts/auto_sync_locales.py` (~95 lines, deep-translator-powered) replaces the older stub. `tsc --noEmit` clean across all touched files.

Routing surfaces wired in this sprint:
- `LiveTimer.tsx` — 6 locales + SSR-safe fallbacks.
- `AnimalTable.tsx` — `MedicalBadge` via `dashboard.medical.*`.
- `app/(main)/intake/page.tsx` — hub of 3 cards localized.
- `app/(main)/intake/public/page.tsx` — full surrender flow (3 steps).
- `app/(main)/medical/page.tsx` + `app/(main)/medical/[animalId]/page.tsx` + `MedicalIntakeChecksheet.tsx` — 44 keys including 10 ASPCA/CART emergency signs.
- `app/(main)/fundraising/page.tsx` + `app/(main)/fundraising/[animalId]/page.tsx` + `FundraisingWallet.tsx` — 28 keys.
- `ESIGNLiabilityWaiver.tsx` — 11 keys.
- `BatchUpload.tsx` (AI Document Scan) — 34 keys.
- `FloatingChatbot.tsx` (Lost Pet Intake) — 8 keys.
- `app/page.tsx` — fixed About-dropdown ghosting; hero CTAs localized.

Mock timer band (`dogs.json`) refreshed: 2 overdue (~1h past), 2 active (60-70h remaining), 8 cleared. Stale `frontend/ja.json` + `frontend/ko.json` deleted.

## Ready

- [x] **EPIC 2**: Viral Growth & Token Gateway · closed 2026-06-20 — viral-share loop live, intake award live
- [ ] **EPIC 3**: Autonomous Outreach Engine
- [ ] **EPIC 4**: Wide-Net Search Engine
- [ ] **Milestone M1**: Brand Sponsorship & Rewarded Ad Network — strategy framed in roadmap, build behind EPIC 3 start
- [ ] **TODO**: Reset intake countdown timers (`LiveTimer` per-second timer needs to be cleared on component unmount to avoid orphaned intervals)
- [ ] **TODO**: Sidebar "Sign Out" / "Staff Login" labels still hardcoded English (small-polish follow-up)

## In Progress

- [x] **EPIC 2 — The Viral Token & Brand Sponsorship Gateway** (Phase 7) · closed 2026-06-20
  - ✅ Schema live on Neon (v6.19.3 client)
  - ✅ `/api/animals/intake` (atomic Animal+IntakeRecord insert + +50 ONBOARDING_BONUS_EARN award via `awardIntakeBonus`)
  - ✅ `/api/shares` (ViralShareVerification writer + `/p/<shareId>` tracking URL)
  - ✅ `/p/[shareId]` public landing (mints +5 via `awardShareReward`, in-memory `(shareId, ip)` rate-limited)
  - ✅ `ShareToHelpButton` wired into `AnimalTable` rows
  - ✅ End-to-end live test confirmed by user 2026-06-20

## Done

- [x] **EPIC 1 — UI Polish & Global Localization (2026-06-17)** — 283 i18n keys, 100% parity across 7 locales, scripts/auto_sync_locales.py tooling, all required surfaces re-wired.
- [x] **Auth Hardlock (2026-06-17)** — NextAuth domain mismatch fixed, `authorized` callback contract corrected, login now accepts `admin@rescuehub.org` / `admin123`.
- [x] **Gemini Migration (2026-06-17)** — `gemini-3.5-flash` → `gemini-1.5-flash` → `gemini-2.5-flash`. AI SDK v6 `ImagePart` typing fixed (`mimeType` embedded in data URL).
- [x] **BatchUpload Bulletproofing (2026-06-17)** — Outer `finally` reset, inner per-file `try/finally` (partial failures no longer lose progress), yellow empty-state alert, staged files auto-clear on success, 2-sec delay skipped after last file.
- [x] **Intake Document Scan route (2026-06-17)** — `/(main)/intake/document-scan/page.tsx` mounts `<BatchUpload />` for staff bulk AI extraction. Hub expanded to 3-card grid.
- [x] **`PetIntakeBatchSchema` Zod schema (2026-06-17)** — `lib/schemas/intake.ts` with full per-animal extraction contract including `euthanasia_risk_status` enum compliance fields.

# RescueHub — Autonomous AI Animal Rescue Platform

## Architecture Overview

**Goal:** Build an autonomous AI platform for animal rescue — finding lost pets and rehoming shelter animals facing imminent euthanasia (dogs, cats, rabbits, turtles).

**Stack:** Next.js 16.2.7, TypeScript + Tailwind CSS + Shadcn, Prisma (expected), Stripe (expected), Auth.js v5 beta.

**Current State:** Public-facing homepage with HeroMesh, adoption feed, corporate sponsors, navigation, and i18n (en/es/zh). Dashboard, intake, medical, and fundraising routes scaffolded. Conversational AI chatbot (FloatingChatbot) with native React + Gemini 3.5 Flash streaming.

---

## Epic Execution Order (Kanban-aligned)

### ✅ COMPLETE — Phase 1–5 (Hybrid Theme, Compliance, etc.)
- HeroMesh with Indigo→Teal gradient, neon blobs, frosted glass card
- Corporate sponsor section (neutral acknowledgment, IRC § 513(i))
- Adoption feed with euthanasia risk filtering
- i18n infrastructure
- Nav bar with Staff Login

### ✅ COMPLETE — EPIC 1 (pass 1): Conversational UI & "Lost Pet" Intake (Phase 6, 2026-06-15)
**Problem:** Owners of lost pets are highly anxious, lack patience for standard web forms.

**Engineering Task:** Build a human-like conversational AI interface (chatbot/voice).

**Functionality:**
- ✅ AI conducts calm, empathetic Q&A to collect lost pet data (breed, location, photos, last seen)
- ✅ FloatingChatbot with native React state — replaced broken @ai-sdk/react useChat hook
- ✅ Gemini 3.5 Flash streaming via /api/chat route
- ✅ Initiates search after data collection
- *Future:* Voice-call capabilities

### ✅ COMPLETE — EPIC 1 (pass 2): UI Polish & Global Localization (2026-06-17)
**Problem:** Hardcoded English strings bypass `t()` lookup on several deep sub-routes; "About" dropdown rendered English even when Chinese selected; missing auto-translation tooling makes scaling to 7 locales unmaintainable.

**Engineering Task:** Embed locale-aware `t()` lookup across every client surface, normalize interpolation token preservation, ship a translator-agnostic parity tool.

**Functionality:**
- ✅ 283 i18n keys; 100% parity across 7 locales (`en`, `es`, `zh`, `zh-TW`, `zh-CN`, `ja`, `ko`).
- ✅ `scripts/auto_sync_locales.py` — lightweight parity translator using deep-translator (Google). Token-safe via placeholder masking + longer-context retry on Google refusal. Idempotent.
- ✅ All required sub-pages wired: `/intake`, `/intake/public`, `/medical`, `/medical/[animalId]`, `/fundraising`, `/fundraising/[animalId]`, ESIGNLiabilityWaiver, BatchUpload, FloatingChatbot.
- ✅ About-dropdown ghosting fixed; Hamburger links + hero CTAs localized.
- ✅ `MockTimer` band refreshed so demo shows red urgent + amber live + green cleared states.
- ✅ Pip dep `deep-translator` introduced (no `requirements.txt` yet — follow-up).

### ✅ COMPLETE — EPIC 2: Viral Growth & Token Gateway (Phase 7) · closed 2026-06-20
**Problem:** Computing power for massive internet searches costs money; we want maximum accessibility — and a free path for users who can earn access by sharing.

**Engineering Task:** Build a dual-path authorization gateway (Path A — pay, Path B — viral loop), wired into every AI-assisted search.

**Active task (as of 2026-06-17):** ~~Database Schema & Prisma Models~~ ✅ **done** (`User`, `TokenWallet`, `TokenTransaction`, `ViralShareVerification`, `Sponsor`, `SponsorshipContribution` all live on Neon with v6.19.3 Prisma client). **Active task (current):** ~~Wire the EARN path into real handlers~~ ✅ **done** — `awardIntakeBonus` (+50 on `/api/animals/intake`), `awardShareReward` (+5 per landing, in-memory rate-limited), `processTokenTransaction` atomic across wallet + ledger.

**Functionality (Path A — Pay):** Stripe fees activate AI internet search. Per-search credits priced in EARN/TOKEN ledger (`SEARCH_FEE_WAIVE_SPEND`).

**Functionality (Path B — Viral Loop):**
- User shares an animal via the dashboard `🔗 Share to Help` button → POST /api/shares → row + tracking URL `/p/<shareId>`
- Visitor lands → server component captures IP, calls `awardShareReward`, mints +5 (rate-limited `(shareId, ip, 24h)`)
- Repeat visits within 24h return the dedup slate panel
- End-to-end closed loop verified by the user 2026-06-20 (commits `3c5ffaa`, `f8f25b6`)

*Detailed Backlog Items:**
- ~~Vision & Flyer Tool (Image upload to PDF generation)~~ deferred to a future iteration. The viral-share-loop is currently the leverage-driven funnel; flyer PDFs would compound it.

### 💰 Monetization Milestones — *running parallel to EPICs 3 & 4*

RescueHub's growth path forces two operating costs at scale: (a) GPU minutes for the conversational intake + search agents, and (b) outbound messaging (SMS/Telegram) for outreach. NEITHER is free. The two-gateway model Epic 2 closed opens a third monetization dimension — **hybrid value-capture** — where some users pay cash, some pay attention, and some pay nothing because a sponsor underwrote them.

#### 💰 Milestone M1 — Brand Sponsorship & Rewarded Ad Network (NEW, 2026-06-20)

**Strategy:** Sponsors pay USD for branded visibility slots; users earn EARN/TOKEN ledger credits by *viewing* sponsored content (rewarded ad). The token-credit landscape already has a home — `processTokenTransaction` + `TokenWallet` — so this integrates at the existing ledger level rather than requiring a parallel "ad-wallet" system.

**Three interlocking streams:**

1. **Sponsorship Slots (cash model, IRC § 513(i) safe)**
   - Brand partners deposit into `Sponsor.allocatedTokenPool` (USD-denominated `Decimal`). Schema is already on Neon (commit `20853b9`).
   - `SponsorshipContribution` rows pair against `TokenTransaction` ledger entries for UBIT reporting under IRC § 513(i).
   - Surface area: static corporate sponsor section is already present on `/` (`app/page.tsx`) with neutral acknowledgment mode. Streams we add to it: a karaoke-style rotating sponsor hero in `/dashboard`, sponsor-only "urgency callouts" on social-share landing pages, sponsor-keyword targeting for the search engine in Epic 4.

2. **Rewarded Ad Streams (TOKEN model — same ledger unit)**
   - Users mint EARN/TOKEN ledger entries by **opt-in viewing** of 6–15s sponsor segments (TikTok-style).
   - Read-receipt flow: a tiny `/api/sponsors/engagement/[engagementId]/confirm` endpoint reports time-on-segment + viewport-intersection; on qualifying engagement, `/api/sponsors/reward` mints EARN/TOKEN to the viewer's wallet via existing `processTokenTransaction` (cost basis `costBasisMinorUnits` optional).
   - Reward ranges: tiered per platform — `SEARCH_FEE_WAIVE_SPEND` (waive one search fee per sponsor segment), `SHARE_BOOST_SPEND` (boost share-rank), etc. The enum is already on `TokenAction`.
   - First-visit-per-segment rate limit reuses the same `(id, ip)` pattern proven in `awardShareReward`.

3. **Hybrid Underwriting (viral loop on top of sponsor pools)**
   - The viral share loop from Epic 2 funds ~$0.05 of GPU cost per share → per visit. Sponsors underwrite the deficit when share-reward payouts exceed external RevShare.
   - Dashboards surface "this search sponsored by X" — participant identity is the existing static `/` corporate block; in-stream callouts go here.
   - Cost-grants: each `Sponsor.allocatedTokenPool` increment is paired 1:1 with a `SponsorshipContribution(captured)` row so UBIT auditors can attribute exactly which sponsor dollar funded which rewarded adv.

**Tying it back to existing data layer** (no migrations needed for V1):
- `Sponsor`: rows already have `allocatedTokenPool` Decimal + `consumedTokenPool` Decimal — V1M1 uses both as cash/TOKEN balances.
- `SponsorshipContribution`: paired 1:1 with `TokenTransaction` ledger row → auditor-friendly atomic record.
- `TokenAction` enum already lists `PRINTED_FLYER_SPEND`, `SHARE_BOOST_SPEND`, `SEARCH_FEE_WAIVE_SPEND`. M1 adds brand-keyword-enumerated `BRAND_PARTNERSHIP_EARN` as the user-side rewarded-view action.
- `tokenWallets_lifetimeEarned` already exists as a counter — separate counter `lifetimeRewardedViewings` is added at the same time as `BRAND_PARTNERSHIP_EARN` rows.
- `ViralShareVerification` continues to drive organic reach; `Sponsor.userId` (via `SponsorshipContribution.tokenTxnId`) holds the link from a token-reward withdraw back to its sponsor.

**KPI gates for V1M1→V2 promotion:**
1. `Sponsor.consumedTokenPool` ≈ `allocatedTokenPool * 0.30` month-over-month (sponsor utilization > 30% — funds reaching fan pipes).
2. Rewarded-ad `TokenTransaction` rows have a content-quality rating after week 4 (no fraud-vector — earned EARN/TOKEN from skip+refresh patterns).
3. The `SponsorshipContribution.captured` rate plateaus around `allocatedTokenPool / 90 days` — predictably sponsor-budgetable accounting cycle.
4. Watch-share correlation: `ViralShareVerification.observedAt NOT NULL AND TokenTransaction.actionType = 'SHARE_10_GROUPS_EARN'` reaches ≥ N/week.

**Engineering alignment with upcoming epics:**
- EPIC 3 ("Autonomous Outreach Engine") will send DMs carrying sponsor-marked cards → backfill M1 with sponsored DM templates.
- EPIC 4 ("Wide-Net Search Engine") attaches `BRAND_PARTNERSHIP_EARN` to search-result impressions — sponsored-search slots become monetizable through the same M1 ledger unit.

### 📋 EPIC 3: Autonomous Outreach Engine (Phase 8)
**Problem:** Animals are euthanized due to lack of visibility to potential fosters/adopters.

**Engineering Task:** Build an autonomous social media analysis and outreach worker.

**Functionality:**
- Agent autonomously scours social media, analyzes text/images/videos
- Identifies "animal lovers" and responsible pet owners
- Cross-references against influencers and local individuals
- Proactively DMs these users with local at-risk animals
- Asks for donations, fostering, adoption, or retweets/shares

**Detailed Backlog Items:**
- **Geolocation & Radius Alerting (Calculate wandering radius and SMS locals)** — Using the last-seen coordinates gathered during the conversational intake, compute a probable wandering radius based on species, size, and time elapsed. Automatically geolocate nearby shelters, vets, and rescue groups within that radius and trigger SMS/Telegram alerts to subscribers in the area. Integrate with the Telegram notification system already in place.

### 📋 EPIC 4: Wide-Net Search Engine (Phase 9)
**Problem:** Lost pet information scattered across thousands of disparate sites, shelters, forums.

**Engineering Task:** Integrate LLM-driven web-scraping and data-matching.

**Functionality:**
- Using data gathered in Epic 1, AI autonomously crawls internet
- Searches shelter databases, local subreddits, Facebook groups
- Finds potential matches for lost pet
- Alerts the owner on match

**Detailed Backlog Items:**
- **Live Shelter Database Search via API/Scraping** — Build a modular crawler that periodically queries shelter API endpoints (Petfinder API, Shelterluv, municipal animal services) and scrapes lost-and-found boards on subreddits, Facebook groups, and Craigslist. Ingest listings into a searchable index, match against active lost-pet profiles by breed, color, location, and date-range. Send automated match alerts to the pet owner and the nearest matched shelter.

---

## Key Principles
- Execute Epics one at a time — stable, error-free codebase
- Each Epic gets its own Kanban sprint
- Track progress in Project_Board.md and CHANGELOG.md
- Build verification: `npm run build` after every change