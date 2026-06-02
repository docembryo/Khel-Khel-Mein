# Khel Khel Mein — World Cup 2026 Predictor Pool

A small web app for a friends' prediction pool. Pool code to join, name + PIN to log in,
predict scorelines, auto-locked at kickoff, live leaderboard. Results sync automatically.

**Scoring:** right result = 2 pts · exact scoreline = 3 pts · +1 bonus for every 5 matches predicted.

---

## What you'll set up (all free tiers)
1. **Supabase** — database + realtime (shared data).
2. **football-data.org** — results + live ticker feed (one free API token).
3. **Vercel** — hosts the web app and the small server functions.

Total time: ~30–40 minutes, mostly clicking.

---

## Step 1 — Supabase (database)
1. Create a free project at supabase.com. Pick a region near India (e.g. Mumbai/Singapore).
2. Open **SQL Editor**, paste the contents of `supabase.sql`, and run it. This creates the tables, the access rules, and turns on realtime.
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key (safe for the browser)
   - **service_role** key (server-only — keep secret)

## Step 2 — football-data.org (scores)
1. Sign up at football-data.org → request a **free API token** (instant, email).
2. The free tier includes the World Cup. That's all you need.
   *(If you skip this, the app still works — results fall back to a free no-key feed that updates more slowly, and the live ticker stays off.)*

## Step 3 — Deploy to Vercel
1. Put this folder in a GitHub repo (or drag it into Vercel's "new project" importer).
2. In Vercel → **Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | your Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | your anon public key |
   | `SUPABASE_URL` | same Project URL |
   | `SUPABASE_SERVICE_KEY` | your service_role key |
   | `FOOTBALL_DATA_TOKEN` | your football-data.org token |
   | `CRON_SECRET` | any long random string you make up |

3. Deploy. You'll get a URL like `khel-khel-mein.vercel.app`. Share it with the group.

## Step 4 — Auto-results schedule
- A daily refresh is already configured in `vercel.json`.
- For near-live updating on match days, set up a free scheduler at **cron-job.org** to call
  `https://YOUR-APP.vercel.app/api/refresh-results?key=YOUR_CRON_SECRET` every 2–5 minutes.
- You can always enter or fix any score by hand on the **Results** tab.

---

## How your group uses it
- **First time:** open the link → enter pool code **KKM2026** → name → set a 4-digit PIN.
- **After that:** name + PIN (the app remembers you on your own phone).
- Predict on **Predict**; add knockout ties on **Knockout** as the bracket fills in; watch the
  **Leaderboard** (Group / Knockout / Overall). **Practice mode** (top checkbox) unlocks everything
  for a pre-tournament dry run.

## Local development (optional)
```
npm install
cp .env.example .env   # fill in your values
npm run dev
```
Note: the `/api/*` functions (live ticker, news, results sync) only run on Vercel, not in `npm run dev`.

## Changing things
- **Pool code:** `POOL_CODE` in `src/data.js`.
- **Drop the PIN / bonus / a tab:** all in `src/App.jsx`.
- **Different results source:** `api/refresh-results.js`.
