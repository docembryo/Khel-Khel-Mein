import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { C, GROUP, FAVS, ROUNDS, RORDER, POOL_CODE, fmtDate, fmtTime, dayKey, score, filled } from "./data.js";
import * as db from "./db.js";

const SESS = "kkm_session_v1", GATE = "kkm_gate_v1";

export default function App() {
  const [gate, setGate] = useState(() => localStorage.getItem(GATE) === "1");
  const [session, setSession] = useState(() => { try { return JSON.parse(localStorage.getItem(SESS) || "null"); } catch { return null; } });

  if (!gate) return <Shell><CodeGate onPass={() => { localStorage.setItem(GATE, "1"); setGate(true); }} /></Shell>;
  if (!session) return <Shell><Login onLogin={(s) => { localStorage.setItem(SESS, JSON.stringify(s)); setSession(s); }} /></Shell>;
  return <Game session={session} onLogout={() => { localStorage.removeItem(SESS); setSession(null); }} />;
}

// ── Pool-code gate (first entry only) ──
function CodeGate({ onPass }) {
  const [code, setCode] = useState(""); const [err, setErr] = useState(false);
  const go = () => { if (code.trim().toUpperCase() === POOL_CODE) onPass(); else setErr(true); };
  return (
    <Centered>
      <Kicker>FIFA World Cup 2026</Kicker>
      <Title>Khel Khel Mein</Title>
      <p style={{ color: C.MUTE, fontSize: 13.5, margin: "8px 0 18px" }}>Enter your pool code to join.</p>
      <input className="inp" placeholder="Pool code" value={code} autoFocus
        onChange={(e) => { setCode(e.target.value); setErr(false); }} onKeyDown={(e) => e.key === "Enter" && go()} />
      {err && <div style={{ color: C.RED, fontSize: 12.5, marginTop: 8 }}>That code doesn't match. Check with your pool admin.</div>}
      <button onClick={go} className="btn-gold" style={{ width: "100%", marginTop: 14 }}>Continue</button>
    </Centered>
  );
}

// ── Name + PIN login ──
function Login({ onLogin }) {
  const [players, setPlayers] = useState([]);
  const [mode, setMode] = useState("returning");
  const [sel, setSel] = useState(null);
  const [pin, setPin] = useState(""); const [name, setName] = useState(""); const [pin2, setPin2] = useState("");
  const [find, setFind] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { db.listPlayers().then((p) => { setPlayers(p); if (p.length === 0) setMode("new"); }); }, []);

  const signIn = async () => {
    if (!sel) return setErr("Pick your name.");
    if (!/^\d{4}$/.test(pin)) return setErr("PIN is 4 digits.");
    setBusy(true);
    const h = await db.hashPin(pin); setBusy(false);
    if (h === sel.pin_hash) onLogin({ id: sel.id, name: sel.name });
    else setErr("Wrong PIN.");
  };
  const signUp = async () => {
    if (!name.trim()) return setErr("Enter a name.");
    if (players.some((p) => p.name.toLowerCase() === name.trim().toLowerCase())) return setErr("Name taken — log in instead.");
    if (!/^\d{4}$/.test(pin2)) return setErr("Choose a 4-digit PIN.");
    setBusy(true);
    const id = "p" + Date.now().toString(36) + Math.floor(Math.random() * 1000);
    const h = await db.hashPin(pin2);
    const { error } = await db.addPlayer(id, name.trim(), h); setBusy(false);
    if (error) return setErr("Could not sign up. Try again.");
    onLogin({ id, name: name.trim() });
  };

  return (
    <Centered>
      <Kicker>Khel Khel Mein</Kicker>
      <Title>{mode === "returning" ? "Welcome back" : "Join the pool"}</Title>
      <div style={{ display: "flex", gap: 6, margin: "14px 0" }}>
        <Seg on={mode === "returning"} onClick={() => { setMode("returning"); setErr(""); }}>I've joined before</Seg>
        <Seg on={mode === "new"} onClick={() => { setMode("new"); setErr(""); }}>I'm new</Seg>
      </div>

      {mode === "returning" ? (
        <>
          {players.length === 0 ? <p style={{ color: C.MUTE, fontSize: 13 }}>No players yet — switch to “I'm new”.</p> : (
            <>
              <input className="inp" placeholder="Type your name to find it" value={find}
                onChange={(e) => { setFind(e.target.value); setErr(""); }} style={{ marginBottom: 10 }} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12, maxHeight: 168, overflowY: "auto" }}>
                {(find.trim() ? players.filter((p) => p.name.toLowerCase().includes(find.trim().toLowerCase())) : players).slice(0, 40)
                  .map((p) => <button key={p.id} onClick={() => { setSel(p); setErr(""); }} className="chip" style={{ borderColor: sel?.id === p.id ? C.GOLD : C.LINE, background: sel?.id === p.id ? C.GOLD_SOFT : "#fff" }}>{p.name}</button>)}
                {find.trim() && players.filter((p) => p.name.toLowerCase().includes(find.trim().toLowerCase())).length === 0 && <span style={{ color: C.MUTE, fontSize: 12.5 }}>No match — check spelling, or use “I'm new”.</span>}
              </div>
              {sel && <div style={{ fontSize: 12.5, color: C.MUTE, marginBottom: 8 }}>Logging in as <b style={{ color: C.INK }}>{sel.name}</b></div>}
            </>
          )}
          <input className="inp" type="password" inputMode="numeric" placeholder="Your 4-digit PIN" value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && signIn()} />
          <button onClick={signIn} disabled={busy} className="btn-gold" style={{ width: "100%", marginTop: 12 }}>Log in</button>
        </>
      ) : (
        <>
          <input className="inp" placeholder="Your name" value={name} onChange={(e) => { setName(e.target.value); setErr(""); }} style={{ marginBottom: 8 }} />
          <input className="inp" type="password" inputMode="numeric" placeholder="Choose a 4-digit PIN" value={pin2}
            onChange={(e) => { setPin2(e.target.value.replace(/\D/g, "").slice(0, 4)); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && signUp()} />
          <button onClick={signUp} disabled={busy} className="btn-gold" style={{ width: "100%", marginTop: 12 }}>Create my account</button>
          <p style={{ color: C.MUTE, fontSize: 11.5, marginTop: 10 }}>Your PIN is how you log in next time, on any device. Keep it private.</p>
        </>
      )}
      {err && <div style={{ color: C.RED, fontSize: 12.5, marginTop: 10 }}>{err}</div>}
    </Centered>
  );
}

