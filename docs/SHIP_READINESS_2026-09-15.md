# RescueHub — Ship-Readiness Review

**Date:** 2026-09-15 · **Scope:** full-repo code review, security audit, test-suite construction, AI-era UI/UX assessment
**Method:** every claim below was verified against the code or a running build. Nothing is carried over from earlier review docs.

> **This document supersedes** `docs/PRODUCT_UX_MVP_TEAM_REVIEW.md` and
> `docs/code-reviews/CONSOLIDATED-PRODUCT-UIUX-TEAM-REVIEW.md` (both 2026-08-23).
> Those graded the product **D+** and reported a failing build. Both are now
> stale: the build is green and the majority of their Top-8 must-fixes have
> genuinely landed. Treat them as history, not status.

---

## 1. Verdict

**Ready for a friends-and-family / pilot-shelter demo once §2 is done. Not yet ready for unrestricted public launch** — see §5.

The engineering foundation is better than the project's own documentation claims. The token ledger is atomic and idempotent, the outreach agent is genuinely human-gated, the compliance layer (stray holds, ESIGN, § 513(i)) is real rather than decorative, and the accessibility floor is largely in place. What was missing was not architecture — it was **a test suite (there was none at all)** and a handful of security holes in the money and AI-cost paths.

### Quality gates (all verified this session)

| Gate | Before | After |
|---|---|---|
| `npm run lint` | 0 errors / 39 warnings | 0 errors / 40 warnings |
| `npm run typecheck` | clean | clean |
| `npm run build` | green, 42/42 pages | green, 42/42 pages |
| `npm test` | **did not exist** | **80 passing** |
| `npm run test:integration` | **did not exist** | **38 passing** |
| `npm audit` | 1 critical, 8 high | **0 critical**, 3 high (build-time only) |
| Browser sweep (desktop + mobile) | — | 0 console errors, 0 layout breaks |

---

## 2. Required before you share the link

These are not code problems. They are yours to do.

1. **Revoke the leaked GitHub token.** A personal access token (`ghp_iW3w…`) was embedded in `.git/config`. I have rewritten the remote to the plain HTTPS URL, and confirmed by scanning the working tree and the last 50 commits that **the token was never committed** — so no history rewrite is needed. Revoke it anyway at <https://github.com/settings/tokens>; it sat in plaintext on disk.

2. **Seed the database, or nobody can log in.** `AUTH_ALLOW_MOCK_USERS` is unset, so the demo credentials are correctly refused, and no real user exists. A login attempt returns CSRF cookies and no session token. Fix:
   ```
   cd frontend && npm run db:seed
   ```
   Then **change both seeded passwords** before the URL leaves your hands. `prisma/seed.mjs` creates `admin@rescuehub.org` / `admin123` and `staff@rescuehub.org` / `staff123` as real ADMIN/STAFF logins.

