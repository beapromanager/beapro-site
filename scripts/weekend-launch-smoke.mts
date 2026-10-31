/**
 * The first weekend ever, over HTTP against the local server with the clock moved by hand (Itzik, 25.10).
 *
 * Start the server first, from the worker folder:
 *   npx wrangler dev -c wrangler.weekend.toml --port 8788 --var DEBUG:1
 * then: node --experimental-strip-types scripts/weekend-launch-smoke.mts
 *
 *   (Itzik, 29.10: the first registration moved to Monday 2.11 20:00 Israel; the weekend stays 5-8.11)
 *   2.11 17:59Z   nobody can open or join: the gate says Monday 2.11 20:00
 *   2.11 18:00Z   a league of seven opens (five slots), seven get in, the eighth is told it is full
 *   3.11 10:00Z   Tuesday: everyone is still in, the code still works, nothing swept
 *   5.11 15:00Z   the lock: seven rounds, a bye each, every pair once
 *   5.11 18:00Z   the rounds are played on a fast clock, one manager never shows up
 *   8.11 18:05Z   the final round is played with the clock already in the next cycle: /mine says league null, last = this one,
 *                 the view still answers, the table and the prize are there, the prize comes back twice with one nonce,
 *                 and the same device can open a league of the new cycle without a 409
 */
import type { DuelView } from '../src/game/duel.ts';

const BASE = process.env.DUEL_URL ?? 'http://127.0.0.1:8788';
const fails: string[] = [];
const claim = (ok: boolean, msg: string) => { if (!ok) fails.push(msg); };
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const Z = (y: number, m: number, d: number, hh: number, mm = 0) => Date.UTC(y, m - 1, d, hh, mm);

let OFFSET = Z(2026, 11, 2, 17, 59) - Date.now();
const now = () => Date.now() + OFFSET;
const setNow = (t: number) => { OFFSET = t - Date.now(); };
async function api<T>(path: string, b?: unknown, at = now()): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(BASE + path, { method: b === undefined ? 'GET' : 'POST', body: b === undefined ? undefined : JSON.stringify(/^\/league(\/join|\/open)?$/.test(path) ? { consent: '2026-10-31', ...(b as object) } : b), headers: { 'content-type': 'application/json', 'x-now': String(at) } });
  let data: T; try { data = await res.json() as T; } catch { data = {} as T; }
  return { ok: res.ok, status: res.status, data };
}
type Err = { error?: string };
const tag = Math.random().toString(36).slice(2, 8);
const devices = Array.from({ length: 8 }, (_, i) => `launch-${tag}-${i}`);
const nicks = ['איציק', 'דודו', 'רועי', 'יוסי', 'מוטי', 'אבי', 'גל', 'שמיני'];
const SLOTS = ['fri-12', 'fri-14', 'sat-20', 'sat-22', 'sun-10'];   // seven managers: seven rounds, five of them chosen

// 1. the gate
{
  const r = await api<Err>('/league', { device: devices[0], nick: nicks[0], name: 'ליגת הפתיחה', slots: SLOTS, size: 7 });
  claim(!r.ok && r.data.error === 'ההרשמה נפתחת ביום שני 2.11 ב-20:00', `at 17:59Z the door said ${JSON.stringify(r.data)}`);
  const o = await api<Err>('/league/open', { device: devices[1], nick: nicks[1] });
  claim(!o.ok && o.data.error === 'ההרשמה נפתחת ביום שני 2.11 ב-20:00', `at 17:59Z the open league said ${JSON.stringify(o.data)}`);
  const m = await api<{ league: string | null; last: string | null }>(`/mine?device=${devices[0]}`);
  claim(m.ok && m.data.league === null && m.data.last === null, `/mine before the launch: ${JSON.stringify(m.data)}`);
}

