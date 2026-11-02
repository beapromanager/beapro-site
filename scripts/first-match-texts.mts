/**
 * Every line the player reads around match 1 of a new-opening career, harvested off the real
 * generators (the same calls the screens make), for the audit and for first-match-check.
 *   node --experimental-strip-types scripts/first-match-texts.mts <out.json> [seeds]
 */
import * as G from '../src/game/state.ts';
import { FIRST_PURSE } from '../src/data/firstMatchText.ts';
import { newGameV2, quickStart } from '../src/game/onboardV2.ts';
import { simulateMatch } from '../src/engine/matchEngine.ts';
import type { Approach, Press } from '../src/engine/matchEngine.ts';
import { DEFAULT_FORMATION } from '../src/data/formations.ts';
import { CITIES } from '../src/data/cities.ts';
import { writeFileSync } from 'node:fs';

export type Slot = 'scout' | 'assistant' | 'headline' | 'purse' | 'fan_post' | 'press_q' | 'press_a' | 'press_r';
export interface Seen { slot: Slot; key: string; text: string; n: number }

const APPROACHES: Approach[] = ['defensive', 'balanced', 'attacking'];
const PRESSES: Press[] = ['low', 'mid', 'high'];

export function play(gs: G.GameState, k: number): G.GameState {
  const inp = G.liveMatchInput(gs);
  const mine = { formation: DEFAULT_FORMATION, approach: APPROACHES[k % 3], press: PRESSES[(k >> 2) % 3] };
  const theirs = { formation: DEFAULT_FORMATION, approach: 'balanced' as Approach, press: 'mid' as Press };
  const res = simulateMatch(
    { id: inp.homeId, name: inp.homeName, players: inp.iAmHome ? inp.playerStarters : inp.oppStarters, tactic: inp.iAmHome ? mine : theirs, chemistry: 0.7, isHome: true },
    { id: inp.awayId, name: inp.awayName, players: inp.iAmHome ? inp.oppStarters : inp.playerStarters, tactic: inp.iAmHome ? theirs : mine, chemistry: 0.7, isHome: false },
    inp.seed);
  return G.commitRound(gs, res);
}

/** what the result screen writes above the ledger, as Result.tsx builds it */
export function headline(gs: G.GameState): string {
  const r = gs.lastPlayerMatch!; const fx = G.playerFixture(gs)!;
  const iAmHome = fx.homeId === gs.clubId;
  const my = iAmHome ? r.score[0] : r.score[1], opp = iAmHome ? r.score[1] : r.score[0];
  return my > opp ? `${my}:${opp} ${iAmHome ? 'בבית' : 'בחוץ'}. היציע יצא מרוצה.`
    : my === opp ? `${my}:${opp}. נקודה ביד, אפשר היה יותר.` : `הפסד ${opp}:${my}. קורה, מתקנים בשבוע הבא.`;
}

/** One career's week: the tactic screen, the result screen and the press room, every text on them. */
export function harvestWeek(gs: G.GameState, k: number, add: (slot: Slot, key: string, text: string) => void): G.GameState {
  const sc = G.matchupScout(gs);
  if (sc) add('scout', sc.verdict, sc.line);
  const echo = G.assistantEcho(gs, ['a', 'b']);
  if (echo) add('assistant', 'echo', echo);
  gs = { ...gs, phase: 'teamsheet' };
  gs = G.sendTeamsheet(gs);
  gs = play(gs, k);
  add('headline', 'result', headline(gs));
  const fan = G.fanNote(gs, 'post');
  add('fan_post', fan.id, fan.text);
  const po = G.purseOutlook(gs);
  // mirrors Result.tsx's ledger line
  if (po && po.expected > 0) add('purse', 'outlook', G.isFirstMatch(gs) ? FIRST_PURSE('₪X') : 'בסוף העונה ייכנסו עוד ₪X, לפי המקום שלכם היום.');
  gs = G.continueFromResult(gs);
  let guard = 0;
  while (gs.phase === 'press' && gs.press && guard++ < 5) {
    const q = gs.press.q;
    add('press_q', q.id, q.text);
    q.answers.forEach((a, i) => { add('press_a', `${q.id}#${i}`, a.label); add('press_r', `${q.id}#${i}`, a.reply); });
    gs = G.answerPress(gs, (k + guard) % q.answers.length);
  }
  return gs;
}

export function harvestFirst(seeds: number): Seen[] {
  const m = new Map<string, Seen>();
  const add = (slot: Slot, key: string, text: string) => {
    const id = slot + '\u0001' + text; const s = m.get(id); if (s) s.n++; else m.set(id, { slot, key, text, n: 1 });
  };
  const cities = CITIES.map(c => c.name);
  for (let s = 0; s < seeds; s++) {
    const city = cities[(s * 7) % cities.length];
    let gs = quickStart(newGameV2(500_000 + s), city);
    harvestWeek(gs, s, add);
  }
  return [...m.values()];
}

if (process.argv[1]?.endsWith('first-match-texts.mts')) {
  const out = process.argv[2] ?? '/tmp/first.json';
  const seeds = Number(process.argv[3] ?? 600);
  const seen = harvestFirst(seeds);
  writeFileSync(out, JSON.stringify(seen, null, 1));
  console.log(`${seen.length} distinct lines over ${seeds} seeds -> ${out}`);
}
