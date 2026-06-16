---

kanban-plugin: board

---

## Ready

- [ ] **EPIC 2**: Viral Growth & Token Gateway
- [ ] **EPIC 3**: Autonomous Outreach Engine
- [ ] **EPIC 4**: Wide-Net Search Engine


## In Progress


## RescueHub — Autonomous AI Animal Rescue Platform


## Architecture Overview

**Goal:** Build an autonomous AI platform for animal rescue — finding lost pets and rehoming shelter animals facing imminent euthanasia (dogs, cats, rabbits, turtles).

**Stack:** Next.js 16.2.7, TypeScript + Tailwind CSS + Shadcn, Prisma (expected), Stripe (expected), Auth.js v5 beta.

**Current State:** Public-facing homepage with HeroMesh, adoption feed, corporate sponsors, navigation, and i18n (en/es/zh). Dashboard, intake, medical, and fundraising routes scaffolded. Conversational Lost Pet chatbot live with Gemini 3.5 Flash streaming.

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

**Backlog Additions:**
- **Vision & Flyer Tool** — Image upload to PDF generation. Users upload photos of their lost pet; the system auto-generates a printable flyer with pet photo, description, contact info, and QR code linking to the RescueHub search page.

### 📋 EPIC 3: Autonomous Outreach Engine (Phase 8)
**Problem:** Animals are euthanized due to lack of visibility to potential fosters/adopters.

**Engineering Task:** Build an autonomous social media analysis and outreach worker.

**Functionality:**
- Agent autonomously scours social media, analyzes text/images/videos
- Identifies "animal lovers" and responsible pet owners
- Cross-references against influencers and local individuals
- Proactively DMs these users with local at-risk animals
- Asks for donations, fostering, adoption, or retweets/shares

**Backlog Additions:**
- **Geolocation & Radius Alerting** — Calculate wandering radius from last-seen location and send SMS/alerts to locals within that radius via Twilio or similar. Integrates with the conversational intake data (last-seen coordinates, pet description).

### 📋 EPIC 4: Wide-Net Search Engine (Phase 9)
**Problem:** Lost pet information scattered across thousands of disparate sites, shelters, forums.

**Engineering Task:** Integrate LLM-driven web-scraping and data-matching.

**Functionality:**
- Using data gathered in Epic 1, AI autonomously crawls internet
- Searches shelter databases, local subreddits, Facebook groups
- Finds potential matches for lost pet
- Alerts the owner on match

**Backlog Additions:**
- **Live Shelter Database Search via API/Scraping** — Detailed implementation: integrate with Petfinder API, 24Petwatch, municipal shelter databases, and county animal control feeds. Use LLM-powered matching to cross-reference lost pet descriptions (breed, color, location, date) against live shelter intake records. Auto-alert the owner on potential match with confidence score.

---

## Key Principles
- Execute Epics one at a time — stable, error-free codebase
- Each Epic gets its own Kanban sprint
- Track progress in Project_Board.md and CHANGELOG.md
- Build verification: `npm run build` after every change



%% kanban:settings
```
{"kanban-plugin":"board","list-collapse":[null,null,null]}
```
%%