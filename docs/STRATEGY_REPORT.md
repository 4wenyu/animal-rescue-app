# RescueHub — Product Design, Mobile Strategy, MVP Launch & Product Refinement Report

**Author:** AI agent (docs-compliance review)
**Date:** 2026-08-23
**Scope:** Items 0, 4, 5 of the product brief — design/theming & mobile app, MVP go-live strategy, and product refinement of the original AI-Agent concept.
**Status:** Strategic recommendation — no code changes in this report (separate from the applied fixes).

---

## 0. Product Design, Theme & Mobile App Strategy

### 0.1 Design principles for an animal-rescue non-profit

Animal rescue platforms face a unique audience: **anxious pet owners** (lost pet), **compassionate adopters**, **shelter staff** (intake officers, medical, admin), and **corporate sponsors**. The UI must balance three tensions:

1. **Empathy over efficiency** — a person reporting a lost pet is in distress. The experience must feel calm, supportive, and hopeful, not like a bureaucratic form.
2. **Urgency with dignity** — euthanasia-risk animals need "urgent" signals without feeling like doom-scrolling. Use time-based urgency honestly, always paired with an actionable step (donate / share / foster / adopt).
3. **Compliance without intimidation** — legal surfaces (ESIGN waivers, IRC § 513(i) sponsor acknowledgment, Hayden Act hold tracking) must be present and accurate, but phrased human-first.

The current app already does several things right (emerald identity, gradient hero, rounded cards, live timers, clean Tailwind system). The recommendations below are **refinements, not a redesign**.

### 0.2 Color & visual identity