// ── Main game ──
function Game({ session, onLogout }) {
  const [roster, setRoster] = useState([]);
  const [preds, setPreds] = useState({});
  const [results, setResults] = useState({});
  const [kos, setKos] = useState([]);
  const [tab, setTab] = useState("predict");
  const [view, setView] = useState({ t: "home" });
  const [now, setNow] = useState(Date.now());
  const [filter, setFilter] = useState("open");
  const [stage, setStage] = useState("overall");
  const [practice, setPractice] = useState(false);
  const [editKO, setEditKO] = useState(false);
  const saveP = useRef(null), saveR = useRef(null), redraw = useRef(null);
  const myId = session.id;

  const koMatches = useMemo(() => kos.map((k) => ({ ...k, stage: "ko" })), [kos]);
  const allMatches = useMemo(() => [...GROUP, ...koMatches.filter((k) => k.home && k.away)], [koMatches]);
  const byId = useMemo(() => Object.fromEntries(allMatches.map((m) => [m.id, m])), [allMatches]);
  const revealed = useCallback((mt) => practice || (mt.ko && now >= mt.ko), [practice, now]);

  const refetch = useCallback(async () => {
    const d = await db.fetchAll();
    setRoster(d.roster); setResults(d.results); setKos(d.kos);
    setPreds((prev) => ({ ...d.preds, [myId]: prev[myId] || d.preds[myId] || {} }));
  }, [myId]);

  useEffect(() => { refetch(); }, [refetch]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 20000); return () => clearInterval(t); }, []);
  useEffect(() => db.subscribeAll(() => { clearTimeout(redraw.current); redraw.current = setTimeout(refetch, 800); }), [refetch]);

  const setPred = (mid, idx, val) => {
    const clean = val === "" ? "" : Math.max(0, Math.min(99, parseInt(val, 10) || 0));
    setPreds((prev) => {
      const mine = { ...(prev[myId] || {}) };
      const cur = mine[mid] ? [...mine[mid]] : ["", ""]; cur[idx] = clean; mine[mid] = cur;
      clearTimeout(saveP.current);
      saveP.current = setTimeout(() => { if (filled(cur)) db.upsertPrediction(myId, mid, cur[0], cur[1]); else if (cur[0] === "" && cur[1] === "") db.deletePrediction(myId, mid); }, 500);
      return { ...prev, [myId]: mine };
    });
  };
  const setResult = (mid, idx, val) => {
    const clean = val === "" ? "" : Math.max(0, Math.min(99, parseInt(val, 10) || 0));
    setResults((prev) => {
      const cur = prev[mid] ? [...prev[mid]] : ["", ""]; cur[idx] = clean;
      clearTimeout(saveR.current);
      saveR.current = setTimeout(() => { if (filled(cur)) db.upsertResult(mid, cur[0], cur[1]); else if (cur[0] === "" && cur[1] === "") db.deleteResult(mid); }, 500);
      return { ...prev, [mid]: cur };
    });
  };
  const saveKos = async (next) => { setKos(next); };
  const addKO = async (k) => { await db.addKnockout(k); refetch(); };
  const delKO = async (id) => { await db.removeKnockout(id); refetch(); };

  const inStage = useCallback((mt) => stage === "overall" ? true : stage === "group" ? mt.stage === "group" : mt.stage === "ko", [stage]);
  const board = useMemo(() => {
    const rows = roster.map((p) => {
      let pts = 0, exact = 0, correct = 0, played = 0, made = 0;
      const mine = preds[p.id] || {};
      for (const mt of allMatches) {
        if (!inStage(mt)) continue;
        const pr = mine[mt.id], rs = results[mt.id];
        if (filled(pr)) made++;
        const s = score(pr, rs); if (s === null) continue;
        played++; pts += s; if (s === 3) exact++; if (s >= 2) correct++;
      }
      const bonus = Math.floor(made / 5);
      return { ...p, pts: pts + bonus, base: pts, bonus, exact, correct, played, made };
    });
    rows.sort((a, b) => b.pts - a.pts || b.exact - a.exact || a.name.localeCompare(b.name));
    return rows;
  }, [roster, preds, results, allMatches, inStage]);

  const myMade = preds[myId] ? Object.values(preds[myId]).filter(filled).length : 0;

  const grouped = (() => {
    const list = GROUP.filter((mt) => {
      const locked = now >= mt.ko;
      if (filter === "open") return !locked;
      if (filter === "favs") return FAVS.has(mt.id);
      return true;
    });
    const g = [];
    for (const mt of list) { const dk = dayKey(mt.ko); const last = g[g.length - 1];
      if (last && last.dk === dk) last.items.push(mt); else g.push({ dk, label: fmtDate(mt.ko), items: [mt] }); }
    return g;
  })();

  return (
    <Shell>
      <style>{css}</style>
      <div className="panel">
      <div className="masthead">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.82)", fontWeight: 700 }}>FIFA World Cup 2026</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 31, fontWeight: 700, color: "#fff", lineHeight: 1, marginTop: 7 }}>Khel Khel Mein</div>
          </div>
          <button onClick={onLogout} className="chip" style={{ background: "rgba(255,255,255,0.16)", borderColor: "rgba(255,255,255,0.38)" }}><span style={{ width: 7, height: 7, borderRadius: 9, background: "#86f0a3", display: "inline-block" }} /><b style={{ color: "#fff" }}>{session.name}</b><span style={{ color: "rgba(255,255,255,0.78)", fontSize: 11 }}>log out</span></button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", margin: "12px 0 2px", fontSize: 12, color: C.MUTE }}>
        <span><b style={{ color: C.GOLD }}>2</b> result · <b style={{ color: C.GOLD }}>3</b> exact · locks at kickoff (IST)</span>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", color: practice ? C.GOLD : C.MUTE, fontWeight: practice ? 700 : 500 }}>
          <input type="checkbox" checked={practice} onChange={(e) => setPractice(e.target.checked)} style={{ accentColor: C.GOLD }} /> Practice mode
        </label>
      </div>

      <LiveTicker />

      {view.t !== "home" && <button onClick={() => setView({ t: "home" })} className="ghost" style={{ marginTop: 12 }}>← Back</button>}

      {view.t === "home" && (<>
        <div style={{ display: "flex", gap: 2, marginTop: 14, borderBottom: `1px solid ${C.LINE}`, flexWrap: "wrap" }}>
          {[["predict", `Predict${` · ${myMade}`}`], ["knockout", "Knockout"], ["board", "Leaderboard"], ["results", "Results"], ["rules", "Rules"], ["news", "News"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className="tab" style={{ color: tab === k ? C.NAVY : C.MUTE, borderBottom: tab === k ? `2px solid ${C.GOLD}` : "2px solid transparent", fontWeight: tab === k ? 700 : 500 }}>{label}</button>
          ))}
        </div>

        {tab === "predict" && (
          <div style={{ marginTop: 16 }}>
            <PredTicker made={myMade} />
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[["open", "Open"], ["favs", "Must-watch"], ["all", "All"]].map(([k, l]) => <Seg key={k} on={filter === k} onClick={() => setFilter(k)}>{l}</Seg>)}
            </div>
            {grouped.length === 0 && <Empty>Every match in this view has kicked off.</Empty>}
            {grouped.map((grp) => (
              <div key={grp.dk} style={{ marginBottom: 18 }}>
                <DayHead>{grp.label}</DayHead>
                {grp.items.map((mt) => <PredictRow key={mt.id} mt={mt} pr={(preds[myId] || {})[mt.id]} rs={results[mt.id]} now={now} setPred={setPred} onOpen={() => setView({ t: "match", id: mt.id })} />)}
              </div>
            ))}
          </div>
        )}

        {tab === "knockout" && (
          <KnockoutTab kos={kos} koMatches={koMatches} myId={myId} preds={preds} results={results} now={now}
            setPred={setPred} addKO={addKO} delKO={delKO} editKO={editKO} setEditKO={setEditKO} onOpen={(id) => setView({ t: "match", id })} />
        )}

        {tab === "board" && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[["overall", "Overall"], ["group", "Group"], ["ko", "Knockout"]].map(([k, l]) => <Seg key={k} on={stage === k} onClick={() => setStage(k)}>{l}</Seg>)}
            </div>
            {board.length === 0 && <Notice>No players yet.</Notice>}
            {board.map((p, i) => (
              <button key={p.id} onClick={() => setView({ t: "player", id: p.id })} className="lbrow" style={{ background: p.id === myId ? C.GOLD_SOFT : C.CARD, border: `1px solid ${p.id === myId ? "#e6d3b0" : C.LINE}` }}>
                <div style={{ width: 26, textAlign: "center", fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 700, color: i < 3 ? C.GOLD : "#c4bdae" }}>{i + 1}</div>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontWeight: 700, color: C.INK }}>{p.name}{p.id === myId && <span style={{ color: C.GOLD, fontWeight: 500, fontSize: 11 }}> · you</span>}</div>
                  <div style={{ fontSize: 11, color: C.MUTE, marginTop: 2 }}>{p.exact} exact · {p.correct} results · {p.made} predicted · <b style={{ color: C.GOLD }}>+{p.bonus} bonus</b></div>
                </div>
                <div style={{ textAlign: "right" }}><div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: C.NAVY, lineHeight: 1 }}>{p.pts}</div><div style={{ fontSize: 10, letterSpacing: 1, color: C.MUTE, textTransform: "uppercase" }}>pts</div></div>
                <span style={{ color: "#cfc8b8", fontSize: 18, marginLeft: 4 }}>›</span>
              </button>
            ))}
          </div>
        )}

        {tab === "results" && (
          <div style={{ marginTop: 16 }}>
            <Notice>Results sync automatically from the live feed. You can also enter or correct any score here{practice ? " (Practice mode: all open)" : ""}.</Notice>
            {[...GROUP, ...koMatches.filter((k) => k.home && k.away)].sort((a, b) => a.ko - b.ko).map((mt) => {
              const open = practice || now >= mt.ko; const rs = results[mt.id] || ["", ""];
              return (
                <div key={mt.id} className="row">
                  <button className="mname" onClick={() => setView({ t: "match", id: mt.id })}>{FAVS.has(mt.id) && <span style={{ color: C.GOLD }}>★</span>}{mt.home} <i>v</i> {mt.away}</button>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ScoreBox value={rs[0]} disabled={!open} onChange={(v) => setResult(mt.id, 0, v)} accent />
                    <span style={{ color: C.MUTE, fontWeight: 700 }}>–</span>
                    <ScoreBox value={rs[1]} disabled={!open} onChange={(v) => setResult(mt.id, 1, v)} accent />
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab === "rules" && <Rules />}
        {tab === "news" && <News />}
      </>)}

      {view.t === "match" && <MatchView mt={byId[view.id]} roster={roster} preds={preds} results={results} myId={myId} reveal={byId[view.id] ? revealed(byId[view.id]) : false} setPred={setPred} now={now} openPlayer={(id) => setView({ t: "player", id })} />}
      {view.t === "player" && <PlayerView player={roster.find((p) => p.id === view.id)} allMatches={allMatches} preds={preds} results={results} myId={myId} revealed={revealed} openMatch={(id) => setView({ t: "match", id })} />}

      <div style={{ marginTop: 26, paddingTop: 12, borderTop: `2px solid ${C.INK}`, display: "flex", justifyContent: "space-between", fontSize: 10, letterSpacing: 0.6, color: "#aaa291", textTransform: "uppercase" }}>
        <span>Times in IST</span><span>{GROUP.length} group · {koMatches.filter((k) => k.home && k.away).length} knockout</span>
      </div>
      </div>
    </Shell>
  );
}

function PredictRow({ mt, pr = ["", ""], rs, now, setPred, onOpen }) {
  const locked = now >= mt.ko; const s = score(pr, rs);
  return (
    <div className="row">
      <button className="mname" onClick={onOpen}>{mt.round ? <span className="rd">{mt.round}</span> : FAVS.has(mt.id) && <span style={{ color: C.GOLD }}>★</span>}{mt.home} <i>v</i> {mt.away}<span className="open">›</span></button>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ScoreBox value={pr[0]} disabled={locked} onChange={(v) => setPred(mt.id, 0, v)} />
        <span style={{ color: C.MUTE, fontWeight: 700 }}>–</span>
        <ScoreBox value={pr[1]} disabled={locked} onChange={(v) => setPred(mt.id, 1, v)} />
      </div>
      <div style={{ minWidth: 86, textAlign: "right" }}>
        {locked ? (filled(rs) ? <span style={{ fontSize: 12 }}>FT <b>{rs[0]}–{rs[1]}</b> {s !== null && <Pts s={s} />}</span> : <Tag c={C.RED}>LOCKED</Tag>) : <Tag c={C.GREEN}>{fmtTime(mt.ko)}</Tag>}
      </div>
    </div>
  );
}

function KnockoutTab({ kos, koMatches, myId, preds, results, now, setPred, addKO, delKO, editKO, setEditKO, onOpen }) {
  const live = koMatches.filter((k) => k.home && k.away);
  const grouped = ROUNDS.map((r) => ({ round: r, items: koMatches.filter((k) => k.round === r).sort((a, b) => (a.ko || 0) - (b.ko || 0)) })).filter((g) => g.items.length);
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12.5, color: C.MUTE }}>{live.length} of {kos.length} ties set</span>
        <Seg on={editKO} onClick={() => setEditKO(!editKO)}>{editKO ? "Done" : "Edit fixtures"}</Seg>
      </div>
      {editKO && <KnockoutEditor kos={kos} addKO={addKO} delKO={delKO} />}
      {!editKO && kos.length === 0 && <Empty>No knockout ties yet. Tap <b>Edit fixtures</b> to add them as the bracket is confirmed (R32 from Jun 28; Final Jul 20 IST).</Empty>}
      {!editKO && grouped.map((g) => (
        <div key={g.round} style={{ marginBottom: 18 }}>
          <DayHead>{g.round}</DayHead>
          {g.items.map((mt) => mt.home && mt.away
            ? <PredictRow key={mt.id} mt={mt} pr={(preds[myId] || {})[mt.id]} rs={results[mt.id]} now={now} setPred={setPred} onOpen={() => onOpen(mt.id)} />
            : <div key={mt.id} className="row"><span style={{ color: "#b8b1a2", fontStyle: "italic", fontSize: 13 }}>{mt.round} — TBD</span></div>)}
        </div>
      ))}
    </div>
  );
}