// 2. 18:00:00Z: a league of seven
setNow(Z(2026, 11, 2, 18));
const made = await api<{ id: string; code: string } & Err>('/league', { device: devices[0], nick: nicks[0], name: 'ליגת הפתיחה', slots: SLOTS, size: 7 });
claim(made.ok && !!made.data.code, `at 18:00Z the league was not made: ${JSON.stringify(made.data)}`);
const id = made.data.id, code = made.data.code;
for (let i = 1; i < 7; i++) {
  const j = await api<{ id: string } & Err>('/league/join', { device: devices[i], nick: nicks[i], code });
  claim(j.ok && j.data.id === id, `${nicks[i]} could not join: ${JSON.stringify(j.data)}`);
}
{
  const eighth = await api<Err>('/league/join', { device: devices[7], nick: nicks[7], code });
  claim(!eighth.ok && eighth.data.error === 'הליגה מלאה', `the eighth was told ${JSON.stringify(eighth.data)}`);
  const v = await api<Record<string, any>>(`/league/${id}?device=${devices[0]}`);
  claim(v.ok && v.data.members.length === 7 && v.data.capacity === 7 && v.data.status === 'open', `the view: ${JSON.stringify(v.data).slice(0, 160)}`);
  claim(v.data.cycle.opens === Z(2026, 11, 2, 18) && v.data.cycle.locks === Z(2026, 11, 5, 15) && v.data.cycle.final === Z(2026, 11, 8, 18), `the league's cycle is ${JSON.stringify(v.data.cycle)}`);
  claim(v.data.roundKeys.length === 7, `${v.data.roundKeys.length} planned rounds for seven`);
}

// 3. Tuesday 3.11: nothing moves
setNow(Z(2026, 11, 3, 10));
{
  const m = await api<{ league: string | null; last: string | null; phase: string }>(`/mine?device=${devices[3]}`);
  claim(m.data.league === id && m.data.last === null && m.data.phase === 'open', `on Tuesday 3.11 /mine says ${JSON.stringify(m.data)}`);
  const v = await api<Record<string, any>>(`/league/${id}?device=${devices[3]}`);
  claim(v.ok && v.data.status === 'open' && v.data.members.length === 7, 'the league changed on Tuesday 3.11');
  const eighth = await api<Err>('/league/join', { device: devices[7], nick: nicks[7], code });
  claim(!eighth.ok && eighth.data.error === 'הליגה מלאה', `on 3.11 the code was forgotten or the league emptied: ${JSON.stringify(eighth.data)}`);
  const again = await api<Err>('/league', { device: devices[2], nick: 'שוב', name: 'עוד ליגה', slots: ['fri-12', 'fri-14', 'sat-20'], size: 6 });
  claim(again.status === 409, `a member could open a second league on 3.11: ${again.status} ${JSON.stringify(again.data)}`);
}

// 4. the lock
await api(`/league/${id}/debug`, { device: devices[0], action: 'clock', clock: { minuteMs: 60, decisionMs: 300, halfMs: 150 } });
setNow(Z(2026, 11, 5, 15) + 1000);
let v = await api<Record<string, any>>(`/league/${id}?device=${devices[0]}`);   // the tick on a view locks it
claim(v.data.status === 'locked', `at the lock the status is ${v.data.status}`);
claim(v.data.rounds.length === 7 && v.data.rounds.every((r: any) => r.bye && r.matches.length === 3), `after the lock: ${v.data.rounds.length} rounds`);
claim(new Set(v.data.rounds.map((r: any) => r.bye)).size === 7, 'someone rests twice');
claim(v.data.me.squad.length === 18, 'no squad');

// 5. the rounds, one manager (6) never shows up
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
setNow(Z(2026, 11, 5, 18) + 1000);
for (let round = 0; round < 7; round++) {
  // the last round is the final: the clock is Sunday 8.11 20:05, already the next cycle
  if (round === 6) setNow(Z(2026, 11, 8, 18) + 5 * 60_000 + 1000);
  const r = await api<{ status: string }>(`/league/${id}/debug`, { device: devices[0], action: 'round' });
  claim(r.ok && r.data.status === 'playing', `round ${round} did not start: ${JSON.stringify(r.data)}`);
  v = await api(`/league/${id}?device=${devices[0]}`);
  const cur = v.data.rounds[round];
  claim(cur.matches.length === 3 && cur.matches.every((m: any) => m.started), `round ${round}: ${cur.matches.filter((m: any) => m.started).length} of ${cur.matches.length} started`);
  await Promise.all(devices.slice(0, 7).map(async (dev, i) => {
    const mv = await api<any>(`/league/${id}?device=${dev}`);
    const mine = mv.data.mine;
    if (!mine || !mine.matchId || i === 6) return;
    const chooser = (x: DuelView) => x.decision!.options ? x.decision!.options[i % x.decision!.options.length].id : (['left', 'center', 'right'] as const)[(i + x.minute) % 3];
    const end = await playMatch(mine.matchId, dev, chooser);
    claim(end.done, `${nicks[i]}'s match in round ${round} did not end`);
  }));
  await wait(400);
  for (let k = 0; k < 60; k++) {
    await api(`/league/${id}/debug`, { device: devices[0], action: 'collect' });
    v = await api(`/league/${id}?device=${devices[0]}`);
    if (v.data.rounds[round].matches.every((m: any) => m.result)) break;
    await wait(300);
  }
  claim(v.data.rounds[round].matches.every((m: any) => m.result), `round ${round} has results missing`);
}

