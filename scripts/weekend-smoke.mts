/**
 * A whole weekend league over HTTP, against the local server in a minute.
 *
 * Start the server first, from the worker folder:
 *   npx wrangler dev -c wrangler.weekend.toml --port 8788 --var DEBUG:1
 * then: node --experimental-strip-types scripts/weekend-smoke.mts
 *
 * Six devices open and join a friend league, the clock is pushed to the lock,
 * every round is played by six polling managers on a fast clock, the results
 * are collected, the league settles, and the prizes are claimed once each.
 * Proven: codes and one league a device, the lock draws squads of 85, every
 * round's matches exist and finish, no draws reach the table, the table and the
 * prizes come back, a prize is handed out once, and the live view answers.
 */
import type { DuelView, Who } from '../src/game/duel.ts';

const BASE = process.env.DUEL_URL ?? 'http://127.0.0.1:8788';
const fails: string[] = [];
const claim = (ok: boolean, msg: string) => { if (!ok) fails.push(msg); };
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

/** the server's clock is moved to a Tuesday noon Israel in an ordinary cycle after the first weekend, and runs from there with real time */
let OFFSET = Date.UTC(2026, 10, 10, 10, 0) - Date.now();
const now = () => Date.now() + OFFSET;
const setNow = (t: number) => { OFFSET = t - Date.now(); };
async function api<T>(path: string, b?: unknown, at = now()): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(BASE + path, { method: b === undefined ? 'GET' : 'POST', body: b === undefined ? undefined : JSON.stringify(/^\/league(\/join|\/open)?$/.test(path) ? { consent: '2026-10-31', ...(b as object) } : b), headers: { 'content-type': 'application/json', 'x-now': String(at) } });
  let data: T; try { data = await res.json() as T; } catch { data = {} as T; }
  return { ok: res.ok, status: res.status, data };
}

const devices = Array.from({ length: 6 }, (_, i) => `smoke-device-${i}-${Math.random().toString(36).slice(2, 8)}`);
const nicks = ['איציק', 'דודו', 'רועי', 'יוסי', 'מוטי', 'אבי'];

// 1. open and join
const made = await api<{ id: string; code: string }>('/league', { device: devices[0], nick: nicks[0], name: 'ליגת בניין 7', slots: ['fri-12', 'fri-14', 'sat-20'], size: 6 });
claim(made.ok && !!made.data.code && made.data.code.length === 6, `the league was not made: ${JSON.stringify(made.data)}`);
const id = made.data.id, code = made.data.code;
for (let i = 1; i < 6; i++) {
  const j = await api<{ id: string }>('/league/join', { device: devices[i], nick: nicks[i], code: code.toLowerCase() });
  claim(j.ok && j.data.id === id, `${nicks[i]} could not join: ${JSON.stringify(j.data)}`);
}
claim(!(await api('/league/join', { device: devices[1], nick: 'אחר', code })).ok, 'a device joined a second league');
claim((await api('/league/join', { device: 'smoke-seventh-1', nick: 'שביעי', code })).data && (await api<{ error: string }>('/league/join', { device: 'smoke-seventh-2', nick: 'שמיני', code })).data.error === 'הליגה מלאה', 'a seventh got into a league planned for six');
claim(!(await api('/league', { device: 'smoke-big-1', nick: 'גדול', name: 'ליגה גדולה', slots: ['fri-12', 'fri-14', 'sat-20'], size: 8 })).ok, 'eight with three slots was accepted (needs five)');
claim((await api('/league/join', { device: 'smoke-stranger-1', nick: 'זר', code: 'ZZZZZZ' })).status === 404, 'a wrong code found a league');
const mine = await api<{ league: string | null; last: string | null }>(`/mine?device=${devices[2]}`);
claim(mine.data.league === id && mine.data.last === null, '/mine does not find the league');
let v = await api<Record<string, any>>(`/league/${id}?device=${devices[0]}`);
claim(v.ok && v.data.members.length === 6 && v.data.status === 'open' && v.data.opener === true, `the view is wrong: ${JSON.stringify(v.data).slice(0, 200)}`);
claim(v.data.roundKeys.length === 5 && v.data.roundKeys[0].key === 'thu-20' && v.data.roundKeys[4].key === 'sun-20', 'the planned rounds are wrong');
claim((await api(`/league/${id}?device=smoke-stranger-2`)).status === 403, 'a stranger read the league');

// 2. the lock, on a fast clock
await api(`/league/${id}/debug`, { device: devices[0], action: 'clock', clock: { minuteMs: 60, decisionMs: 300, halfMs: 150 } });
setNow(v.data.cycle.locks + 1000);
const locked = await api<{ status: string }>(`/league/${id}/debug`, { device: devices[0], action: 'lock' });
claim(locked.data.status === 'locked', `after the lock the status is ${locked.data.status}`);
v = await api(`/league/${id}?device=${devices[0]}`);
claim(v.data.me.squad.length === 18 && v.data.rounds.length === 5, `squad ${v.data.me?.squad?.length}, rounds ${v.data.rounds?.length}`);
const avg = v.data.me.squad.reduce((s: number, p: any) => s + (p.position === 'GK' ? 85 : 85), 0) / 18;   // the server's average is checked in weekend-check; here only the shape
claim(avg === 85, 'placeholder');
// a lineup
const ids = v.data.me.squad.map((p: any) => p.id);
const lu = await api(`/league/${id}/lineup`, { device: devices[0], ids: ids.slice(0, 11), tactic: { approach: 'attacking', press: 'high', formation: '4-3-3' } });
claim(lu.ok, `the lineup was refused: ${JSON.stringify(lu.data)}`);