function KnockoutEditor({ kos, addKO, delKO }) {
  const [round, setRound] = useState("Round of 32");
  const [home, setHome] = useState(""), [away, setAway] = useState(""), [dt, setDt] = useState("");
  const add = () => {
    if (!home.trim() || !away.trim()) return;
    const ko = dt ? new Date(dt + ":00+05:30").getTime() : 0;
    addKO({ id: "k" + Date.now().toString(36) + Math.floor(Math.random() * 1000), round, home: home.trim(), away: away.trim(), ko });
    setHome(""); setAway(""); setDt("");
  };
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.LINE}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
      <div style={{ fontWeight: 700, color: C.NAVY, marginBottom: 10 }}>Add a knockout tie</div>
      <select value={round} onChange={(e) => setRound(e.target.value)} className="inp" style={{ marginBottom: 8 }}>{ROUNDS.map((r) => <option key={r}>{r}</option>)}</select>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input className="inp" placeholder="Home team" value={home} onChange={(e) => setHome(e.target.value)} />
        <input className="inp" placeholder="Away team" value={away} onChange={(e) => setAway(e.target.value)} />
      </div>
      <label style={{ fontSize: 11, color: C.MUTE }}>Kickoff (IST)</label>
      <input className="inp" type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} style={{ marginTop: 4, marginBottom: 10 }} />
      <button onClick={add} className="btn-gold" style={{ width: "100%" }}>Add tie</button>
      {kos.length > 0 && <div style={{ marginTop: 14, borderTop: `1px solid ${C.LINE}`, paddingTop: 10 }}>
        {kos.map((k) => (
          <div key={k.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f0ede6" }}>
            <span style={{ fontSize: 13 }}><span className="rd">{k.round}</span>{k.home} v {k.away}{k.ko ? <span style={{ color: C.MUTE, fontSize: 11 }}> · {fmtDate(k.ko)} {fmtTime(k.ko)}</span> : <span style={{ color: C.RED, fontSize: 11 }}> · no time</span>}</span>
            <button onClick={() => delKO(k.id)} className="ghost" style={{ color: C.RED }}>remove</button>
          </div>
        ))}
      </div>}
    </div>
  );
}

