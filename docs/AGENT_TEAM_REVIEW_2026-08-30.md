# RescueHub — Agent Team Review (Fresh, 2026-08-30)

**Reviewers:** 7-agent parallel workflow (6 area reviewers + synthesis chair), run against the post-Tier-0/1 codebase.
**Supersedes:** `docs/AGENT_TEAM_REVIEW.md` (2026-08-24, grade D+ — most of its Criticals are now fixed).
**Scope:** the true-MVP after Tier 0 hardening (token ledger, RBAC, share verification, public intake) and Tier 1 centerpiece (share-to-10 free search, opt-in autonomous outreach).

---

## Overall grade: **C+ (WARN)** — architecture is right, several real holes remain

The headline hardening claims mostly hold on the happy path — EXPIRE now burns, SPEND has an atomic balance floor, share status is forced PENDING with a STAFF/ADMIN-only review gate, `/intake/public` is un-gated, the share-to-10 grant is DB-idempotent, and the outreach agent is consent-gated with a human review step. But the reviewers found one **CRITICAL** compliance bypass, several **HIGH** honesty/minting holes, and a pattern of **self-dealing and client-trusted inputs** that undermines the "pay OR share" economy. This is a solid MVP **foundation**, not yet a shippable one.

| Area | Grade | Score |
|---|---|---|
| Token Economy & Ledger | WARN | 5.5 |
| API Security, RBAC & Input Trust | WARN | 4.0 |
| Share-to-10 Free-Search Grant | FAIL | 4.0 |
| Staged Opt-in Outreach Loop | WARN | 6.0 |
| UI Honesty, UX & Correctness | WARN | 6.5 |
| Docs & Build Health | WARN | 7.0 |

---

## Critical / High findings (must fix before shipping)

### CRITICAL — statutory-hold bypass in anonymous intake
- **`app/api/animals/intake/route.ts` (148-162).** The "hold is server-side only" claim is bypassable end-to-end. The endpoint is anonymously reachable, and `statutoryHoldCleared`/`strayHoldExpiresAt` are derived from two client-controlled inputs: `intakeType=OWNER_SURRENDER` (client-settable → `holdExpiry=null, holdCleared=true`) and `intakeTimestamp` (a past or garbage date string → `computeStrayHoldExpiry` returns `new Date()` on NaN, so `isStatutoryHoldCleared` evaluates true). Any unauthenticated user can create Animal rows pre-marked hold-cleared, enabling premature adoption/euthanasia — the app's core compliance control.
- **Fix:** derive the hold from a **server-generated** intake timestamp + a server-verified surrender/evidence path; reject/clamp client timestamps (400 on invalid); never let the payload influence `statutoryHoldCleared`.

### HIGH — unbounded GET-time token mint on `/p/[shareId]`
- **`app/p/[shareId]/page.tsx` (88-105).** `awardShareReward` mints +5 on every GET. Both the idempotency key and the in-memory 24h rate limiter key on the client-spoofable `x-forwarded-for`. An authenticated user can create their own share then hit `/p/<shareId>` with rotated `X-Forwarded-For` per request → unlimited +5 self-mint, and can inflate any share creator's balance. GET performing a ledger mutation also violates HTTP safe-method semantics.
- **Fix:** never mint on GET; move the reward to an authenticated, event-driven path keyed on session userId, persist the 24h window in Postgres.

### HIGH — no Prisma migration for the outreach models
- **`prisma/schema.prisma` (536-584).** `OutreachProfile`/`OutreachDraft` + enums were applied via `prisma db push`, but no migration exists. Any `prisma migrate deploy` (standard prod) will fail at runtime with "relation does not exist". Confirmed: migrations contain no outreach objects.
- **Fix:** add a real migration (or at minimum document `db push` as the deploy prerequisite).

