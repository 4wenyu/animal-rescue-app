# Cursor Desktop + TeamoRouter / FreeLLMAPI

These APIs fund **LLM compute** for Find My Pet chat. They do **not** mint RescueHub wallet tokens. Wallet grants are server-side (`grantPreviewSearchCredit`, `POST /api/tokens/sponsor-search`).

**Never paste API keys in Cursor chat, `.env` committed to git, or screenshots.**

## 1. App (this repo)

Copy `frontend/.env.example` → `frontend/.env.local` and set **one** gateway:

### TeamoRouter (hosted)

```
TEAMOROUTER_API_KEY=sk-teamo-your-key
TEAMOROUTER_BASE_URL=https://api.teamorouter.com/v1
TEAMOROUTER_MODEL=gemini-3.5-flash
```

Prefer a **flash / free** model (`gemini-3.5-flash`, `deepseek-flash-free`, `glm-5.3-flash-free`) so you do not burn rate limits. Avoid Opus-class models for intake chat.

### FreeLLMAPI (usually local)

```
FREELLMAPI_API_KEY=freellmapi-your-unified-key
FREELLMAPI_BASE_URL=http://localhost:3001/v1
FREELLMAPI_MODEL=auto
```

If FreeLLMAPI is hosted, replace the base URL with that public `/v1` origin.

### Gemini (fallback)

```
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key
```

Restart `npm run dev` after saving. `POST /api/chat` and `/api/chat-intake` send `x-rescuehub-llm: teamorouter|freellmapi|gemini` when live.

## 2. Cursor Desktop (editor agent, optional)

This is separate from the Next.js app.

1. Cursor Settings → **Models**.
2. Add an **OpenAI-compatible** provider.
3. Base URL: `https://api.teamorouter.com/v1` **or** your FreeLLMAPI `/v1` URL.
4. Paste the key in the Cursor secret field (not in this repo).
5. Prefer Composer / Cursor Grok for everyday Agent work so the Pro **Other Models** pool (Claude/GPT) is not emptied. TeamoRouter/FreeLLMAPI are for the **website** chat path.

Windows Credential Manager is the right place for a GitHub PAT. Same rule: not chat, not `.env` in git.

## 3. Rate limits

The app already rate-limits public chat (10/min/IP) and sponsor-search (5/hour/user). If a gateway 429s, switch `TEAMOROUTER_MODEL` to a free/flash id or enable `CHAT_INTAKE_USE_MOCK=true` for UI work without spend.
