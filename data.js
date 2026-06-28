// Khel Kel Main — shared data, fixtures, scoring + helpers.
// Pure ESM, safe to import from both the browser app and the serverless job.

export const POOL_CODE = "KKM2026";

export const C = {
  NAVY: "#0a1f44", INK: "#14161c", GOLD: "#b9772a", GOLD_SOFT: "#f2e7d5",
  PAPER: "#faf7f2", CARD: "#ffffff", LINE: "#e8e4dc", MUTE: "#7c7568",
  GREEN: "#2f7a52", RED: "#b4452f",
};

const IST = { timeZone: "Asia/Kolkata" };
export const fmtDate = (ms) => new Date(ms).toLocaleDateString("en-US", { ...IST, weekday: "short", month: "short", day: "numeric" });
export const fmtTime = (ms) => new Date(ms).toLocaleTimeString("en-US", { ...IST, hour: "numeric", minute: "2-digit" });
export const dayKey = (ms) => new Date(ms).toLocaleDateString("en-CA", IST);

export const filled = (p) => p && p[0] !== "" && p[1] !== "" && p[0] != null && p[1] != null;
export const score = (pred, res) => {
  if (!filled(pred) || !filled(res)) return null;
  const po = Math.sign(pred[0] - pred[1]), ro = Math.sign(res[0] - res[1]);
  if (po !== ro) return 0;
  return (pred[0] === res[0] && pred[1] === res[1]) ? 3 : 2;
};

// ── Knockout scoring ──
// A knockout entry is [ftHome, ftAway, penHome, penAway]; pens only used on a draw.
// ft = score after extra time. Ladder (stacked, max 5):
//   +2 correct qualifier (else 0, nothing else counts)
//   +1 correct goal difference   +1 exact full-time score
//   +1 exact penalty shootout score (only if it actually went to pens AND you predicted a draw)
export const penFilled = (s) => s && s[2] !== "" && s[2] != null && s[3] !== "" && s[3] != null;
export const qualOf = (s) => {
  if (!filled(s)) return null;
  if (s[0] > s[1]) return "home";
  if (s[0] < s[1]) return "away";
  if (!penFilled(s)) return null;            // a draw with no pens entered = unknown winner
  return s[2] > s[3] ? "home" : s[2] < s[3] ? "away" : null;
};
export function scoreKO(pred, res) {
  if (!filled(pred) || !filled(res)) return null;
  const pq = qualOf(pred), rq = qualOf(res);
  if (pq == null || rq == null) return null; // draw without a pens score = incomplete, don't score
  if (pq !== rq) return 0;                    // qualifier wrong → 0
  let pts = 2;
  if ((pred[0] - pred[1]) === (res[0] - res[1])) pts += 1;     // goal difference
  if (pred[0] === res[0] && pred[1] === res[1]) pts += 1;      // exact full-time
  const wentToPens = res[0] === res[1] && penFilled(res);
  const predDraw = pred[0] === pred[1] && penFilled(pred);
  if (wentToPens && predDraw && pred[2] === res[2] && pred[3] === res[3]) pts += 1; // exact pens
  return pts;
}
export const scoreAny = (pred, res, ko) => (ko ? scoreKO(pred, res) : score(pred, res));

export const ROUNDS = ["Round of 32", "Round of 16", "Quarter-final", "Semi-final", "Third place", "Final"];
export const RORDER = Object.fromEntries(ROUNDS.map((r, i) => [r, i]));

// football-data.org stage names -> our round labels (used by the results job).
export const FD_ROUND = {
  LAST_32: "Round of 32", ROUND_OF_32: "Round of 32",
  LAST_16: "Round of 16", ROUND_OF_16: "Round of 16",
  QUARTER_FINALS: "Quarter-final", QUARTER_FINAL: "Quarter-final",
  SEMI_FINALS: "Semi-final", SEMI_FINAL: "Semi-final",
  THIRD_PLACE: "Third place", THIRD_PLACE_FINAL: "Third place",
  FINAL: "Final",
};

