# Changelog

## v2.2.0 — Native React Chat Rewrite + Gemini Integration (2026-06-15)

### Bug Fixes
- **@ai-sdk/react `useChat` hook eliminated** — The Vercel AI SDK's `useChat` was completely dead in Next.js 15, failing to initialize and silently swallowing user inputs. Ripped out all imports and replaced with pure React state management (`useState`, `useCallback`, `useRef`).
- **Server Action hijack bypassed** — Removed dependency on Vercel SDK's internal message pipeline that was being intercepted by Next.js 15 Server Actions. Native fetch() to `/api/chat` now routes directly to the streaming endpoint without SDK middleware interference.

### Added
- **Pure React chat state** — Messages, input, and isLoading managed via `useState` with a self-generating `nextId()` counter for stable message keys.
- **Native ReadableStream consumption** — Chatbot reads the streaming response chunk-by-chunk via `getReader()` + `TextDecoder`, appending assistant text incrementally for real-time streaming feel.
- **Gemini 3.5 Flash backend** — API route (`app/api/chat/route.ts`) uses `@ai-sdk/google` `streamText()` targeting `google("gemini-3.5-flash")` with empathetic RescueHub system prompt. Returns a `toTextStreamResponse()` for native streaming.
- **Emotional UI flow** — Assistant greeting initialized immediately in message state. Typing indicator (3 bouncing dots) shows during loading. Error messages inline in chat with details from the fetch error.
- **Form-based submission** — Input wrapped in `<form onSubmit>` so both Enter key and Send button go through a single `handleSubmit` handler. Disabled state prevents double-fire during loading.

### Changed
- **`FloatingChatbot.tsx`** — Full rewrite: removed `useChat` / `handleInputChange` / `append` from `@ai-sdk/react`. Replaced with `messages`, `input`, `isLoading` local state. Stream reading via low-level `Response.body.getReader()`.
- **`app/api/chat/route.ts`** — New API endpoint with `force-dynamic`, `maxDuration: 60`, Gemini 3.5 Flash model, and structured error handling returning 500 JSON on failure.

### Architecture
- Frontend → `/api/chat` now flows: user message → `fetch()` POST → `streamText()` on Gemini → `ReadableStream` → chunk-by-chunk render. Zero Vercel SDK client-side dependency.

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

|### Next Sprint
|- EPIC 2: Viral Growth & Token Gateway, EPIC 3: Autonomous Outreach Engine, EPIC 4: Wide-Net Search Engine.