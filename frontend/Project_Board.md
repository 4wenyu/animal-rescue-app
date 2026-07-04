---
kanban-plugin: basic
---
# RescueHub — Project Board

## ✅ Done

### Phase 1: Public Home Page
- [x] Public-facing adoption broadcast feed
- [x] IMMEDIATE_BEHAVIORAL structural exclusion
- [x] NEUTRAL_ACKNOWLEDGMENT corporate sponsor section (IRC § 513(i))
- [x] Surrender + crowdfunding nav entry points
- [x] Compliance documentation

### Phase 2: Dashboard Triage Table & UX Fixes
- [x] Stray Hold Guardian table with countdowns
- [x] Legal Status column — locked until `statutoryHoldCleared` = TRUE
- [x] BSL breed safety (default to "Mixed Breed")
- [x] Hayden Act warnings (IMMEDIATE_BEHAVIORAL → locked/disabled)
- [x] Add Animal button routes to `/intake`
- [x] Sidebar logo + home link already satisfied requirements
- [x] CHANGELOG documented, Project Board updated

### Phase 3: Premium UI Polish, Interactive Triage & Multi-Language Scaffolding
- [x] Global cleanup — no GlowButton remnants found (already clean)
- [x] Animal images in public adoption feed (rounded thumbnails)
- [x] Clinical dark dashboard theme (bg-slate-950, high-contrast)
- [x] Thematic lucide-react icons (PawPrint, HeartPulse, AlertTriangle, ShieldCheck)
- [x] Interactive stat cards — click to filter the Triage Table
- [x] Table rows clickable → `/hold-profile/[id]`
- [x] i18n scaffolding — JSON dictionaries for en, es, zh
- [x] LocaleSwitch component in public nav
- [x] CHANGELOG + Project Board updated

### Phase 3.5 — Emergency UI/UX Sprint (Completed)
- [x] **Revert Theme & Fix Dashboard** — Removed dark theme (`bg-slate-950`) from dashboard. Unified with clean light theme (`from-slate-50 to-white`). Fixed bottom disclaimer overlap via `pb-8` + `mt-10`.
- [x] **Wire Up Dashboard Filters** — Clicking "Total Dogs" stat card now calls `setFilter(null)`, showing all 12 animals. "View All" button in AnimalTable works as clear-control.
- [x] **Fix Broken Images** — Already using reliable `picsum.photos/seed/{name}/400/400` across all 12 animals (no Unsplash URLs in data). ✅ No change needed.
- [x] **Global Hamburger Menu** — Added to public nav header with links: Mission, Legal, Process, Story, About Us, Contact. Full responsive split: desktop (inline) / mobile (dropdown).
- [x] **Global 'Back to Dashboard' Buttons** — Added to every sub-page

### Frontend UI Polish (Sprint)
- [x] **Desktop Override Sprint** — Adoption Broadcast `<p>` rewired to use i18n keys with `{count}` variable interpolation. SPONSORS array refactored with real corporate logos via Clearbit API.
- [x] **True Ticking Clock** — `LiveTimer.tsx` rewritten from scratch with `setInterval(..., 1000)` precision. Massive attention-grabbing amber/red UI (`text-xl font-black font-mono`, pulsing overdue alerts). Injected into the dashboard's Legal Status column in `AnimalTable.tsx`.
- [x] **Option A: i18n Localization & Real Logos** — Full breed dictionary (12 breeds × 3 languages), medical status translations, clock label translations. Sponsors switched to Clearbit Logo API `<img>` tags, removing lucide icons.
- [x] **Clean Sweep Sprint — Hydration Fix** — Added `isMounted` state guard in `LiveTimer.tsx` to prevent SSR/CSR hydration mismatch. Added nav dictionary keys (`public_portal`, `dashboard`, `intake`, `medical`) to all 3 locale files. Wired `Sidebar.tsx` to use i18n `t()` function with locale-change event listener.
- [x] **Quick Fix — Resilient Logos** — Swapped sponsor logo API from Clearbit to Google Favicon API (`s2/favicons?domain=...&sz=128`) to bypass ad-blocker/CORS blocks on localhost.

### Phase 4: NextAuth/RBAC Implementation
- [x] NextAuth.js setup with credentials + ADMIN/STAFF mock users
- [x] Role-based access — role exposed in session callback
- [x] Protected dashboard/middleware via `proxy.ts`
- [x] Premium login page at `/login`
- [x] Sidebar auth integration — email, role badge, sign out button