function MatchView({ mt, roster, preds, results, myId, reveal, setPred, now, openPlayer }) {
  if (!mt) return <Empty>Match not found.</Empty>;
  const rs = results[mt.id]; const locked = now >= mt.ko;
  const rows = roster.map((p) => { const pr = preds[p.id] && preds[p.id][mt.id]; return { ...p, pr, s: score(pr, rs) }; }).filter((r) => filled(r.pr));
  rows.sort((a, b) => (b.s ?? -1) - (a.s ?? -1) || a.name.localeCompare(b.name));
  const myPr = (preds[myId] || {})[mt.id] || ["", ""];
  return (
    <div style={{ marginTop: 14 }}>
      {mt.round && <div className="rd" style={{ marginBottom: 6 }}>{mt.round}</div>}
      <div style={{ fontFamily: "Georgia, serif", fontSize: 24, fontWeight: 700, color: C.NAVY }}>{mt.home} <span style={{ color: "#b8b1a2", fontStyle: "italic", fontSize: 16 }}>v</span> {mt.away}</div>
      <div style={{ fontSize: 12.5, color: C.MUTE, marginTop: 4 }}>{fmtDate(mt.ko)} · {fmtTime(mt.ko)} IST {FAVS.has(mt.id) && <span style={{ color: C.GOLD }}>· ★ must-watch</span>}</div>
      <div style={{ margin: "12px 0", padding: "10px 14px", background: filled(rs) ? C.GOLD_SOFT : "#fff", border: `1px solid ${C.LINE}`, borderRadius: 10, fontSize: 14 }}>
        {filled(rs) ? <span>Full time <b style={{ fontSize: 18, color: C.INK }}>{rs[0]} – {rs[1]}</b></span> : locked ? <span style={{ color: C.RED }}>Locked · awaiting result</span> : <span style={{ color: C.GREEN }}>Kicks off {fmtTime(mt.ko)} IST — predictions open</span>}
      </div>
      {!locked && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 12.5, color: C.MUTE }}>Your pick:</span>
          <ScoreBox value={myPr[0]} onChange={(v) => setPred(mt.id, 0, v)} />
          <span style={{ color: C.MUTE, fontWeight: 700 }}>–</span>
          <ScoreBox value={myPr[1]} onChange={(v) => setPred(mt.id, 1, v)} />
        </div>
      )}
      <DayHead>{reveal ? `Predictions · ${rows.length}` : "Predictions"}</DayHead>
      {!reveal ? <Empty>{rows.length} pick{rows.length === 1 ? "" : "s"} in — hidden until kickoff so no one peeks.</Empty>
        : rows.length === 0 ? <Empty>No predictions for this match.</Empty>
        : rows.map((r) => (
          <button key={r.id} className="row" onClick={() => openPlayer(r.id)} style={{ width: "100%", background: "none", border: "none", borderBottom: `1px solid ${C.LINE}`, cursor: "pointer" }}>
            <span style={{ flex: 1, textAlign: "left", fontWeight: 600, color: r.id === myId ? C.GOLD : C.INK }}>{r.name}</span>
            <span style={{ fontFamily: "Georgia, serif", fontWeight: 700, color: C.NAVY, minWidth: 54, textAlign: "center" }}>{r.pr[0]}–{r.pr[1]}</span>
            <span style={{ minWidth: 40, textAlign: "right" }}>{r.s !== null ? <Pts s={r.s} /> : <span style={{ color: "#cfc8b8" }}>—</span>}</span>
          </button>
        ))}
    </div>
  );
}

