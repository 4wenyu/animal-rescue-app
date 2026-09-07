# RescueHub — UI/UX Redesign & Background / 2D–3D Recommendation

**Date:** 2026-08-23 · **Audience:** product + engineering
**Scope:** background animation & imagery, 2D vs 3D strategy, visual identity refinement, performance budget.
**Status:** recommendation only — no code in this file. A concrete build plan is at the end.

---

## 1. Current state (what actually exists)

- **Hero (`/`):** 2D CSS mesh-gradient (`HeroMesh.tsx`) — indigo→teal with 3 neon blobs (`mix-blend-screen` + 140px blur), 8 floating lucide icons (Dog/Cat/Paw/Bone/Heart/Hexagon) with CSS float keyframes, plus an SVG noise overlay. Content sits in a frosted `bg-white/70 backdrop-blur-xl` card.
- **Motion system:** `framer-motion` (v12) — entrance animations on hero + `whileInView` reveals on sections.
- **3D tooling:** `three@0.184`, `@react-three/fiber@9`, `@react-three/drei@10` are **installed but never imported** — zero usage, pure bundle dead-weight today.
- **Identity:** emerald primary, slate neutrals, amber for AT_RISK, red for IMMEDIATE_BEHAVIORAL. Tailwind v4.

### Honest critique of the current hero

| Aspect | Issue |
|---|---|
| Palette | **Indigo→teal + magenta/cyan neon clashes with the app's emerald identity.** Reads "SaaS dashboard", not "rescue". |
| Perf | 3 × `blur-[140px]` on `40rem` circles + 8 infinite-float icon layers = **heavy GPU work**, janky on low-end mobiles, blocks compositing. |
| Reduced motion | `animate-pulse`, CSS float keyframes — **no `prefers-reduced-motion` guard**. |
| Brand story | Abstract blobs/icons say nothing about **real animals needing homes**. Rescue converts with *real photos + urgency*, not neon. |
| Bundle | `three`+R3F+drei (~200–350 KB) shipped but unused. Either use it or remove it. |

---

## 2. Guiding principles (for a rescue brand)

1. **Calm + hopeful, never frantic.** The user may be in distress (lost pet) or guilt-weighted (surrender). Backgrounds must recede, breathe slowly, and feel warm.
2. **Real animals are the hero, animation is the supporting cast.** Photos of real shelter animals beat any abstract 3D scene for conversion and empathy.
3. **Emotion through light + depth, not color noise.** Think: soft dawn light, drifting dust motes, gentle parallax — not flashing blobs.
4. **Performance is a feature.** Every animated layer costs mobile battery and LCP/CLS budget. If it doesn't add emotional value, remove it.
5. **One identity, everywhere.** A single semantic token set (action/urgent/find) so hero, dashboard, and mobile app feel like one product.

---

## 3. Background & imagery recommendation (2D-first)

### 3.1 Replace the CSS mesh with a brand-aligned, GPU-cheap "aurora" system

- **Palette shift:** indigo→teal → **soft emerald + warm peach + sky**, low saturation. Use Tailwind v4 semantic tokens (`--color-action`, `--color-urgent`, `--color-find`) instead of raw hex so the whole product stays consistent.
- **Cheaper blur:** replace `blur-[140px]` on huge elements with **pre-blurred radial-gradient layers** (`background: radial-gradient(...)`), which the GPU rasterizes once instead of re-blurring every frame. This alone removes most mobile jank.
- **Noise overlay:** keep (it adds film grain cheaply) — it's already a static data-URI; just reduce to `opacity-[0.04]`.

### 3.2 Layered depth (parallax) instead of floating icons

- Replace the 8 floating lucide icons with **2–3 depth layers**: far (slow drift), mid (parallax on scroll via `framer-motion useScroll/useTransform`), near (larger, more motion). Depth reads "premium"; the icon zoo reads "clip-art".
- Use **3–4 recognizable silhouettes** (paw, a dog, a cat, a heart) as large, very-low-opacity SVG shapes — fewer, bigger, calmer.

### 3.3 Add a lightweight canvas particle layer (optional, tasteful)

- A tiny `<canvas>` (no library, <120 lines) of slowly drifting **paw-print/dust motes**, capped by devicePixelRatio (max 1.5) and **paused when off-screen or `prefers-reduced-motion`**. This is the single highest-ROI "alive" background upgrade.

### 3.4 Imagery system (bigger win than any animation)

- **Hero:** one real, emotionally strong shelter photo as a full-bleed backdrop with a warm gradient scrim (left-dark for text). Use `next/image` with `priority` + `blurDataURL` + `sizes` — this fixes LCP too.
- **Adoption feed:** photo-first cards (currently breeds are name/breed text-heavy). Real photo + "still available" live badge + age/sex chips.
- **Lost-pet flow:** photo + last-seen map dominate; add a gentle "searching" pulse around the radar.

---

## 4. 2D vs 3D — the honest answer

### Recommendation: **2D-first, 3D-sparingly, WebGL-as-island**

| Use case | 2D | 3D (WebGL) |
|---|---|---|
| Hero background | ✅ default — aurora + parallax + particles | Only as a **small accent island**, never full-bleed |
| Brand emblem | ✅ SVG paw/heart | A slow-rotating low-poly **paw/globe** is a nice hero accent |
| Animal cards | ✅ photos + depth on hover | ❌ 3D animal models = uncanny + heavy |
| Data viz (radar/searches) | ✅ charts/SVG | Maybe a 3D "reach radius" globe on the radar page (optional) |
| Dashboard staff | ✅ calm, no background | ❌ staff need speed, not spectacle |

