// Live WC matches for the top ticker. Calls football-data.org server-side (token hidden).
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=30");
  if (!process.env.FOOTBALL_DATA_TOKEN) return res.status(200).json({ live: [] });
  try {
    const r = await fetch("https://api.football-data.org/v4/competitions/WC/matches?status=LIVE", {
      headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_TOKEN },
    });
    const j = await r.json();
    const live = (j.matches || []).map((m) => ({
      home: m.homeTeam?.shortName || m.homeTeam?.name,
      away: m.awayTeam?.shortName || m.awayTeam?.name,
      h: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? 0,
      a: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? 0,
      minute: m.minute || null,
    }));
    return res.status(200).json({ live });
  } catch (e) {
    return res.status(200).json({ live: [], error: String(e) });
  }
}
