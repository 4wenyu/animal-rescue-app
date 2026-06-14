# Changelog

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