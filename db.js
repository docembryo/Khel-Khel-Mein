// Supabase access layer for Khel Kel Main.
import { createClient } from "@supabase/supabase-js";
import { POOL_CODE } from "./data.js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(url, key);
export const POOL = POOL_CODE;

export async function hashPin(pin) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("kkm:" + pin));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function fetchAll() {
  const [pl, pr, rs, ko] = await Promise.all([
    supabase.from("kkm_players").select("id,name").eq("pool", POOL),
    supabase.from("kkm_predictions").select("player_id,match_id,home,away,ph,pa").eq("pool", POOL),
    supabase.from("kkm_results").select("match_id,home,away,ph,pa").eq("pool", POOL),
    supabase.from("kkm_knockouts").select("id,round,home,away,ko").eq("pool", POOL),
  ]);
  const roster = (pl.data || []).map((p) => ({ id: p.id, name: p.name }));
  const preds = {};
  for (const p of roster) preds[p.id] = {};
  for (const row of pr.data || []) { (preds[row.player_id] ||= {})[row.match_id] = [row.home, row.away, row.ph ?? "", row.pa ?? ""]; }
  const results = {};
  for (const row of rs.data || []) results[row.match_id] = [row.home, row.away, row.ph ?? "", row.pa ?? ""];
  const kos = (ko.data || []).map((k) => ({ id: k.id, round: k.round, home: k.home, away: k.away, ko: Number(k.ko) }));
  return { roster, preds, results, kos };
}

export async function listPlayers() {
  const { data } = await supabase.from("kkm_players").select("id,name,pin_hash").eq("pool", POOL).order("name");
  return data || [];
}
export async function addPlayer(id, name, pinHash) {
  return supabase.from("kkm_players").insert({ id, pool: POOL, name, pin_hash: pinHash });
}
export async function upsertPrediction(playerId, matchId, h, a, ph, pa) {
  return supabase.from("kkm_predictions").upsert({ pool: POOL, player_id: playerId, match_id: matchId, home: h, away: a, ph: ph === "" || ph == null ? null : ph, pa: pa === "" || pa == null ? null : pa, updated_at: new Date().toISOString() });
}
export async function deletePrediction(playerId, matchId) {
  return supabase.from("kkm_predictions").delete().eq("pool", POOL).eq("player_id", playerId).eq("match_id", matchId);
}
export async function upsertResult(matchId, h, a, ph, pa) {
  return supabase.from("kkm_results").upsert({ pool: POOL, match_id: matchId, home: h, away: a, ph: ph === "" || ph == null ? null : ph, pa: pa === "" || pa == null ? null : pa, updated_at: new Date().toISOString() });
}
export async function deleteResult(matchId) {
  return supabase.from("kkm_results").delete().eq("pool", POOL).eq("match_id", matchId);
}
export async function addKnockout(k) {
  return supabase.from("kkm_knockouts").insert({ id: k.id, pool: POOL, round: k.round, home: k.home, away: k.away, ko: k.ko });
}
export async function removeKnockout(id) {
  return supabase.from("kkm_knockouts").delete().eq("pool", POOL).eq("id", id);
}
export function subscribeAll(cb) {
  const ch = supabase.channel("kkm-" + POOL);
  for (const t of ["kkm_players", "kkm_predictions", "kkm_results", "kkm_knockouts"]) {
    ch.on("postgres_changes", { event: "*", schema: "public", table: t }, cb);
  }
  ch.subscribe();
  return () => supabase.removeChannel(ch);
}
