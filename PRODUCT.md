# Product

## Register
product

## Users
Four distinct audiences, each with a different job:

- **Anxious pet owners** — someone who just lost a pet. Job: report the lost pet fast (chat-first), start a token-funded search, track it on a radar page, and share it to mobilize their community. State: high stress, low patience for forms.
- **Compassionate helpers** — adopters, fosters, volunteers, donors, transporters. Job: see animals that need them (nearby at-risk animals), act in one or two clicks, and control exactly how the system may contact them (opt-in outreach).
- **Shelter staff** — intake officers, medical, admin. Job: run intake (public + county), track statutory stray holds, review medical status, and act as the human gate for anything the autonomous agent proposes.
- **Corporate sponsors** — Job: underwrite search/sponsor credits through IRC § 513(i)-compliant, value-neutral acknowledgment; no calls-to-action, no fund mixing.

## Product Purpose
RescueHub is an **autonomous animal-rescue agent**, not just an adoption feed. Its purpose, from the original record (Idea.md): help lost-pet owners search across the internet; help shelter animals at risk of euthanasia find owners; and do it with **autonomous capabilities** — scouring social media to find animal lovers, analyzing their content to confirm they care, and proactively reaching out with the rescue site, a nearby at-risk animal, and a concrete ask (donate / volunteer / foster / adopt).

The **true MVP** closes the core loop end-to-end, safely and honestly:

> A lost pet is reported via chat → a token-funded search starts → results stream to a radar page → sharing mints tokens and (at 10 verified shares) unlocks a free search → a sponsor acknowledgment underwrites the spend — and a citizen can opt in to let the autonomous agent reach out about nearby at-risk animals, with a human staff review before anything is sent.

Success looks like: a single pilot shelter runs the full loop without compliance risk (stray holds, ESIGN, 513(i)), and the autonomous outreach agent demonstrably connects helpers to at-risk animals — opt-in only, unsubscribe-able, honestly labeled.

## Brand Personality
Warm, trustworthy, urgent-but-hopeful. (Emerald = trust/action, amber = urgent-but-hopeful, slate = calm neutrality, reserved red = true danger.)

## Anti-references
- **Doom-scrolling rescue feeds** that overwhelm with tragedy and no clear action — every urgent signal must pair with an actionable step.
- **Spammy autonomous outreach** — cold-messaging strangers, fabricated follower counts, or agent messages impersonating a human volunteer. Outreach is opt-in, human-gated, and always labeled as automated (stage 1).
- **Fake self-verification** — letting users mark their own shares "verified" to farm free searches, or minting tokens from client-supplied directions/amounts.
- **Bureaucratic legal forms** — ESIGN/waiver/hold surfaces must be present and accurate but phrased human-first.
- **Placeholder/fabricated stats** — dashboards must show real wallet balances, real hold times, real share counts ("—" instead of invented numbers).

## Design Principles
1. **Empathy over efficiency** — a person reporting a lost pet is in distress; the experience must be calm, supportive, and hopeful.
2. **Urgency with dignity** — time-based urgency is honest and always paired with a next step (donate / share / foster / adopt).
3. **Compliance without intimidation** — Hayden Act stray holds, ESIGN/UETA waivers, and IRC § 513(i) sponsor acknowledgment are built into the product, not bolted on; never trust a client-supplied hold-cleared flag.
4. **The ledger is truth** — token balance is the sum of signed ledger rows; every mutation is atomic and idempotent; EXPIRE is a burn, never a mint.
5. **Humans gate the agent** — the autonomous agent drafts; STAFF/ADMIN approve; nothing is delivered or "verified" without a human in the loop.
6. **Server > client for trust** — RBAC and policy (SPEND-only client surface, PENDING-forced share status, server-side holds) are enforced on the server, never in the browser.

## Accessibility & Inclusion
- Target **WCAG 2.2 AA**: contrast (slate-600 body on white ≈ 4.5:1), visible focus rings, reduced-motion support, screen-reader labels on all icon-only buttons.
- Native elements where possible (`<select>`, `<button>`, real checkboxes) so keyboard + screen-reader users get standard behavior; `aria-haspopup`/`aria-expanded`/`role` on custom menus.
- Multi-language UI: en, es, zh-CN, zh-TW, ja, ko (+ legacy zh alias), synced across all 7 locale files with no missing keys.
- Legal/medical text (waivers, medical checksheets) remains selectable and untruncated; urgent timers are never the only signal (always paired with text + action).
- Language should stay human-first on legal surfaces — compliance present, intimidation absent.