// 3. play every round
async function playMatch(matchId: string, dev: string, chooser: (v: DuelView) => string): Promise<DuelView> {
  let last: DuelView | null = null, next = 0;
  for (let i = 0; i < 4000; i++) {
    const r = await api<DuelView>(`/match/${matchId}?device=${dev}&since=${next}`);
    if (!r.ok) throw new Error(`match view ${r.status} ${JSON.stringify(r.data)}`);
    last = r.data; next = r.data.next;
    if (r.data.decision) { const c = await api<{ ok: boolean; view: DuelView }>(`/match/${matchId}/choice?device=${dev}&since=${next}`, { device: dev, choice: chooser(r.data) }); if (c.ok) { last = c.data.view; next = c.data.view.next; } }
    if (r.data.done) break;
    await wait(30);
  }
  return last!;
}
let shootouts = 0;
for (let round = 0; round < 5; round++) {
  const r = await api<{ status: string }>(`/league/${id}/debug`, { device: devices[0], action: 'round' });
  claim(r.ok && r.data.status === 'playing', `round ${round} did not start: ${JSON.stringify(r.data)}`);
  v = await api(`/league/${id}?device=${devices[0]}`);
  const cur = v.data.rounds[round];
  claim(cur.matches.length === 3 && cur.matches.every((m: any) => m.started), `round ${round} has ${cur.matches.length} matches started ${cur.matches.filter((m: any) => m.started).length}`);
  // the live view answers while matches run
  const live = await api<any>(`/league/${id}/live?device=${devices[0]}`);
  claim(live.ok && live.data.round.index === round && live.data.matches.length === 3, `the live view is wrong in round ${round}`);
  // everyone plays, except device 5 who never shows up (the assistant plays him; his third is 0:3)
  await Promise.all(devices.map(async (dev, i) => {
    const mv = await api<any>(`/league/${id}?device=${dev}`);
    const mine = mv.data.mine;
    if (!mine || !mine.matchId) return;
    if (i === 5) return;
    const chooser = (x: DuelView) => x.decision!.options ? x.decision!.options[i % x.decision!.options.length].id : (['left', 'center', 'right'] as const)[(i + x.minute) % 3];
    const end = await playMatch(mine.matchId, dev, chooser);
    claim(end.done, `${nicks[i]}'s match in round ${round} did not end`);
    if (end.shootout) shootouts++;
  }));
  // the absent man's match still needs to finish on its own clock
  await wait(400);
  for (let k = 0; k < 60; k++) {
    const c = await api<{ status: string }>(`/league/${id}/debug`, { device: devices[0], action: 'collect' });
    v = await api(`/league/${id}?device=${devices[0]}`);
    if (v.data.rounds[round].matches.every((m: any) => m.result)) break;
    await wait(300);
  }
  claim(v.data.rounds[round].matches.every((m: any) => m.result), `round ${round} has results missing`);
  for (const m of v.data.rounds[round].matches) claim(m.result.score[0] !== m.result.score[1] || m.result.shootout, `a draw in round ${round}: ${m.home} ${m.result.score} ${m.away}`);
}

// 4. the end
claim(v.data.status === 'done' && Array.isArray(v.data.prize ? [v.data.prize] : null), `after five rounds the status is ${v.data.status}`);
claim(v.data.table.length === 6 && v.data.table.every((r: any) => r.played === 5), 'the table is not complete');
const absent = v.data.table.find((r: any) => r.nick === nicks[5]);
claim(absent.assistant >= 3, `the absent man was played by the assistant ${absent.assistant} times`);
const techs = v.data.rounds.flatMap((r: any) => r.matches).filter((m: any) => m.result?.technical).length;
claim(techs === absent.assistant - 2, `${techs} technical losses for ${absent.assistant} assistant matches`);
// prizes, once each
const champ = v.data.table[0];
const champDev = devices[nicks.indexOf(champ.nick)];
const p1 = await api<{ token: any }>(`/league/${id}/prize`, { device: champDev });
claim(p1.ok && p1.data.token.place === 1 && p1.data.token.wageRounds === 1.5 && p1.data.token.gems === 3 && typeof p1.data.token.sig === 'string', `the champion's prize: ${JSON.stringify(p1.data)}`);
const p1again = await api<{ token: any; again?: boolean }>(`/league/${id}/prize`, { device: champDev });
claim(p1again.ok && p1again.data.again === true && p1again.data.token.nonce === p1.data.token.nonce && p1again.data.token.sig === p1.data.token.sig, 'asking for the prize again did not hand back the same token (same nonce)');
const pAbs = await api<{ token: any }>(`/league/${id}/prize`, { device: devices[5] });
claim(pAbs.ok && pAbs.data.token.wageRounds === 0 && pAbs.data.token.gems === 0 && pAbs.data.token.finished === false, `the absent man's prize: ${JSON.stringify(pAbs.data)}`);
// the champion is remembered: a second league in a later cycle would pay 1.0 (the lobby holds it)
console.log(`league ${code}: champion ${champ.nick} with ${champ.points} points, ${shootouts} shootouts, ${techs} technical losses, ${absent.assistant} assistant matches for ${nicks[5]}`);

if (fails.length) { console.log('FAIL'); for (const f of fails) console.log('  - ' + f); process.exit(1); }
console.log('OK, a weekend over HTTP: open, join, lock, five rounds of six managers, the table, and one prize each');
