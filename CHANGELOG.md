# Changelog

## v3.0.0 — Phase 6: Conversational UI & Lost Pet Chatbot (2026-06-15)

### Added
- **Native React Chat Component (`FloatingChatbot.tsx`)** — Complete rewrite of the conversational AI interface. Replaced the broken `@ai-sdk/react` `useChat` hook with pure React state management using `useState` + `useCallback`. The component initializes with the assistant's empathetic greeting and manages messages, input, and loading state entirely through local state.

- **Manual Streaming via `fetch` + `ReadableStream`** — User messages are sent with `fetch('/api/chat', { method: 'POST', body: JSON.stringify({ messages }) })`. The response is processed through `ReadableStream.getReader()` and `TextDecoder`, appending assistant responses chunk by chunk as they stream in, providing real-time character-by-character feedback.

- **Gemini 3.5 Flash Backend (`app/api/chat/route.ts`)** — Server-side API route using `@ai-sdk/google` `streamText()` with `google("gemini-3.5-flash")`. Handles streaming text generation with a calming RescueHub system prompt. Returns `result.toTextStreamResponse()` for native ReadableStream consumption by the frontend.

### Fixed
- **`@ai-sdk/react` `useChat` Hook Failure** — The Vercel AI SDK's `useChat` hook was failing to initialize silently in the Next.js 15 environment. This manifested as the chat being completely dead — inputs swallowed, no responses generated, no console errors. Replaced entirely with native React state management, bypassing the SDK dependency layer entirely.

- **Next.js 15 Server Action Hijack** — The rewrite avoids any Server Action interception by using a standard `fetch()` POST to the `/api/chat` route, keeping the streaming connection in the client-side rendering path.

### Architecture
- `frontend/src/components/chat/FloatingChatbot.tsx` — Pure React component, no external AI SDK dependencies. Uses `useState<Message[]>`, `useState(input)`, `useState(isLoading)`, and `useCallback(sendMessage)`.
- `frontend/app/api/chat/route.ts` — Node.js runtime, `force-dynamic`, 60s max duration. Accepts `{ messages }` body, streams via `google("gemini-3.5-flash")`.

### Compliance & UX
- Assistant greeting provides empathetic, calming language to distressed pet owners per EPIC 1 requirements.
- Typing indicator (bouncing dots) during streaming, smooth-scroll to newest message.
- Inline error messages appended to chat on fetch failure — no silent failures.

### Next Sprint
- EPIC 2 (Phase 7): Viral Growth & Token Gateway

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