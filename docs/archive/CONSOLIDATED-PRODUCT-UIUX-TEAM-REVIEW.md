# RescueHub — Product, MVP & UI/UX Team Review

**Lead product/UX consolidation** of six specialist reviews (Product-Goals & Strategy · MVP Shippability · Hero & Visual Identity · Adoption Feed Conversion · Lost-Pet & Trust Flow · Staff Dashboard / Mobile / A11y / Modern Benchmark).
**Date:** 2026-08-23 · **Basis:** `ROADMAP.md`, `docs/STRATEGY_REPORT.md`, `docs/UI_UX_REDESIGN.md`, shipped `frontend/` code + `prisma/schema.prisma`, plus a direct verification that `PRODUCT.md` is an empty template (22 lines, all placeholder brackets). Read-only review; no code was modified.

---

## 1. Executive Summary

**What this product is FOR.** Per `ROADMAP.md` ("Autonomous AI Animal Rescue Platform") and STRATEGY §4.1's core loop, RescueHub exists to (a) **help owners find lost pets** — chat intake → token-funded search → radar → viral sharing — and (b) **rehome euthanasia-risk animals** — adoption feed, fundraising, medical — with a sponsor/token gateway (Epic 2) underwriting search costs, and an eventual autonomous outreach + wide-net search layer (Epic 3/4, today design-only). It serves four audiences (STRATEGY §0.1): **anxious lost-pet owners**, **compassionate adopters/fosters**, **shelter staff**, and **corporate sponsors**.

**Does the current build deliver a modern animal-rescue UX? Not end-to-end.** The *surface* is genuinely polished — a calm on-brand hero, photo-first feed infrastructure, honest time-based urgency, 7-locale i18n, a real append-only token ledger, and a real end-to-end viral share loop. But both customer journeys the mission rests on **dead-end**: a lost-pet owner cannot start a search (staff-gated, token-pre-funded, activation CTA hidden on mobile), and an adopter cannot adopt (view-only feed, hover-only CTA, compliance page served as the "profile"). The trust machinery is broken in places (fabricated radar "live" feed, mock text leaking into empathetic chat, stock photos presented as real animals, a fake "verified" badge, a cartoon as the sponsor message). The staff shell is not mobile at all, there are no `error`/`loading`/`not-found` states, and **`npm run build` currently fails**.

**Overall product-readiness grade: D+ — a credible, well-crafted prototype with a broken conversion core; NOT shippable to a pilot shelter as-is.** Per-surface grades from the specialist reviews:

| Review | Surface | Grade |
|---|---|---|
| 1 | Product-Goals & Strategy alignment | **C−** |
| 2 | MVP Shippability / go-live | **D** |
| 3 | Hero & Visual Identity | **B−** |
| 4 | Adoption Feed Conversion | **C−** |
| 5 | Lost-Pet & Trust Flow | **C** |
| 6 | Staff Dashboard / Mobile / A11y | **D** |

The strategy's own readiness table (§4.2) and launch plan (§4.5 Phase 0) already call out auth, data, secrets, seed, and monitoring as un-ready, and "turn off MOCK auth, load real org/jurisdiction" has **not** been executed. With a focused ~1–2 week sprint on the Top 8 must-fixes (§5) — starting with the build and the lost-pet/adoption unlock — this reaches a credible **Phase-0 pilot B**. The architecture is right; most fixes are small and well-understood.

---

## 2. Product-Goals & Strategy Findings

### 2.1 Original-idea map (STRATEGY §5.1 rows → shipped reality)

| Original idea (§5.1) | Shipped reality | Gap |
|---|---|---|
| Help owners find lost pets across the internet | Chat-intake agent, `LostPetSearch` persistence, `/radar/[searchId]` payoff | No real crawler (Epic 4, unbuilt) — **and the whole flow is staff-gated + token-pre-funded** (Critical) |
| Rehome cats/dogs + rabbits/turtles/small animals facing euthanasia | Public adoption feed with risk badges + timers, fundraising, medical, hold engine | No real inventory (all mock dogs, **no `species` field in data**), no adoption/interest submission, no shelter sync |
| Core agent is **autonomous** | Chat agent is conversational but strictly **reactive** | The entire autonomous layer (no worker/scheduler/loop) |
| Scours social media to find animal lovers | — | ❌ Not built |
| Analyzes posts/blogs/images/videos to qualify animal lovers | Photo upload accepted in chat intake | No qualification/embedding/vision engine |
| Proactively DMs at-risk animals (donate/foster/adopt/share) | Only `/api/telegram/notify` — an intake-ops alert that is **dead** (no `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` in either `.env`) | DM templates, sponsor-marked cards, opt-in community, campaign engine |
| **Viral exponential sharing** | ✅ Real: `/api/shares` → `/p/[shareId]` → +5 mint, rate-limited per `(shareId, ip, 24h)`, wired into the table | Dedup is **in-memory (dev-only)**; rows stay `PENDING` forever (verifier cron is "future") |
| **Pay a fee OR share to 10 groups for free search** | Sponsor-gateway: +50 `SPONSOR_VIEW_CREDIT_EARN` → −100 `LOST_PET_SEARCH_SPEND` | "Share 10 → free" is **not measurable** (no counter, no grant at 10); Stripe pay path unbuilt; pre-flight `balance + 50 ≥ 100` blocks fresh users |

### 2.2 Findings

