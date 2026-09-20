# Animal Rescue App — Full UI/UX + Code Audit

*Compiled from 3 parallel team-agent audits (core pages, feature flows, API layer).*

## ✅ Progress log

**Phase 1 — security + honest flows: COMPLETE and verified** (`npm run lint` → 0 errors; `npm run build` → passes)

| Item | Status |
|---|---|
| Shared pruned rate limiter (`frontend/lib/rate-limit.ts`) | ✅ new |
| Rate-limit + payload caps (Zod) + no error leaks: `api/chat`, `api/chat-intake`, `api/shelter/intake/map`, `api/telegram/notify` | ✅ |
| `api/animals/intake` rate limit (per-user / per-IP) + `err.message` leak closed | ✅ |
| `api/auth/register` P2002 race → 409 (was 500) | ✅ |
| `intake/public` false "Submission Complete" — now gates on `res.ok`, real error card + Retry, visible submitting status, double-submit guard | ✅ |
| `intake/county` fake 800ms "Verifying…" + IRS/zoning claims removed; honest copy; failure path + `aria-invalid`/`aria-describedby` | ✅ |
| Orphaned `/intake/county` now linked from the intake hub (new card) | ✅ |
| `api/chat` type regression fixed (Zod `discriminatedUnion` on `role`) — this had broken `npm run build` | ✅ |

**Phase 3 — started**

| Item | Status |
|---|---|
| `CLAUDE.md` DB line corrected (Prisma/Postgres + dogs.json read-only roster — auditing showed dogs.json is still imported by 5 pages, so it is NOT dead) | ✅ |
| Dead `components/magic/GlowButton.tsx` deleted (zero imports) | ✅ |

**Phase 2 — conventions & structure: in progress (verified items below)**

| Item | Status |
|---|---|
| **Home page split** — `app/page.tsx` 853-line client mega-component → 33-line Server Component + 12 island files under `src/components/home/` (each <150 lines); locale bundles narrowed to home-only strings via `useSyncExternalStore` store | ✅ |
| About dropdown: click/keyboard disclosure, `aria-expanded`/`haspopup`/`controls`, Escape + refocus, focus ring, route-change close | ✅ |
| Sponsors: google/s2 favicon `<img>`s → self-hosted monogram tiles (`role="img"` + aria-label; placedog-only `next.config` made next/image a non-starter) | ✅ |
| Contrast: 11px slate-400 lines → `text-xs text-slate-600`; hero `p-6 sm:p-8 md:p-12`, `h-[85vh]` → `min-h-[85svh]`; dead exit animation deleted | ✅ |
| **Responsive (main) shell** — `Sidebar.tsx` rewritten: desktop aside unchanged; mobile top bar + off-canvas drawer (`role="dialog"`, Escape/backdrop/route-change close, scroll lock, `aria-expanded`); layout `flex-col md:flex-row`, gutters `px-4 sm:px-6 lg:px-10`; nav content extracted to `SidebarNav.tsx` | ✅ |
| **FloatingChatbot** — 595-line component split into 8 files (each <150); mounted via `ChatbotMount` client wrapper with `next/dynamic ssr:false` + route gate (hidden list preserved); paperclip click-bug fixed by unmounting on `/lost-pet-intake`; inline styles removed | ✅ |
| Data/dict mismatch: `medicalStatus "Needs Review"` vs key `Needs_Review` — normalized in `AdoptCard.tsx` | ✅ |
| i18n dedup onto `useI18n` + `html lang` sync | ✅ (16 files deduped: SidebarNav, AboutNav, LocaleSwitch, dashboard, intake×3, medical×2, fundraising×2 + 5 shared components; missing locale keys — county card, public-intake submit, radar share errors, adopt hold-note, `ai_doc_title` — added to all 7 dicts; hook now broadcasts the change event + syncs `document.documentElement.lang`) |
| Radar/adopt component splits (663/371/304-line files), CANCELLED stepper, hold CTAs | ✅ (RadarView→149, ShareToEarn→128, AdoptProfile→105; ~21 new <150-line files; new i18n keys use EN-fallback helpers pending locale dictionary additions) |
| Shared API helpers (`requireRole`/`parseJsonBody`), adoption-interest limiter, searches conditional update | ✅ (`lib/api/helpers.ts`; adoption-interest on shared pruned limiter; searches PATCH atomic via conditional `updateMany` with race re-read) |

**Phase 3 — design system & polish: COMPLETE**

