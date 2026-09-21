---
kanban-plugin: basic
---

# RescueHub — Active Kanban

> Obsidian vault = this repo (`.obsidian/`). Open this note with the **Kanban** community plugin.  
> Roles: **PM agent** (`.cursor/rules/project-manager.mdc`) · **Lead Engineer/Architect** (`.cursor/rules/lead-engineer-architect.mdc`)  
> Source of truth for gaps: `docs/GAPS_AND_PLAN.md` · Epics: `ROADMAP.md`

## 📥 Backlog

- [ ] **M1** Brand sponsorship & rewarded-ad network (parallel to Epic 3/4 — legal 513(i) first)
- [ ] Charleston compliance geo-map (Phase 5 leftover)
- [ ] Stray hold expiration forecast (Phase 5 leftover)
- [ ] PWA, then Expo (website stays canonical)
- [ ] React Compiler-era lint modernization (55 warnings → promote rules gradually)

## 🎯 Next up (ordered)

- [ ] **N0 — Pilot roster data path** — Petfinder **public API shut down Dec 2025** (no new keys). Waiting on SoCal pilot emails (Riverside DAS, SB City, Kitty Devore). Accept CSV / partner export / manual intake; keep `dogs.json` seed until then. Stub `petfinder-sync` stays for any future member feed.
- [ ] **N4 — Stripe webhooks** — replace success-URL confirm for fundraising
- [ ] **N5 — Operator hardening** — real shelter photos/hours; Telegram keys or accept record-only; rotate LLM keys; Sentry; Redis before multi-instance

## 🚀 In progress

- [ ] **N0** — pilot shelter outreach sent; awaiting replies

## ✅ Done (recent)

- [x] **N3 — SMS/Telegram radius alerts** (2026-09-20) — geocode last-seen → queue drafts for opted-in helpers in radius; staff still gates send; Telegram helper chat optional; SMS deferred
- [x] **N2 — Richer staff share-evidence UI** (2026-09-20) — tracking + proof links, radar/animal, reject note on `/shares/review`
- [x] **N1 — Persist lost-pet chat drafts server-side** (2026-09-20) — `LostPetIntakeDraft` + `/api/lost-pet-drafts`; localStorage fallback for anonymous; merge by `savedAt`
- [x] MVP loop close — sponsor-search server path, LLM router, share review, adopt conversion (2026-09-19)
- [x] Google OAuth citizen login + Vercel preview envs
- [x] Merge to `main` + push helper script
- [x] Repo cleanup — dual lockfile/`node_modules`, dead leftovers (~320MB)

## 🔵 Epics (status)

- [x] **EPIC 1** — UI Polish & Global Localization · COMPLETE
- [x] **EPIC 2** — Viral Token & Brand Sponsorship Gateway · CLOSED
- [ ] **EPIC 3** — Autonomous Outreach Engine · FOUNDATION + N3 radius — open: SMS/Twilio; draft persistence + radius Telegram drafts done
- [ ] **EPIC 4** — Wide-Net Search Engine · public Petfinder API gone; pilot CSV/partner path instead

## 🔶 Blocked / archive

- [ ] 3D WebGL hero — archived on `archive/3d-webgl`; replace with 2D CSS mesh if desired
- [ ] Social-media scouring / cold outreach — do **not** schedule next (ToS + 513(i))
- [ ] Petfinder Partners self-serve API keys — **retired by Petfinder** (Dec 2025)

%% kanban:settings
```
{"kanban-plugin":"basic","list-collapse":[false,false,false,false,false,false]}
```
%%
