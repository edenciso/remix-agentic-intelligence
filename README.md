# Remix Agentic Intelligence Studio

A six-agent orchestration that ingests a weekly batch of cross-functional signals — customer calls, support tickets, product feedback, sales notes, internal updates — and produces a CEO-ready decision memo with evidence-backed themes, contradictions, recommendations, and calibrated confidence.

Built with **React 18 + Vite**, deployed to **Cloudflare Pages**, powered by the **Anthropic Claude API** (Opus 4.7 by default).

---

## Architecture

The six agents (Ingestion → Theme → Contradiction → Recommendation → Critic → Memo) run sequentially, with strict JSON contracts between them. Each call goes through a Cloudflare Pages Function proxy that keeps your API key off the browser.

```
  Browser (React)          Cloudflare Edge          Anthropic
  ┌──────────────┐        ┌──────────────────┐    ┌──────────┐
  │ RemixStudio  │ POST   │ /api/claude      │    │ /v1/     │
  │ fetch(       │──────▶ │ functions/api/   │──▶ │ messages │
  │   "/api/     │        │ claude.js        │    │          │
  │   claude")   │◀────── │ adds x-api-key   │◀── │          │
  └──────────────┘  JSON  │ from env var     │    └──────────┘
                          └──────────────────┘
                                ▲
                                │ ANTHROPIC_API_KEY
                                │ (encrypted env var)
```

**Two execution modes** toggled in the UI:
- **DEMO** — replays hand-audited gold outputs, no API calls, runs offline instantly.
- **LIVE** — calls the real Anthropic API through the proxy. Full pipeline is ~60–120s on Opus 4.7.

