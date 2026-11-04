/**
 * A reload on a room whose way back is held only in memory.
 *   node --experimental-strip-types scripts/reload-check.mts
 *
 * The squad off the hub came back from a reload as the first-time squad, and its button opened the summer in the middle
 * of a season. The summer's market backed out onto the hub with the summer still running. Both through the real loader.
 */
import * as G from '../src/game/state.ts';
import { saveCareer, loadCareer } from '../src/game/save.ts';

const store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true, writable: true,
  value: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); } },
});

const fails: string[] = [];
let checked = 0;
const claim = (ok: boolean, msg: string) => { checked++; if (!ok) fails.push(msg); };

let base = G.newGame(4242);
base = G.setProfile(base, { name: 'בדיקה', nickname: '', age: 38, type: 'mental' });
base = G.pickClub(base, base.league.clubs[0].id);
base = G.afterSigning(base, {});

function reload(patch: Partial<G.GameState>): G.GameState {
  store.clear();
  saveCareer({ ...base, ...patch } as G.GameState);
  return loadCareer()!;
}
const deals = { a: 2, b: 3 };

/* the very first run stands where it stood, and its button is still owed */
claim(reload({ phase: 'squad', season: 1, week: 1, contracts: {} }).phase === 'squad', 'the first-time squad does not survive a reload');

/* anything else on the squad came off the hub */
claim(reload({ phase: 'squad', season: 1, week: 5, contracts: deals }).phase === 'hub', 'the squad mid season reloads onto the squad');
claim(reload({ phase: 'squad', season: 1, week: 1, contracts: deals }).phase === 'hub', 'the squad in the first week of a career with deals reloads onto the squad');
claim(reload({ phase: 'squad', season: 3, week: 1, contracts: deals }).phase === 'hub', 'the squad in a later season reloads onto the squad');
claim(reload({ phase: 'squad', season: 1, week: 5, contracts: {} }).phase === 'hub', 'the squad mid season with no deals reloads onto the squad');
const quick = { choice: null, namesDue: false, deferred: { kit: true, arch: true, market: true }, t0: 0 } as unknown as G.GameState['obV2'];
claim(reload({ phase: 'squad', season: 1, week: 1, contracts: {}, obV2: quick }).phase === 'hub', 'a quick-started career, which has no deals until its first summer, gets the first-time squad');

/* the market belongs to whoever opened it, and the summer can be read off the state */
claim(reload({ phase: 'transfers', preWeek: 2 }).phase === 'preseason-market', "the summer's market reloads with its back to the hub");
claim(reload({ phase: 'transfers', preWeek: 2 }).preWeek === 2, "the summer's round is lost on a reload");
claim(reload({ phase: 'transfers', preWeek: 0 }).phase === 'transfers', 'the market in the season does not survive a reload');

/* the rooms that were fine are left alone */
claim(reload({ phase: 'hub', season: 1, week: 5, contracts: deals }).phase === 'hub', 'the hub moved');
claim(reload({ phase: 'preseason-market', preWeek: 1 }).phase === 'preseason-market', 'the summer board moved');

console.log(`${checked} checks`);
if (fails.length) { console.log(`FAIL (${fails.length})`); for (const f of fails) console.log('  - ' + f); process.exit(1); }
console.log('OK, a reload on the squad or the market lands where its own back button would');
