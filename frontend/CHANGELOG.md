# Changelog

## 2026-06-18 — Epic 2 Environment Hardening: Prisma v6 Lock-In & Neon DB Connect

### Fixed
- **Prisma v6/v7 workspace hoisting conflict** — npm workspace had silently installed Prisma 7.x at `animal-rescue-app/node_modules` while the project's `package.json` requirement was met by 6.x hoisted under `frontend/node_modules`. The two-clients mix caused `npx prisma generate` to fail with "Could not resolve @prisma/client" because Prisma 7's CLI looked at root, where the v7 client didn't expose `library.js`. Cleaned to a single v6.19.3 chain (`npm install @prisma/client@6 prisma@6`) and added `npm rebuild @prisma/client prisma` to re-emit WASM/query-engine binaries that got dropped during the v6/v7 churn.
- **`prisma-client` provider required an output path** — the v6 "new" generator (`provider = "prisma-client"`) refuses to generate with no `output` set, contradicting the usual "remove `output` to default to `node_modules`" workflow. Flipped the provider back to legacy `provider = "prisma-client-js"` so `@prisma/client` resolves out of `node_modules/.prisma/client` with no schema path gymnastics.
- **Turbopack import alias resolution broken for `@/generated/prisma`** — the previous setup emitted Prisma client to `frontend/generated/prisma` and made every importer (`lib/prisma.ts`, `lib/services/tokenService.ts`) reference that alias. Turbopack (Next.js 16's bundler) could not resolve `@/generated/prisma` consistently across hot-reload boundaries, causing intermittent "Module not found" crashes. Switched **all** Prisma imports to the canonical `@prisma/client` package and removed `output = "..."` from `prisma/schema.prisma` entirely. Module resolution is now bulletproof.
- **Neon PostgreSQL connection** — created `frontend/.env` with `DATABASE_URL` placeholder pointing at Neon, added `url = env("DATABASE_URL")` to `prisma/schema.prisma` datasource block (required by Prisma 6.x validator, no longer implicit from `prisma.config.ts`), `prisma generate` now resolves cleanly against the remote-DB URL format.
- **Legacy TypeScript / Zod v4 API mismatches that surfaced after the alias fix** —
  - `err.errors.map(...)` → `err.issues.map(...)` (zod v4 renamed the field)
  - `z.record(z.unknown())` → `z.record(z.string(), z.unknown())` (zod v4 requires explicit key+value shapes)
  - `body: unknown` then `{ ...body }` spread — TS forbade it; tightened parse to `Record<string, unknown>` with null-rejection guard
  - `lifetimeRefunded: true` in wallet SELECT — column doesn't exist on `TokenWallet` (schema is `lifetimeEarned | lifetimeSpent | lifetimeExpired` only)
  - `Prisma` namespace used as a TS *type* annotation — TS2709; switched to `PrismaClient` class for the singleton type while re-exporting `Prisma` so consumers can still write `Prisma.TokenAction` etc.
  - `expireTokens()` missing required `currency` field per `TokenTransactionDataSchema` — added `"USD"` default to the helper

### Verification
- `npm run build` → `✓ Compiled successfully in 7.6s` against the current schema
- `node -e "require('@prisma/client')"` confirms `PrismaClient`, `Prisma` namespace, `TokenAction`, `TokenDirection` enum all resolve from the package
- Routes compiled: ƒ `/api/tokens/transaction`, ƒ `/api/tokens/wallet`, ○ `/dashboard`

## 2026-06-17 — Auth Hardlock, Gemini 2.5 Migration & Bulletproof BatchUpload

### Fixed
- **NextAuth domain mismatch (root cause of `CredentialsSignin`)** — `app/api/auth/[...nextauth]/auth.ts` `MOCK_USERS` were `admin@rescuehub.com` / `staff@rescuehub.com` with password `password123`, but the `/login` page UI advertised `admin@rescuehub.org` / `admin123`. Updated mock users to `.org` with role-matched passwords (`admin123` / `staff123`) so the login UI hint and the credentials provider agree. Updated the Credentials provider's `placeholder` to match. ENV was not the issue — `AUTH_SECRET` was already present in `.env.local`.
- **NextAuth v5 `authorized` contract violation** — The callback was returning a bare `Response.redirect(redirectUrl)`, which is invalid for NextAuth v5's `authorized` hook (must return `boolean` or `NextResponse`). Switched to `return false`. Gating actually happens in `proxy.ts`, which calls `auth()` directly and returns a proper `NextResponse.redirect`, so this callback is now a safe permission fence rather than a malformed handler.
- **Gemini model deprecation 404** — `app/api/shelter/intake/map/route.ts` model id migrated from the unreachable `gemini-3.5-flash` → through the deprecated `gemini-1.5-flash` → final canonical `gemini-2.5-flash`. Live verified end-to-end via `test-upload.ts` on `test-cage-card.jpg` returning `200 OK` with a valid schema-shaped response.
- **AI SDK v6 `ImagePart` typing** — The route was passing `image: base64String` and a sibling `mimeType`, but v6's `ImagePart` type does not accept `mimeType` separately. Embedded the MIME into a `data:<mime>;base64,<payload>` URL inside `image`, and added `type: "image" as const` so the discriminated union narrows correctly. Caught by `tsc strict`; would have caused a 500 at runtime.
- **BatchUpload silent empty-state failure** — When the API returned zero extracted records (e.g. photo with no readable intake text), the UI gave no feedback. Added a yellow `bg-amber-50` info alert: *"No intake records detected in these documents."* Suppressed on initial page load via `hasAttemptedSubmission` flag so it only appears after a real run.
- **BatchUpload queue cleanup on partial failure** — A single bad file used to abandon already-completed extractions and leave the spinner stuck. Wrapped each per-file upload in its own inner `try/finally`, drained the file from staging on every exit path, skipped the trailing 2-second delay after the last file, and gated clear-all cleanup on a `succeededCleanly` exit flag.

### Changed
- **Intake Hub → 3-card grid** — `app/(main)/intake/page.tsx` now renders three cards (Public Surrender Portal, Staff Medical Intake, AI Document Scan). Switched grid breakpoints from `sm:grid-cols-2` → `lg:grid-cols-3` so the layout scales appropriately on wider screens.
- **Intake layout widened** — `app/(main)/intake/layout.tsx` max-width grew from `max-w-2xl` → `max-w-4xl` to give the BatchUpload UI room. Refactored the ESIGN/UETA legal banner out into `src/components/intake/IntakeLegalBanner.tsx`, a client component using `usePathname()` that auto-hides on staff-only routes (currently `/intake/document-scan`).

### Added
- **`PetIntakeBatchSchema` (Zod)** — `lib/schemas/intake.ts`. Outer wrapper with `animals: z.array(PetIntakeSchema).min(0)` plus the per-animal `PetIntakeSchema` covering name, species, breed, age, sex, weightLbs, medicalStatus, `euthanasia_risk_status` enum (SAFE / AT_RISK / IMMEDIATE_BEHAVIORAL), `statutoryHoldCleared`, `intakeTimestamp`, intakeNumber, notes. All fields are `.describe()`-ed so the AI SDK can use them as part of the prompt contract. Field set mirrors `data/dogs.json` so extracted records flow directly into the adoption pipeline.
- **`BatchUpload` drag-and-drop component** — `src/components/intake/BatchUpload.tsx`. Accepts images (JPEG, PNG, WEBP, HEIC) + PDFs, loops files through `FormData`, POSTs to `/api/shelter/intake/map`, gracefully displays extracted records as AnimalCards (Name, Species, Breed, Age, Sex, Medical, Hold Cleared, Notes, Intake #), color-coded risk badges per IRC § 513(i), 2-sec rate-limit delay per file, yellow empty-state alert.
- **Intake Document Scan staff route** — `app/(main)/intake/document-scan/page.tsx` mounts `<BatchUpload />` with a header + Back link. Staff-only landing for bulk AI extraction. Wired into the intake hub as the third card.
- **`IntakeLegalBanner`** — `src/components/intake/IntakeLegalBanner.tsx`, pathname-aware suppression of citizen-flow ESIGN notice on staff routes.
- **`test-upload.ts` harness** — automated end-to-end check that POSTs `test-cage-card.jpg` to the extraction route and prints the JSON response. Used as a regression check whenever the route or schema changes.

## 2026-06-13 — Phase 4: NextAuth Auth, 3D WebGL Hero & Phase 5 Compliance Widgets

### Added
- **NextAuth v5 authentication** — CredentialsProvider with mock ADMIN/STAFF users. JWT callback injects role into token; session callback exposes role on client. Login page at `/login`.
- **Route protection** — `proxy.ts` guards `/dashboard/*`, `/intake/*`, `/medical/*` via `auth()` call, redirects unauthenticated to `/login`.
- **Intake Hub** — `/(main)/intake/page.tsx` with two premium selection cards: Public Surrender Portal and Staff Medical Intake.
- **Medical Intake scaffold** — `/(main)/intake/medical/page.tsx` placeholder card for Phase 6.
- **Hero3D WebGL component** — Three.js "Rescue Network" constellation: central liquid-silver globe, orbiting glass animal nodes, constellation lines, orbital rings, mouse-follow tilt. **Archived to `archive/3d-webgl` branch** due to Next.js CSS/SSR height collapse conflicts with R3F Canvas.
- **Phase 5: Compliance Dashboard Widgets** — `UbitSponsorWidget` (IRC § 513(i) revenue bars: $42.5K sponsorships vs $18.2K donations) and `EsignStatsWidget` (100% compliance, 342 active hashes) injected side-by-side above the AnimalTable.
- **Dashboard i18n translation sweep** — Full translation keys for all dashboard stat cards, table columns/headers/badges/buttons, and compliance footer across en/es/zh.

### Fixed
- **Sidebar hydration error** — Added `isMounted` state guard with `FALLBACK_LABELS` English defaults, preventing `localStorage` SSR/CSR mismatch.
- **ESIGN type error** — Corrected prop name from `onComplete` to `onSigned` (the component's actual API), added required `surrenderType` prop.
- **3D Canvas black void** — Wrapped Canvas children in `<Suspense fallback={null}>`, set `alpha: true` on gl config.
- **Z-index stacking** — Replaced negative z-index with explicit `z-0` / `z-10` stacking via parent wrapper divs.
- **Intake 404** — Moved hub into `/(main)` route group; created `/(main)/intake/medical/page.tsx`.
- **3D height collapse** — Applied `style={{ width: '100%', height: '100%' }}` to Canvas, brute-force `h-[85vh]` on hero section.

## 2026-06-12 — i18n Localization, Live Timer Hydration Fix & Resilient Sponsor Logos

### Fixed
- **LiveTimer SSR/CSR hydration mismatch** — Added `isMounted` state guard in `LiveTimer.tsx`. The component returns a muted placeholder (`--`) during server render and initial client render, then mounts the real ticking clock on the next render cycle. Eliminates the React hydration error caused by `Date.now()` differences between server and client.

### Changed
- **Comprehensive i18n localization** — Wired the Sidebar navigation labels (`nav.public_portal`, `nav.dashboard`, `nav.intake`, `nav.medical`, `nav.fundraising`) through the shared `t()` function with locale-change event listener. Sidebar now responds instantly to language switches via the LocaleSwitch component.
- **Breed and medical status translations** — Added 12 breed keys and 2 medical status keys to all three locale dictionaries (en, es, zh). Adoption cards in `app/page.tsx` now render `tr("breeds.{breed}")` and `tr("medical.{status}")` instead of raw English.
- **Clock labels localised** — `LiveTimer.tsx` now uses `t("clock.hold_cleared")`, `t("clock.stray_hold_active")`, `t("clock.hold_overdue")`, `t("clock.remaining")`, `t("clock.legal_action_required")` with full Spanish and Chinese translations.
- **True ticking countdown** — `LiveTimer.tsx` rewritten with `setInterval(..., 1000)` for per-second repaints. Output format: `48h 12m 05s`. Massive amber warning box for active holds, pulsing red urgency box for overdue holds.
- **Dashboard LiveTimer** — `AnimalTable.tsx` Legal Status column replaced static `StrayHoldBadge` text with the `LiveTimer` component. Hayden Act animals retain the special LOCKED badge.
- **Resilient sponsor logos** — `app/page.tsx` SPONSORS array switched from Clearbit Logo API to Google Favicon API (`s2/favicons?domain=...&sz=128`) to bypass ad-blocker and CORS restrictions on localhost.
- **Adoption Broadcast i18n** — Count labels rewired to use `tr("adoption_feed.available", { count })` and `tr("adoption_feed.excluded", { count })` with proper variable interpolation across all three languages.

### Added
- **CHANGELOG.md** — Project changelog created.
- **Nav dictionary keys** — `public_portal`, `dashboard`, `intake`, `medical` added to `en.json`, `es.json`, and `zh.json`.
- **Clock dictionary section** — `clock.*` keys added to all three locale files with translations for "Hold Cleared", "HOLD OVERDUE", "Stray Hold Active", "remaining", and "overdue — legal action required".