### HIGH — outreach over-claims "matched by region" / "nearby"
- **`lib/services/outreachService.ts` (46-66, 74-112).** Every generated message says the animal is "at a nearby partner shelter" and `sourceNote` says "matched by region", but `findOutreachEligibleAnimals` never reads `regionLabel` or any location — it returns the latest hold-cleared animals cycled by index, identical for every profile. This is the same class of fabricated-state issue the earlier review flagged.
- **Fix:** implement real region filtering, or change the copy to an honest stage-1 label ("first available animal; region matching not yet implemented").

### HIGH — unsubscribe does not stop pending outreach delivery
- **`lib/services/outreachService.ts` (173-196) + `app/api/outreach/unsubscribe/route.ts` (50-56).** Unsubscribing sets the profile to `UNSUBSCRIBED`, but `reviewOutreachDraft` only checks the draft's own status, not the profile's. Staff can still approve → SENT a draft generated before the user revoked consent — violating the opt-in-only invariant.
- **Fix:** in `reviewOutreachDraft`, reject/auto-skip when `profile.status !== ACTIVE`; on unsubscribe, mark the profile's open DRAFTs SKIPPED.

---

## Medium findings (grouped)

**Token ledger**
- `tokenService.ts` (237-247): EXPIRE/reversals use plain `wallet.update` with negative increment and **no floor** — can drive balance negative, unlike SPEND. Mirror the atomic `gte` guard.
- `tokenService.ts` (625-632): `reverseTransaction` has no floor on negative deltas.
- `tokenService.ts` (177-185): idempotency is a sequential pre-check; concurrent duplicates throw P2002 (not translated to replay), and the route's 409 omits the committed row. Catch P2002 and return the existing row.
- `tokenService.ts` (180-184): replay path returns another user's committed row if you know their idempotencyKey — cross-user disclosure; add ownership check.
- `tokens/transaction/route.ts` (190-215): `TokenWallet.status` (FROZEN/CLOSED) never enforced.
- `animals/intake/route.ts` (191-232): `awardIntakeBonus` is dead code; inline wallet create has a read-then-write race (concurrent first intakes → P2002 → 500).

**API security / RBAC**
- `tokens/transaction/route.ts` (109-112): client can set `sponsorOrgId`/`sourceViralShareId`/`issuedByUserId` on a SPEND — falsifies 513(i) attribution; strip on client path.
- `searches/route.ts` (149-175): IDOR — replay branch returns another user's search row for a known `debitTxnId`; scope to `userId`.
- `shares/[shareId]/route.ts` (118-127): no reviewer≠creator rule — a STAFF user can create their own search + 10 shares, PATCH them VERIFIED, and mint +100 to themselves (self-dealing; idempotent but repeatable per search).
- No rate limiting on any mutating endpoint (shares/intake/searches/tokens POST) → DB spam + review-queue flooding.
- `auth.ts` (84-98): JWT role never revalidated against DB → stale elevated privileges after demotion.
- `auth.ts` (12-27, 64-81): hardcoded admin/staff demo credentials gated only by env flag — dangerous if the flag leaks into a non-prod deploy with real data.

**Share-to-10 free search**
- `shares/route.ts` (37-124): sybil farming is cheap — unlimited free shares, client-chosen `platformPostId`; and `searches/route.ts` (148-225) doesn't enforce the 100-token spend (`debitTxnId` optional) → net token printer.
- `tokenService.ts` (471-481): milestone count is not scoped to the search owner while the widget progress is → displayed "X/10" diverges from the evaluated threshold (honesty mismatch).
- `shares/route.ts` (70-73, 105-109): `relatedSearchId` unvalidated client input → third party can inflate another user's milestone.

**Outreach loop**
- `outreachService.ts` (147-149): only `helpAreas[0]` ever used — multi-area consent ignored.
- `OutreachDraftReviewQueue.tsx` (122-146): "Approve & send" is one-click, irreversible, no confirm/undo.
- `outreachService.ts` (124-145): `generateOutreachDrafts` is not concurrency-safe (read-then-create); two runs can double-draft a profile.
- `schema.prisma` + service: `APPROVED` enum is dead — DRAFT jumps straight to SENT with `sentAt` stamped though no delivery channel exists (over-claims delivery).
- Review queue `take:100` with no pagination → old DRAFTs become invisible/unreviewable.