| Severity | Area | Issue | Fix |
|---|---|---|---|
| **Critical** | Lost-pet flow (mission) | The flagship job — the anxious owner reporting a lost pet (STRATEGY §0.1 persona #1) — is **unreachable from the public site**. Hero CTAs are only *Fundraising* and *Surrender* (`app/page.tsx`); the only "Find My Pet" entry sits inside the **staff dashboard** behind auth + a 5-second sponsor view + a **≥50 pre-held token** requirement (ROADMAP line 51 confirms this). | Add a public "I lost a pet" entry (hero CTA → public `/lost-pet-intake`), split the two customer jobs per §0.6 #1 ("lost pet" vs "I want to help"), let the search start from 0 balance with an earn path. |
| **Critical** | User onboarding | Auth is `MOCK_USERS` only (hardcoded `admin@rescuehub.org`/`admin123`); **no registration/sign-up route anywhere**. Every share-loop referrer, searcher, and wallet holder is a hardcoded staff account — the viral loop, token economy, and lost-pet search are not usable by the public. | Real user provisioning (self-signup or pilot-invite); kill MOCK_USERS before any public launch (§4.2, §4.5 Phase 0 — still open). |
| **Critical** | Goal-ambiguity / credibility | ROADMAP declares the active phase "**EPIC 3 — Autonomous Outreach Engine (Phase 8), foundation merged**" with EPIC 2 "closed," but there is **no autonomous agent, no outreach, no geolocation/SMS, no crawler**. The payoff is `RadarView`, which **fabricates a live activity feed** ("Alerting municipal shelters within a 5-mile radius…", "Notifying N registered volunteers…", "Live presence mirrored to Nextdoor/Facebook") on a timer — none of that outreach happens. | Re-title the phase honestly (e.g. "Epic 3 Phase A — reactive intake only"); label the radar feed as a simulation in-product; keep geolocation/SMS/crawler as explicit unbuilt backlog. |
| **High** | Positioning contradiction | Root `README.md` markets "a **high-fidelity, premium SaaS-style dashboard**… centralizes shelter logistics, dog intake statuses" — a staff SaaS tool — while ROADMAP/STRATEGY define a **public autonomous rescue platform**. The shipped product is effectively two products (public adoption site + staff SaaS + token-gated search) with no stated strategy binding them. | Rewrite the README around the mission (find lost pets / rehome euthanasia-risk / sponsor-underwritten sharing) and state which audience is primary. |
| **High** | Product definition debt | **`PRODUCT.md` is an empty template** — every section is a placeholder ("Who they are", "Brand Personality", "Anti-references", "Design Principles", "Accessibility & Inclusion", success criteria). There is no written target-user, personality, anti-reference, or definition of done. This is the root cause of the goal ambiguity and the README contradiction. *(Verified directly: 22 lines, all placeholder brackets.)* | Fill `PRODUCT.md` from STRATEGY §0.1/§5 and the original-idea record: 4 personas, 3-word personality, anti-references (doom-scroll euthanasia feeds, spammy DM cold-calling), design principles, success metrics from §5.4. |
| **High** | Token economy promise | "Pay OR **share to 10 groups for free**" is implemented as sponsor-view −/+ with a **pre-fund requirement** (`currentBalance + 50 ≥ 100`), so a new 0-token user hits "Insufficient funds" and cannot search. `SHARE_10_GROUPS_EARN` exists as an enum + wallet label but there is **no share counter and no grant at 10** — the free path is not measurable or granted (§5.2 #1 flagged this; still open). | Build the "Free search" progress widget (`shares_completed / 10` → grant the −100 spend); let the sponsor-view path work from 0 balance. |
| **Medium** | Rehoming conversion | For euthanasia-risk animals the app **never converts a viewer into an adopter/foster/lead**: the feed and hold-profile are view-only; the only "adopt" is a staff "Mark as adopted" pill in the dashboard table. | Add an "I want to adopt/foster this animal" submission + shelter notification (even a mailto/lead row). |
| **Medium** | Species inclusion (overstated) | §5.2 #5 says small-animal inclusion "is now real," but shipped inventory (`data/dogs.json`, 12 records) is **100% dogs with no `species` field**; cats/rabbits/turtles exist only in the intake Zod schema and chat enum. | Add species to the animal model + fixtures; extend feed/medical/fundraising defaults per §5.2 #5. |
| **Medium** | Dead outreach surface | `/api/telegram/notify` + `src/lib/telegram.ts` **throw at runtime** because `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` are absent from both `.env` files — and its purpose (intake-ops alerting) isn't the mission's outreach (reaching fosters/adopters). | Gate the route, add real creds, or repurpose it as the actual radius-alert channel when Epic 3 backlog lands. |
| **Medium** | Claim-vs-committed-tree hygiene | ROADMAP/CHANGELOG claim EPIC 3 foundation "merged 2026-08-16, verified 2026-08-23," but `git status` shows `dashboard/page.tsx`, `api/chat-intake/route.ts`, `p/[shareId]/page.tsx`, etc. **uncommitted**, and ROADMAP itself admits the `chat-intake/radar/searches` routes were "staged-around" and excluded. "Shipped" runs ahead of reality. | Commit the merged state and make ROADMAP track the committed tree. |
| **Low** | i18n parity overstatement | ROADMAP claims 100% parity across 7 locales "on all required surfaces," but the **dashboard loads only en/es/zh** dicts — ja/ko/zh-CN/zh-TW silently fall back to EN there. | Load all 7 dicts in the dashboard hook, or scope the claim honestly. |
| **Low** | Docs hygiene | `frontend/README.md` is the untouched `create-next-app` boilerplate (zero product content) alongside the contradictory root README. | Replace with real content or delete and link to the root README. |

**Product-Goals Score: C−.** Strong engineering exists a rescue org can stand on (real viral share loop, compliant token ledger, live chat-intake agent, polished adoption feed, thoughtful strategy doc), but product-*goals* alignment fails on the essentials: the flagship lost-pet flow is staff-gated and token-pre-funded; "Autonomous Outreach Engine" is a label over a mock radar; PRODUCT.md is empty and the README mispositions the product; "share 10 → free" is unimplemented and contradicted by a pre-fund check; and there is no public user onboarding at all.

---

## 3. MVP Shippability Findings (Go-Live Readiness)

**Verdict: NOT shippable to a pilot shelter as-is.** Two hard build blockers + a red lint + no monitoring + mock auth/data + half-wired token enforcement. Crucially, the strategy's **own** §4.2 readiness table and §4.5 Phase 0 already mark Auth, Data, Secrets, Seed, and Monitoring un-ready.

### 3.1 Hard blockers

| Severity | Issue | Fix |
|---|---|---|
| **CRITICAL** | **`npm run build` FAILS** — `app/p/[shareId]/page.tsx` has a missing `</div>` (the reward-toast container div opened ~L175 is closed by bare `)}` at L193). Regression after the checklist run (git diff: closing tag + blank line deleted in the same edit that added `data-testid="share-reward-mint"`/`AnimalPhoto`). §4.2 claims "Production build ✅ Green" — **stale**. | Restore the closing `</div>`; re-run `npm run build`; gate merges on it. |
| **CRITICAL** (latent) | **Duplicate `/` route** — `app/page.tsx` (public home) and `app/(main)/page.tsx` (`MainDashboard`) both resolve to `/`. Next's `next-app-loader` throws "You cannot have two parallel pages that resolve to the same path" — blocks the build the moment the parse error is fixed. | Delete the orphaned `app/(main)/page.tsx` (real dashboard is `app/dashboard/page.tsx`), or remove `app/page.tsx` if the group page is intended as home. |
| **HIGH** | Lint red — 60 errors / 21 warnings (`npm run lint` exits 1); `typescript.ignoreBuildErrors: true` hides 4+ tsc errors. §4.2 claims "57 err / 24 warn" — stale. | Sweep top offenders; remove `ignoreBuildErrors`; make `tsc --noEmit` a CI gate. |

### 3.2 Core loop end-to-end (code-verified)

| Step | Status | Evidence / gap |
|---|---|---|
| 1. Chat intake | ✅ Works | `/api/chat-intake` → `streamObject` + Gemini (strict Zod); mock only when `CHAT_INTAKE_USE_MOCK` set. No auth — public endpoint. |
| 2. Token-funded search | ⚠️ Half-wired | −100 SPEND minted **only in the UI** (`SponsorshipCheckoutModal`). `/api/searches` treats `debitTxnId` as optional → search created with `debitTxnId=null`; `/lost-pet-intake` is not in `proxy.ts`'s matcher → a logged-in 0-token user can search without paying. "Token-funded" is not enforced server-side. |
| 3. Radar | ⚠️ Half-wired / misleading | Real `LostPetSearch` row shown, but the "Activity Feed" is **fabricated** (random shelters/volunteers/cities on a timer — a mock ticker simulating the partner network). "Mark as complete" only `router.push('/dashboard')` — no FOUND/CANCELLED path exists. |
| 4. Share loop | ❌ Blocked by build bug | `/api/shares` → `/p/[shareId]` mints +5, but that file has the parse error — doesn't compile. Dedup is an **in-memory `Map`** ("dev-only — move to Postgres in production") → breaks across serverless instances → +5 farmable. Rows stay `PENDING` forever (no verifier). |
| 5. Sponsor ack | ⚠️ Works, attribution missing | +50 `SPONSOR_VIEW_CREDIT_EARN` → −100 SPEND — real DB ledger, idempotent. But `sponsorOrgId` is deliberately LEFT NULL → the UBIT § 513(i) sponsor attribution the compliance story promises is not actually recorded. |

**Extra integrity holes in the loop:** `POST /api/animals/intake` mints **+50 per fake animal with no rate limit / per-user cap** (unlimited token farming) and bypasses `processTokenTransaction`; `/api/chat` (public FloatingChatbot) is an unauthenticated Gemini endpoint with no throttle.

### 3.3 MVP Scope — Keep / Cut / Defer

**KEEP (ship as-is after fixes):**
- Chat-intake agent (`/api/chat-intake` + `LostPetAgent`) — live Gemini, structured extraction
- `LostPetSearch` persistence + radar **summary card** (the real row is fine; only the feed is fake)
- Token wallet + ledger (`tokenService.ts`, `/api/tokens/*`) — real, atomic, idempotent
- Sponsor modal +50/−100 flow (compliant copy, real ledger) — **once** `sponsorOrgId` attribution is wired
- Share button + `/p/[shareId]` landing (mint +5) — **once** the JSX fix lands and dedup is DB-backed
- Hold-time engine, ESIGN waiver, i18n (7 locales), About section, dashboard widgets

**CUT (from this pilot, or re-label honestly):**
- Radar "live Activity Feed" — replace the fabricated ticker with a static "broadcast dispatched to N partner channels" note or a real webhook/email stub; never show fake volunteer alerts to a shelter
- "Mark as complete" button — until a real status-transition endpoint exists
- Unbounded +50 intake mint — cap per user/day now
- Public `FloatingChatbot` (`/api/chat`) — throttle it, or remove from the pilot build
- Share "verification" (PENDING-forever rows) — admit it's nominal until a verifier exists

**DEFER (explicitly out of MVP, consistent with STRATEGY §4.1):**
- Real payments (Stripe), token purchases
- Autonomous social-media outreach / geolocation / SMS / crawler (Epic 3/4) — do **not** present the fake radar feed as if this exists
- Full multi-org/multi-tenant admin
- Mobile apps (Expo Phases B/C, STRATEGY §0.5)
- "Share 10 → free search" progress widget (MVP+1, §5.2 #1 / §5.3)

**Non-deferrable go-live blockers (§4.2 / §4.5 Phase 0):** green build + CI gates (lint/tsc/prisma migrate); real (non-mock) auth; real org/jurisdiction/sponsor seed; at-minimum basic error monitoring (Sentry) — a pilot shelter is a real-life system and the 99.9% availability KPI (§4.6) is meaningless without it.

**MVP-Shippability Score: D.** The product does not build, lint is red, monitoring is absent, auth/data are mock, and the core loop's economic enforcement, share dedup, and radar truthfulness are half-wired. The architecture is right and most fixes are small (a one-line JSX restore, one file delete, a spend-enforcement check, a rate-limit table) — **~1–2 focused days to reach B** for a trusted 3-volunteer pilot.

---

## 4. UI/UX Findings by Surface

### 4.1 Hero & Visual Identity — **B−** (R3)

| Severity | Issue | Fix |
|---|---|---|
| **High** | **No full-bleed real-photo hero with warm scrim** (UI_UX §3.4, STRATEGY §0.3) — the single biggest conversion + LCP lever. Hero is still abstract aurora + frosted `bg-white/70 backdrop-blur-xl` card — exactly the "abstract not animals" pattern the brief criticizes. Only photo is a small desktop-only (`hidden … lg:block`) side card using **placedog.net placeholders**. | Make the hero photo-first: `next/image` `priority` + true `blurDataURL` + `sizes`, full-bleed behind content, warm gradient scrim (left-dark for text, amber/emerald glow right), aurora/particles/noise as a light overlay on top; 3D emblem as accent only. |
| **High** | **Semantic token system (action/urgent/find) not implemented** (§0.2). Zero `--color-action`/`--color-urgent`/`--color-find` in `globals.css`; raw hex (`bg-[#10B981]`, `text-[#334155]`, `text-[#64748B]`) + raw palette classes everywhere; `--color-accent` is still **cyan `#06b6d4`** — the old SaaS accent. | Define the three tokens in `@theme`, remap every raw hex + cyan to them (emerald=action, amber=urgent, `#3B82F6` cobalt=find), delete cyan `--color-accent`. |
| **High** | **"Find/search" blue is absent — search reads green.** Feed `<Search>` icon is `text-emerald-500`; hero has **no search / "I lost a pet" CTA at all** (§0.6 #1). | Add a hero "I lost a pet / Find my pet" action in cobalt `find` token; wire the feed's search icon to it. |
| **Med–High** | **Mobile hero has zero emotional anchor** — featured photo and 3D emblem both `hidden … lg:block`; on phones the hero is pure aurora + frosted card, precisely where most rescue visitors convert. Also `p-12` + `h-[85vh]` cramped on ~375px. | Show a compact animal photo on mobile; reduce card padding; use `min-h` rather than rigid `h-[85vh]`. |
| **Medium** | SaaS-y `bg-cyan-100 text-cyan-700` badge above the headline; typography does not follow §0.3 (Geist + Geist Mono only — no humanist sans + warm display serif); metadata reads SaaS ("legally compliant multi-tenant SaaS platform…"). | Badge → emerald/amber trust via tokens; add humanist sans (Inter/Plus Jakarta) + warm serif (Fraunces/Lora) for `h1`/section `h2` (`font-display` token); rewrite title/description as human-first rescue copy. |
| **Medium** | `backdrop-blur-xl` on the full hero card — heavy GPU cost over the animated aurora, ironic given §3.1 removed the 140px blur technique. | `backdrop-blur-sm`/solid `bg-white/85` on mobile, or rely on the scrim-photo approach; disable under `prefers-reduced-motion`. |
| **Low** | No `template.tsx` page transitions (§5); `blurDataURL` is a flat emerald rect, not a true photo preview. | Add `app/template.tsx` (200ms fade, reduced-motion-aware); generate real tiny per-image blur previews once real photos are wired. |

**What's genuinely good here:** `HeroMesh` is calm and on-brand (pre-blurred radial gradients, no neon, 3-depth parallax silhouettes, static noise) — §3.1/§3.2 implemented well; `PawParticles` is a model citizen (DPR ≤1.5, reduced-motion pause, off-screen + hidden-tab pause) — exactly §3.3; the lazy WebGL `PawEmblem` island (matte, low-power, static fallback under reduced motion) is the §4 signature moment, done right; `MotionConfig reducedMotion="user"` is set.

### 4.2 Adoption Feed (conversion surface) — **C−** (R4)

| Severity | Issue | Fix |
|---|---|---|
| **Critical** | **The entire public adoption path dead-ends.** Every card's only action ("View details") routes to `/hold-profile/[id]` — a staff triage/compliance page whose only buttons are "Back to Dashboard" and "Public Surrender Portal." An adopter can never adopt, foster, donate, or contact the shelter anywhere in the public experience. | Build an adopter-facing profile (`/adopt/[id]`) with a big "Meet [Name]" → application flow plus **Adopt / Foster / Donate / Contact shelter** CTAs; keep compliance on the staff route. |
| **High** | **Card CTA is hover-only** (`opacity-0 group-hover:opacity-100`) — on touch devices there is no hover, so **mobile (the primary adoption platform) has zero visible CTA**, and clicking the photo does nothing. | Always-visible "Meet [Name] / Adopt" button (full-width, thumb-zone on mobile); make the whole card a tap target. |
| **High** | **The "still available" live badge is absent** (§3.4/§0.6 #2 — the signature trust feature). The static pill is derived from `euthanasia_risk_status`, not live availability, and can lie (ignores `statutoryHoldCleared` → a SAFE animal on hold reads "Available" while the dashboard blocks adoption). | Add a live "Still available" badge (green pulsing dot + "verified just now"), derived from actual adoptability (hold cleared + not adopted + risk ≠ behavioral); gray out on lapse. |
| **High** | **Photos are random placeholder stock** (`placedog.net` returns a random dog for `?id=N`, not the animal) — presenting a stock image as the real animal is the single biggest trust breaker; `AnimalPhoto` has **no `onError` fallback**. | Real shelter photos (S3/R2, Petfinder, Shelterluv `remotePatterns` at launch); paw-glyph fallback; image-error state. |
| **Medium** | **Compliance/legal jargon on adopter cards** — `LiveTimer` ("Stray Hold Active — 48h…"; lapsed = pulsing red "⚠ HOLD OVERDUE — legal action required") and "…excluded… per Behavioral Euthanasia Exception compliance" — doom-scroll cues that violate §0.1 #2 "urgency with dignity." | Keep countdowns on staff surfaces; on the feed show "Needs a home by [date]" (amber, calm) or "Urgent — needs a sponsor or foster" with the actionable step. |
| **Medium** | **No filters or sorting** (species/breed/age/size; "Most urgent first"/"Newest"); no search. | Filter chips + a sort control defaulting to urgency → newest (§5.3 already scopes MVP+1). |
| **Medium** | **Hero CTAs serve the shelter, not the adopter** — only "Emergency Crowdfunding" and "Public Surrender Portal," violating §0.6 #1 ("I want to help" must be first-class); the feed sits below the fold with no hero path into it. | Third hero CTA — "Find your new best friend" → adoption feed or `/adopt`. |
| **Medium** | **AT_RISK badge copy targets sponsors, not adopters** ("urgent corporate sponsorship needed") — an adopter can't tell if the animal is adoptable, suppressing conversion. | Dual-audience copy: "Still adoptable — urgently needs a home or sponsor." |
| **Low** | Cards don't tell a story — no **sex** field/chips (§3.4 asks for age/sex), no temperament/weight/bio; no loading/error states; dog-only feed (§5.2 #5 taxonomy exists to reuse); thin adopter-trust signals (shelter name/contact, "verified rescue," how-adoption-works). | Add `sex` + chips, a personality blurb, skeleton/error states, species filter, trust elements. |

**Would an adopter trust it? Not yet.** Photo-first *surface* with a broken *conversion core* — "a staff dashboard wearing a public skin."

### 4.3 Lost-Pet & Trust Flow — **C** (R5)

| Severity | Issue | Fix |
|---|---|---|
| **Critical** | **The entire activation CTA lives in the sidebar, which is `hidden lg:flex`** (`LostPetAgent.tsx:915`). Below 1024px — the mobile-first audience (§0.5) — a user who completes 5/5 fields has **no progress view and no "Activate Search Network" button at all**. The lost-pet journey dead-ends in an endless chat on the most common device. | Mobile sticky bottom sheet with progress + the Activate button below the composer; compact progress strip on mobile. |
| **Critical** | **A brand-new anxious owner is locked out of starting a search** — preflight `currentBalance + 50 ≥ 100` requires balance ≥ 50 *before* the sponsor grant; a 0-token user gets "Insufficient wallet balance" with no working next step (no share/earn path reachable from the journey). | Relax the gate so the grant can fund the search (0-balance → +50 → net −50), or grant a one-time "first search" courtesy; put a concrete earn path inside the insufficient-funds view. |
| **High** | **The SEARCHING → FOUND → CANCELLED timeline is dead** (§0.6 #3 explicitly asked for it). `RadarView` never renders `search.status`; "Mark as complete" only `router.push("/dashboard")` — no API call, no FOUND transition, no "my searches" list. The app literally cannot show "we found them." | Status stepper on the radar; `PATCH /api/searches/:id` setting `status=FOUND` + `closedAt`; "My searches" list with status pills on the dashboard. |
| **High** | **Radar is obviously mock — and dangerously so.** The ticker pulls `Math.random()` lines from a fixed bank (2.6–3.4s) that fabricate real-world claims: "Three community members reported possible sightings", "Notifying 8–30 registered volunteers in [city]", "Alerting municipal shelters within a 5-mile radius" — with a "· live" label and **zero simulation disclaimer**. Geolocation is explicit Epic-3 backlog, so these are fabricated promises to a distressed owner (false hope + trust/legal risk). | Label the feed "simulated demo feed — the partner network is starting up"; drop fabricated sightings/volunteer counts; replace with honest in-flight copy ("Broadcast queued; alerts go out as partners join"). |
| **High** | **The "sponsor message" is Big Buck Bunny** — an unrelated open-source cartoon (`SPONSOR_VIDEO_SRC`) under "A note from our sponsor" + "Chewy is acknowledged…". Reads broken/deceptive. | Real neutral sponsor asset (RescueHub/Chewy acknowledgment video, or a text+still variant with no CTA), or clearly frame as a placeholder. |
| **Med–High** | **Mock mode leaks internal text into the empathetic chat** — reply strings literally contain "(MOCK reply — set CHAT_INTAKE_USE_MOCK=false…)" (`readMockTurn`). A distressed user sees engineering config inside the calming assistant. | Gate the mock disclaimer behind an env check; strip from user-facing bubbles; mock dev-only, off in prod. |
| **Med–High** | **"Pay OR share to 10 groups for free" is not a first-class path.** The only share UI (`ShareToHelpButton`) is on shelter-animal rows — **no share flow for a lost-pet search** and no "shares_completed / 10 → free search" widget (§5.2 #1). The viral loop never connects to the radar. | "Share my search" on the radar minting per-share links scoped to `searchId`; a free-search progress widget that grants the −100 spend at the 10th verified share. |
| **Medium** | **Surrender first screen is lawyer-speak** — "This ESIGN/UETA-compliant electronic waiver creates a legally defensible chain of custody…" titled "Public Surrender Portal" — violates §0.1 #3 "compliance without intimidation" for someone giving up a pet at a hard moment. | Lead with warmth ("We're here to help you and this animal — a short legal form protects everyone."); legal description as supporting copy; rename heading human-first. |
| **Medium** | **`/p/[shareId]` badge says "Viral share verified" for any found share** — but shares are created `PENDING` and only later VERIFIED, so every fresh share claims verification that hasn't happened; the +5 toast explains the token economy to a stranger (gamey). | Show honest state ("Share link active" while PENDING, "Verified" only after verification); soften token-economy copy on the public landing. |
| **Medium** | **"+50 tokens minted 🎁" toast on the surrender confirmation gamifies an emotional event** (and in the ESIGN confirm step). | For `OWNER_SURRENDER`, drop/reword the reward (silent credit + neutral "welcome"); keep the playful mint for `FOUND_STRAY`/onboarding only. |
| **Low–Med** | No "not sure/skip" for required fields — the sidebar hard-gates activation on 5/5 (incl. `collarId`) while the system prompt promises "never pressure"; an owner with no collar/microchip/breed can be stuck forever. | "Not sure / None" counts as captured; soft "This is enough — start searching" once species + lastSeen exist. |
| **Low** | Dev jargon in the user journey ("Epic 3 · AI Agent Outreach Engine", "· live", "search id") hardcoded English on emotional screens; radar is entirely unlocalized (contradicts the 7-locale polish). | User-facing copy ("Find My Pet — secure intake"); route radar/chat chrome through i18n. |

**Verdict:** Strong empathy on the inside, brittle trust on the outside. The chat system prompt is disciplined ("never promise, never pressure, no emoji"), the sponsor copy is § 513(i)-clean, and the 5/5 progress pattern is thoughtful — but the trust machinery around the core promise is critical-broken for the person who needs it most.

### 4.4 Staff Dashboard — **calm B−, data integrity D−** (R6a)

| Severity | Issue | Fix |
|---|---|---|
| **High** | **Fabricated trends.** `dogs.json` has 12 dogs (8 Healthy / 4 Needs Review), but trends are computed against invented baselines: `healthyTrend = ((8−248)/248) → "↓ 97%"`, `reviewTrend = ((48−4)/48) → "↓ 92%"`; "Total Dogs" trend hardcoded `8`. A 12-animal roster displays a "97% decline" — misleading staff telemetry. | Compute trends from real history (DB/API snapshot) or drop trend badges; never derive trends from magic constants. |
| **High** | **Fabricated stat-card metadata** — `PremiumStatCard.getMeta()` hardcodes "79% of total" (271/342, not the 12-dog dataset), "Peak: 13" (`totalDogs*1.12`), "↓ 12 from last month" (`48*0.25`). | Pass real meta as props from the data source; remove hardcoded numerators/denominators. |
| **High** | **Widget numbers are fake.** `UbitSponsorWidget` hardcodes `$42,500 / $18,200`; `EsignStatsWidget` hardcodes `342 hashes / 47 intakes / 100%` — mock revenue/compliance presented as real. (§4.2 itself flags `dogs.json` as mock.) | Serve from the API (ledger/ESIGN tables) or label "Sample data — demo" with a visible banner until real data exists. |
| **Low** | `PremiumStatCard` ships Stripe-style double-layer shadows + spring hover-lift + icon wiggle — "spectacle" per UI_UX §4 ("staff need speed, not spectacle"). | Keep entrance fades; drop per-card spring hover/`whileTap`; reserve motion for status change (e.g. overdue hold). |

### 4.5 Mobile — **F** (R6b + R5 criticals)

| Severity | Issue | Fix |
|---|---|---|
| **Critical** | **The staff app is not mobile at all.** Both `dashboard/layout.tsx` and `(main)/layout.tsx` render a fixed `w-64` (256px) `shrink-0` sidebar + `<main class="px-10 py-10">`. On a 375px phone that leaves **~39px** of content. No hamburger, no drawer, no bottom nav, no `md:hidden`. | Collapse the sidebar into a `md:flex` drawer with a mobile hamburger (or bottom tab bar); `px-4 sm:px-10`. |
| **High** | Dashboard header stacks 3 controls (Sign Out, Find My Pet, Add Animal) + title in `justify-between` — overflows 375px. | `hidden sm:inline-flex` for secondary actions; one primary CTA visible; full-width action row or FAB on mobile. |
| **High** | Primary staff actions (Add Animal, Find My Pet) live top-right — outside the thumb zone. | Bottom-fixed action bar / thumb-reachable FAB (mirrors Nextdoor/Petfinder bottom tabs). |
| **Medium** | `AnimalTable` action pills are `text-[11px]`, ~28px tall — under the 44×44px touch guidance (WCAG 2.5.8; Apple HIG). | `min-h-11`/44px touch targets; larger `min-w-max` tap padding. |
| **Low** | Public landing **is** responsive (hamburger, mobile menu, `sm:` grids) — a good precedent the staff shell wasn't given. | Reuse the landing's mobile-nav pattern inside the staff layout. |
| **Critical (lost-pet)** | (See §4.3 #1) The lost-pet **activation CTA is hidden below `lg`** — the mobile-first audience can't start a search. | Sticky bottom activation bar + progress strip. |

### 4.6 Accessibility & UX States (WCAG 2.2 AA) — **D+** (R6c)

| Severity | Issue | Fix |
|---|---|---|
| **High** | **Keyboard (2.1.1):** clickable stat cards are `<div onClick>`; entire table rows are `<motion.tr onClick>` navigating via `window.location.href` — not keyboard-operable, not announced. | Real `<button>`/`<Link>` or `role="button"` + `tabIndex` + Enter/Space handlers; use `router.push`. |
| **High** | **Bypass blocks (2.4.1):** no skip-to-content link on any layout; persistent sidebar/sticky nav force repeated tabbing. | Visually-hidden "Skip to main content" first in both layouts; `<main id>`. |
| **High** | **Focus (2.4.11):** no global `:focus-visible` style — sidebar nav, header buttons, pills, wallet rows, modal close have no visible ring. | Global 2px / 3:1 `:focus-visible` ring in `globals.css`. |
| **High** | **Contrast (1.4.3):** `text-slate-400` on white (~3.0:1) used widely; trend badges `#15be53`/`#ef4444` at 12px (~2.5:1 / ~3.9:1); wallet `emerald-600`/`rose-600` at 14px (~3.8:1); UBIT `amber-600` (~3.2:1); sidebar 10px `slate-500` (~3.8:1). | Darken secondary text ≥4.5:1 (slate-600+); `emerald-700`/`rose-700` numbers; semantic tokens (§0.2); verify with a contrast tool. |
| **Medium** | **Reduced motion (2.3.3):** `MotionConfig reducedMotion="user"` + canvas/emblem guards are good, but `animate-pulse` (overdue LiveTimer, `IMMEDIATE_BEHAVIORAL` badge, sponsor countdown dot, wallet skeletons), `animate-spin`, and the `shake` keyframe are **unguarded**. | `motion-safe:`/`motion-reduce:` variants or a global `@media (prefers-reduced-motion: reduce)` block disabling pulse/spin/shake. |
| **High** | **Modal (2.1.1/2.4.3):** `SponsorshipCheckoutModal` has `role="dialog"`/`aria-modal`/`aria-labelledby` ✓ but **no focus trap, no Escape-to-close, no initial focus, no focus restore**. | Trap focus; focus the panel on open; restore focus to the trigger on close; close on Escape. |
| **Medium** | `LocaleSwitch` lacks `aria-haspopup`/`aria-expanded`, no menu roles, no Escape/arrow nav (AboutNav is the good reference). | `aria-expanded` + menu keyboard pattern, or native `<select>` (per §0.4). |
| **High** | **Language (3.1.1):** i18n is localStorage-driven with **static `<html lang="en">`** — SRs read Spanish/Chinese pages in English phonetics; the dashboard's `t()` only supports en/es/zh (Sidebar/LocaleSwitch support 6), so 日本語/한국어/繁體 silently render English there. | Drive `document.documentElement.lang` from the active locale; route the dashboard through shared `useI18n` (6 locales). |
| **Low** | Alt discipline is good (`AnimalPhoto` requires `alt`; icon buttons have `aria-label`) — keep. | Add `aria-hidden` to the few decorative icons lacking it. |
| **Critical** | **No `error.tsx` / `not-found.tsx` / `loading.tsx` / `global-error.tsx` anywhere.** Uncaught render errors blank the page with no recovery; 404s show the default unstyled Next page. | Add route-level `error.tsx` (with "Try again" reset) + `not-found.tsx` (branded, home link) for the `(main)` group and root; add `global-error.tsx`. |
| **Medium** | Only `TokenWalletCardClient` has a skeleton; DB-backed dashboard rows pop in with layout shift; `AnimalTable` filter-to-zero renders a blank `<tbody>`. | Per-route `loading.tsx` reusing the skeleton style; reserve layout height (CLS budget, UI_UX §6); add an empty state with a reset action. |
| **Medium** | **Benchmark gaps** (Petfinder / Adopt-a-Pet / Pawboost / Nextdoor): no personality tags + bio story, no search/facet filters on the feed, no save/favorite, no page transitions (`template.tsx`). | Story fields + facets + `template.tsx` fade (UI_UX §5) + favorite/heart. |

---

## 5. Top 8 Product/UX Must-Fix Action Items (Ranked by **User Impact**, not code impact)

Ranking rationale: first the things that decide whether a *real person* (owner, adopter, staff) can do the thing the product exists for and trust what they see; then the foundations that let those ship; then integrity and quality floor. Execution order differs — **the build fix must land first** (it blocks everything) — but this list is user-impact-ordered.

| # | Must-fix | User impact (why) | Owning surface | Doc anchor |
|---|---|---|---|---|
| **1** | **Unlock "I lost a pet" for the public, on mobile, from zero balance.** Public hero CTA → public intake; activation CTA reachable below `lg` (sticky bottom bar); relax the `balance + 50 ≥ 100` preflight so the sponsor grant funds a first search; inline earn path in the insufficient-funds view; "not sure/skip" for required fields. | The flagship persona — an anxious owner in distress — currently **cannot start a search at all** (staff-gated, token-pre-funded, mobile-hidden). Highest possible user impact: the mission's primary user is blocked. | Home + Lost-Pet flow (`/lost-pet-intake`, `LostPetAgent`, `SponsorshipCheckoutModal`) | STRATEGY §0.1 #1, §0.6 #1, §4.1, §5.2 #1 |
| **2** | **Turn the adoption feed into a funnel.** New adopter-facing `/adopt/[id]` (photo-led story, "Meet [Name]" → application) with Adopt/Foster/Donate/Contact CTAs; always-visible thumb-zone card CTA (kill the hover-only dead-end); live **"Still available"** badge derived from real adoptability; real shelter photos with `onError` fallback; dignified "Needs a home by [date]" copy; urgency-first sort + species/age/sex chips. | Every adopter who falls in love with a dog today can do **nothing** — no adoption, foster, donation, or contact anywhere; mobile cards show zero CTA; stock photos undermine trust. | Adoption Feed + new public profile | UI_UX §3.4; STRATEGY §0.1 #2, §0.6 #2, §0.3, §5.2 #5 |
| **3** | **De-mock every user-believable surface.** Label the radar a simulated demo feed and remove fabricated sightings/volunteer counts; strip "(MOCK reply…)" from chat bubbles; honest "Share link active" vs "Verified"; replace/relabel the Big Buck Bunny sponsor video; only show "Mark as complete" once a real status transition exists. | A distressed owner and a pilot shelter are shown **fabricated outreach as real** ("alerting shelters", "N volunteers notified") — false hope plus trust/legal risk at the product's most emotional moment. | Radar, Chat intake, Share landing, Sponsor modal | STRATEGY §0.6 #3; ROADMAP Epic 3 (honest labeling) |
| **4** | **Ship self-service accounts + a real org/jurisdiction/sponsor seed (kill MOCK_USERS).** Real user table, hashed creds, admin provisioning, strong rotated `AUTH_SECRET`; production seed with the pilot shelter's real EIN/jurisdiction/sponsor (also enables `sponsorOrgId` attribution). | Until real accounts exist, every share-loop referrer, searcher, and wallet holder is `admin@rescuehub.org` — the viral loop, token economy, and lost-pet search are **not usable by the public**, and Phase 0 is not executed. | Auth/Onboarding, Seed | STRATEGY §4.2, §4.5 Phase 0, §4.4 |
| **5** | **Fix the build + CI.** Restore the missing `</div>` in `app/p/[shareId]/page.tsx`; delete the duplicate `/` route (`app/(main)/page.tsx`); gate merges on `build → lint → tsc --noEmit → prisma migrate deploy`. | The **share loop — the one live viral asset — is compile-broken** and unreachable; the checklist's "✅ Green" is stale and would let the duplicate route re-break the build. | Build/CI | STRATEGY §4.2, §4.3 |
| **6** | **Make search resolution real and visible.** Render `SEARCHING → FOUND → CANCELLED` as a stepper + status pill on the radar; wire "Mark as complete" to a `PATCH /api/searches/:id` setting `FOUND` + `closedAt`; add a "My searches" list with status pills on the dashboard. | The app currently **cannot show an owner "we found them"** — the highest-trust payoff of the whole journey is dead; "Mark as complete" silently does nothing. | Radar + Dashboard | STRATEGY §0.6 #3 |
| **7** | **Make the token promise honest and enforceable.** Build the "Free search after 10 shares" progress widget (`shares_completed / 10` → grant −100) on the radar (§5.2 #1); require a valid user-owned `LOST_PET_SEARCH_SPEND` txn (or paid grant) server-side to create a search (add `/lost-pet-intake` to the proxy matcher); move share dedup to Postgres with a `(shareId, ip)` unique constraint; cap the +50 intake mint per user/day through `processTokenTransaction`; record `sponsorOrgId`. | The original "pay OR share to 10 for free" pitch is a **broken promise** (pre-funded lockout, no measurable counter); spend is bypassable, +5 is farmable across serverless instances, and sponsor attribution (UBIT) is not recorded — the economy users earn in can't be trusted. | Token economy, Share loop, Lost-Pet flow | STRATEGY §5.2 #1, §4.2, §4.4, §4.6 (fraud <1%) |
| **8** | **Mobile staff shell + UX-state/a11y floor.** Collapse the fixed `w-64` sidebar into a drawer/bottom-tab shell (`px-4 sm:px-10`), move primary actions into thumb reach; add `error.tsx`/`not-found.tsx`/`loading.tsx`; skip link, keyboard-operable cards/rows, global `:focus-visible`, contrast fixes, modal focus trap + Escape, `motion-reduce:` guards; kill the fabricated dashboard stat/widget numbers (real data or "Sample data — demo" banner). | Staff can't work below tablet (~39px content); uncaught errors blank the page with no recovery; keyboard/contrast gaps exclude users; and **fabricated metrics break staff trust** in the tool they'd rely on. | Dashboard, Mobile shell, A11y | STRATEGY §0.2, §0.4, §4.2; UI_UX §4, §5, §6 |

**Suggested execution sequence (product-owner runnable):**
- **Sprint A (days 1–3, foundations):** #5 build/CI → #4 auth + seed → #6 status timeline + PATCH endpoint.
- **Sprint B (days 4–7, the two funnels):** #1 lost-pet unlock (public CTA, mobile activation bar, 0-balance start) → #2 adoption funnel (`/adopt/[id]`, live badge, real photos).
- **Sprint C (days 8–10, trust + integrity):** #3 de-mock → #7 token honesty (share-10 widget, DB dedup, spend enforcement).
- **Sprint D (ongoing, quality floor):** #8 mobile staff shell + states + a11y, aligning with STRATEGY §5.3 (Now → MVP+1 → MVP+2 → MVP+3/4).

---

## 6. Positive Notes — What Already Nails the Rescue-Brand Brief

Despite the red build and broken funnels, several things are genuinely **ahead of the brief** and should be preserved and built upon:

- **The calm, on-brand hero system is exactly UI_UX §3.1–3.3, done right.** Pre-blurred emerald/peach/sky radial gradients (no neon, no 140px blur), 3-depth parallax silhouettes (Paw/Dog/Cat/Heart) instead of the 8-icon zoo, static noise at `opacity-[0.05]`; `PawParticles` is a model citizen (DPR ≤1.5, paused on `prefers-reduced-motion`, off-screen via `IntersectionObserver`, hidden-tab via `visibilitychange`); the lazy-loaded matte WebGL `PawEmblem` island with a static reduced-motion fallback is precisely the §4 "one signature 3D moment"; `MotionConfig reducedMotion="user"` is set. The "calm + hopeful, never frantic" principle (§2) is honored.
- **The viral share loop is real and end-to-end (Epic 2).** `/api/shares` → `/p/[shareId]` → +5 mint with `(shareId, ip, 24h)` dedup, verified closed-loop 2026-06-20 — a genuine differentiator that Pawboost-style sharing hints at but RescueHub actually ships.
- **A compliant, atomic token ledger.** Append-only `TokenTransaction` + `processTokenTransaction` (idempotent, SPEND-guarded) — the economic core is real DB, not mock, and the sponsor-modal copy is properly value-neutral under IRC § 513(i).
- **Compliance discipline is strong** (§0.1 #3, §4.4): ESIGN/UETA waiver with typed-name + SHA-256, Hayden Act hold engine that blocks euthanasia until the hold clears, breed-designation "Mixed Breed" default + BSL suffix mitigation, privacy/terms pages, value-neutral sponsor acknowledgment.
- **The adoption feed's foundation is photo-first and honest.** `next/image` with `priority`/`sizes` and blur placeholder, amber AT_RISK badges, and time-based `LiveTimer` urgency — the urgency system is **ahead of the benchmark** (matches Pawboost's ethos) and its calm tone honors §0.1 #2 "urgency with dignity."
- **The chat-intake agent is genuinely empathetic by design.** Disciplined system prompt ("never promise, never pressure, no emoji"), strict Zod structured extraction, ownership-bounded `LostPetSearch` persistence, and a graceful mock fallback (503 when the Gemini key is absent) — the hard part of §0.1 #1 is already engineered.
- **i18n and polish infrastructure that works.** 391 keys at 100% parity across 7 locales with `scripts/auto_sync_locales.py` tooling, SSR-safe `LiveTimer`, honest empty states on the wallet and adoption feed, good `alt` discipline, an `aria-live` share toast, and a reusable wallet skeleton pattern.

**Bottom line:** this is a well-engineered, design-conscious prototype whose *foundations* (token ledger, share loop, chat agent, compliance, hero system) already clear the brand brief — but the *conversion core and trust surfaces* are not yet a product a real owner, adopter, or shelter can rely on. Close §5's Top 8 and RescueHub goes from a D+ prototype to a credible Phase-0 pilot that honors the mission in ROADMAP and STRATEGY §4.1.
