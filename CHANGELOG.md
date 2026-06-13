# Changelog

## v2.1.0 — Phase 1: Public Home Page (2026-06-11)

### Added
- **Public-Facing Home Page** (`app/page.tsx`) — A premium, standalone landing page outside the staff sidebar layout. Serves as the platform's public entry point with four compliance-enforced sections.

- **Adoption Broadcast Feed** — Displays adoptable animals from the roster. Structurally excludes any animal flagged with `euthanasia_risk_status: IMMEDIATE_BEHAVIORAL` via the `getAdoptableAnimals()` data-layer filter (§ 1.1 Behavioral Euthanasia Exception compliance).

- **Corporate Sponsor Section** — Strict NEUTRAL_ACKNOWLEDGMENT mode (IRC § 513(i) Qualified Sponsorship Payment). Four sponsors displayed with static logo placeholders, value-neutral factual descriptions, and zero calls to action. Includes a compliance footnote documenting the tax-exempt classification.

- **Public Surrender Navigation Entry Point** — Hero card + navbar link pointing to `/intake/public`. Links to the existing ESIGN/UETA-compliant public surrender workflow.

- **Emergency Crowdfunding Navigation Entry Point** — Hero CTA + quick-action card pointing to `/fundraising`. Links to the existing fundraising campaign pages.

### Changed
- **`dogs.json`** — Expanded from 5 to 12 animals. Added `euthanasia_risk_status` field (enum: `SAFE`, `AT_RISK`, `IMMEDIATE_BEHAVIORAL`) required for the adoption feed compliance filter.

- **`app/layout.tsx`** — Updated metadata title and description to reflect the platform's broader scope as a compliance engine, not just a dashboard.

### Compliance Rules Implemented
1. **§ 1.1 Behavioral Euthanasia Exception** — `IMMEDIATE_BEHAVIORAL`-flagged animals are structurally excluded from the public adoption broadcast feed at the data layer. They never reach the render tree.
2. **§ 3.2 NEUTRAL_ACKNOWLEDGMENT (UBIT-safe)** — Sponsor section uses only value-neutral descriptions, static logo placeholders, and zero calls to action. No pricing, savings, endorsements, or inducement language — satisfying IRC § 513(i) QSP safe harbor.
3. **Charleston Principles** — Footer includes jurisdictional disclosure for multi-state charitable solicitation compliance.
4. **Chain of Custody** — Surrender portal link preserves the existing ESIGN/UETA waiver chain of custody for property rights transfer.

### Next Sprint
- Phase 2: Dashboard Triage Table — Kanban-style triage board on the internal dashboard with intake status, stray hold clock, behavioral risk level, and medical priority.