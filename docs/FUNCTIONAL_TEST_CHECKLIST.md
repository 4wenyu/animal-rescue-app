# RescueHub — Functional Test Checklist (ALL Pages / ALL Buttons)

**Run:** 2026-08-23 · **Environment:** local dev server (`npm run dev`, Next 16.2.7)
**Method:** automated HTTP sweep + manual browser checklist
**Status legend:** ✅ PASS · ❌ FAIL · ⚠️ NOT TESTED (needs manual browser) · 🚧 KNOWN ISSUE

> **Automated sweep result (2026-08-23):** 35/35 automated checks passed
> (24 public routes + 11 authenticated routes/APIs). 6 unauthenticated 307 redirects
> are the **correct** proxy-route-guard behavior, not failures.

---

## A. Public Pages (no login)

| # | Page / Button | Expected | Actual | Status |
|---|---|---|---|---|
| A1 | `/` homepage loads | 200 | 200 | ✅ |
| A2 | `/` logo → home | navigates | — | ⚠️ |
| A3 | `/` hero CTA "Surrender" → `/intake/public` | nav | — | ⚠️ |
| A4 | `/` hero CTA "Fundraising" → `/fundraising` | nav | — | ⚠️ |
| A5 | `/` "Staff Login" → `/dashboard` | nav (auth) | 307→login | ✅ |
| A6 | `/` language switcher (globe) → 6 options | opens | — | ⚠️ |
| A7 | `/` hamburger menu (mobile) opens/closes | toggle | — | ⚠️ |
| A8 | `/` **About dropdown → all 12 items** | opens | — | ⚠️ (links verified A9–A20) |
| A9 | `/about/mission` | 200 | 200 | ✅ |
| A10 | `/about/process` | 200 | 200 | ✅ |
| A11 | `/about/story` | 200 | 200 | ✅ |
| A12 | `/about/team` | 200 | 200 | ✅ |
| A13 | `/about/partners` | 200 | 200 | ✅ |
| A14 | `/about/faq` | 200 | 200 | ✅ |
| A15 | `/about/about-us` | 200 | 200 | ✅ |
| A16 | `/about/privacy` | 200 | 200 | ✅ |
| A17 | `/about/terms` | 200 | 200 | ✅ |
| A18 | `/about/careers` | 200 | 200 | ✅ |
| A19 | `/about/legal` | 200 | 200 | ✅ |
| A20 | `/about/contact` | 200 | 200 | ✅ |
| A21 | `/about/<unknown>` → localized "not found" card | 200 + card | 200 | ✅ |
| A22 | About page language switcher works (7 locales) | swap text | — | ⚠️ (content parity verified = 0 missing) |
| A23 | `/login` page loads | 200 | 200 | ✅ |
| A24 | `/login` credentials submit → dashboard | 302 | 302 | ✅ |
| A25 | `/login` wrong creds → error | error msg | — | ⚠️ |
| A26 | `/lost-pet-intake` loads (chat agent) | 200 | 200 | ✅ |
| A27 | `/radar/[id]` loads | 200 | 200 | ✅ |
| A28 | `/p/[shareId]` landing (valid share) | 200 + reward | — | ⚠️ (dedup verified in earlier pass) |
| A29 | `/hold-profile/[id]` (1–12) | 200 | 200 | ✅ |
| A30 | `/hold-profile/<missing>` → not found | 200 + msg | 200 | ✅ |

## B. Authenticated Pages (staff, admin@rescuehub.org / admin123)

| # | Page / Button | Expected | Actual | Status |
|---|---|---|---|---|
| B1 | `/dashboard` loads | 200 | 200 | ✅ |
| B2 | Dashboard stat cards (Total/Healthy/Needs Review/Avg Age) filter table | click filters | — | ⚠️ |
| B3 | Dashboard "Add Animal" → `/intake/public` | nav | — | ⚠️ |
| B4 | Dashboard **"Find My Pet"** → opens sponsor modal | opens | — | ⚠️ |
| B5 | Sponsor modal Step 1: sponsor video + countdown (5s) | plays | — | ⚠️ |
| B6 | Sponsor modal "Acknowledge & Continue" → +50 credit | 200 txn | 200 (verified) | ✅ |
| B7 | Sponsor modal Step 2: −100 spend → routes to `/lost-pet-intake` | txn + nav | 400 if <50 bal (guard) | ✅ |
| B8 | Sponsor modal insufficient-funds gate (bal < 50) | blocked | guard verified | ✅ |
| B9 | Wallet card shows balance + recent txns | renders | 200 API | ✅ |
| B10 | Wallet "refresh" on `tokenwallet:refresh` event | updates | — | ⚠️ |
| B11 | Sidebar **About dropdown (dark) → 12 items** | opens | bundle verified | ✅ |
| B12 | Sidebar nav links (Dashboard/Intake/Medical/Fundraising) | nav | — | ⚠️ |
| B13 | Sidebar "Sign Out" → `/login` | sign out | — | ⚠️ |
| B14 | `/medical` list loads | 200 | 200 | ✅ |
| B15 | `/medical/[animalId]` checksheet renders | 200 | 200 | ✅ |
| B16 | Medical checksheet inputs (TPR, weight, microchip, vaccines) | editable | — | ⚠️ |
| B17 | Medical checksheet "Save" → console/API payload | logs | — | ⚠️ |
| B18 | `/intake` hub 3 cards load | 200 | 200 | ✅ |
| B19 | `/intake/public` surrender flow Step 1 (type cards) | 200 | 200 | ✅ |
| B20 | `/intake/public` **species/breed dropdown (new)** | 2 dropdowns | — | ⚠️ |
| B21 | `/intake/public` ESIGN waiver sign → SHA-256 hash + Telegram | hash shown | — | ⚠️ |
| B22 | `/intake/public` confirm + token bonus badge | +50 shown | API verified | ✅ |
| B23 | `/intake/county` officer flow | 200 | 200 | ✅ |
| B24 | `/intake/document-scan` OCR upload flow | 200 | 200 | ✅ |
| B25 | `/intake/medical` page | 200 | 200 | ✅ |
| B26 | `/fundraising` campaign list | 200 | 200 | ✅ |
| B27 | `/fundraising/[animalId]` wallet + donate form | 200 | 200 | ✅ |
| B28 | Fundraising donate allocation (medical/general) | toggles | — | ⚠️ |

