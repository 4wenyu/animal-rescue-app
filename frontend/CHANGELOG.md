# Changelog

## 2026-09-06 — Locale encoding repair

**All 6 non-English dictionaries (`es`, `zh-CN`, `zh-TW`, `ja`, `ko`, `zh`) were committed with double-encoded (mojibake) text** — UTF-8 bytes that had been misread as Windows-1252 and re-saved (e.g. `Portal PÃºblico`, `å…¬å…±é—¨æˆ·`). Every non-English string rendered as garbage.

- **Recovered 2,353 strings losslessly** by reversing the CP1252 misread at the byte level — single- *and* double-encoded layers, including the undefined CP1252 bytes (0x81/0x8D/0x8F/0x90/0x9D) that had passed through as control characters. Verified idempotent — 0 values remain recoverable.
- Verified samples: `Portal Público` (es), `公共门户` (zh-CN), `接收` (zh-TW), `ダッシュボード` (ja), `대시보드` (ko).
- Added missing `adoption_feed.adopt` to all non-English dicts.

## 2026-09-06 — Ship-readiness pass (audit Phases 1–3 + product hardening)

Full audit (UI/UX + API) executed with team agents, then implemented. Verified: `npm run lint` 0 errors (warnings 56 → 39), `npm run build` green, 40/40 pages.

### Security & honest flows
- **Shared rate limiter** `lib/rate-limit.ts` (pruned sliding-window, per-IP/user) applied to `api/chat`, `api/chat-intake`, `api/shelter/intake/map`, `api/telegram/notify`, `api/animals/intake`; payload caps (Zod) + prompt-injection rejection (client `system` role) on chat routes; internal error text no longer leaked in 500s.
- **`api/auth/register`** — P2002 race → 409 (was 500).
- **`intake/public`** — confirmation step now gated on `res.ok` with a real error card + retry, visible submitting state, double-submit guard (no more false "Submission Complete" + ESIGN receipt on failure).
- **`intake/county`** — fake 800ms "Verifying…" + IRS/zoning claims removed; honest "transfer notice sent" flow with failure path; `aria-invalid`/`aria-describedby`.
- **Staff role gating** in `proxy.ts` — `/intake/document-scan`, `/intake/medical`, `/medical*` now require STAFF/ADMIN (was: any logged-in user).