function PlayerView({ player, allMatches, preds, results, myId, revealed, openMatch }) {
  if (!player) return <Empty>Player not found.</Empty>;
  const mine = preds[player.id] || {};
  let pts = 0, exact = 0, correct = 0, played = 0, made = 0;
  const list = [...allMatches].sort((a, b) => (a.ko || 0) - (b.ko || 0)).map((mt) => {
    const pr = mine[mt.id], rs = results[mt.id], s = score(pr, rs);
    if (filled(pr)) made++; if (s !== null) { played++; pts += s; if (s === 3) exact++; if (s >= 2) correct++; }
    return { mt, pr, rs, s };
  });
  const isMe = player.id === myId;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontFamily: "Georgia, serif", fontSize: 26, fontWeight: 700, color: C.NAVY }}>{player.name}{isMe && <span style={{ color: C.GOLD, fontSize: 13, fontWeight: 500 }}> · you</span>}</div>
      <div style={{ display: "flex", gap: 18, margin: "10px 0 16px", flexWrap: "wrap" }}>
        <Stat n={pts} l="points" big /><Stat n={exact} l="exact" /><Stat n={correct} l="results" /><Stat n={played} l="scored" /><Stat n={made} l="predicted" />
      </div>
      {list.map(({ mt, pr, rs, s }) => {
        const show = isMe || revealed(mt);
        return (
          <button key={mt.id} className="row" onClick={() => openMatch(mt.id)} style={{ width: "100%", background: "none", border: "none", borderBottom: `1px solid ${C.LINE}`, cursor: "pointer" }}>
            <span style={{ flex: 1, textAlign: "left", fontSize: 13.5, color: C.INK }}>{mt.round && <span className="rd">{mt.round}</span>}{mt.home} <i style={{ color: "#b8b1a2" }}>v</i> {mt.away}</span>
            <span style={{ minWidth: 50, textAlign: "center", fontFamily: "Georgia, serif", fontWeight: 700, color: filled(pr) ? C.NAVY : "#cfc8b8" }}>{show ? (filled(pr) ? `${pr[0]}–${pr[1]}` : "—") : "•–•"}</span>
            <span style={{ minWidth: 50, textAlign: "center", fontSize: 12, color: C.MUTE }}>{filled(rs) ? `${rs[0]}–${rs[1]}` : ""}</span>
            <span style={{ minWidth: 32, textAlign: "right" }}>{s !== null ? <Pts s={s} /> : ""}</span>
          </button>
        );
      })}
    </div>
  );
}

