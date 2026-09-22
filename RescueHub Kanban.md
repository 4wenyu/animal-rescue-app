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

- [ ] **N0 — Pilot roster data path** — Petfinder **public API shut down Dec 2025**. **CSV ingest ready** (`/staff/roster`, `POST /api/admin/roster-csv`). Still waiting on SoCal pilot emails (Riverside DAS, SB City, Kitty Devore) for a real export. Keep `dogs.json` seed until then.

## 🚀 In progress

- [ ] **N0** — CSV import path shipped; awaiting pilot CSV / partner feed

## ✅ Done (recent)

- [x] **N5 — Operator hardening** (2026-09-20) — Upstash rate limits, Sentry hook, `/staff/ops`, Telegram honesty banner, operator checklist
- [x] **N4 — Stripe webhooks** (2026-09-20) — `checkout.session.completed` → idempotent fulfill; confirm URL is fallback only
- [x] **N3 — SMS/Telegram radius alerts** (2026-09-21) — geocode last-seen → queue drafts for opted-in helpers in radius; staff still gates send; Telegram and Twilio SMS on approve when configured
- [x] **N2 — Richer staff share-evidence UI** (2026-09-20) — tracking + proof links, radar/animal, reject note on `/shares/review`
- [x] **N1 — Persist lost-pet chat drafts server-side** (2026-09-20) — `LostPetIntakeDraft` + `/api/lost-pet-drafts`; localStorage fallback for anonymous; merge by `savedAt`
- [x] MVP loop close — sponsor-search server path, LLM router, share review, adopt conversion (2026-09-19)
- [x] Google OAuth citizen login + Vercel preview envs
- [x] Merge to `main` + push helper script
- [x] Repo cleanup — dual lockfile/`node_modules`, dead leftovers (~320MB)

## 🔵 Epics (status)

- [x] **EPIC 1** — UI Polish & Global Localization · COMPLETE
- [x] **EPIC 2** — Viral Token & Brand Sponsorship Gateway · CLOSED
- [ ] **EPIC 3** — Autonomous Outreach Engine · FOUNDATION + N3 radius — SMS + Telegram delivery in code (env-gated); draft persistence done
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