### Why not full WebGL everywhere
- **Bundle:** three+R3F+drei is ~200–350 KB min+gzip added to the route that uses it → must be **lazy-loaded** (`next/dynamic`) so it only loads on the pages that need it.
- **Mobile battery:** WebGL at 60fps is a battery drain; shelters' donated/older devices are common.
- **Emotion:** rescue = empathy + urgency. Abstract 3D can feel cold. Reserve 3D for a *single* memorable signature moment.

### The one signature 3D moment I recommend
A **small, slow-rotating low-poly paw (or heart) emblem** floating above the hero CTA, built with R3F + drei `<Float>` + `<MeshDistortMaterial>` — soft, rounded, matte (not shiny/neon). ~150 lines, lazy-loaded as an island, `pointer-events-none`. It gives "wow, it's 3D" without dominating or hurting perf. `prefers-reduced-motion` → render a static gradient badge instead.

---

## 5. Motion & micro-interaction polish (framer-motion, already installed)

- **Scroll choreography:** hero content parallax + section `whileInView` (already partly there) — extend with `useScroll` + `useTransform` for a subtle rise-and-fade on cards.
- **Hover/tap:** scale CTAs `active:scale-0.97` (already); add card hover lift + shadow, button micro-press.
- **Page transitions:** App Router `template.tsx` + a 200ms fade/slide — gives the app a cohesive feel with ~10 lines.
- **LiveTimer urgency:** add a slow pulse to the overdue state (already `animate-pulse`) but keep the active state static.
- **Sponsor modal:** the 5s countdown is already animated; keep it calm, add a soft "acknowledged ✓" success animation.

### Reduced-motion contract (mandatory)
- Wrap all non-essential animation in `@media (prefers-reduced-motion: reduce)` → disable float/parallax/pulse/canvas; keep opacity fades only.
- `framer-motion` has `MotionConfig reducedMotion="user"` — one line, huge a11y win.

---

## 6. Performance budget (the guardrails)

| Metric | Budget | How |
|---|---|---|
| LCP (hero) | < 2.0s mobile 3G | real photo via `next/image` priority; no blocking JS for bg |
| CLS | 0 | reserve hero height (`h-[85vh]` → min-h + aspect locked); no late-layout images |
| JS per page | hero ≤ 350 KB gzip | lazy-load 3D island + particles only on `/` |
| GPU | ~1 animated layer visible at a time on mobile | replace blur-heavies with pre-blurred gradients; cap DPR |
| Idle battery | no continuous 60fps fullscreen | pause canvas when tab hidden / off-viewport; use `requestAnimationFrame` with visibility guard |
| Bundle | no unused libs | **either ship the 3D island or remove three/R3F/drei** — decide this first |

---

## 7. Concrete build plan (ordered)

**Step 0 — Decide the 3D fate.** Given it's already installed and unused, I recommend **using it for the signature paw emblem** (removes dead weight by making it real). If you'd rather stay 100% 2D, uninstall `three`+R3F+drei to cut bundle.

**Step 1 — Brand the aurora (½ day).** Rewrite `HeroMesh` → emerald/peach/sky radial-gradient layers + static SVG noise + 3-depth parallax via framer-motion. Remove neon blob technique. Add `MotionConfig reducedMotion="user"`.

**Step 2 — Canvas particles (½ day).** Tiny paw-mote canvas, DPR-capped, visibility-paused.

**Step 3 — Signature 3D emblem (1 day).** `PawEmblem.tsx` (R3F + drei, `<Float>` + soft distortion), lazy-loaded via `next/dynamic` with `ssr:false`, `prefers-reduced-motion` fallback.

**Step 4 — Photo-first imagery (1–2 days).** Real shelter photos: hero backdrop + adoption cards + `next/image` everywhere (priority/blurDataURL/sizes). This is the biggest conversion + LCP win.

**Step 5 — Motion polish (1 day).** Page transitions (template), card hovers, sponsor success animation, LiveTimer keep-calm.

**Step 6 — Perf audit (½ day).** Lighthouse mobile (LCP/CLS/TBT), bundle analyzer (remove any unused `three` subtree), real-device battery check, reduced-motion QA.

**Ordering rationale:** Step 0 unblocks bundle health; Steps 1–3 deliver the "wow" the user asked about (background + 2D/3D); Step 4 is the *real* conversion lever; Steps 5–6 harden it.

---

## 8. Summary (the 30-second answer)

- **Direction:** swap neon SaaS blobs for a **calm, brand-aligned aurora + parallax + drifting paw-particles** (2D), add **one lazy-loaded 3D signature emblem** (not full-screen 3D), and let **real photos** carry the emotional weight.
- **Do NOT:** full-screen WebGL, 3D animal models, flashing blobs, heavy blurs on mobile.
- **Perf first:** pre-blurred gradients, DPR-capped canvas, reduced-motion contract, lazy 3D — or don't ship it.
- **Libraries:** keep `three`/R3F/drei only if you adopt the 3D island (recommended); otherwise uninstall them.