// 6. after Sunday 20:00: the lobby moved on, the league is still here as last
{
  const t = now();
  claim(t > Z(2026, 11, 8, 18), 'the clock is not past the final');
  const m = await api<{ league: string | null; last: string | null; cycle: { opens: number } }>(`/mine?device=${devices[2]}`);
  claim(m.data.league === null && m.data.last === id && m.data.cycle.opens === Z(2026, 11, 8, 18), `after the final /mine says ${JSON.stringify(m.data)}`);
  claim(v.data.status === 'done' && v.data.table.length === 7 && v.data.table.every((r: any) => r.played === 6), `after seven rounds: status ${v.data.status}, table ${v.data.table?.length}`);
  const absent = v.data.table.find((r: any) => r.nick === nicks[6]);
  claim(absent.assistant === 6, `the absent man was played by the assistant ${absent.assistant} times, wanted 6`);
  const techs = v.data.rounds.flatMap((r: any) => r.matches).filter((m: any) => m.result?.technical).length;
  claim(techs === 4, `${techs} technical losses, wanted 4 (six assistant matches, the first two allowed)`);
  const champ = v.data.table[0];
  const champDev = devices[nicks.indexOf(champ.nick)];
  const cv = await api<Record<string, any>>(`/league/${id}?device=${champDev}`);
  claim(cv.ok && cv.data.prize && cv.data.prize.place === 1 && cv.data.claimed === false, `the champion's view after the final: ${JSON.stringify(cv.data.prize)} claimed ${cv.data.claimed}`);
  const p1 = await api<{ token: any }>(`/league/${id}/prize`, { device: champDev });
  claim(p1.ok && p1.data.token.place === 1 && p1.data.token.wageRounds === 1.5 && p1.data.token.gems === 3 && p1.data.token.final === Z(2026, 11, 8, 18), `the champion's prize: ${JSON.stringify(p1.data)}`);
  const p2 = await api<{ token: any; again?: boolean }>(`/league/${id}/prize`, { device: champDev });
  claim(p2.ok && p2.data.again === true && p2.data.token.nonce === p1.data.token.nonce && p2.data.token.sig === p1.data.token.sig, `the second ask: ${JSON.stringify(p2.data).slice(0, 120)}`);
  const cv2 = await api<Record<string, any>>(`/league/${id}?device=${champDev}`);
  claim(cv2.data.claimed === true, 'the view does not say claimed');
  // the same device opens a league of the new cycle, no 409
  const fresh = await api<{ id: string; code: string } & Err>('/league', { device: champDev, nick: 'אלוף', name: 'השבוע הבא', slots: ['fri-12', 'fri-14', 'sat-20'], size: 6 });
  claim(fresh.ok && !!fresh.data.code, `the champion could not open a league of the new cycle: ${JSON.stringify(fresh.data)}`);
  const m2 = await api<{ league: string | null; last: string | null }>(`/mine?device=${champDev}`);
  claim(m2.data.league === fresh.data.id && m2.data.last === id, `after opening the next one /mine says ${JSON.stringify(m2.data)}`);
  // a week after the final the last league is gone from /mine
  const later = await api<{ league: string | null; last: string | null }>(`/mine?device=${devices[2]}`, undefined, Z(2026, 11, 8, 18) + 7 * 86_400_000 + 60_000);
  claim(later.data.last === null, `eight days after the final /mine still says last ${later.data.last}`);
  console.log(`league ${code}: champion ${champ.nick} with ${champ.points} points, ${techs} technical losses for ${nicks[6]}`);
}

if (fails.length) { console.log('FAIL'); for (const f of fails) console.log('  - ' + f); process.exit(1); }
console.log('OK, the first weekend over HTTP: gated until Monday 2.11 20:00, seven in and the eighth out, nothing swept on Tuesday 3.11, seven rounds, and the final, the table and the prize all there after Sunday 8.11 20:00');