// shared bits
function Shell({ children }) {
  return (
    <div style={{ minHeight: "100vh", position: "relative", padding: "22px 14px 44px", fontFamily: "ui-sans-serif, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif", color: C.INK }}>
      <div className="kkm-bg" />
      <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>{children}</div>
    </div>
  );
}
function Centered({ children }) { return <div style={{ maxWidth: 380, margin: "9vh auto 0" }}><style>{css}</style><div className="glass">{children}</div></div>; }
function Kicker({ children }) { return <div style={{ fontSize: 10.5, letterSpacing: 4, textTransform: "uppercase", color: C.MUTE, fontWeight: 700 }}>{children}</div>; }
function Title({ children }) { return <div style={{ fontFamily: "Georgia, serif", fontSize: 30, fontWeight: 700, color: C.NAVY, lineHeight: 1.05, marginTop: 6 }}>{children}</div>; }
function Seg({ on, onClick, children }) { return <button onClick={onClick} className="seg" style={{ background: on ? C.NAVY : "transparent", color: on ? "#fff" : C.MUTE, borderColor: on ? C.NAVY : C.LINE }}>{children}</button>; }
function ScoreBox({ value, onChange, disabled, accent }) { return <input type="number" inputMode="numeric" min={0} max={99} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="sbox" style={{ borderColor: accent ? C.GOLD : C.LINE, background: disabled ? "#f4f1ea" : "#fff", color: disabled ? "#9b9485" : C.INK }} />; }
function Pts({ s }) { const c = s === 3 ? C.GOLD : s === 2 ? C.GREEN : "#c4bdae"; return <b style={{ color: c }}>+{s}</b>; }
function Tag({ c, children }) { return <span style={{ fontSize: 11, letterSpacing: 1, color: c, fontWeight: 700 }}>{children}</span>; }
function DayHead({ children }) { return <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.MUTE, fontWeight: 700, marginBottom: 8 }}>{children}</div>; }
function Notice({ children }) { return <div style={{ background: "#fff", border: `1px solid ${C.LINE}`, borderLeft: `3px solid ${C.GOLD}`, borderRadius: 8, padding: "10px 12px", fontSize: 12.5, color: "#5c5648", marginBottom: 14 }}>{children}</div>; }
function Empty({ children }) { return <div style={{ color: C.MUTE, padding: "22px 0", textAlign: "center", fontSize: 13 }}>{children}</div>; }
function Stat({ n, l, big }) { return <div><div style={{ fontFamily: "Georgia, serif", fontSize: big ? 28 : 20, fontWeight: 700, color: big ? C.GOLD : C.NAVY, lineHeight: 1 }}>{n}</div><div style={{ fontSize: 10, letterSpacing: 1, color: C.MUTE, textTransform: "uppercase", marginTop: 2 }}>{l}</div></div>; }