| Item | Status |
|---|---|
| Token-driven primitives `src/components/ui/` (`button.tsx`, `card.tsx`, `cn.ts`) wired to `@theme` tokens; `--color-accent` re-pointed at the app's real primary (emerald) so token migration preserves visuals | ✅ |
| Hardcoded hex CTAs (`bg-[#10B981]`, `bg-[#334155]`) on home hero + site nav → `bg-(--color-accent)` / `bg-(--color-sidebar)` tokens | ✅ |
| ARIA/contrast sweep — 11px `slate-400` → `slate-600` on 9 files (dashboard, login, medical, intake, outreach) | ✅ |
| Dead `@theme` tokens — now consumed by the ui primitives (accent/card/muted/text-*) instead of deleted; sidebar tokens kept for future use | ✅ |

**Ship-readiness pass (product hardening)**

| Item | Status |
|---|---|
| **Staff role gating** in `proxy.ts` — `/intake/document-scan`, `/intake/medical`, `/medical*` now require STAFF/ADMIN (was login-only) | ✅ |
| `app/robots.ts` + `app/sitemap.ts` (public routes + all adoption profiles; staff/api excluded) | ✅ |
| `.env.example` created — documents all 6 required vars incl. previously-undeclared `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` (missing from .env/.env.local — must be set before production notification features work) | ✅ |
| `api/telegram/notify` — empty/garbage body now 400 (was 500) | ✅ |
| Dashboard layout responsive gutters (matched `(main)`) | ✅ |
| `CHANGELOG.md` — full ship-readiness entry added | ✅ |
| **Production smoke test** — `next start` on :3199: `/`, `/login`, `/intake/public`, `/adopt/1`, `/intake`, `/intake/county`, `/robots.txt`, `/sitemap.xml` → 200; `/adopt/99` → 404; `/dashboard` → 307→/login; staff route → 307→/login; notify API → 400/400/200 | ✅ |

**Final gate:** `npm run lint` → 0 errors (39 warnings, down from 56) · `npm run build` → green, **42/42 pages** (incl. robots.txt + sitemap.xml)