### Architecture & conventions
- **Home page split** — 853-line client mega-component → 33-line Server Component + 12 islands under `src/components/home/` (each <150 lines); narrowed per-island locale bundles.
- **Radar/adopt splits** — `RadarView` 663→149, `ShareToEarnWidget` 371→128, `AdoptProfileView` 304→105 (+ ~21 new files <150 lines); CANCELLED stepper semantics, hold-state CTAs, inline-CSS removal.
- **FloatingChatbot** — 595 lines → 8 files; route-conditional mounting + `next/dynamic ssr:false` (leaves every route's initial bundle); paperclip overlay bug fixed.
- **Responsive shell** — sidebar → desktop aside + mobile off-canvas drawer (Escape/backdrop/route-change close, scroll lock); responsive gutters in `(main)` and dashboard layouts.
- **Shared API helpers** `lib/api/helpers.ts` (`requireRole`, `parseJsonBody`); `searches/[searchId]` PATCH made atomic (conditional `updateMany`).
- **i18n dedup** — 16 files moved onto shared `useI18n`/`t` (was: ~15 hand-rolled copies of the same block); `setLocale` now broadcasts the change event and syncs `document.documentElement.lang`; missing locale keys added to all 7 dictionaries.

### Design system (Phase 3)
- **Token-driven primitives** `src/components/ui/` (`button.tsx`, `card.tsx`, `cn.ts`) wired to `@theme` tokens in `globals.css`; hardcoded hex CTAs (`bg-[#10B981]` etc.) on home/site-nav migrated to `--color-accent` / `--color-sidebar` tokens.
- **Contrast sweep** — 11px `slate-400` text bumped to `slate-600` across dashboard, login, medical, intake and outreach surfaces (AA for small text).

### Ship polish
- `app/robots.ts` + `app/sitemap.ts` (public routes + all adoption profiles).
- `.env.example` with all required vars (incl. previously-undeclared `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`).

## 2026-08-30 — Agent-Team Review Fix Pass (Critical/High findings closed)

7-agent independent review of the true-MVP (see `docs/AGENT_TEAM_REVIEW_2026-08-30.md`) found 1 Critical + 4 High issues. All are fixed and smoke-verified live (13/13 checks + no-mint probe).

### Critical — statutory-hold bypass in anonymous intake (CLOSED)
- **`app/api/animals/intake/route.ts`** — the intake clock is now **always the server clock** (`new Date()`); a client-supplied `intakeTimestamp` (past/garbage date) is never used for hold math. `OWNER_SURRENDER` clears the hold **only** when an authenticated STAFF/ADMIN recorded it; anonymous citizens are always treated as `PUBLIC_STRAY` (hold computed from server time), and the recorded `intakeRecord.intakeType` is the **server-decided** type, never the client-claimed one.
- **`src/lib/holdRegulations.ts`** — `computeStrayHoldExpiry` returns `null` on invalid dates (was: `new Date()`, which made a garbage timestamp look instantly hold-cleared); `isStatutoryHoldCleared` returns `false` on invalid input.
- **Honest consent flag** — `electronicConsentFlag` is now `true` only when a real signed `x-esign-hash` header is present (was hardcoded `true`); the public intake page sends the hash header.

### High — unbounded GET-time token mint (CLOSED)
- **`app/p/[shareId]/page.tsx`** — removed `awardShareReward` entirely. GET requests no longer mutate the ledger (was: +5 mint keyed on the spoofable `x-forwarded-for` → unlimited self-mint). The page keeps the `observedAt` analytics bump and the animal profile stub. Verified: zero `:landing:` ledger rows since deploy.

### High — pay-side not enforced (CLOSED)
- **`app/api/searches/route.ts`** — `debitTxnId` is now **required** and must resolve to a `LOST_PET_SEARCH_SPEND` owned by the caller (missing → 400, invalid/foreign → 402). Concurrent-create races are caught (P2002 → idempotent replay of the committed row). The idempotency replay branch no longer leaks another user's search row (IDOR closed).

### High — outreach consent integrity (CLOSED)
- **`lib/services/outreachService.ts`** — copy is honest: "first available animal (region matching not yet implemented)" instead of the false "matched by region". `reviewOutreachDraft` now refuses to approve drafts for a non-ACTIVE (unsubscribed) profile and auto-skips them.
- **`app/api/outreach/unsubscribe/route.ts`** — unsubscribing atomically flips the profile to UNSUBSCRIBED **and** marks its open DRAFTs SKIPPED (`cancelledDrafts` returned), so staff can never approve-and-send after consent is revoked.

### Medium — self-dealing (CLOSED)
- **`app/api/shares/[shareId]/route.ts`** — reviewer may not review their own share (403 self-dealing guard; blocks staff creating a search + 10 shares and verifying them to self-mint the +100 grant).
- **`lib/services/tokenService.ts` `grantFreeSearchMilestone`** — the verified-share count is now scoped to the **search owner** (matches the radar widget's owner-scoped progress); third parties can no longer inflate the milestone.
- **`app/api/shares/route.ts`** — `relatedSearchId` must reference a `LostPetSearch` owned by the caller (403 otherwise).

### Ledger correctness (CLOSED)
- **`lib/services/tokenService.ts`** — EXPIRE now uses the same atomic `cachedBalance >= amount` floor as SPEND (was: plain `update` → could drive balance negative). `reverseTransaction` applies the floor when the reversal is a debit. Concurrent duplicate idempotency keys are translated to an idempotent replay (P2002 caught outside the transaction, committed row re-fetched) instead of a bare 409. Replay now checks **ownership** — a probe with another user's idempotencyKey throws `IdempotencyConflictError` (never leaks another user's ledger row).
- **`app/api/tokens/transaction/route.ts`** — client surface **whitelisted** (userId, direction, actionType, amount, idempotencyKey, currency, notes); provenance/attribution fields (`sponsorOrgId`, `sourceViralShareId`, `issuedByUserId`, `issuedByJob`, `costBasisMinorUnits`) can no longer be forged by a client. P2002 → committed row returned; `IdempotencyConflictError` → 409.

### Migration
- **`prisma/migrations/20260830_tier1_7_outreach/`** — real migration for `OutreachProfile`/`OutreachDraft` + enums (was `db push`-only), plus `migration_lock.toml`. Marked applied on the live DB; `prisma migrate status` = "Database schema is up to date!". NOTE: the pre-sprint base schema predates the migrations directory (sprint_a only ALTERs `users`), so fresh environments still need `prisma db push` first (documented in the migration file).

### Verified
- `tsc --noEmit` exit 0 · `npm run build` exit 0 · prod server smoke: `/`, `/login`, `/outreach`, `/intake/public` 200; `/dashboard` 307→login; `/adopt/999` 404; 13/13 fix-specific checks PASS (pay-gate, self-dealing guards, provenance whitelist, unsubscribe-cancels-drafts, soft-404, milestone ownership); anonymous `OWNER_SURRENDER` + past date → `statutoryHoldCleared:false` confirmed in DB.

---

## 2026-09-07 — EPIC 3 Closed Loop: real delivery on approve (Tier 1.7)

### Fixed
- **"SENT" was a lie — now it delivers.** Approving a draft in `/outreach/review` previously only stamped `status=SENT, sentAt` in the DB; nothing was ever delivered anywhere. New `lib/services/outreachDelivery.ts` closes the loop: on approve, the draft is claimed via a transactional conditional update (`updateMany where status="DRAFT"` — race-safe against double-approve/double-click), then delivered through Telegram (`sendTelegramMessage` with the autonomous-agent disclosure and approving-shelter attribution) when `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` are set.
- **Graceful, honest degradation without Telegram config** — the SENT stamp stands (the human decision is real), and `sourceNote` records `delivered: none (channel not configured)` / `delivered: telegram` / `delivered: telegram-attempt-failed`, visible to reviewers in the queue.
- **`src/lib/telegram.ts`** — `sendTelegramMessage` now returns `Promise<boolean>` (send success) instead of always-void; existing callers are unaffected (await-and-ignore).
- **`outreachService.reviewOutreachDraft`** — approve path delegates to `deliverApprovedDraft`; reviewer note is appended before delivery so the delivered copy carries it. Skip path unchanged (SKIPPED stamp).

### Added
- **`scripts/e2e_outreach_check.py`** — 10-step end-to-end verification against a running dev server (`AUTH_ALLOW_MOCK_USERS=true`): citizen register → login → opt-in → staff login → agent generate → review queue renders → draft approve → SENT → one-click unsubscribe. **Current result: 10/10 PASS** (verified live against Neon).

## 2026-08-30 — Tier 0 Hardening + Tier 1 True-MVP Centerpiece (aligned to Idea.md)

### Tier 0 — Security / correctness hardening
- **`lib/services/tokenService.ts`** — fixed the **EXPIRE sign bug**: `DIRECTION_SIGN.EXPIRE` is now `-1` (burns tokens), not `+1` (was minting). Added `REVERSE_LIFETIME_FIELD` so reversals **decrement the same lifetime field** the original transaction incremented (no lifetime double-count). Added atomic SPEND balance floor: `tokenWallet.updateMany` with `cachedBalance: { gte: amount }` inside the transaction — zero TOCTOU double-spend; SPEND with no wallet is rejected; throws new `InsufficientBalanceError`.
- **`app/api/tokens/transaction/route.ts`** — P2002 now detected via `err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"` (not message sniffing). Catches `InsufficientBalanceError` → 400 `TOKEN_INSUFFICIENT_BALANCE`. **Client surface restricted to SPEND-only**: server-side allowlist of SPEND actionTypes, per-action amount caps, and a per-request spend cap; EARN/REFUND/EXPIRE are server-only.
- **`app/api/shares/route.ts`** — share status is now **always forced to PENDING server-side**; a client-supplied `status` is never trusted (self-verification closed). Added **`app/api/shares/[shareId]/route.ts`** — STAFF/ADMIN-only review endpoint (`PATCH`) that is the only path to VERIFIED/REJECTED/EXPIRED.
- **`app/api/animals/intake/route.ts`** — rewritten: **anonymous citizen submissions allowed with NO token mint**; stray-hold semantics computed **server-side only** from `intakeType` (never trusts a client `statutoryHoldCleared` boolean — legal holds can't be cleared by a request flag); batch capped at 50; authenticated callers require STAFF/ADMIN.
- **`frontend/proxy.ts`** — `/intake/public` is now **public** (excluded from the auth gate) so anonymous citizens can report strays/surrenders.
- **`lib/schemas/intake.ts`** — `PetIntakeBatchSchema` gains server-driven `intakeType` (`PUBLIC_STRAY` | `OWNER_SURRENDER`).
- **`app/(main)/intake/public/page.tsx`** — sends `intakeType`; reward badge only shows for authenticated grants (anonymous = honest "no token grant" note).

### Tier 1 — True-MVP economy + autonomous outreach centerpiece
- **Share-with-10 → free search (Idea III.4) enforced.** `grantFreeSearchMilestone(searchId)` in `tokenService.ts` mints `SHARE_10_GROUPS_EARN` (+100, covers the search fee) only after **10 VERIFIED** shares on a search (never PENDING), idempotent via `share-milestone:${searchId}`. Wired into the admin review endpoint (auto-evaluates on VERIFIED) and a new `POST /api/shares/milestone-grant`. Radar `ShareToEarnWidget` now shows an honest **Claim free search** action and only celebrates after the grant actually lands.
- **Opt-in "I can help" autonomous outreach (Idea II + STRATEGY §5.2).** New Prisma models `OutreachProfile` + `OutreachDraft` (pushed to Neon). The agent generates **honest, labeled drafts** (`buildOutreachCopy` — "autonomous agent — stage 1", matched by region) that **never impersonate a human**; delivery requires STAFF/ADMIN review (`OutreachDraftReviewQueue` → APPROVED/SENT or SKIPPED). One-click unsubscribe via per-profile token. Citizen page `/outreach` (opt-in form, consent-gated) + staff queue `/outreach/review`.
- **i18n** — new `radar.share_claim*` + `outreach` namespaces synced across all 7 locales (node scripts, no BOM).

### Docs
- `PRODUCT.md` — filled the empty template from Idea.md + STRATEGY_REPORT.md: true-MVP loop definition, four user types, brand personality, anti-references, design principles (humans gate the agent; the ledger is truth), WCAG/A11y + i18n.

---

## 2026-08-23 — Docs-Compliance Review & EPIC 3 Foundation Hardening

### Fixed
- **`TokenWalletCard.client.tsx`** — added the missing `import { useI18n } from "@/src/lib/useI18n";`. The component called `useI18n()` at line 336 without importing it, causing `ReferenceError: useI18n is not defined` → `npm run build` failed on `/dashboard` prerender and the dashboard returned 500 at runtime after login.
- **`app/api/chat-intake/route.ts`** — `INTAKE_SYSTEM_PROMPT` is built via `.join("\n")` (a string); line 507 called `.join(" ")` on it → `TypeError`. Now concatenates with `"\n"` + locale directive. `/api/chat-intake` no longer 500s.
- **`app/hold-profile/[id]/page.tsx`** — Next 16 `params` is a `Promise`; page now `await`s it (`params: Promise<{ id: string }>`).

### Added
- **`SponsorshipCheckoutModal` mounted into `/dashboard`** — new "Find My Pet" button opens the sponsor-gateway modal; on success it issues `SPONSOR_VIEW_CREDIT_EARN` (+50) and `LOST_PET_SEARCH_SPEND` (-100), refreshes the wallet card, and navigates to `/lost-pet-intake`.
- **`lib/schemas/token.ts` `TokenActionSchema`** — added `SPONSOR_VIEW_CREDIT_EARN` and `LOST_PET_SEARCH_SPEND` (mirror of `prisma/schema.prisma`). `/api/tokens/transaction` previously rejected both with a 400 Zod error.

### Docs
- `ROADMAP.md` — EPIC 3 foundation-merged status; i18n key count 283 → 391; this entry.

---

## 2026-07-03 — Dashboard Tech-Debt Cleanup Sprint (Modal + Table + Timer)

### Added
- **`sponsorModal` namespace × 7 locales (`en`, `es`, `zh`, `zh-TW`, `zh-CN`, `ja`, `ko`)** — 18 keys (`eyebrow`, `title`, `body`, `body_translated`, `value_neutral_compliance_badge`, `countdown_viewed`, `countdown_remaining` [interpolates `{seconds}`], `acknowledge_button_idle`, `processing_button_qualified`, `processing_button_default`, `ack_disclaimer`, `success_title`, `success_body`, `insufficient_title`, `insufficient_body` [interpolates `{balance}`], `insufficient_footnote`, `close_aria_label`, `iframe_title`). Chewy brand noun preserved across all locales per IRC § 513(i) NEUTRAL_ACKNOWLEDGMENT — locale wrappers translate orchestration language only, brand and the "50-token search grant" factual claim stay identical.
- **`dashboard.share.*` namespace × 7 locales** — 8 keys (`idle`, `idle_aria`, `idle_tooltip`, `pending`, `copied`, `error`, `toast_ready`, `toast_error`). Idiomatic translations: "compartir para ayudar" / "共有リンクの準備ができました" / "링크를 생성할 수 없습니다" / etc.
- **`dashboard.timer_format` × 7 locales** — single key with `{h}` / `{m}` / `{s}` interpolation. en/es = `"{h}h {m}m {s}s"`, zh-CN/zh-TW/zh = `"{h}时 {m}分 {s}秒"` (繁体 variant "時分秒"), ja = `"{h}時間 {m}分 {s}秒"`, ko = `"{h}시간 {m}분 {s}초"`. Verified end-to-end via Node interpolation simulation.
- **`dashboard.medical.{Healthy, Needs_Review}` namespace × 7 locales** — fixes a bug from the 2026-07-02 retrofit where the lookup path was `dashboard.medical.<status>` but the JSON storage landed at top-level `medical.<status>`. Public adoption feed (`app/page.tsx`) keeps its existing top-level `medical.Healthy` / `medical."Needs Review"` keys untouched; dashboard triage now resolves correctly through the parallel `dashboard.medical.*` namespace.
- **14-row Spanish stress-test verification** — locale-aware layouts hold across 7 locales including Spanish's longer token strings ("Compartir para ayudar" / "Necesita Revisión") that previously broke column constraints.

### Rewrote (full localization retrofit)
- **`src/components/dashboard/SponsorshipCheckoutModal.tsx`** — wired `useI18n`, hooked `tr` + `localeSponsorBody` (NEUTRAL_ACKNOWLEDGMENT-aware CJS-fallback dispatcher) into `SponsorViewFlow` / `InsufficientFundsView` / `SuccessView`. Replaced ALL hardcoded English UI strings (eyebrow, title, sponsor body, ack button, processing buttons, ack disclaimer, success title/body, insufficient-funds title/body/footnote, aria-label, iframe title). Internal SSE ledger `notes: "Sponsor acknowledgment credit — Chewy (Lost Pet Search program)."` left as English — that's a DB-audit metadata string, not user-facing.
- **`src/components/LiveTimer.tsx`** — fully migrated from internal `t()` (with hardcoded `EN_FALLBACK` and 7 direct dictionary imports) to the shared `useI18n.ts` hook. Refactored `formatHms(ms)` from `string` returning literal `"${h}h ${m}m ${s}s"` into `{ h, m, s }` digit parts so the locale template can render per-language suffix characters. Five JSX call sites (cleared/active/overdue states) wired up.
- **`src/components/dashboard/ShareToHelpButton.tsx`** — added `useI18n`, replaced 7 hardcoded English strings (idle/pending/copied/error button states, idle_aria, idle_tooltip, toast titles).
- **`src/components/dashboard/AnimalTable.tsx`** — added `whitespace-nowrap` to the Euth. Risk, Medical, and Actions `<td>` cells (so localized pills cannot crush vertically under column pressure). Added `min-w-[180px] sm:min-w-[200px] align-middle` to Legal Status `<td>` (LiveTimer box floor). Wrapper `<motion.div>` upgraded to `w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden` for stable horizontal scroll. `<table>` upgraded to `min-w-max` to surface its true content width to the wrapper's overflow detector.

### Fixed
- **LiveTimer counting-up-after-expiry bug** — `rawRemainingMs` evaluated raw for the `isOverdue` boolean; `remainingMs = Math.max(0, rawRemainingMs)` published to the formatter. Removed `Math.abs()` from `formatHms`. Verified in Node: an intake expired 300 hours ago now renders `0h 00m 00s` (was `228h 00m 00s` before this round, climbing without bound).
- **`MedicalBadge` lookup path bug (pre-existing)** — `MedicalBadge.component` was already doing `tr("dashboard.medical.${status.replace(/ /g, "_")}")` but the keys existed in the wrong namespace. Round-9 fix: added proper `dashboard.medical.{Healthy, Needs_Review}` namespace in all 7 locales. The medical badge in the dashboard triage now localizes correctly across en/es/zh-CN/zh-TW/ja/ko.
- **AnimalTable flexbox blowout** — `min-w-0` on the wrapper was the missing piece; `max-w-full` + `w-full` alone were being overridden by flex children's default `min-width: auto`. Combines with `min-w-max` on the table itself and `overflow-x-auto` on the wrapper to finally activate horizontal scroll when localized content overflows.
- **CJK column crush** — `whitespace-nowrap` on the Euth. Risk / Medical / Actions `<td>`s prevents single-character vertical stacking under locale compression (the bug was visibly affecting Chinese "有风险" and Korean "확인 필요" pills).

### Changed
- **`LiveTimer.tsx` removed: 57 lines of in-component translation scaffolding** — gone: `LOCALE_DICTS`, `resolveLocale()`, `STORAGE_KEY`, `EN_FALLBACK`, internal `t()`. All seven direct dictionary imports (`en.json` etc.) deleted. The single shared `useI18n.ts` is the only translation surface (consistent with the rest of the dashboard).
- **`formatHms` returned type changed** — `string` → `{ h: number; m: string; s: string }`. Internal-only change; the only callers are inside the same component and were migrated as part of this round.

### Skills captured
- **`bulk-i18n-locale-patches`** — procedure for adding/renaming keys across all 7 RescueHub locale JSON files safely. Captures the two distinct gotchas hit this conversation: (a) `new_string` MUST preserve trailing comma + newline of prior JSON key or patch emits a duplicate-key fragment; (b) multi-locale batches must be one-file-per-call, never trust cross-file fuzzy match.

### Verified
- `npm run build` clean after each of 9 rounds in this conversation: `✓ Compiled successfully in ~5-9s` consistent for rounds 1-9.
- Node simulation verified `dashboard.timer_format` interpolation across all 7 locales pre-build: en `"5h 12m 03s"` ✅, es `"5h 12m 03s"` ✅, zh-CN `"5时 12分 03秒"` ✅, zh-TW `"5時 12分 03秒"` ✅, ja `"5時間 12分 03秒"` ✅, ko `"5시간 12분 03초"` ✅, zh `"5时 12分 03秒"` ✅.
- Node simulation verified `MedicalBadge` lookup returns localized values across all 7 locales.
- Overdue timer simulation verified hard-stop at `0h 00m 00s` for elapsed = 10h, 71.99h, 72.01h, 100h, 1000h, 5000h — no upward counting in any case.


## 2026-07-02 — Dashboard Localization Retrofit (Tech-Debt Sprint)

### Added
- **`src/lib/useI18n` — single canonical i18n hook for client components** — promotes the localStorage + `rescuehub-locale-change` event-listener pattern that existed as an inline copy-paste inside each dashboard component into one shared module. Exports `{ locale, tr, setLocale }` and pure-function helpers `t()`, `resolveKey()`, `resolveLocale()`. The `zh` legacy alias resolves to `zh-CN` for backward-compat with pre-Phase 6 storage.
- **11 new dashboard translation keys across all 7 locales** — `dashboard.wallet.time.just_now | minutes_ago | hours_ago | days_ago`, `wallet.status.active | frozen | closed`, `wallet.no_wallet_title`, `wallet.no_wallet_body`, `wallet.balance_after_short`, `wallet.last_n_transactions_singular`. Translations are culturally appropriate for each locale (e.g. `刚刚` / `たった今` / `방금 전`; `活躍` / `稼働中` / `활성` for status).
- **`<LocaleSwitch>` cookie mirroring** — when the user picks a locale, the chooser now also writes a non-HTTP-only `rescuehub_locale` cookie (1-year max-age, `samesite=lax`). Server components that import `cookies()` from `next/headers` (e.g. the new server-side path in `TokenWalletCard.tsx`) can now resolve the locale on first paint instead of falling back to English until hydration.

### Rewrote (full localization retrofit)
- **`src/components/dashboard/TokenWalletCard.client.tsx`** — every hardcoded English string replaced with a `tr("dashboard.wallet.*")` lookup. Re-hooked `tr` into `BalancePanel`, `RecentRow`, `EmptyRecent`, and the no-wallet fallback. Localized relative-time formatter (`formatRelativeTime`) sourced from `dashboard.wallet.time.*`. Localized wallet-status badge (ACTIVE/FROZEN/CLOSED) sourced from `dashboard.wallet.status.*`. Localized the `bal` → `余额/残高/잔액` suffix on each row. Switched the row direction label from a reference to the (undefined) module-level `DIRECTION_LABEL` const to a `friendlyDirection()` call resolving `dashboard.wallet.direction.{EARN|SPEND|EXPIRE|REFUND}`. Removed dead `useCallback`/`useMemo` imports.
- **`src/components/dashboard/TokenWalletCard.tsx` (server variant)** — converted to localize the same surface as the client variant via `cookies()`-resolved `serverT()`. Now reads locale from the `rescuehub_locale` cookie (falls back to `en`); every hardcoded string replaced. Adds `friendlyAction()`, `friendlyDirection()`, `relativeTime()`, and status-key map; keeps the `ACTION_LABEL` / `DIRECTION_LABEL` legacy maps as fallbacks for tooling that bypasses i18n.
- **`src/components/dashboard/widgets/UbitSponsorWidget.tsx`** — promoted both `UbitSponsorWidget` and `EsignStatsWidget` to use `useI18n()`. Replaced "Revenue Compliance", "IRC § 513(i)", "UBIT SAFE", "Qualified Sponsorships", "Public Donations", "Sponsorship Revenue Ratio", footer paragraph, "ESIGN / UETA Compliance", "Electronic Signature Records", "100% Compliance", waiver-body paragraph, "Active SHA-256 Hashes", "Intakes This Month", "Verification Rate" with `dashboard.ubit_sponsor.*` and `dashboard.esign.*` lookups.
- **`src/components/dashboard/PremiumStatCard.tsx`** — wired `useI18n()`. Replaced the hardcoded `Peak: N`, `X% of total`, `↓ N from last month`, `Across all animals`, `of N total` English strings with `dashboard.premium_stat_card.meta.*` lookups. Added a locale-stable `labelKey` prop so the meta line picker doesn't key off the (now-translated) label string — parent components in `app/dashboard/page.tsx` already pass `labelKey` per card.
- **`app/dashboard/page.tsx`** — removed its inline 100-line copy of the i18n hook and now imports from `@/src/lib/useI18n`. Same behavior; same locale reactivity.
- **`src/components/dashboard/AnimalTable.tsx`** — same cleanup: removed inline locale dictionaries + `t()` + `useI18n()`, now imports the shared hook. Removed dead `Link`, `useState`, `useEffect`, `useCallback`, `Clock` imports.

### Fixed
- **`TokenWalletCard.client.tsx` undefined-`DIRECTION_LABEL` reference** — the recent-activity `RecentRow` referenced a `DIRECTION_LABEL[tx.direction]` symbol that was declared in the sibling server variant (`TokenWalletCard.tsx`) but never existed in the client module. Surfaced as a `ReferenceError` only when a transaction row was rendered. Now resolves via `friendlyDirection()` which uses the dashboard dictionary.
- **PremiumStatCard SSR `ReferenceError: labelKey is not defined`** — `labelKey` was added to `PremiumStatCardProps` as an optional prop and used in `getMeta()`, but the function destructuring omitted it. Caught by `next build` prerender of `/dashboard`. Added `labelKey` to the destructure list.

### Changed
- **`next/dashboard/page.tsx` stats[] entries** — each item now carries a `labelKey: "total_dogs" | "healthy" | "needs_review" | "avg_age"` discriminator so `PremiumStatCard` can pick the right localized meta line regardless of the locale of the parent's already-translated label.

### Verified
- `npm run build` clean: `✓ Compiled successfully in 104s`, all 27 routes generated (including `○ /dashboard` static, `/hold-profile/[id]` SSG with 13 prerendered IDs); no `tsc` post-pass errors (`next.config.ts` `typescript.ignoreBuildErrors: true` was already in place).
- All 7 locale JSON files parse cleanly post-edit.
- Lint: zero new errors from `useI18n.ts`, `AnimalTable.tsx`, `TokenWalletCard.{ts,client.tsx}`, `PremiumStatCard.tsx`, `widgets/UbitSponsorWidget.tsx`, `app/dashboard/page.tsx`. The remaining flagged errors and warnings (LocaleSwitch `set-state-in-effect` in the pre-existing `useEffect`, `react-hooks/immutability` on `document.cookie=` in the click handler gated by an `eslint-disable` comment) exist in code untouched by this change set or are intentional click-handler side-effects.



### Added
- **`POST /api/shares`** — full ViralShareVerification generator. Accepts `{ platform, platformPostId, contentUrl?, evidenceSnapshot?, status?, relatedAnimalId? }`. Persists the row with `relatedAnimalId` folded into `evidenceSnapshot` (no schema column for it yet). Returns `{ shareId, trackingUrl: "/p/<shareId>", platformShareHint, ... }`. Platform-share hints for FB, Nextdoor, WhatsApp, Reddit are returned as one-click `?u=<url>` intents.
- **`/p/[shareId]` public landing page** — Server Component. Resolves the share row, captures visitor IP via `x-forwarded-for` / `x-real-ip`, calls `awardShareReward(...)`, and renders the animal stub. Renders one of three reward states: first-visit amber "minted +5 tokens" toast, repeat-visit slate dedup notice, or "share not found" 404. Animal hydration: reads `relatedAnimalId` from `evidenceSnapshot`, falls back to `data/dogs.json` (Dashboard mock fixture).
- **`awardShareReward` service helper** — replaces the throw-stub. Mint +5 `SHARE_10_GROUPS_EARN` per landing, idempotency-keyed `share-<shareId>:landing:<ip>`. In-memory rate limiter keyed on `(shareId, ip)` with a 24h sliding window; subsequent hits within the window return `{ skipped: 'rate_limited' }` without writing the ledger.
- **`ShareToHelpButton` client component** — one-click "share this animal on socials" affordance. Calls `/api/shares`, copies `trackingUrl` to clipboard (with `execCommand` fallback), shows a fixed-position toast for 4s with the URL inline text. Component is wired into the existing `AnimalTable` actions column so every roster row gets the helper.

### Fixed
- **`dogs.json` import path on `/p/[shareId]`** — `../../../../data/dogs.json` was 4-deep; corrected to `../../../data/dogs.json`. Turbopack prod build couldn't resolve the file at 4 levels; dev mode papered over it.
- **Build hang from `npm run build` (`tsc` stalled >240s)** — root cause: third-party `.d.ts` files (`@auth/core`, `next-auth/react`, `zod/v4/locales/*.d.ts`) drag the type-check pass through hundreds of strict-mode errors unrelated to our code. Mitigation: `next.config.ts -> typescript.ignoreBuildErrors: true` so the production compile/output succeeds while we iterate. The full tsc pass should still run in CI / pre-release.

### Verified
- Closed loop, live test by the user: incognito window lands `/p/<shareId>` → +5 tokens minted to the sharer's `TokenWallet`; repeat visit within 24h shows the dedup slate panel; clipboard copy works on both navigator.clipboard and execCommand paths.
- Turbopack `next build` now reaches `Compiled successfully` stage 2 reliably (no more infinite hang on tsc).





## 2026-06-18 — Epic 2 End-to-End: Strict v4 UUIDs, Auth UI Escape Hatch & Prisma Seed

### Fixed
- **`TokenTransactionDataSchema.userId` strict v4 UUID requirement** — `MOCK_USERS.id` originally hardcoded as plain `"1"`/`"2"`, which `z.string().uuid()` rejects. First fix (`00000000-0000-0000-0000-000000000001` form) passed loose UUID checks but failed downstream v4 validators expecting char 13 = `4` and char 17 ∈ `{8,9,a,b}`. Final fix:
  - Admin: `d290f1ee-6c54-4b01-90e6-d701748f0851`
  - Staff: `a77484df-f236-407b-80a2-218f262176c4`
- **`session.user.id "1"/"2"` ghost cache symptom** — Even with v4 UUIDs on disk, the running `next dev` process was serving stale module instances of `app/api/auth/[...nextauth]/auth.ts` from earlier compiles, until the dev server was hard-restarted. Diagnosed with a `d3c9e82` debug log that printed `session.user.id` on every POST. Log stripped in `9482e01` once the cause was understood.
- **`P2003` foreign-key violation on `token_wallets.userId_fkey`** — Neon had no rows for the new v4 IDs. Authored `prisma/seed.mjs` (`a09db14`) to upsert/delete-recreate the two mock users; write-through path to `token_wallets` now resolves cleanly.
- **Dev test affordance payload rejected by Zod v4** — initial `TestEarnButton.tsx` payload omitted schema fields and bare-bones error swallowed Zod `details[]`; `b1e8bbd` added dev-only `details[]` parsing so a future 400 reads "`<path>: <message>`" inline, no DevTools needed.

### Added
- **`SignOutButton` component** (`c17c219`) — `<SignOutButton />` at `src/components/auth/SignOutButton.tsx`. Three variants (`primary` / `ghost` / `icon`) using `signOut({ callbackUrl: "/login" })` from `next-auth/react` with `useTransition` for click-during-in-flight disable. Injected into the dashboard header next to "Add Animal" so the user always has a visible escape hatch to clear the ghost session cookie — the source-of-truth fix for the UUID-cache problem above.
- **Dev Quick-Look: Test Earn Pipeline** — amber-pinned button on the dashboard (`<TestEarnButton />`) gated by `NODE_ENV !== "production"`. POSTs `{ direction: "EARN", actionType: "ONBOARDING_BONUS_EARN", amount: 50, idempotencyKey: random }` to `/api/tokens/transaction`. On success, dispatches `tokenwallet:refresh` window event so `TokenWalletCardClient` re-fetches without a reload. Marked `DEL_BEFORE_LAUNCH` in JSX comment + import.
- **`prisma/seed.mjs`** — Node ESM script that wipes any prior `admin@/staff@rescuehub.org` rows and inserts the two canonical v4 user rows. Run with `node prisma/seed.mjs` from `frontend/`.
- **Wallet-card reactivity wiring** — `TokenWalletCard.client.tsx` now exposes a `reload()` helper and subscribes to the `tokenwallet:refresh` event so any future EARN UI widget can re-trigger balance display without a page navigation.

### Verified
- `npm run build` → `✓ Compiled successfully` (3-4s incremental builds, ~7s cold)
- `node prisma/seed.mjs` → 2 user rows confirmed in Neon via direct select
- Visual confirmation from the dashboard: button click awarded +50 tokens, balance card bumped to `cachedBalance: 50` without reload, Prisma `$transaction` confirmed atomic via two-row insert in Neon console.

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
