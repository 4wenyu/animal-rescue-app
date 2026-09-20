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

- [ ] **N0 — Live Petfinder roster (NEXT)** — Get Petfinder Partners keys + `PETFINDER_ORG_ID` for one pilot shelter; set env on Vercel; staff `POST /api/admin/petfinder-sync`; drop JSON fallback when `NEXT_PUBLIC_SITE_MODE=live`. Optional later: Shelterluv if the shelter uses it.
- [ ] **N1 — Persist lost-pet chat drafts server-side** — highest remaining UX risk (drafts die on refresh)
- [ ] **N2 — Richer staff share-evidence UI** — more than a bare URL for `/shares/review`
- [ ] **N3 — Epic 3 backlog: SMS/Telegram radius alerts** — last-seen lat/lng, not cold DMs
- [ ] **N4 — Stripe webhooks** — replace success-URL confirm for fundraising
- [ ] **N5 — Operator hardening** — real shelter photos/hours; Telegram keys or accept record-only; rotate LLM keys; Sentry; Redis before multi-instance

## 🚀 In progress

- [ ] Sprint kickoff: board + agent roles + Petfinder next-item (2026-09-19)

## ✅ Done (recent)

- [x] MVP loop close — sponsor-search server path, LLM router, share review, adopt conversion (2026-09-19)
- [x] Google OAuth citizen login + Vercel preview envs
- [x] Merge to `main` (`c6c19b1`)
- [x] Repo cleanup — dual lockfile/`node_modules`, dead root `src`, generated prisma dump, duplicate archive review, temp logs (~320MB)

## 🔵 Epics (status)

- [x] **EPIC 1** — UI Polish & Global Localization · COMPLETE
- [x] **EPIC 2** — Viral Token & Brand Sponsorship Gateway · CLOSED
- [ ] **EPIC 3** — Autonomous Outreach Engine · FOUNDATION MERGED — open: geo + radius SMS/Telegram
- [ ] **EPIC 4** — Wide-Net Search Engine · READY — Petfinder stub live; needs keys + crawler depth

## 🔶 Blocked / archive

- [ ] 3D WebGL hero — archived on `archive/3d-webgl`; replace with 2D CSS mesh if desired
- [ ] Social-media scouring / cold outreach — do **not** schedule next (ToS + 513(i))

%% kanban:settings
```
{"kanban-plugin":"basic","list-collapse":[false,false,false,false,false,false]}
```
%%
