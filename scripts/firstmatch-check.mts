/**
 * Run:
 *   node --experimental-strip-types scripts/firstmatch-check.mts            (the check)
 *   node --experimental-strip-types scripts/firstmatch-check.mts --write    (re-pin the fixture; only on a commit that changes no text)
 *
 * The first match (Itzik, 2.11). Match 1 of a new-opening career (obV2, season 1, week 1) has words of
 * its own: no previous match, no table, no run, no "again", no training week behind him. Points:
 *   1. week 1 of 240 quick-started careers (every city, varied tactics and answers): no line the player
 *      reads on the tactic screen, the result screen or in the press room carries a history word
 *   2. same careers: the press questions, the fan and the answers picked are the SAME ids the pinned
 *      build picked (only the wording changed), and the save after week 1 is byte-identical to it
 *      (the press card is gone from the save by then, so nothing else differs)
 *   3. weeks 2..6 of those careers and weeks 1..6 of classic careers: every text, and the whole save at
 *      the end of each week, byte-identical to the pinned build (scripts/fixtures/first-match-snapshot.json)
 *   4. the gate: the first-match words are only for obV2 + season 1 + week 1
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import * as G from '../src/game/state.ts';
import { newGameV2, quickStart } from '../src/game/onboardV2.ts';
import { CITIES } from '../src/data/cities.ts';
import { harvestWeek, type Slot } from './first-match-texts.mts';

const FIXTURE = new URL('./fixtures/first-match-snapshot.json', import.meta.url);
const WRITE = process.argv.includes('--write');
const fails: string[] = [];
let checked = 0;
/** the save as bytes; obV2.t0 is the wall clock the career started at, the one field no two runs share */
const bytes = (gs: G.GameState) => JSON.stringify(gs, (k, v) => (k === 't0' ? 0 : v));
const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const cities = CITIES.map(c => c.name);

