# ConsistAI

**Improving LLM Reasoning Through Self-Consistency Voting**

A small demo built for a Generative AI course project on Self-Consistency
Prompting: the same reasoning question is sent to Groq multiple times, a
final answer is pulled out of each independent response, and majority
voting picks the most consistent one. Everything shown in the app is real —
live model calls for the demo, and a real (small, one-time) measurement for
the comparison section. Nothing is mocked or hardcoded.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Get a free Groq API key at https://console.groq.com/keys (no credit card
   required), then add it:

   ```bash
   cp .env.example .env
   # then edit .env and set GROQ_API_KEY=gsk_...
   ```

3. Run both the API server and the frontend together:

   ```bash
   npm run dev
   ```

   Open the printed local URL (typically http://localhost:5173). The Vite
   dev server proxies `/api/*` requests to the Express backend on port 3001.

Production build (single Node process serves both the built frontend and the API):

```bash
npm run build
npm start
```

## Deploy to Vercel

The app runs on Vercel two ways at once: the frontend deploys as a static
Vite build, and `/api/self-consistency` deploys as a serverless function
(`api/self-consistency.js`) — Vercel detects both automatically, no config
file needed.

1. Install the CLI and log in (opens a browser):

   ```bash
   npm install -g vercel
   vercel login
   ```

2. From the project root:

   ```bash
   vercel
   ```

   Answer the setup prompts (link to a new project is fine). This creates a
   preview deployment.

3. Add your Groq key as a Vercel environment variable — either in the
   dashboard (Project → Settings → Environment Variables → add
   `GROQ_API_KEY`), or via the CLI:

   ```bash
   vercel env add GROQ_API_KEY
   ```

4. Ship it to production:

   ```bash
   vercel --prod
   ```

`api/self-consistency.js` and `api/health.js` import the same logic in
`server/*.js` that the local Express server uses — no duplicated behavior,
just a thin adapter for Vercel's function signature.

## How it's wired up

```
src/
  components/            UI components (Navbar, Hero, DemoSection, HowItWorks, ...)
  components/ui/         Small shared primitives (SectionHeading, Reveal)
  hooks/
    useSelfConsistencyDemo.js   Drives the live demo: ask -> generate -> vote
  lib/
    selfConsistencyEngine.js    Client for the backend: POSTs to
                                 /api/self-consistency, computes majority votes
  data/
    presetProblems.js           Example questions for the "Try:" chips
    evaluationResults.js        Real (pre-measured) single-vs-self-consistency
                                 numbers shown in the comparison section

api/
  self-consistency.js    Vercel serverless function — same route, for prod
  health.js               Vercel serverless function — health check

server/
  index.js               Express app used for local dev (`npm run dev`) and
                          self-hosted `npm start`; same two routes as api/
  config.js               Model, temperature, and prompt settings
  groqClient.js            Thin fetch-based client for the Groq chat completions API
  selfConsistency.js       Fires N independent samples in parallel, extracts
                            and normalizes answers, groups them into voteable paths
  textUtils.js             Final-answer extraction / normalization / reasoning
                            preview trimming
  httpErrors.js            Shared error-to-HTTP-response mapping (used by both
                            server/index.js and api/self-consistency.js)
```

**Model:** `openai/gpt-oss-20b` on Groq (override with `GROQ_MODEL` in `.env`
— see console.groq.com/docs/models for the current list).

**The demo flow:** Question → 3/5/7 independent Groq calls → each response's
`Final Answer:` line is extracted and normalized → answers are tallied →
majority answer + confidence % are shown. If the API key is missing or a
request fails, the UI shows a clear, specific error instead of any
placeholder data.

**The comparison section** (`src/data/evaluationResults.js`) isn't a live
background job — it's a real, one-time measurement (6 classic reasoning
questions, single-prompt vs. 5-sample self-consistency, checked by hand)
kept simple on purpose so the demo has nothing to wait on or fail during a
live presentation.