**UI honesty / UX**
- `app/(main)/intake/public/page.tsx` (234-248): **false success on a legal workflow** — confirm screen says "recorded" even when the POST failed silently; `esignHash` never persisted server-side.
- `app/page.tsx` (486-651): public adoption feed presents the 12-animal demo roster (placeholder photos, bios, "Still available" badges) with **no demo label**, unlike the dashboard widgets.
- `app/page.tsx` (143-172, 683-689): "Corporate Sponsors" shows real brands (Chewy/Purina/Petco/Merrick) via Google favicons while the comment claims Clearbit logos — unverified brand endorsement.
- `data/dogs.json` (10-12): stale fixed dates (past deadlines render as "Needs a home by Aug 24" while "Still available").
- Clickable stat-card divs not keyboard-accessible; homepage About dropdown hover-only; `html lang` hardcoded "en"; several `style={}` inline CSS props violate CLAUDE.md; staff Adopt/Transfer table buttons enabled-but-dead.

---

## What is actually FIXED (verified against code, not just claimed)

- ✅ `DIRECTION_SIGN.EXPIRE = -1` (burns, not mints); consistent with `LIFETIME_COUNTER`.
- ✅ SPEND atomic balance floor (`updateMany WHERE cachedBalance >= amount`) — genuinely race-safe.
- ✅ Share status forced `PENDING` server-side; `PATCH /api/shares/[shareId]` is the only VERIFIED path (STAFF/ADMIN).
- ✅ Client SPEND-only surface with action allowlist + caps + per-request cap.
- ✅ `/intake/public` un-gated; anonymous intake mints **no** tokens.
- ✅ P2002 detected via `err.code`, not `message.includes`.
- ✅ Milestone grant DB-idempotent (UNIQUE `idempotencyKey`) — no double-mint (verified in smoke: replay → `alreadyGranted:true`, balance stable).
- ✅ Outreach is opt-in, human-gated, honestly labeled, unsubscribable; RBAC on generate/list/review.
- ✅ Sponsor modal = static ack panel (no fake iframe); dashboard widgets labeled "Sample data — demo".
- ✅ True 404 on `/adopt/[id]` (`dynamicParams=false`); `params` awaited (Next 16).
- ✅ `PRODUCT.md` filled; `CHANGELOG.md` updated; i18n parity confirmed across all 7 locales (identical top-level keys, no BOM, 25 outreach keys + `radar.share_claim` everywhere).
- ✅ Build green: `tsc --noEmit` exit 0, `npm run build` exit 0.

## Still OPEN (the honest gap list)

1. Statutory-hold bypass via client `intakeType`/`intakeTimestamp` (CRITICAL).
2. GET-time +5 mint, spoofable-IP keyed (HIGH).
3. No migration for outreach tables (HIGH).
4. Outreach "nearby/matched by region" over-claim (HIGH).
5. Unsubscribe doesn't stop pending drafts (HIGH).
6. `debitTxnId` optional → free-search activation without paying; share sybil farming.
7. STAFF self-verification → self-mint milestone grants (reviewer≠creator rule missing).
8. Frozen/closed wallets not enforced; EXPIRE/reversal negative-balance floor missing.
9. Idempotency P2002 not graceful (concurrent duplicates 500/409 without committed row).
10. Cross-user IDOR in searches replay; client-controllable ledger provenance fields.
11. No rate limiting; no real delivery channel for outreach; stale-role JWT; hardcoded demo creds.
12. Public feed + sponsors section present demo/simulated data without labels; stale roster dates.

## Top 5 recommended next actions (priority order)