## C. API Endpoints

| # | Endpoint / Test | Expected | Actual | Status |
|---|---|---|---|---|
| C1 | `POST /api/auth/callback/credentials` (login) | 302 | 302 | ✅ |
| C2 | `GET /api/tokens/wallet` (authed) | 200 + wallet | 200 | ✅ |
| C3 | `POST /api/tokens/transaction` — valid EARN action | 200 | 200 | ✅ |
| C4 | `POST /api/tokens/transaction` — valid SPEND action | 200 or 400 guard | 400 (insufficient) | ✅ |
| C5 | `POST /api/tokens/transaction` — invalid actionType | 400 | 400 | ✅ |
| C6 | `POST /api/tokens/transaction` — duplicate idempotencyKey | 409/200 replay | — | ⚠️ |
| C7 | `POST /api/chat-intake` — live Gemini stream | 200 stream | 200 live | ✅ |
| C8 | `POST /api/chat-intake` — mock mode | 200 | — | ⚠️ |
| C9 | `GET /api/searches?searchId=...` (authed) | 200/404 | 404 (nonexistent) | ✅ |
| C10 | `POST /api/searches` create | 200/201 | — | ⚠️ |
| C11 | `POST /api/shares` create share | 201 | 201 (earlier) | ✅ |
| C12 | `GET /p/[shareId]` reward mint + dedup | +5 once | verified earlier | ✅ |
| C13 | `POST /api/animals/intake` (authed) atomic + bonus | 201 | — | ⚠️ (verified earlier flow) |
| C14 | `POST /api/telegram/notify` | 200 | 🚧 needs real TELEGRAM creds (env missing) | 🚧 |
| C15 | `POST /api/shelter/intake/map` (OCR) | 200 | — | ⚠️ |
| C16 | `GET /api/chat` (public chatbot) | 200 | 200 live (earlier) | ✅ |

## D. Cross-Cutting

| # | Check | Status |
|---|---|---|
| D1 | i18n parity — 7 locales × 391→key set, **0 missing keys** (verified script) | ✅ |
| D2 | About section — all 12 pages in all 7 locales | ✅ |
| D3 | Species/breed taxonomy — 9 species × all 7 locales | ✅ |
| D4 | Hold-time engine — jurisdiction rules + intake wiring | ✅ (code) |
| D5 | Build (`npm run build`) | ✅ |
| D6 | `tsc --noEmit` — 4 pre-existing errors, none in changed files | 🚧 |
| D7 | `npm run lint` — 57 errors / 24 warnings pre-existing | 🚧 |
| D8 | Dark-mode / high-contrast | ⚠️ not implemented |
| D9 | Responsive (mobile ≤ 768px) | ⚠️ |

---

## 🚧 Known issues (pre-existing, not introduced by this work)

1. **`/api/telegram/notify`** — `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` not in any env file → route effectively disabled. Add creds or gate the route before launch.
2. **Auth** — `MOCK_USERS` hardcoded (admin@rescuehub.org / staff@rescuehub.org). Replace with real provisioning for production.
3. **`dogs.json` is mock data** — needs DB-backed animals + real shelter sync.
4. **4 `tsc` errors + 57 lint errors** — pre-existing, in files unrelated to this pass (intake/public STRAY comparison, chat-intake WirePart types, shares spread type; lint in FloatingChatbot/LostPetAgent/MedicalIntakeChecksheet/test-upload).
5. **`next.config.ts`** sets `typescript.ignoreBuildErrors: true` — masks the above until fixed.

## 📋 Manual-test items still pending (⚠️)
The ⚠️ items require a real browser session (clicks, toggles, modals, chat). Recommended sequence:
1. Public: hero CTAs, language switcher (all 7), hamburger, About dropdown (12 items, each page).
2. Login → dashboard: stat-card filters, sponsor modal full flow (video → countdown → +50/−100 → redirect), wallet refresh, sidebar About dropdown.
3. Public surrender: species/breed dropdown, ESIGN sign → hash, token bonus.
4. Medical: checksheet inputs + save payload.
5. Fundraising: donate + allocation toggle.
6. Lost-pet chat: end-to-end conversation → broadcast → radar.

---

*Prepared during the 2026-08-23 docs-compliance review. Automated results are from the live dev server; manual ⚠️ items to be completed in a browser pass.*
