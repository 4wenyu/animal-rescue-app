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
- [ ] Charleston compliance geo-map
- [ ] Stray hold expiration forecast

## 🚀 In Progress

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