---

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer
- An [Anthropic API key](https://console.anthropic.com/) with billing set up
- A free [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [GitHub](https://github.com/) account (for the recommended deploy flow)

Wrangler (Cloudflare's CLI) is installed automatically as a dev dependency — no separate install needed.

---

## Quick start — local development

```bash
# 1. Install dependencies
npm install

# 2. Configure your local API key
cp .dev.vars.example .dev.vars
# Open .dev.vars and paste your Anthropic key where indicated

# 3. Run with the local Pages Function proxy
npm run dev:local
```

This starts Wrangler's Pages dev server (which in turn runs Vite). Visit the URL it prints — usually `http://localhost:8788`.

> **Why not `npm run dev`?** Plain Vite doesn't execute the Pages Function, so `/api/claude` would return 404 and LIVE mode would fail. `dev:local` runs both Vite and the function runtime together. You *can* use `npm run dev` if you only need to work on the UI in DEMO mode.

---

## Deploy to Cloudflare Pages

### Option A — Connect to GitHub (recommended)

1. **Create a new GitHub repo and push this project:**
   ```bash
   cd remix-studio
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/remix-studio.git
   git push -u origin main
   ```

2. **Connect it to Cloudflare Pages:**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** tab → **Connect to Git**
   - Authorize GitHub, select the repo you just pushed
   - Build settings:
     - **Framework preset:** Vite
     - **Build command:** `npm run build`
     - **Build output directory:** `dist`
   - Click **Save and Deploy**. First build takes ~90 seconds.

3. **Add your API key** (critical):
   - In the Pages project: **Settings** → **Environment variables** → **Add variable**
   - Variable name: `ANTHROPIC_API_KEY`
   - Value: your key (starts with `sk-ant-api03-...`)
   - **Toggle "Encrypt"** — this is the key security step
   - Apply to both **Production** and **Preview** environments
   - Save

4. **Redeploy** to pick up the env var:
   - **Deployments** → latest → **Retry deployment** (three-dot menu)

5. Visit `https://YOUR-PROJECT.pages.dev`. Toggle the header pill from **DEMO** to **LIVE** and click **Run weekly mix**.

### Option B — Deploy via CLI

```bash
# One-time: authenticate Wrangler
npx wrangler login

# Build and deploy
npm run deploy
```

On first run, Wrangler prompts you to create the Pages project — name it whatever you like. Subsequent runs go straight to deploy.

You still need to add `ANTHROPIC_API_KEY` via the dashboard (Settings → Environment variables, encrypted) — CLI deploys don't inherit from `.dev.vars`.

---

## Configuration

### Model selection

Default is **`claude-opus-4-7`** — the strongest current model, for the highest-quality synthesis. To change, edit the top of `src/RemixStudio.jsx`:

```js
const MODEL = "claude-opus-4-7";       // Gold run — best quality
// const MODEL = "claude-sonnet-4-6";  // Faster & cheaper
// const MODEL = "claude-haiku-4-5-20251001";  // Cheapest — iteration only
```

Redeploy after changing. Opus 4.7 is the model this app was tuned against; downgrading will work but output quality drops meaningfully.

### Running the pipeline

Open the deployed site, toggle **DEMO** → **LIVE** in the top-right, click **Run weekly mix**. You'll see each of the six agents light up as it runs, with latency printed below each node when it completes. Total time is dominated by the Theme and Recommendation agents (the largest context windows).

---

## Cost and rate-limit notes

**Per full pipeline run (estimate for Opus 4.7):**
- Input: ~25–35k tokens across all six agents (prompts + signal batch + upstream agent outputs)
- Output: ~5–8k tokens
- Cost: roughly **$0.20–$0.40 per run** at current pricing ($5 input / $25 output per million tokens)

Check [anthropic.com/pricing](https://www.anthropic.com/pricing) for current rates. Set a budget alert in [Anthropic Console](https://console.anthropic.com/) → **Settings** → **Limits** before experimenting — it's easy to hit 20+ runs while iterating.

**Cloudflare limits:**
- Pages Functions have per-request execution limits (~30s wall time on free tier). Each agent is its own invocation, so the limit applies per-agent, not per-pipeline. Individual Opus calls should stay under that.
- If you share the URL publicly, add rate-limiting in the Cloudflare dashboard: **Security** → **WAF** → **Rate limiting rules**. Suggested: 10 POST requests per minute per IP on `/api/claude`.

---

## Project structure

```
remix-studio/
├── functions/
│   └── api/
│       └── claude.js         # Pages Function — the Anthropic proxy
├── src/
│   ├── main.jsx              # React root
│   ├── index.css             # Minimal base styles
│   └── RemixStudio.jsx       # The app — agents, UI, styles, data
├── index.html                # Vite entry HTML
├── vite.config.js
├── package.json
├── .gitignore
├── .dev.vars.example         # Copy to .dev.vars for local dev
├── .nvmrc                    # Pins Node 20 for CI builds
└── README.md
```

---

## Troubleshooting

**`npm run dev:local` errors with "wrangler: command not found":**
Run `npm install` first — wrangler is a devDependency, not a global install.

**LIVE mode returns `ANTHROPIC_API_KEY not configured on server`:**
- Local: `.dev.vars` doesn't exist or has the wrong variable name. Check it spells `ANTHROPIC_API_KEY` exactly.
- Production: go to Pages project → Settings → Environment variables → verify the var is set AND encrypted AND applied to the environment you're testing → redeploy (var changes aren't picked up by existing deployments).

**Agents fail partway through with a 401:**
Your key is invalid, expired, or doesn't have Opus 4.7 access. Test it from a terminal:
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-opus-4-7","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'
```

**Agents fail with a 400:**
Usually a model name typo. Verify the `MODEL` constant matches an available model string exactly. Available IDs are documented at [docs.claude.com/en/docs/about-claude/models/overview](https://docs.claude.com/en/docs/about-claude/models/overview).

**Cloudflare build fails with "Cannot find module" or similar:**
In Pages project → Settings → Environment variables, add `NODE_VERSION=20` (or newer). Cloudflare's default Node version is older than Vite 5 supports.

**Pipeline is very slow (>2 min):**
Expected on Opus 4.7 — it runs adaptive thinking, which trades latency for quality. Switch to `claude-sonnet-4-6` for ~3x speedup if you're just testing the wiring.

---

## What's next

This scaffold is step **C** of a four-step roadmap:

- **A.** Zod schemas for strict agent-output validation at every boundary
- **B.** "Load your own batch" upload flow in the UI
- **C. → You are here —** Cloudflare deployment with live Opus pipeline
- **D.** Second use case (customer-interview synthesis) with a use-case selector

A companion Python orchestrator (`remix_orchestrator.py`, distributed separately) runs the same six-agent pipeline server-side for scheduled jobs or CLI use.

---

## License

MIT.