| Aspect | Current | Recommendation |
|---|---|---|
| Primary | Emerald (#10B981 / #059669) | **Keep emerald as the trust/action color.** It reads "life, health, growth" and is the rescue-sector norm (ASPCA green family). |
| Secondary accent | none consistent | Introduce a **warm amber/peach (#F59E0B → #F97316)** for "urgent but hopeful" moments (euthanasia-risk badges, hold countdowns, sponsor callouts). Amber already exists for AT_RISK — make it systemic. |
| Danger | Red (#EF4444) | Reserve strictly for IMMEDIATE_BEHAVIORAL / legal-lock / overdue-hold states. Never decorate with red. |
| Neutrals | Slate | Keep slate; ensure AA contrast on body text (slate-600 on white is ~4.5:1 — verify). |
| Brand accent | — | Add a single **cobalt/trust blue (#3B82F6)** for "search / find" actions (lost-pet search) to differentiate from adopt (emerald) and urgent (amber). |

**Theme implementation guidance (current Tailwind v4):**
- Define semantic tokens via CSS variables (e.g. `--color-action`, `--color-urgent`, `--color-find`) in the Tailwind v4 theme, then reference `bg-action` etc. This keeps the "no inline CSS" rule and makes a dark-mode pass trivial later.
- Provide a **high-contrast / reduced-motion mode** for accessibility and for older shelter terminals.

### 0.3 Typography, imagery & layout

- **Type:** A humanist sans (e.g. *Inter* or *Plus Jakarta Sans*) for UI, paired with a warm display face for hero/headlines (e.g. *Fraunces* or *Lora* serif) to evoke warmth and trust. Limit to 2 families.
- **Imagery:** Real shelter photos of the actual animals (not stock) — this is the single highest-converting element in rescue adoption. Always show the animal, never a placeholder icon, when a photo exists. For lost-pet searches, a photo + last-seen map dominates.
- **Layout:** Card-based (already present). On mobile, thumb-zone primary actions; on desktop, a persistent "rescue ticker" (recent intakes / urgent animals) for staff.

### 0.4 Accessibility & compliance (WCAG)

- Target **WCAG 2.2 AA**: contrast, focus rings, reduced motion, screen-reader labels on all icon buttons.
- The AboutNav/Select components added in this pass already include `aria-haspopup`, `aria-expanded`, `role="menu"`, native `<select>` (keyboard + SR native) — keep this bar.
- Legal/medical text (waiver, medical checksheet) must remain selectable and not truncated.

### 0.5 Mobile app — how to get into the Apple App Store & Google Play

The current product is a **Next.js web app**. The recommended path is a **React Native / Expo app** that wraps the existing API, not a from-scratch rewrite.

**Recommended stack: Expo (managed) + React Native**
- **Why Expo:** OTA updates (Expo Updates) — you can ship web fixes to mobile users without store review for JS changes; managed workflow handles native modules; EAS Build compiles both stores.
- **Why React Native over native:** one codebase, one team, shares TS types and the token/i18n logic conceptually. (Note: Expo now supports React Native Web too, but the web should stay Next.js — it's already excellent; the RN app targets stores.)
- **What NOT to rewrite:** the API, Prisma/Neon data layer, auth, and business logic all stay server-side and are consumed over HTTPS. The mobile app is a **client** over the same endpoints.

**Store readiness checklist:**
1. **Apple Developer Program** ($99/yr) + **Google Play Console** ($25 one-time). Create org accounts (not personal) with the non-profit's EIN.
2. **App icons, splash, adaptive icons** — 1024px master, all sizes auto-generated by Expo.
3. **Privacy policy URL** (required by both stores) — point to the `/about/privacy` page created in this pass. Include data categories, third-party SDKs (Google auth, analytics), and data-deletion mechanism.
4. **Account/sign-in:** support email+password (already have next-auth credentials) + **Sign in with Apple** (required if offering any third-party login) + **Google Sign-In**. Apple review rejects apps with 3rd-party login but no Apple login.
5. **App Store Connect metadata:** screenshots (6.7" + 6.1" + iPad), description, keywords, age rating (4+), content rating (no user-generated-content toggle concerns if it's a search/adopt tool), in-app-purchase disclosure if tokens ever become purchasable.
6. **Google Play Data Safety form** + **Play Console app content** (ad policy if sponsored content shows).
7. **Non-profit consideration:** Apple's App Store Small Business Program (15% commission) and Google's service-fee policies — for a 501(c)(3) the token economy should be structured as service/acknowledgment, not IAP, to avoid 30% IAP fees (see 4.4).

**Phased mobile rollout:**
- **Phase A (web, current):** keep polishing web — it is the fastest distribution channel (link sharing, no install barrier).
- **Phase B (MVP app):** Expo app with 4 screens — **Home/Adopt**, **Find My Pet** (chat intake), **Wallet/Tokens**, **Dashboard (staff)**. Ship to **TestFlight + Play internal testing** first with the pilot shelter.
- **Phase C (v1 store launch):** public App Store + Play release.

**Native-feature opportunities (roadmap):**
- Push notifications: lost-pet radius alerts (the Epic 3 geolocation backlog), adoption-match alerts.
- Camera: photo of lost pet (upload to the search), cage-card OCR on device.
- Location services: last-seen coordinates for radius search.
- Deep links: `/p/[shareId]` and `/radar/[searchId]` deep links into the app (share-loop reachability on mobile).

### 0.6 High-quality-product enhancements (any platform)

1. **Hero actions → two clear jobs:** "I lost a pet" (search) and "I want to help" (adopt/foster/donate) — the two customer types never compete.
2. **Adoption feed with real photos + live "still available" badges** — prevent the heartbreak of adopting an animal already gone.
3. **Progress/status timeline** for a search: "Searching → Matching found → Resolved" (LostPetSearch status already exists: SEARCHING/FOUND/CANCELLED — surface it).
4. **Sponsor storytelling** that feels generous, not ad-like (IRC § 513(i) neutral acknowledgment — the current modal copy already walks this line; keep it value-neutral).
5. **Empty/loading/error states everywhere** — a polished product is judged by its empty states.
6. **Analytics with consent:** privacy-first analytics (e.g. PostHog or Plausible self-hosted) + consent banner aligned to the privacy policy.

---

## 4. MVP Go-Live Strategy

### 4.1 What the MVP actually is

A lean, shippable slice that proves the core loop end-to-end and is safe for a single pilot shelter:

> **"A lost pet is reported via chat → a token-funded search starts → results stream to a radar page → shares mint tokens → a sponsor acknowledgment underwrites the spend."**

**In scope (already mostly built):**
- Public pages, login, dashboard, intake (surrender + public), medical, fundraising, hold-profile, About section (now complete).
- Token wallet + ledger, sponsor gateway modal (+50 credit / −100 spend), viral-share loop (`/api/shares`, `/p/[shareId]`), chat-intake agent, LostPetSearch persistence, radar view.
- Hold-time regulations engine (jurisdiction-aware).

**Out of scope for MVP (blocked/deferred):**
- Live autonomous social-media outreach agent (Epic 3 geolocation/SMS + crawling) — design only.
- Real payment processing (Stripe) — tokens are earned/credited, not purchased yet.
- Full multi-org multi-tenant admin.
- Mobile apps (Phases B/C above).

### 4.2 Readiness checklist — current gaps to close before launch

| Area | Status | Action |
|---|---|---|
| **Production build** | ✅ Green | Keep CI (`npm run build` + `npm run lint`) gating merges. |
| **Type errors** | ⚠️ 4 pre-existing | Fix `intake/public` STRAY comparison, `chat-intake` WirePart message types, `shares` spread type. |
| **Lint debt** | ⚠️ 57 errors / 24 warnings | Dedicated sweep (FloatingChatbot, LostPetAgent, MedicalIntakeChecksheet, test-upload). Not launch-blocking but risky for regressions. |
| **Secrets/env** | ⚠️ | `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` referenced but absent from env files — the `/api/telegram/notify` route is effectively dead. Add real creds or gate the route. `CHAT_INTAKE_USE_MOCK` should be off in prod with the Gemini key present. |
| **Auth** | ⚠️ | MOCK_USERS only (hardcoded admin/staff). Replace with real user provisioning + role-based admin before launch. |
| **Hosting** | ⚠️ | Next.js on Vercel (recommended; Turbopack + serverless route support) or a Dockerized Node deploy. Neon Postgres already external — good. |
| **Data** | ⚠️ | `dogs.json` is mock. Move to DB-backed animals with real shelter sync. |
| **Privacy/legal** | ✅ | Privacy/Terms pages now exist; consent flows in waivers. |
| **Monitoring** | ❌ | Add error tracking (Sentry) + uptime (betterstack/statuspage) + structured logging. |
| **Seed/onboarding** | ⚠️ | Write a production seed (real org, real jurisdiction, real sponsor) — current seed uses `00-0000000` EIN and demo org UUID. |

### 4.3 Infrastructure recommendation

- **Host:** Vercel for the Next.js app (route handlers + proxy already work there; static pages fast). Alternate: Railway/Render Docker.
- **DB:** Keep Neon Postgres (already in use). Add connection pooling (pgbouncer-style via Neon) and automated backups + point-in-time restore.
- **Object storage:** S3/R2 for cage-card scans and photos (the `documentSnapshotUrl` field is currently unused).
- **Secrets:** Vercel env vars / a secrets manager; rotate the Gemini key; never commit `.env*`.
- **CI/CD:** GitHub Actions: `lint → build → prisma migrate deploy → deploy`. Add a migration guard (schema diff) to catch the class of drift fixed in this pass.
- **Analytics/errors:** PostHog (or Plausible) + Sentry + Vercel Analytics.

### 4.4 Legal, compliance & payment structure (critical)

- **Non-profit status:** if 501(c)(3), keep the **token/sponsor model value-neutral** (IRC § 513(i) QSP safe harbor) — sponsor acknowledgment must NOT be ad-remuneration. The code comments already encode this; keep the discipline.
- **Donations vs tokens:** real donations should go through a registered donation processor (Stripe Donations / PayPal Giving Fund / Classy) with receipting. **Do not sell tokens via App Store IAP** (30% fee + policy issues); structure the fee model as: (a) earned tokens (share/sponsor-view) — free, (b) paid search — a real donation/gift to the org, not a token purchase.
- **ESIGN/UETA:** already implemented (typed-name + SHA-256 hash). Add server-side signing timestamp + non-repudiation audit row.
- **Hayden Act / stray holds:** hold engine added; keep the strict rule that **euthanasia is blocked until hold cleared**, enforced server-side (currently surfaced in UI + hold-profile).
- **GDPR/CCPA:** privacy page exists; add data-export + deletion endpoints before EU/CA users.
- **Insurance/BSL:** `breedDesignation` "Mixed Breed" default and BSL suffix logic already mitigate breed-discrimination liability — keep.

### 4.5 Launch plan (phased)

1. **Phase 0 — Internal pilot (2–4 weeks):** one municipal shelter + 3 volunteer admins. Turn off MOCK auth, load real org/jurisdiction, run daily intake + one real lost-pet search. Collect feedback on chat-intake accuracy and the sponsor modal.
2. **Phase 1 — Public soft launch (4–6 weeks):** public pages + share loop live; invite local rescue groups to share. Goal: 5–10 shelters/orgs, 1,000 monthly sessions, 50 searches, 3 sponsor acknowledgments. Measure: activation (login→first action), search completion, share-to-token conversion.
3. **Phase 2 — Token economy hardening:** add real sponsor onboarding, ledger reporting (UBIT), fraud guardrails on the share loop (the `(shareId, ip)` dedup already exists — extend with rate limits + abuse monitoring).
4. **Phase 3 — Mobile:** Expo app (TestFlight → stores) as described in 0.5.
5. **Phase 4 — Autonomous outreach (Epic 3/4):** geolocation radius alerts + SMS/Telegram (wire real creds), then the shelter crawler.

### 4.6 Go-live KPIs

- Activation rate (sign-in → first real action) ≥ 50%.
- Lost-pet search completion (chat → broadcast) ≥ 40%.
- Share-loop: shares per search ≥ 10; token mint fraud rate < 1%.
- Hold-compliance: 100% of euthanasia/transfer actions blocked until hold cleared (audit log).
- i18n: 0 missing keys across 7 locales (currently true).
- Availability ≥ 99.9% post-launch; P95 page load < 2.5s.

---

## 5. Product Refinement — from the original AI-Agent record

### 5.1 Map the original vision to today's build

| Original idea (record) | Status in code | Gap |
|---|---|---|
| Help owners find lost pets across the internet | Partial: chat-intake collects details; `LostPetSearch` persists; radar shows a mock feed | **No real internet-wide search / crawler yet** (Epic 4) |
| Help shelter cats/dogs (and rabbits, turtles, small animals) facing euthanasia find adopters | Adoption feed + fundraising + medical exist; **species taxonomy now covers dog/cat/rabbit/turtle/bird/small_mammal/reptile/fish** | No adoption/shelter-sync of real inventory |
| Core agent is **autonomous** | Chat agent is conversational but **reactive**, not autonomous | Needs the autonomous outreach engine |
| Agent scours social media to find animal lovers | ❌ not built | Epic 3 — design only |
| Agent analyzes posts/blogs/images/videos to qualify animal lovers | ❌ not built | Epic 3 — Gemini vision/embedding analysis |
| Agent proactively DMs at-risk animals, asks for donation/foster/adopt/share | ❌ not built | Epic 3 — DM templates + sponsor-marked cards |
| **Viral exponential sharing** (influencers share/retweet) | ✅ Share loop + `/p/[shareId]` + +5 landing reward, dedup | Works; extend to DM/share buttons on mobile |
| **Pay a fee OR share to 10 groups for free search** | ✅ Sponsor-gateway: +50 credit (sponsor view) then −100 spend; the "share 10 groups" alternative is the share loop | Clarify the "10 groups" as the free path and make it measurable (count shares → grant) |

### 5.2 Where the original idea needs sharpening (recommendations)

1. **The "free search via 10 shares" needs an explicit, measured path.** Today a user can earn +50 by watching a sponsor and then pays 100 — but the *share-to-earn* route isn't a first-class "share 10 → free" promise. **Recommendation:** add a "Free search" progress widget (shares_completed / 10) tied to the wallet; grant the −100 spend when the share counter hits 10. This directly encodes the original pitch and is a strong growth mechanic.

2. **Autonomous outreach must be staged to stay legal & humane.** Blindly DMing strangers is spammy and against platform ToS (and can backfire on the brand). **Recommendation:** start with **public opt-in** (pet-lovers who visit the site/join the community), then a **respectful, low-volume DM campaign** with clear "unsubscribe", then only later the fully autonomous social-media analysis. Gate each stage behind human review and analytics on reply/click rates.

3. **The "animal lover qualification" should reuse the existing AI assets.** The chat-intake agent + Gemini already do structured extraction. Extend the same pattern to **cage-card OCR** (already scaffolded in `/intake/document-scan` + `BatchUpload`) and **lost-pet photo matching** (image embeddings) — this is higher ROI than social-media scraping for MVP+1.

4. **Phone calls (from the original idea) — defer, with a plan.** Voice is high-trust but heavy. **Recommendation:** build a **call-back request** (user leaves a number, agent/volunteer calls back) before investing in realtime voice AI. Realtime voice (e.g. Gemini Live / Twilio Voice) is a Phase-4 candidate, not MVP.

5. **Small-animal inclusion is now real** (rabbits, turtles, birds, small mammals, reptiles, fish) — make it visible: the intake/search species dropdowns now list them, but the adoption feed and medical flows still assume dog/cat in places. Extend species-awareness across: cage-card parsing, medical checksheet, fundraising default goals, and radar content.

6. **Turn the token economy into a story, not a chore.** The sponsor-gateway modal is compliant; make the "why" visible: "Chewy helped fund 1 lost-pet search" with a running counter (UBIT-safe acknowledgment). This converts sponsors into storytelling partners.

### 5.3 Prioritized roadmap (recommendation)

- **Now (MVP close):** real auth, real data, kill mock; fix 4 tsc + top lint errors; wire Telegram creds; add Sentry; CI gates.
- **MVP+1 (growth):** share-to-free widget (10 shares), lost-pet photo matching, adoption-feed photo-first redesign, analytics consent, data-export/deletion endpoints.
- **MVP+2 (mobile):** Expo app (Home/Adopt, Find My Pet, Wallet, Staff), push notifications, deep links, TestFlight → stores.
- **MVP+3 (autonomous):** opt-in community + low-volume DM outreach; geolocation radius alerts + SMS/Telegram; sponsor-marked DM templates.
- **MVP+4 (wide-net):** shelter API crawler (Petfinder/Shelterluv/municipal), match engine against active LostPetSearch rows, auto-match alerts.

### 5.4 Success metrics tied to the mission

- Fewer preventable euthanasias (per shelter, reported by orgs).
- Faster median time-to-adopt and time-to-resolve for lost pets.
- Higher share reach (impressions/mentions) per at-risk animal.
- Sponsor funds actually underwriting searches (UBIT-compliant attribution).

---

## Appendix A — Suggested doc structure for the Obsidian vault

- `docs/STRATEGY_REPORT.md` (this file)
- `docs/design-tokens.md` (color/type tokens for Tailwind v4)
- `docs/mobile-app.md` (Expo/EAS/store checklist, expanded from §0.5)
- `docs/mvp-launch-checklist.md` (expand §4.2 into a tracked task board)
- `docs/product-refinement.md` (the §5 mapping as a living gap tracker)
- `docs/code-reviews/` (existing empty folder — this review's notes belong here)

---

*This report is strategic guidance. Items 0/4/5 do not modify code; the code fixes from the review (About section, hold-time engine, taxonomy, build/lint blockers, schema reconciliation) are separate and already applied.*