### Phase 5: Compliance Dashboard Widgets
- [x] UBIT sponsor revenue widget (IRC § 513(i) — $42.5K vs $18.2K)
- [x] ESIGN waiver completion stats (100% compliance, 342 hashes)
- [x] Dashboard i18n translation sweep (stat cards, table, badges)
- [x] **Dashboard Localization Retrofit (Tech-Debt Sprint)** — Promoted inline i18n pattern across the dashboard to a canonical `useI18n` hook (`src/lib/useI18n.ts`). Replaced every remaining hardcoded English string in `TokenWalletCard.client.tsx`, `TokenWalletCard.tsx` (server variant), `widgets/UbitSponsorWidget.tsx` (+ `EsignStatsWidget`), and `PremiumStatCard.tsx` with `tr("dashboard.*")` lookups. Fixed the undefined-`DIRECTION_LABEL` symbol bug in the client variant. Added 11 new translation keys (`wallet.time.*`, `wallet.status.*`, `wallet.no_wallet_*`, `wallet.balance_after_short`, `wallet.last_n_transactions_singular`) across all 7 locales with culturally-appropriate translations (en/es/zh-CN/zh-TW/ja/ko/zh). `LocaleSwitch` now mirrors selections into a non-HTTP-only cookie so server components reading `cookies()` resolve locale on first paint. `npm run build` clean against 27 routes.
- [x] **Tech-Debt Cleanup Sprint (2026-07-03)** — continuation of the above. Modal retrofit (`SponsorshipCheckoutModal.tsx` — 18 `sponsorModal` keys × 7 locales wired through `useI18n`), `ShareToHelpButton` (8 `dashboard.share.*` keys + 7 tr-calls), `LiveTimer` migrated off its internal `t()` onto the shared `useI18n` hook (removed 57 lines of duplicated scaffolding; `formatHms` now returns `{h,m,s}` parts formatted per-locale via `dashboard.timer_format`). `AnimalTable` CSS hardening: `whitespace-nowrap` on Euth. Risk / Medical / Actions `<td>`s, `min-w-[180px]` floor on Legal Status `<td>`, `min-w-0 max-w-full overflow-x-auto` on the wrapper `<motion.div>`, `min-w-max` on the `<table>` itself — all to fix CJK pill crush and final the horizontal scroll. `dashboard.medical.*` namespace added (fixes a Path-misplacement bug from the 2026-07-02 retrofit where keys landed at top-level `medical.*` instead of `dashboard.medical.*`). `LiveTimer` math clamp: `remainingMs = Math.max(0, rawRemainingMs)` and removed `Math.abs()` from `formatHms` — overdue states now hard-stop at `0h 00m 00s` instead of counting upward indefinitely. Comprehensive CHANGELOG entry under `## 2026-07-03` with 9-round retrospective.
- [ ] Charleston compliance geo-map
- [ ] Stray hold expiration forecast

### Epic 2 — Viral Token & Brand Sponsorship Gateway: Foundations
- [x] **Prisma v6 lock-in** — single v6.19.3 client chain; v7 workspace conflicts resolved (commits `20853b9`, `96a0e0a`)
- [x] **`MOCK_USERS.id` strict v4 UUIDs** — admin `d290f1ee-…`, staff `a77484df-…` (commits `c8095dd`, `96a0e0a`)
- [x] **`SignOutButton` + dashboard injection** — escape hatch for ghost session cookies (commit `c17c219`)
- [x] **`TokenWalletCard` (server + client) on dashboard** — pull-paginated ledger, ambient refresh on `tokenwallet:refresh` (commit `db714d6`)
- [x] **`TestEarnButton` dev affordance** — env-gated (`NODE_ENV !== "production"`) test button for verifying the EARN pipeline end-to-end (commit `db714d6`, retired in `c0c3466`)
- [x] **`prisma/seed.mjs`** — populates `admin@/staff@rescuehub.org` in Neon with the canonical v4 IDs (commit `a09db14`)
- [x] **End-to-end click verified** — button award → 50 tokens → wallet bumps without page reload → `$transaction` atomic in Neon
- [x] **`POST /api/animals/intake`** — atomic Animal + IntakeRecord insert + +50 onboarding bonus (commit `c0c3466`)
- [x] **Closed viral-share loop** — `/api/shares` → row + tracking URL → `/p/<shareId>` landing mints +5 via `awardShareReward` with in-memory `(shareId, ip)` rate limit; `ShareToHelpButton` wired into `AnimalTable` (commits `3c5ffaa`, `f8f25b6`)
- [x] **`awardIntakeBonus` / `awardShareReward` / `awardReferralConverted` (stub) / `awardVolunteerHour` (stub)** in `lib/services/tokenService.ts` — all atop `processTokenTransaction` (commit `c0c3466`)

### Epic 2 — Environment & Database Hardening
- [x] **Prisma v6/v7 workspace hoisting conflict resolved** — single v6.19.3 chain, `npm rebuild` to re-emit WASM/query-engine binaries dropped during the v7 churn
- [x] **Turbopack import alias resolution restored** — removed `output = "..."` from `prisma/schema.prisma`, all `@/generated/prisma` imports migrated to canonical `@prisma/client`
- [x] **Neon PostgreSQL connection** — `frontend/.env` populated with `DATABASE_URL`, `prisma generate` resolves cleanly
- [x] **Legacy TS / Zod v4 API mismatches patched** — `err.issues`, `z.record(z.string(), z.unknown())`, body-spread null-guard, removed phantom `lifetimeRefunded`, fixed `Prisma` namespace-as-type, fixed `expireTokens()` missing `currency`
- [x] **`npm run build` clean compile** — `✓ Compiled successfully in 7.6s` against current schema; `/api/tokens/transaction`, `/api/tokens/wallet`, `/dashboard` all compiled

## 🚀 In Progress

- [ ] **Build Premium 2D CSS Animal Mesh Gradient for Hero Section** — Replace archived 3D WebGL with a pure CSS animated gradient mesh

### Phase 6: Medical Intake Module
- [ ] `<MedicalIntakeChecksheet />` component scaffolding
- [ ] ASPCA TPR (Temp/Pulse/Respiration) form wireframe
- [ ] Emergency signs conditional flags (UI only)
- [ ] Medical file linking to animal record

## 🔶 Archived / Blocked

### 3D WebGL Hero
- [x] Rescue Network constellation built with Three.js/R3F
- [x] Central liquid-silver globe + orbiting glass animal nodes
- [x] Constellation lines, orbital rings, starfield, mouse-follow tilt
- [ ] **Blocked**: Next.js CSS/SSR height collapse conflicts with R3F Canvas prevented reliable rendering
- [ ] **Archived**: Code on `archive/3d-webgl` branch — replace with premium 2D CSS solution