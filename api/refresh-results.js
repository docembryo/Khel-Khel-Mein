// Vercel serverless function: pulls finished WC scores and writes them to Supabase.
// Schedule it (cron-job.org or Vercel Cron) to hit:  /api/refresh-results?key=CRON_SECRET
import { createClient } from "@supabase/supabase-js";
import { GROUP, normTeam, POOL_CODE } from "../src/data.js";

const pairKey = (a, b) => [normTeam(a), normTeam(b)].sort().join("|");

export default async function handler(req, res) {
  const auth = req.headers.authorization || "";
  const ok = !process.env.CRON_SECRET || req.query.key === process.env.CRON_SECRET || auth === `Bearer ${process.env.CRON_SECRET}`;
  if (!ok) return res.status(401).json({ error: "bad key" });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

  // Build a lookup: unordered team pair -> {id, home} for group + knockout fixtures.
  const { data: kos } = await supabase.from("kkm_knockouts").select("id,home,away").eq("pool", POOL_CODE);
  const lookup = {};
  for (const m of GROUP) lookup[pairKey(m.home, m.away)] = { id: m.id, home: normTeam(m.home) };
  for (const k of kos || []) lookup[pairKey(k.home, k.away)] = { id: k.id, home: normTeam(k.home) };

  let finished = [];
  try {
    if (process.env.FOOTBALL_DATA_TOKEN) {
      const r = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
        headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_TOKEN },
      });
      const j = await r.json();
      finished = (j.matches || [])
        .filter((m) => m.status === "FINISHED" && m.score?.fullTime?.home != null)
        .map((m) => ({ home: m.homeTeam.name, away: m.awayTeam.name, h: m.score.fullTime.home, a: m.score.fullTime.away }));
    } else {
      const r = await fetch("https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json");
      const j = await r.json();
      finished = (j.matches || [])
        .filter((m) => m.score?.ft)
        .map((m) => ({ home: m.team1, away: m.team2, h: m.score.ft[0], a: m.score.ft[1] }));
    }
  } catch (e) {
    return res.status(502).json({ error: "feed fetch failed", detail: String(e) });
  }

  const rows = [];
  for (const f of finished) {
    const hit = lookup[pairKey(f.home, f.away)];
    if (!hit) continue;
    // Orient the score to our fixture's home/away.
    const direct = normTeam(f.home) === hit.home;
    rows.push({
      pool: POOL_CODE, match_id: hit.id,
      home: direct ? f.h : f.a, away: direct ? f.a : f.h,
      updated_at: new Date().toISOString(),
    });
  }

  if (rows.length) {
    const { error } = await supabase.from("kkm_results").upsert(rows);
    if (error) return res.status(500).json({ error: error.message });
  }
  return res.status(200).json({ matched: rows.length, scanned: finished.length });
}