**✅ Resolved (verified by web search):** `gemini-3.5-flash` — used by `api/chat` and `api/chat-intake` — IS a real, released Google model ([model card](https://deepmind.google/models/model-cards/gemini-3-5-flash/), [release docs](https://ai.google.dev/gemini-api/docs/whats-new-gemini-3.5)), so the public chatbot's model ID is valid. `api/shelter/intake/map` uses `gemini-2.5-flash`; also valid, though unifying on 3.5 is worth considering.

---

## Verdict

Visually polished with genuine accessibility intent (skip link, focus rings, reduced-motion, honest demo copy), and the money paths (tokens, shares, outreach) are well-hardened with Zod, RBAC, idempotency, and race-safe wallet updates. But convention compliance is poor — an 853-line client home page, 4 oversized components, a 9-file copy-pasted i18n engine, Shadcn effectively absent — and there are **4 unauthenticated endpoints that trigger paid AI calls or spam channels**, plus two intake flows that lie to users about what actually happened.

**Biggest risks:** unauthenticated paid-Gemini endpoints (cost/abuse) · false "Submission Complete" + ESIGN receipt on failed intake POST · fake county "verification" flow.

---

## 🔴 Critical (fix first)

| # | Location | Issue |
|---|----------|-------|
| C1 | `app/api/chat/route.ts`, `app/api/chat-intake/route.ts`, `app/api/shelter/intake/map/route.ts` | No auth, no rate limit; unvalidated input streamed to paid Gemini (client can pass `system`-role messages → prompt injection). Trivial API-key exhaustion. |
| C2 | `app/(main)/intake/public/page.tsx:242–251` | Intake POST failure only `console.warn`s; `finally` always advances to confirm → user sees "Submission Complete" + ESIGN receipt hash even when nothing was recorded. No visible submitting state; waiver double-submittable. |
| C3 | `app/(main)/intake/county/page.tsx:66–77` | Fake flow: 800ms `setTimeout` pretends to "Verify…", then only a fire-and-forget Telegram notify — no persistence, no error path; confirmation claims IRS/zoning verification happened. Route is also orphaned (nothing links to it). |
| C4 | `app/page.tsx` | 853-line "use client" mega-component on the most public surface: ships all 7 locale dictionaries + dogs data client-side. About dropdown hover-only (no keyboard/ARIA). |

## 🟠 High

- `app/api/telegram/notify/route.ts:18` — unauthenticated; anyone can spam the shelter Telegram channel; payload unvalidated (no Zod).
- `app/api/animals/intake/route.ts` — anonymous writes by design but no rate limit/captcha → unbounded rows; 500 leaks `err.message`.
- `app/(main)/radar/RadarView.tsx` — 663 lines (subcomponents defined in-file); inline `style={{backgroundImage: radial-gradient}}` violates the no-inline-CSS rule (lines 532–539).
- `app/(main)/intake/public/page.tsx` — 463 lines; extract SelectStep/EsignStep/ConfirmStep.
- `app/adopt/[id]/AdoptProfileView.tsx` — 304 lines; Adopt/Foster CTAs stay fully active during a statutory hold.
- `app/(main)/layout.tsx` + `Sidebar.tsx` — fixed `w-64` sidebar on all viewports, no mobile collapse; non-responsive `px-10` gutters.
- `src/components/chat/FloatingChatbot.tsx` — 595 lines, mounted globally on every route (incl. adopt/dashboard); documented z-index/overlay click bug on /lost-pet-intake.
- i18n engine hand-rolled and duplicated across **9 files** (~300 lines) despite existing `src/lib/useI18n.ts`.

## 🟡 Medium

- **Shadcn absent**: zero Radix/CVA deps, no `ui/button`/`card` primitives; hardcoded hex colors (`bg-[#10B981]`) instead of theme tokens.
- `html lang="en"` hardcoded while app supports 7 locales; `t()` re-implemented in 3+ components with locale-flip flash after mount.
- `app/api/adoption-interest/route.ts:25` — in-memory rate-limit Map: never pruned (leak), useless multi-instance, keyed on spoofable `x-forwarded-for`.
- `app/api/shelter/intake/map/route.ts` — unbounded file count/size (full base64 in memory); error details returned to client; 2s sleep inside request.
- ShareToEarnWidget — 371 lines, duplicated fetch logic, hardcoded English error strings break es/zh/ja/ko.
- Statutory-hold UX (see High), stepper treats CANCELLED as a step after FOUND, no back button in intake step 2, staff tools (medical/document-scan) shown on the intake hub with zero route protection.
- `Dog` type re-declared in 4 files; adoption-interest + searches hand-roll validation while the rest use Zod.
- Sponsor logos via raw external `<img>` (google.com/s2) — no next/image, no fallback; 11px slate-400 text ≈2.9:1 contrast fails AA.

## 🟢 Low

- `app/api/auth/register/route.ts:70` — check-then-create race; concurrent dup → unhandled P2002 → 500 instead of 409.
- `app/api/searches/[searchId]/route.ts:91` — terminal-transition check-then-update; concurrent PATCHes double-append notes.
- Dead code: `components/magic/GlowButton.tsx` imported nowhere, dead exit animation (no AnimatePresence), unused `@theme` tokens, legacy `data/dogs.json` + CLAUDE.md says "DB: src/data/dogs.json" but **reality is Prisma/Postgres** (`lib/prisma.ts`) — update CLAUDE.md.
- A11y details: missing `role="status"`/`aria-live` on confirmations, no `aria-invalid`/`aria-describedby` on county/adopt inputs, aria-live feed announces every ~3s, missing `autoComplete` attrs.
- Minor: module-level mutable `_feedCounter`, no way to mint a second share link or poll verified counts, hero `p-12` at all breakpoints.

## ✅ What's already good

- Money paths (tokens/spend/shares/outreach): session + RBAC + ownership + idempotency, race-safe conditional `updateMany`.
- Adopt detail page: proper Server Component pattern (`dynamicParams=false`, `notFound`).
- Skip link, global focus ring, `prefers-reduced-motion`, photo error fallbacks, mobile hamburger aria-label, honest radar demo copy, consistent `{ok,...}`/`{error,message,details}` response shapes.

---

## Recommended fix order

**Phase 1 — Stop the bleeding (security + lies to users)**
1. Gate `chat`, `chat-intake`, `shelter/intake/map` behind session + shared rate limiter (DB/Redis-backed, not in-memory).
2. `intake/public`: gate step 3 on `res.ok`, render a real error card with retry, add submitting state + double-submit guard.
3. `intake/county`: delete the fake verification or implement it honestly; add a hub card or remove the orphan route.
4. Zod-validate `telegram/notify`; cap file count/size in the map route; stop leaking internals in 500s.

**Phase 2 — Conventions & structure**
5. Split `app/page.tsx` into Server page + client islands (SiteNav / AdoptCard / Sponsors / Footer).
6. Deduplicate i18n onto `src/lib/useI18n.ts` (~300 lines deleted); set `document.documentElement.lang`.
7. Extract oversized components (RadarView → HeroHeader/Stepper/SummaryRow/FeedLine; intake/public → 3 steps; AdoptProfileView → hero/form/CTA).
8. Shared API helpers `requireRole()` + `parseJsonBody()`; P2002 → 409 in register; conditional `updateMany` in searches PATCH.
9. Responsive `(main)` layout (mobile sidebar collapse); inline-CSS cleanup in RadarView.

**Phase 3 — Design system & polish**
10. Introduce Shadcn primitives + theme tokens (replace hex CTAs).
11. A11y pass: ARIA on dropdowns/LocaleSwitch (expand/collapse, Escape, route-change close), form feedback, contrast fixes, sponsor `next/image`.
12. Delete dead code (GlowButton, dogs.json refs) and update CLAUDE.md (DB = Prisma/Postgres).