3. **Set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`, or accept that outreach delivers nothing.** Approving a draft still records the human decision correctly and annotates `sourceNote` with `delivered: none (channel not configured)`. That degradation is honest, but it means the outreach loop has no output.

4. **Add error monitoring.** There is none. A pilot shelter is a real-life system; you will not hear about failures otherwise.

---

## 3. Issues found and fixed

### Critical

**Search fee bypass — token economy.** `POST /api/searches` validated the payment's owner, direction, and action type but never its **amount**. Because `/api/tokens/transaction` accepts any positive amount up to the cap, a user could `SPEND` **1 token** and activate a search priced at 100. The entire paid tier was bypassable with a one-line request change.
*Fixed:* the pay-gate now asserts `amount >= SEARCH_FEE_AMOUNT`, and the fee — previously the magic number `100` duplicated across three files — is a single exported constant.

**Unauthenticated paid AI endpoint.** `POST /api/shelter/intake/map` runs Gemini vision OCR on every uploaded file (up to 5 files / 5 MB per request) and had **no auth gate at all**, despite its own comment describing it as the "staff OCR flow." Any anonymous caller could burn the Gemini budget.
*Fixed:* now `STAFF`/`ADMIN` via `requireRole`, with the rate-limit bucket keyed per user as well as per IP.

**Critical Next.js advisory.** The app ran Next `16.2.7`, inside the affected range of a critical advisory (≤ 16.3.2).
*Fixed:* upgraded to `16.3.5`, which also cleared the bundled `postcss` (arbitrary file read) and `sharp` (libvips) high-severity advisories. Build, lint, typecheck, and all tests re-verified on the new version.

### High

**Admin password printed on the sign-in page.** `/login` rendered `Demo: admin@rescuehub.org / admin123` on screen, and repeated the credentials in the failed-login error. Those are the real seeded ADMIN credentials — deployed, the login page would have handed the staff portal to anyone who loaded it.
*Fixed:* the hint is compiled out when `NODE_ENV === "production"`, and the error message no longer names an account.

**Broken audit trail on delivered outreach.** `OutreachDraft` carries `reviewedByUserId` / `reviewedAt`. The **SKIPPED** paths stamped both. The **approve-and-deliver** path stamped only `status` and `sentAt`, discarding the `reviewerId` it was passed. Every message that actually reached a human had **no record of which staff member authorized it**, while every message that was declined was fully attributed — exactly backwards, and in direct conflict with design principle #5 ("humans gate the agent").
*Fixed:* the reviewer is stamped inside the same race-safe conditional `updateMany` as the status flip, so attribution cannot be lost.

**Token farming via staff intake.** The `+50` intake bonus minted **per animal**, with a batch cap of 50 and a rate limit of 10 requests/minute, and no per-user cap — a compromised staff account could mint ~25,000 tokens/minute. The mint also bypassed `processTokenTransaction`.
*Fixed:* a rolling 24-hour budget of 25 bonuses per user. Intake itself is never blocked — only the reward stops accruing — and the API response now derives `tokensAwarded` from rows actually committed rather than the animal count, so it cannot over-report once the cap engages.

**Registration leaked internals.** `/api/auth/register` re-threw non-P2002 Prisma errors, surfacing framework error text and stack traces to an unauthenticated caller.
*Fixed:* logged server-side, generic 500 returned.

### Medium

**Cross-user ledger read.** In the defensive P2002 branch of `/api/tokens/transaction`, a committed transaction was re-fetched by `idempotencyKey` (globally unique) and returned **without an ownership check** — a caller who guessed another user's key could read back their ledger row.
*Fixed:* returns 409 unless the row belongs to the authenticated user.

**Public Telegram spam vector.** `/api/telegram/notify` is public by necessity (the citizen intake and municipal forms are unauthenticated) and writes to the shelter's ops channel. The budget was 5/minute — 300/hour against a real-world pattern of one submission per person.
*Fixed:* 10 per rolling hour per IP. Failing closed is safe here: notification is fire-and-forget and the intake record is persisted separately, so a throttled alert never loses animal data.

**Missing route boundaries.** `/dashboard` and `/lost-pet-intake` — the primary staff surface and the primary emotional surface — had no `error.tsx` or `loading.tsx`, so an uncaught render error blanked the page.
*Fixed:* added for both. The lost-pet boundary leads with reassurance ("nothing you typed was lost from our side") and offers the non-AI intake portal as a fallback, since the chat depends on a paid provider that can fail independently.

---

## 4. Test suite (built from zero)

No test framework was installed. Vitest is now wired up with two configs.

**`npm test` — 80 unit tests, hermetic and offline:**

| Area | What it pins |
|---|---|
| Stray-hold clock | Active/Cleared/Overdue transitions on a frozen clock, including the exact boundary where `remainingMs === 0` must already read Overdue. Getting this wrong euthanizes an animal inside its legal reclaim window. |
| Jurisdiction rules | An identified animal's hold is never *shorter* than an unidentified one's across all 18 jurisdictions; invalid dates fail closed rather than resolving to "now" (which would read as instantly cleared). |
| Password hashing | scrypt round-trip, per-hash salting, and `verifyPassword` returning `false` — never throwing — on six malformed-hash shapes. A throw inside the NextAuth `authorize` callback becomes a 500, not a failed login. |
| Rate limiter | Window edges, sliding (not fixed-block) behaviour, bucket isolation, and `x-forwarded-for` parsing. |
| Token policy | Amounts must be positive integers; unknown directions/actions rejected; new shares always default to `PENDING` so a client cannot self-verify; sponsor grant equals the search fee. |
| Locale parity | All 391 keys across all 6 translations, plus `{placeholder}` preservation. **Verified genuinely clean** — a missing key renders the raw dotted path to the user. |

**`npm run test:integration` — 38 tests against a running production build:** route guards, 401s on every authenticated endpoint, prompt-injection rejection on `/api/chat`, malformed-body handling, and assertions that no error response contains a stack trace or Prisma internals. Includes a regression test that `/api/shelter/intake/map` returns 401 anonymously.

**Also added:** `npm run verify` (lint → typecheck → test → build), `npm run db:seed`, and `tests/integration/login-check.mjs` — a login probe you can run yourself to confirm auth works after seeding.

**Browser sweep** (desktop 1440×900 and mobile 390×844) across 9 public pages: zero console errors, no hover-only CTAs, no mobile horizontal scroll, form validation working.

---

## 5. Still open (prioritized, not fixed)

| # | Issue | Why it matters |
|---|---|---|
| 1 | **Chat run state lives only in the transcript.** `LostPetAgent` keeps captured fields in React state with no persistence. A reload or dropped connection loses everything a distressed owner just typed. | Highest remaining UX risk. See §6. |
| 2 | **No confidence or provenance on AI-extracted intake.** `BatchUpload` feeds Gemini-extracted animal records — including medical fields — straight into a form with no per-field confidence or "AI-suggested" marking. | Staff act on AI output as if it were verified data. See §6. |
| 3 | **In-memory rate limiting.** `lib/rate-limit.ts` is process-local and correctly documents this. On multi-instance or serverless hosting, every limit in the app is enforced per-instance. | Must be Redis- or DB-backed before horizontal scaling. |
| 4 | **Share rows stay `PENDING` forever.** No verifier exists, so the "10 verified shares → free search" milestone is unreachable in practice without manual staff review. | The advertised free tier is effectively inert. |
| 5 | **`LostPetAgent.tsx` is 1,082 lines** against your own 150-line rule (`CLAUDE.md`); 14 other components exceed it. | Convention debt, not a defect. I did not refactor this — it is the highest-traffic emotional surface and I would not restructure it without component-level tests first. |
| 6 | **Inline `style={{}}` in ~9 files** against the no-inline-CSS rule. Most are dynamic progress-bar widths and Framer transforms, which are legitimate exceptions; `PremiumStatCard` (12 blocks) is a genuine Tailwind bypass. | Convention debt. |
| 7 | **`UbitSponsorWidget` hardcodes `$42,500` / `$18,200`.** Visibly labeled "Sample data — demo," so it is honest, but it is still fabricated money on a staff dashboard. | Replace with ledger queries or remove before a shelter relies on it. |
| 8 | **3 high-severity `npm audit` findings remain** (`prisma`, `@prisma/config`, `deepmerge-ts`). All are build/CLI-time dependencies, not runtime. Fixing requires a Prisma major bump. | Low runtime risk; schedule deliberately. |

---

## 6. AI-era UI/UX assessment

Grounded in current agentic-UX practice ([Smashing Magazine, Feb 2026](https://www.smashingmagazine.com/2026/02/designing-agentic-ai-practical-ux-patterns/); [Agent Patterns Catalog](https://www.agentpatternscatalog.org/patterns/generative-ui/)). The consensus framework is a lifecycle — **pre-action** (intent preview, autonomy dial), **in-action** (explainable rationale, confidence signal, streaming trace), **post-action** (action audit, undo, escalation path) — with UX patterns selected by *risk × predictability*. Higher risk demands more human gating.

You have three AI surfaces. They sit at very different risk levels, and your design instincts were right on the highest-risk one.

### Outreach agent — high risk, unpredictable · **strongest surface**

It contacts real people about real animals. The literature's guidance for this quadrant is unambiguous: *no autonomous execution; suggest-only with human approval.* That is exactly what you built. `deliverApprovedDraft` never flips `DRAFT → SENT` itself, the transition is a race-safe conditional `updateMany` that cannot double-send, unsubscribed profiles can never be approved, and the Telegram copy keeps the automated-agent disclosure. **This is materially better than most shipping agent products.**

Two gaps worth closing:

- **No undo window.** Once `SENT`, there is no reversal or compensation path. The literature treats undo as "the single most powerful mechanism for building user confidence." Even a 30-second hold-before-send would give reviewers a real out.
- **No intent preview.** `POST /api/outreach/generate` runs `generateOutreachDrafts(5)` immediately. A plan summary — *"I'll draft 5 messages for profiles in these regions about these animals"* — before generation would let staff scope the run rather than react to its output.

*(The audit-trail break in this flow is fixed — see §3.)*

### Lost-pet chat intake — medium risk · **the transcript is the state**

This is the clearest departure from current practice. Agent-UX guidance is explicit that **run state must persist beyond the transcript**, because "streaming tokens stop when a browser disconnects, while the run may continue on the server." Your captured fields live in React state only. An anxious owner on a phone who backgrounds the app or drops signal loses their entire report.

Recommended, in order:
1. **Persist captured fields** (a `localStorage` draft keyed per session is enough for MVP; a server-side draft row is better). Highest-value UX fix remaining in the app.
2. **Intent preview before the spend.** The activation button commits 100 tokens. Show what will happen and what it costs *before* the charge, not after.
3. **Confidence on extracted fields.** The agent infers structured fields from prose. Let the user see and correct what was understood — you already render the 5-field progress panel, so the surface exists.

### Document-scan OCR — medium risk, understated

`BatchUpload` extracts animal records — including medical fields — via Gemini and hands them to staff with **no confidence signal and no provenance marking**. Nothing distinguishes an AI guess from a verified fact. This is the "confidence signal" and "explainable rationale" gap, and it is the one most likely to cause a real-world error, because the output looks like data rather than like a suggestion.

Minimum viable fix: mark every AI-populated field visually (an "AI-suggested" chip), and require staff to confirm rather than defaulting to accepted.

### Radar — correctly handled

Long-running-run UX is right: real persisted `LostPetSearch` state (not transcript-derived), a `SEARCHING → FOUND → CANCELLED` stepper, a real `PATCH` endpoint behind "mark as found," and a working cancel. Critically, the simulated activity feed is now **labeled as a demo** rather than presented as live outreach. Keep that discipline — it was the single most serious trust problem in the August review, and you fixed it correctly.

### Design-system notes

- **Honesty is your differentiator, and it's working.** Real `—` placeholders instead of invented numbers, "Sample data — demo" banners, `delivered: none (channel not configured)` annotations. In a category full of fabricated urgency, this is a genuine brand asset. Protect it.
- **The hero is still copy-first, not photo-first.** The featured animal photo is `hidden lg:block`, so mobile — where most rescue conversion happens — gets no emotional anchor. `docs/UI_UX_REDESIGN.md` §3.4 called real photography "the biggest conversion + LCP win," and that remains the highest-value visual change available.
- **`<html lang>` is client-synced only.** SSR always emits `lang="en"`, updated after hydration. Screen readers announce the first paint of a Spanish or Japanese page in English phonetics.

---

## 7. Pre-launch checklist

```
[ ] Revoke the leaked GitHub PAT
[ ] npm run db:seed   (nobody can log in until this runs)
[ ] Change both seeded passwords
[ ] Rotate AUTH_SECRET for production
[ ] Set TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (or accept no outreach delivery)
[ ] Set NEXT_PUBLIC_SITE_URL to the real origin (sitemap/robots depend on it)
[ ] Add error monitoring (Sentry or equivalent)
[ ] Move rate limiting to Redis before running more than one instance
[ ] npm run verify   (lint -> typecheck -> test -> build)
[ ] npm run test:integration against the deployed URL
```

---

## 8. Bottom line

The August reviews graded this **D+** with a broken build. That assessment is obsolete. The build is green, the compliance and ledger logic is sound, the outreach agent follows the correct high-risk pattern, and there is now a real test suite guarding the parts where being wrong has consequences — statutory holds, credentials, and money.

The remaining work splits cleanly: a short list of **operational** tasks that gate your demo (§2, mostly one seed command and a token revocation), and a list of **product** improvements that are genuinely optional for a friends-and-family share (§5, §6).

Ship the demo. Do §2 first.