1. **Fix the hold bypass** — server-generated intake timestamp, validate/reject client dates, server-verified OWNER_SURRENDER evidence before clearing a hold.
2. **Kill the GET-time mint** — move +5 reward off `/p/[shareId]` GET onto an authenticated, Postgres-persisted, userId-keyed path.
3. **Enforce the "pay" side** — require a real `LOST_PET_SEARCH_SPEND` debit (or explicit fee-waive) before a search activates and before the +100 grant mints.
4. **Close self-dealing** — reviewer≠creator on share verification; scope milestone count to the search owner and match widget progress.
5. **Add the outreach migration + consent integrity** — write a real Prisma migration; make unsubscribe cancel pending DRAFTs; drop the "matched by region" claim until region matching exists.

---

## Fix pass (same day) — Critical/High findings CLOSED

After this review, the orchestrator fixed and verified (see `frontend/CHANGELOG.md` 2026-08-30 entry):

| Finding | Status | Verified |
|---|---|---|
| CRITICAL statutory-hold bypass (client timestamp + client intakeType) | ✅ Closed — server clock, STAFF-verified OWNER_SURRENDER only, NaN-safe hold math, honest consent flag | DB probe: anonymous `OWNER_SURRENDER` + 2020 date → `statutoryHoldCleared:false`, expiry +72h from server now, recorded type `PUBLIC_STRAY` |
| HIGH GET-time +5 mint (spoofable-IP keyed) | ✅ Closed — `awardShareReward` removed from `/p/[shareId]`; no ledger mutation on GET | zero `:landing:` rows since deploy; 3 GETs on a live share minted nothing |
| HIGH pay-side not enforced (`debitTxnId` optional) | ✅ Closed — debit required + owner-validated (400/402); concurrent P2002 → replay; IDOR in replay branch closed | smoke: missing debit → 400, bogus debit → 402 |
| HIGH outreach over-claims "matched by region" | ✅ Closed — copy now says "first available animal (region matching not yet implemented)" | code review + build |
| HIGH unsubscribe doesn't stop pending drafts | ✅ Closed — unsubscribe atomically SKIPs open DRAFTs; review refuses non-ACTIVE profiles | smoke: unsubscribe → `cancelledDrafts:1` |
| MED self-dealing (STAFF self-verification → self-mint) | ✅ Closed — reviewer≠creator 403; milestone count owner-scoped; `relatedSearchId` ownership-checked | smoke: own-share review → 403; foreign search link → 403 |
| MED ledger holes (EXPIRE/reversal negative floor, P2002 graceful replay, replay ownership, client provenance forgery) | ✅ Closed — atomic floor for EXPIRE+reversal debits; P2002 → idempotent replay; `IdempotencyConflictError`; client SPEND surface whitelisted | smoke: provenance fields stripped (200 ok) |
| HIGH no migration for outreach models | ✅ Closed — `prisma/migrations/20260830_tier1_7_outreach/` + `migration_lock.toml`; `migrate status` up to date | `prisma migrate status` = "Database schema is up to date!" |

**Regression gate:** `tsc --noEmit` exit 0 · `npm run build` exit 0 · 13/13 fix smoke checks pass · public routes 200 / auth-gated 307 / `/adopt/999` 404.

**Still open (documented, out of scope for this pass):** no automated share-evidence verification (manual STAFF review is the gate — deliberate); outreach has no real SMS/email channel (Telegram when configured, else honest record-only); social-media *scouring* not implemented (opt-in stage-1 only); shares/intake RBAC is STAFF/ADMIN (not ADMIN-only); pre-existing lint debt (~63 err / 22 warn, not build-gated); dead `/api/telegram/notify` route; `dogs.json` mock roster with stale dates; demo-data labels on the public feed/sponsor sections; frozen-wallet status not yet enforced; no rate limiting on mutating endpoints.

*Generated by the 7-agent review workflow; the Docs & Build area and synthesis were reconstructed by the orchestrator from direct i18n/build verification after the workflow's spill file truncated its tail.*
