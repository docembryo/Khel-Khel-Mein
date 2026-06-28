# Khel Khel Mein — World Cup 2026 Predictor Pool

A small web app for a friends' prediction pool. Pool code to join, name + PIN to log in,
predict scorelines, auto-locked at kickoff, live leaderboard. Results sync automatically.

**Group scoring:** right result = 2 pts · exact scoreline = 3 pts.

**Knockout scoring:** correct qualifier = 2 · correct goal difference = +1 · exact full-time score = +1 · exact penalty shootout = +1 (max 5). Predict a draw and you enter a pens score — the side with more pens is who you think goes through.

---

## ⚡ UPDATING AN ALREADY-DEPLOYED POOL (knockouts + penalties)

If your pool is already live and you're adding the knockout update, do these three things:

1. **Replace the files** — upload this whole project over your existing GitHub repo (keep the
   folder layout: `src/…`, `api/…`, `public/…`). Commit. Vercel redeploys automatically.
2. **Run the migration** — Supabase → SQL Editor → paste all of **`MIGRATION.sql`** → Run.
   This adds two optional penalty columns. It does **not** touch any existing data — every
   group prediction, result, player and the leaderboard stay exactly as they are. *(This is the
   only new step versus your original setup.)*
3. **Redeploy without cache** if Vercel doesn't pick it up: Deployments → ⋯ → Redeploy →
   untick "Use existing Build Cache".

### 60-second self-test (do this before the real knockouts)
1. Turn on **Practice mode** (toggle near the tabs) — unlocks everything for a dry run.
2. **Knockout tab → Edit fixtures** → add a fake tie (e.g. *Brazil v Spain*, any round, pick a
   time + zone) → Done.
3. Open that tie, enter your pick **1–1**, and a **Penalties** box appears — enter **4–3**
   (so you've picked Brazil through). It should show "Through: Brazil".
4. **Results tab** → enter the same match **1–1**, then its **Penalties 4–3**.
5. **Leaderboard → Knockout / Overall** → you should score **5** (2 qualifier +1 GD +1 exact
   +1 pens). Change the result to **2–1** and you'll see it drop to **2** (qualifier only).
6. Turn Practice mode back **off**. Done — delete the fake fixture.

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