function LiveTicker() {
  const [live, setLive] = useState([]);
  useEffect(() => {
    let on = true;
    const load = async () => { try { const r = await fetch("/api/live"); const j = await r.json(); if (on) setLive(j.live || []); } catch { /* not deployed / no feed */ } };
    load(); const t = setInterval(load, 60000); return () => { on = false; clearInterval(t); };
  }, []);
  if (!live.length) return null;
  const m = live[0];
  const q = encodeURIComponent(`${m.home} vs ${m.away} live score`);
  return (
    <a href={`https://www.google.com/search?q=${q}`} target="_blank" rel="noreferrer"
      style={{ display: "flex", alignItems: "center", gap: 10, background: C.NAVY, color: "#fff", borderRadius: 10, padding: "9px 13px", marginTop: 12, textDecoration: "none", fontSize: 13.5 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#ff8a8a", fontWeight: 700, fontSize: 11, letterSpacing: 1 }}><span style={{ width: 7, height: 7, borderRadius: 9, background: "#ff5252", display: "inline-block" }} />LIVE</span>
      <b>{m.home} {m.h}–{m.a} {m.away}</b>
      <span style={{ color: "#c3cde0" }}>{m.minute ? `${m.minute}'` : ""}</span>
      <span style={{ marginLeft: "auto", color: "#c3cde0", fontSize: 12 }}>commentary ›</span>
    </a>
  );
}

function PredTicker({ made }) {
  const bonus = Math.floor(made / 5);
  const toNext = (bonus + 1) * 5 - made;
  return (
    <div style={{ background: C.GOLD_SOFT, border: "1px solid #e6d3b0", borderRadius: 10, padding: "9px 13px", marginBottom: 14, fontSize: 12.5, color: "#6b4f1f" }}>
      You've predicted <b>{made}</b> {made === 1 ? "match" : "matches"} · earned <b>+{bonus}</b> bonus {bonus === 1 ? "pt" : "pts"} · <b>{toNext}</b> more for the next bonus.
    </div>
  );
}

function Rules() {
  const items = [
    ["Scoring", "Right result (win, draw or loss) = 2 points. Exact scoreline = 3 points. Wrong result = 0."],
    ["Volume bonus", "Every 5 matches you predict earns +1 bonus point. The more you play, the more you climb — no penalty for skipping."],
    ["Deadline", "Predictions lock the moment a match kicks off (IST). No late entries."],
    ["Privacy", "Everyone's picks stay hidden until kickoff. After that, they appear on the match page for all to see."],
    ["Signing in", "Enter the pool code once to join. After that, log in with your name and your 4-digit PIN — that's how only you can edit your picks."],
    ["Results", "Final scores sync automatically from the live feed. Anyone can also enter or correct a score on the Results tab."],
    ["Leaderboard", "Three views: Group, Knockout, and Overall. A group-stage champion can be crowned before the knockouts begin."],
    ["Knockouts", "Ties are added as the bracket is confirmed, and score exactly like group matches."],
  ];
  return (
    <div style={{ marginTop: 16 }}>
      {items.map(([h, b]) => (
        <div key={h} style={{ padding: "11px 0", borderBottom: `1px solid ${C.LINE}` }}>
          <div style={{ fontWeight: 700, color: C.NAVY, fontSize: 14.5 }}>{h}</div>
          <div style={{ fontSize: 13, color: "#5c5648", marginTop: 3, lineHeight: 1.5 }}>{b}</div>
        </div>
      ))}
    </div>
  );
}

function News() {
  const [items, setItems] = useState(null);
  const [q, setQ] = useState("FIFA World Cup 2026");
  const load = async (query) => {
    setItems(null);
    try { const r = await fetch("/api/news?q=" + encodeURIComponent(query)); const j = await r.json(); setItems(j.items || []); }
    catch { setItems([]); }
  };
  useEffect(() => { load(q); }, []);
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Team or topic" onKeyDown={(e) => e.key === "Enter" && load(q)} />
        <button onClick={() => load(q)} className="btn-gold">Search</button>
      </div>
      {items === null && <Empty>Loading headlines…</Empty>}
      {items && items.length === 0 && <Empty>No headlines (the news feed runs on the deployed site).</Empty>}
      {items && items.map((it, i) => (
        <a key={i} href={it.link} target="_blank" rel="noreferrer" className="row" style={{ textDecoration: "none", display: "block", padding: "11px 0" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.NAVY, lineHeight: 1.35 }}>{it.title}</div>
          <div style={{ fontSize: 11.5, color: C.MUTE, marginTop: 3 }}>{it.source}{it.pubDate ? ` · ${it.pubDate}` : ""}</div>
        </a>
      ))}
    </div>
  );
}

const css = `
  .kkm-bg{ position:fixed; inset:0; background:#0a1f44 url('/wc-hero.jpg') center/cover no-repeat; }
  .kkm-bg::after{ content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(9,16,32,0.5), rgba(9,16,32,0.72)); }
  .panel{ background:rgba(250,247,242,0.96); border:1px solid rgba(255,255,255,0.5); border-radius:18px; padding:0 16px 24px; box-shadow:0 14px 46px rgba(8,16,34,0.4); overflow:hidden; }
  .masthead{ position:relative; margin:0 -16px 16px; padding:24px 18px 18px; background:#0a1f44 url('/wc-hero.jpg') center 32%/cover no-repeat; border-radius:18px 18px 0 0; overflow:hidden; }
  .masthead::before{ content:""; position:absolute; inset:0; background:linear-gradient(155deg, rgba(10,31,68,0.4), rgba(10,31,68,0.9)); }
  .masthead > *{ position:relative; }
  .glass{ background:rgba(250,247,242,0.95); border:1px solid rgba(255,255,255,0.55); border-radius:18px; padding:26px 22px; box-shadow:0 16px 50px rgba(8,16,34,0.45); }
  .sbox{ width:38px;height:38px;text-align:center;font-size:15px;font-weight:700;border:1px solid ${C.LINE};border-radius:9px;outline:none;-moz-appearance:textfield; }
  .sbox::-webkit-outer-spin-button,.sbox::-webkit-inner-spin-button{ -webkit-appearance:none;margin:0; }
  .sbox:focus{ border-color:${C.NAVY};box-shadow:0 0 0 3px rgba(10,31,68,0.08); }
  .row{ display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid ${C.LINE}; }
  .mname{ flex:1;min-width:0;background:none;border:none;text-align:left;font-size:14.5px;font-weight:600;color:${C.NAVY};cursor:pointer;display:flex;align-items:center;gap:6px;padding:0; }
  .mname i{ color:#b8b1a2;font-style:italic;font-weight:400;font-size:12px; }
  .mname .open{ color:#cfc8b8;font-weight:700; }
  .rd{ font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:${C.GOLD};font-weight:700;background:${C.GOLD_SOFT};padding:2px 6px;border-radius:5px;margin-right:6px; }
  .tab{ background:none;border:none;padding:9px 12px 10px;font-size:13.5px;cursor:pointer; }
  .seg{ padding:6px 13px;border:1px solid ${C.LINE};border-radius:999px;font-size:12.5px;font-weight:600;cursor:pointer; }
  .chip{ display:inline-flex;align-items:center;gap:7px;padding:7px 13px;border:1px solid ${C.LINE};border-radius:999px;background:#fff;font-size:13px;cursor:pointer; }
  .lbrow{ display:flex;align-items:center;gap:12px;padding:12px;border-radius:10px;margin-bottom:6px;cursor:pointer;width:100%; }
  .btn-gold{ background:${C.GOLD};color:#fff;border:none;padding:10px 16px;border-radius:9px;font-size:13.5px;font-weight:700;cursor:pointer; }
  .ghost{ background:none;border:none;color:${C.MUTE};font-size:12.5px;cursor:pointer;padding:6px 8px; }
  .inp{ width:100%;padding:10px 12px;border-radius:9px;border:1px solid ${C.LINE};font-size:14px;outline:none;background:#fff;font-family:inherit;box-sizing:border-box; }
  .inp:focus{ border-color:${C.NAVY}; }
  button{ font-family:inherit; }
`;
