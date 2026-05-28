# heyDavid — Conversational Meal Tracker (POC)

A tiny conversational meal tracker built with Next.js App Router, TypeScript, and Tailwind. Runs entirely with sample data; optionally uses Claude when `ANTHROPIC_API_KEY` is set.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

No environment variables are required. The app defaults to **Sample mode**.

## Optional: Claude mode

Set `ANTHROPIC_API_KEY` to enable Claude-powered responses. You can also set:

- `ANTHROPIC_MODEL` — override the model (default: `claude-opus-4-7`)
- `MEAL_TRACKER_MODE=sample` — force sample mode even when an API key is set

If a Claude call fails, the app falls back to sample mode automatically.

## Deploy to Vercel

Import this repo into Vercel — no env vars needed for a working deployment.
