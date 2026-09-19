# Cursor Desktop + TeamoRouter / FreeLLMAPI

These APIs fund **LLM compute** for Find My Pet chat. They do **not** mint RescueHub wallet tokens. Wallet grants are server-side (`grantPreviewSearchCredit`, `POST /api/tokens/sponsor-search`).

**Never paste API keys in Cursor chat, `.env` committed to git, or screenshots.**

There are **three separate places**. Filling one does not fill the others.

| Place | What it powers | Required? |
|---|---|---|
| `frontend/.env.local` | The RescueHub website (`/api/chat`, `/api/chat-intake`) | Yes, for live Find My Pet |
| Cursor Desktop → Settings → **API Keys** | The **editor** Agent / Chat models on your laptop | No. Optional. Does not feed the website. |
| This Cloud Agent box | Remote coding VM | No. Do not put TeamoRouter/FreeLLMAPI keys here. |

Cursor Desktop API Keys **never** reach Next.js. The site only reads `frontend/.env.local`.

## 1. App (this repo) — put keys here

On **your** machine (Cursor Desktop checkout), copy `frontend/.env.example` → `frontend/.env.local` and set **one** gateway.

This Cloud Agent workspace has **no** `.env.local`. Keys on your laptop are not copied here (gitignores `.env*`).

### TeamoRouter (hosted)

```
TEAMOROUTER_API_KEY=sk-teamo-your-key
TEAMOROUTER_BASE_URL=https://api.teamorouter.com/v1
TEAMOROUTER_MODEL=gemini-3.5-flash
```

Official host is **`api.teamorouter.com`**, not `api.teamorouter.cc` (that hostname does not resolve). OpenAI-compatible clients need the **`/v1`** suffix.

Prefer a **flash / free** model (`gemini-3.5-flash`, `deepseek-flash-free`, `glm-5.3-flash-free`) so you do not burn rate limits. Avoid Opus-class models for intake chat.

### FreeLLMAPI (not a Cursor Settings field)

Cursor Settings → API Keys only has OpenAI / Anthropic / Google slots. **FreeLLMAPI is not configured there.**

1. Run [FreeLLMAPI](https://github.com/tashfeenahmed/freellmapi) locally (default `http://localhost:3001`).
2. Put the **unified key** in `frontend/.env.local`:

```
FREELLMAPI_API_KEY=freellmapi-your-unified-key
FREELLMAPI_BASE_URL=http://localhost:3001/v1
FREELLMAPI_MODEL=auto
```

If FreeLLMAPI is hosted, replace the base URL with that public `/v1` origin.

You do **not** need FreeLLMAPI if TeamoRouter is already set. The app prefers TeamoRouter when `TEAMOROUTER_API_KEY` is present.

### Gemini (fallback)

```
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key
```

Restart `npm run dev` after saving. `POST /api/chat` and `/api/chat-intake` send `x-rescuehub-llm: teamorouter|freellmapi|gemini` when live.

### Probe keys without printing them

```bash
cd frontend
npm run llm:probe
```

Reports host reachability and HTTP status only. Never paste the output if you edited it to include a key.

## 2. Cursor Desktop (editor only, optional)

The screenshot of **Settings → API Keys** is for the **editor**, not RescueHub.

To actually use a TeamoRouter key in Desktop Chat/Agent:

1. **Use OpenAI API Key** = **ON**. If this stays OFF, Cursor ignores the saved key and the base-URL override and keeps using Cursor’s own models.
2. **Override OpenAI Base URL** = ON.
3. **Base URL** = `https://api.teamorouter.com/v1` (`.com` + `/v1`, not `https://api.teamorouter.cc`).
4. Paste the `sk-teamo-…` key in the OpenAI key field (not in this repo, not in chat).

FreeLLMAPI in the editor (only if you want Desktop itself to talk to localhost, and you are **not** using TeamoRouter in that same slot):

1. Start FreeLLMAPI on port 3001.
2. Use OpenAI API Key = ON.
3. Base URL = `http://localhost:3001/v1`.
4. Paste the FreeLLMAPI unified key in the OpenAI key field.

Prefer **Composer / Cursor Grok** for everyday Agent work so the Pro **Other Models** pool (Claude/GPT) is not emptied. TeamoRouter/FreeLLMAPI are for the **website** chat path.

Windows Credential Manager is the right place for a GitHub PAT. Same rule: not chat, not `.env` in git.

## 3. Cursor Cloud Agent — do not set this up here

This Cloud Agent does not read Desktop API Keys. It has no `DATABASE_URL` and no `.env.local`. Putting TeamoRouter or FreeLLMAPI on the Cloud Agent would only spend those quotas on coding, and **still** would not turn on Find My Pet until `frontend/.env.local` exists on the machine that runs `npm run dev`.

Leave Cloud Agent on the default Cursor model.

## 4. Desktop does **not** pick up this branch automatically

Opening Cursor Desktop on your existing local clone does **not** include this work until that clone has the branch.

```bash
git fetch origin cursor/rescuehub-mvp-loop-cfb0
git checkout cursor/rescuehub-mvp-loop-cfb0
cd frontend
cp .env.example .env.local   # then fill keys + DATABASE_URL locally
npm install
npx prisma generate --schema=../prisma/schema.prisma
npm run db:seed
npm run llm:probe
npm run dev
```

Then: home → adopt Oscar (switch to 中文) → register (preview +100 tokens) → Find My Pet.

`main` without this checkout is still the pre-MVP-loop tree. Cursor API Keys and a leftover `.env.local` do not replace `git checkout`.

## 5. Rate limits

The app already rate-limits public chat (10/min/IP) and sponsor-search (5/hour/user). If a gateway 429s, switch `TEAMOROUTER_MODEL` to a free/flash id or enable `CHAT_INTAKE_USE_MOCK=true` for UI work without spend.