/** the history words: anything that leans on a match, a week, a run or a table before this one */
export const HISTORY = [
  /(^|[\s,."'(])ו?שוב([\s,.?!]|$)/, /בשבוע שעבר/, /במשחק הקודם|מהמשחק הקודם|הקודם/, /לעומת/, /רצף|ברצף/,
  /טבלה|בטבלה/, /בפסגה|בצמרת|בתחתית/, /המקום שלכם|במקום \d|מקום ראשון/, /סוף סוף/, /כבר חודש/,
  /בשבועות האחרונים/, /כל השבוע|כל שבוע/, /עוד תיקו|עוד ניצחון|עוד ילד/, /מתחילים להתרגל/, /אמרתי לך/,
  /העונה\?|הכי טוב שלכם העונה/, /עוד כאלה/, /קוראים להחליף/, /איפה מצאת/, /להביא אותו/, /מאז שעלינו/,
  /להציל עונה/, /מבזבז עונה/, /הרודפות|רודפות אחריכם/, /כל הליגה מחכה שתיפלו/, /אותו הרכב/,
];

/* ---------------------------------------------------------------- careers */

const sheet = (gs: G.GameState): G.GameState => {
  let guard = 0;
  while (gs.phase !== 'tactic' && guard++ < 40) {
    if (gs.phase === 'chat') gs = G.closeChat(gs);
    else if (gs.phase === 'sponsor') gs = G.takeSponsor(gs, 'base');
    else if (gs.phase === 'ob-friends') gs = G.leaveObFriends(gs);
    else gs = { ...gs, phase: 'tactic', dilemma: null };
  }
  return gs;
};

interface Week { texts: string[]; state: string }
/** one week, every text read on it (tactic screen, hub fan, result, press, the chat after) and the save at its end */
function week(gs: G.GameState, k: number, keep: (slot: Slot, key: string, text: string) => void = () => {}): { gs: G.GameState; w: Week } {
  const texts: string[] = [];
  const add = (slot: Slot, key: string, text: string) => { texts.push(`${slot}|${key}|${text}`); keep(slot, key, text); };
  if (!(gs.obV2 && gs.season === 1 && gs.week === 1)) add('fan_post', 'pre', JSON.stringify(G.fanNote(gs, 'pre')));
  gs = harvestWeek(gs, k, add);
  if (gs.chat) texts.push('chat|' + JSON.stringify(gs.chat));
  if (gs.phase === 'ob-friends') gs = G.leaveObFriends(gs);
  gs = sheet(gs);
  return { gs, w: { texts, state: sha(bytes(gs)) } };
}

function classic(seed: number, city: number): G.GameState {
  let gs = G.newGame(seed);
  gs = G.setProfile(gs, { name: 'איציק', nickname: 'איציק', age: 38, type: 'mental' });
  gs = G.pickClub(gs, gs.league.clubs[city % gs.league.clubs.length].id);
  gs = G.afterSigning(gs, {});
  gs = G.enterSeason(gs);
  return sheet(gs);
}

/* ---------------------------------------------------------------- 1 + 2: week 1 */

const N1 = 240;
const ids1: string[] = [];
const state1: string[] = [];
const later: Record<string, string[]> = {};
const flagged = new Map<string, string>();
for (let s = 0; s < N1; s++) {
  const city = cities[(s * 7) % cities.length];
  const start = quickStart(newGameV2(500_000 + s), city);
  const picked: string[] = [];
  const { gs, w } = week(start, s, (slot, key, text) => {
    if (slot === 'press_q' || slot === 'fan_post' || slot === 'scout') picked.push(`${slot}:${key}`);
    checked++;
    const hit = HISTORY.find(re => re.test(text));
    if (hit && !WRITE) flagged.set(`${slot} ${key}: ${text}`, String(hit));
  });
  ids1.push(picked.join(','));
  state1.push(w.state);
  // 3a. weeks 2..6 of the same career (a dozen of them, for time)
  if (s % 20 === 0) {
    let g = gs; const ws: string[] = [];
    for (let k = 2; k <= 6 && g.phase === 'tactic'; k++) { const r = week(g, s + k); g = r.gs; ws.push(sha(r.w.texts.join('\n')) + ':' + r.w.state); }
    later[`v2/${s}`] = ws;
  }
}
// 3b. classic careers, weeks 1..6
for (let s = 0; s < 12; s++) {
  let g = classic(700_000 + s * 13, s); const ws: string[] = [];
  for (let k = 1; k <= 6 && g.phase === 'tactic'; k++) { const r = week(g, s + k); g = r.gs; ws.push(sha(r.w.texts.join('\n')) + ':' + r.w.state); }
  later[`v1/${s}`] = ws;
}

const snap = { ids1, state1, later };
if (WRITE) {
  writeFileSync(FIXTURE, JSON.stringify(snap, null, 1) + '\n');
  console.log(`firstmatch-check: fixture written (${ids1.length} week-1 careers, ${Object.keys(later).length} long careers)`);
  process.exit(0);
}

for (const [line, re] of flagged) fails.push(`week 1 says history (${re}): ${line}`);
const pin = JSON.parse(readFileSync(FIXTURE, 'utf8')) as typeof snap;
for (let i = 0; i < N1; i++) {
  checked += 2;
  if (pin.ids1[i] !== ids1[i]) fails.push(`career ${i}: week 1 picked ${ids1[i]}, the pinned build picked ${pin.ids1[i]}`);
  if (pin.state1[i] !== state1[i]) fails.push(`career ${i}: the save after week 1 is not the pinned one`);
}
for (const [tag, ws] of Object.entries(pin.later)) {
  ws.forEach((p, j) => { checked++; if (later[tag]?.[j] !== p) fails.push(`${tag} week ${tag.startsWith('v2') ? j + 2 : j + 1}: texts or save differ from the pinned build`); });
  if ((later[tag]?.length ?? 0) !== ws.length) fails.push(`${tag}: played ${later[tag]?.length} weeks, pinned ${ws.length}`);
}

/* ---------------------------------------------------------------- 4: the gate */
{
  const start = quickStart(newGameV2(500_001), cities[0]);
  checked += 4;
  if (!G.isFirstMatch(start)) fails.push('a quick-started career on week 1 is not the first match');
  if (G.isFirstMatch({ ...start, week: 2 })) fails.push('week 2 counts as the first match');
  if (G.isFirstMatch({ ...start, season: 2 })) fails.push('season 2 counts as the first match');
  if (G.isFirstMatch({ ...start, obV2: undefined } as G.GameState)) fails.push('a classic career counts as the first match');
}

if (fails.length) {
  console.error(`firstmatch-check: ${fails.length} failure(s) over ${checked} checks`);
  for (const f of fails.slice(0, 60)) console.error('  ' + f);
  process.exit(1);
}
console.log(`firstmatch-check: ${checked} checks passed (${N1} first matches clean, ${Object.keys(pin.later).length} longer careers identical)`);