// Group stage (fixed) — kickoff stored with IST offset
export const GROUP = [
  ["m01","Mexico","South Africa","2026-06-12T00:30:00+05:30"],["m02","South Korea","Czechia","2026-06-12T07:30:00+05:30"],
  ["m03","Canada","Bosnia & Herzegovina","2026-06-13T00:30:00+05:30"],["m04","USA","Paraguay","2026-06-13T06:30:00+05:30"],
  ["m05","Qatar","Switzerland","2026-06-14T00:30:00+05:30"],["m06","Brazil","Morocco","2026-06-14T03:30:00+05:30"],
  ["m07","Haiti","Scotland","2026-06-14T06:30:00+05:30"],["m08","Australia","Türkiye","2026-06-14T09:30:00+05:30"],
  ["m09","Germany","Curaçao","2026-06-14T22:30:00+05:30"],["m10","Netherlands","Japan","2026-06-15T01:30:00+05:30"],
  ["m11","Ivory Coast","Ecuador","2026-06-15T04:30:00+05:30"],["m12","Sweden","Tunisia","2026-06-15T07:30:00+05:30"],
  ["m13","Spain","Cape Verde","2026-06-15T21:30:00+05:30"],["m14","Belgium","Egypt","2026-06-16T00:30:00+05:30"],
  ["m15","Saudi Arabia","Uruguay","2026-06-16T03:30:00+05:30"],["m16","Iran","New Zealand","2026-06-16T06:30:00+05:30"],
  ["m17","France","Senegal","2026-06-17T00:30:00+05:30"],["m18","Iraq","Norway","2026-06-17T03:30:00+05:30"],
  ["m19","Argentina","Algeria","2026-06-17T06:30:00+05:30"],["m20","Austria","Jordan","2026-06-17T09:30:00+05:30"],
  ["m21","Portugal","DR Congo","2026-06-17T22:30:00+05:30"],["m22","England","Croatia","2026-06-18T01:30:00+05:30"],
  ["m23","Ghana","Panama","2026-06-18T04:30:00+05:30"],["m24","Uzbekistan","Colombia","2026-06-18T07:30:00+05:30"],
  ["m25","Czechia","South Africa","2026-06-18T21:30:00+05:30"],["m26","Switzerland","Bosnia & Herzegovina","2026-06-19T00:30:00+05:30"],
  ["m27","Canada","Qatar","2026-06-19T03:30:00+05:30"],["m28","Mexico","South Korea","2026-06-19T06:30:00+05:30"],
  ["m29","USA","Australia","2026-06-20T00:30:00+05:30"],["m30","Scotland","Morocco","2026-06-20T03:30:00+05:30"],
  ["m31","Brazil","Haiti","2026-06-20T06:30:00+05:30"],["m32","Türkiye","Paraguay","2026-06-20T09:30:00+05:30"],
  ["m33","Netherlands","Sweden","2026-06-20T22:30:00+05:30"],["m34","Germany","Ivory Coast","2026-06-21T01:30:00+05:30"],
  ["m35","Ecuador","Curaçao","2026-06-21T05:30:00+05:30"],["m36","Tunisia","Japan","2026-06-21T09:30:00+05:30"],
  ["m37","Spain","Saudi Arabia","2026-06-21T21:30:00+05:30"],["m38","Belgium","Iran","2026-06-22T00:30:00+05:30"],
  ["m39","Uruguay","Cape Verde","2026-06-22T03:30:00+05:30"],["m40","New Zealand","Egypt","2026-06-22T06:30:00+05:30"],
  ["m41","Argentina","Austria","2026-06-22T22:30:00+05:30"],["m42","France","Iraq","2026-06-23T02:30:00+05:30"],
  ["m43","Norway","Senegal","2026-06-23T05:30:00+05:30"],["m44","Jordan","Algeria","2026-06-23T08:30:00+05:30"],
  ["m45","Portugal","Uzbekistan","2026-06-23T22:30:00+05:30"],["m46","England","Ghana","2026-06-24T01:30:00+05:30"],
  ["m47","Panama","Croatia","2026-06-24T04:30:00+05:30"],["m48","Colombia","DR Congo","2026-06-24T07:30:00+05:30"],
  ["m49","Switzerland","Canada","2026-06-25T00:30:00+05:30"],["m50","Bosnia & Herzegovina","Qatar","2026-06-25T00:30:00+05:30"],
  ["m51","Scotland","Brazil","2026-06-25T03:30:00+05:30"],["m52","Morocco","Haiti","2026-06-25T03:30:00+05:30"],
  ["m53","Czechia","Mexico","2026-06-25T06:30:00+05:30"],["m54","South Africa","South Korea","2026-06-25T06:30:00+05:30"],
  ["m55","Ecuador","Germany","2026-06-26T01:30:00+05:30"],["m56","Curaçao","Ivory Coast","2026-06-26T01:30:00+05:30"],
  ["m57","Japan","Sweden","2026-06-26T04:30:00+05:30"],["m58","Tunisia","Netherlands","2026-06-26T04:30:00+05:30"],
  ["m59","Türkiye","USA","2026-06-26T07:30:00+05:30"],["m60","Paraguay","Australia","2026-06-26T07:30:00+05:30"],
  ["m61","Norway","France","2026-06-27T00:30:00+05:30"],["m62","Senegal","Iraq","2026-06-27T00:30:00+05:30"],
  ["m63","Cape Verde","Saudi Arabia","2026-06-27T05:30:00+05:30"],["m64","Uruguay","Spain","2026-06-27T05:30:00+05:30"],
  ["m65","Egypt","Iran","2026-06-27T08:30:00+05:30"],["m66","New Zealand","Belgium","2026-06-27T08:30:00+05:30"],
  ["m67","Panama","England","2026-06-28T02:30:00+05:30"],["m68","Croatia","Ghana","2026-06-28T02:30:00+05:30"],
  ["m69","Colombia","Portugal","2026-06-28T05:00:00+05:30"],["m70","DR Congo","Uzbekistan","2026-06-28T05:00:00+05:30"],
  ["m71","Algeria","Austria","2026-06-28T07:30:00+05:30"],["m72","Jordan","Argentina","2026-06-28T07:30:00+05:30"],
].map(([id, home, away, ko]) => ({ id, stage: "group", home, away, ko: new Date(ko).getTime() }));

export const FAVS = new Set(["m06","m10","m17","m22","m34","m41","m61","m69"]);

// Team-name normalisation so the results feed (which uses its own spellings)
// can be matched to our fixtures. Lowercase, strip accents/punctuation, alias.
const ALIAS = {
  korearepublic: "southkorea", republicofkorea: "southkorea",
  unitedstates: "usa", unitedstatesofamerica: "usa", us: "usa",
  czechrepublic: "czechia",
  cotedivoire: "ivorycoast",
  turkey: "turkiye",
  caboverde: "capeverde",
  congodr: "drcongo", democraticrepublicofthecongo: "drcongo", democraticrepublicofcongo: "drcongo",
  iriran: "iran",
  bosniaandherzegovina: "bosnia", bosniaherzegovina: "bosnia",
};
export function normTeam(name) {
  if (!name) return "";
  let k = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
  return ALIAS[k] || k;
}
