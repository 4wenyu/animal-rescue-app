---
kanban-plugin: basic
---

## Ready

- [ ] **EPIC 2**: Viral Growth & Token Gateway
- [ ] **EPIC 3**: Autonomous Outreach Engine
- [ ] **EPIC 4**: Wide-Net Search Engine
- [ ] **TODO**: Apply global i18n to dynamic table data/forms (breed/medical/status chips still bypass t() in some dashboard paths)
- [ ] **TODO**: Reset intake countdown timers (`LiveTimer` per-second timer needs to be cleared on component unmount to avoid orphaned intervals)

## In Progress



## Done

- [x] **Auth Hardlock (2026-06-17) — NextAuth domain mismatch fixed, `authorized` callback contract corrected, login now accepts `admin@rescuehub.org` / `admin123`.
- [x] **Gemini Migration (2026-06-17) — `gemini-3.5-flash` → `gemini-1.5-flash` → `gemini-2.5-flash`. AI SDK v6 `ImagePart` typing fixed (`mimeType` embedded in data URL).
- [x] **BatchUpload Bulletproofing (2026-06-17) — Outer `finally` reset, inner per-file `try/finally` (partial failures no longer lose progress), yellow empty-state alert, staged files auto-clear on success, 2-sec delay skipped after last file.
- [x] **Intake Document Scan route (2026-06-17) — `/(main)/intake/document-scan/page.tsx` mounts `<BatchUpload />` for staff bulk AI extraction. Hub expanded to 3-card grid.
- [x] **`PetIntakeBatchSchema` Zod schema (2026-06-17) — `lib/schemas/intake.ts` with full per-animal extraction contract including `euthanasia_risk_status` enum compliance fields.

# RescueHub — Autonomous AI Animal Rescue Platform

## Architecture Overview

**Goal:** Build an autonomous AI platform for animal rescue — finding lost pets and rehoming shelter animals facing imminent euthanasia (dogs, cats, rabbits, turtles).

**Stack:** Next.js 16.2.7, TypeScript + Tailwind CSS + Shadcn, Prisma (expected), Stripe (expected), Auth.js v5 beta.

**Current State:** Public-facing homepage with HeroMesh, adoption feed, corporate sponsors, navigation, and i18n (en/es/zh). Dashboard, intake, medical, and fundraising routes scaffolded. Conversational AI chatbot (FloatingChatbot) with native React + Gemini 3.5 Flash streaming.

---

## Epic Execution Order (Kanban-aligned)

### ✅ COMPLETE — Phase 1–5 (Hybrid Theme, Compliance, etc.)
- HeroMesh with Indigo→Teal gradient, neon blobs, frosted glass card
- Corporate sponsor section (neutral acknowledgment, IRC § 513(i))
- Adoption feed with euthanasia risk filtering
- i18n infrastructure
- Nav bar with Staff Login

### ✅ COMPLETE — EPIC 1: Conversational UI & "Lost Pet" Intake (Phase 6)
**Problem:** Owners of lost pets are highly anxious, lack patience for standard web forms.

**Engineering Task:** Build a human-like conversational AI interface (chatbot/voice).

**Functionality:**
- ✅ AI conducts calm, empathetic Q&A to collect lost pet data (breed, location, photos, last seen)
- ✅ FloatingChatbot with native React state — replaced broken @ai-sdk/react useChat hook
- ✅ Gemini 3.5 Flash streaming via /api/chat route
- ✅ Initiates search after data collection
- *Future:* Voice-call capabilities

### 📋 EPIC 2: Viral Growth & Token Gateway (Phase 7)
**Problem:** Computing power for massive internet searches costs money; we want maximum accessibility.

**Engineering Task:** Build a dual-path authorization gateway.

**Functionality (Path A — Pay):** Standard Stripe fee to activate AI internet search.

**Functionality (Path B — Viral Loop):**
- User shares RescueHub to 10 local community groups / social platforms
- On verification of sharing → token consumption cost waived
- AI searches for free

**Detailed Backlog Items:**
- **Vision & Flyer Tool (Image upload to PDF generation)** — Allow users to upload photos of their lost pet. The system auto-generates a printable, shareable PDF flyer with the pet's photo, name, last-seen location, and contact info. The flyer can be downloaded or shared directly to social platforms as part of the viral loop verification.

### 📋 EPIC 3: Autonomous Outreach Engine (Phase 8)
**Problem:** Animals are euthanized due to lack of visibility to potential fosters/adopters.

**Engineering Task:** Build an autonomous social media analysis and outreach worker.

**Functionality:**
- Agent autonomously scours social media, analyzes text/images/videos
- Identifies "animal lovers" and responsible pet owners
- Cross-references against influencers and local individuals
- Proactively DMs these users with local at-risk animals
- Asks for donations, fostering, adoption, or retweets/shares

**Detailed Backlog Items:**
- **Geolocation & Radius Alerting (Calculate wandering radius and SMS locals)** — Using the last-seen coordinates gathered during the conversational intake, compute a probable wandering radius based on species, size, and time elapsed. Automatically geolocate nearby shelters, vets, and rescue groups within that radius and trigger SMS/Telegram alerts to subscribers in the area. Integrate with the Telegram notification system already in place.

### 📋 EPIC 4: Wide-Net Search Engine (Phase 9)
**Problem:** Lost pet information scattered across thousands of disparate sites, shelters, forums.

**Engineering Task:** Integrate LLM-driven web-scraping and data-matching.

**Functionality:**
- Using data gathered in Epic 1, AI autonomously crawls internet
- Searches shelter databases, local subreddits, Facebook groups
- Finds potential matches for lost pet
- Alerts the owner on match

**Detailed Backlog Items:**
- **Live Shelter Database Search via API/Scraping** — Build a modular crawler that periodically queries shelter API endpoints (Petfinder API, Shelterluv, municipal animal services) and scrapes lost-and-found boards on subreddits, Facebook groups, and Craigslist. Ingest listings into a searchable index, match against active lost-pet profiles by breed, color, location, and date-range. Send automated match alerts to the pet owner and the nearest matched shelter.

---

## Key Principles
- Execute Epics one at a time — stable, error-free codebase
- Each Epic gets its own Kanban sprint
- Track progress in Project_Board.md and CHANGELOG.md
- Build verification: `npm run build` after every change