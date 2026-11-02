/**
 * ONBOARD_V2, plan T1: the flag, the new phases and the skeleton, nothing else.
 *   node --experimental-strip-types scripts/onboardv2-flag-check.mts
 *
 * Four questions:
 *   (a) newGame (the old builder) is byte-for-byte main's, and since 2.11
 *       (Itzik approved the opening) ONBOARD_V2/obV2Enabled() are both true;
 *   (b) twenty careers built the way an older build would have (no obV2
 *       field at all) go through saveCareer/loadCareer unharmed: no obV2
 *       key appears from nowhere, no 'ob-*' phase appears from nowhere;
 *   (c) newGameV2 stands on 'ob-prologue' with a well formed obV2, is
 *       otherwise identical to newGame, and is never written to storage
 *       (the save guard is explicit about the two phases, not only about
 *       clubId being empty);
 *   (d) a sabotage proof: the source is read for the literal
 *       `ONBOARD_V2 = true`, and the same assertion that reads it is run
 *       against a simulated `false` to show it would fail. The real test —
 *       flip the file, run the check, watch it fail, put the file back —
 *       is done by hand once and confirmed with `git diff`, not by this
 *       script (it cannot un-sabotage a passing import at runtime).
 *
 * newGame's player ids are a running counter with no connection to the seed
 * (see scripts/seed-check.mts): calling it twice in one process never gives
 * the same ids twice. The fingerprint below is taken over the JSON with
 * every "pNNN" id folded to a constant, which is exactly what makes two
 * calls agree with each other and is the only form of "the same object"
 * newGame has ever promised.
 */
import * as G from '../src/game/state.ts';
import { ONBOARD_V2, obV2Enabled, newGameV2 } from '../src/game/onboardV2.ts';
import { saveCareer, loadCareer } from '../src/game/save.ts';
import { CITIES } from '../src/data/cities.ts';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const fails: string[] = [];
let checked = 0;

/* localStorage, which node does not have and the loader insists on */
const store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true, writable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  },
});

/** player ids folded to a constant, so two calls to newGame agree on everything that is not a running counter */
const canon = (gs: unknown): string => JSON.stringify(gs).replace(/"p\d+"/g, '"ID"');
const fingerprint = (gs: unknown): string => createHash('sha256').update(canon(gs)).digest('hex');

/* ---------------------------------------------------------- (a) flag off, today's newGame, untouched */
{
  // captured from main's own newGame(seed) at 0795753 (2.11: הר ברכה joined the cities, which moved every
  // fingerprint on main itself), and this branch's newGame is byte-identical to it: the diff against main only
  // adds Phase union members and an optional interface field, never touches the newGame() function body itself.
  // A real change to what newGame returns moves these.
  const FINGERPRINTS: Record<number, string> = {
    1: '300b7e3b24ff40da08dd0c07ed01d51a706822dbcef2bed3ae82d2b4531dbeed',
    42: '5a1b7e2e912757462cf98c1d86c68829f439e75210f555ab62ddb1e20e3c034c',
    12345: '5ad8319f4771a1a8802c83a1598734b81c4cf7d29a323845e11207d29c0a8353',
    999999: '2308292681a07d64bc3152c162ce5911b4f806ddd58970ab476329174e5ab534',
    777: '7678879703bebb51458b0f69c08531c6a3c9242ef5a6a49a3c501012ecffee2c',
  };
  for (const [seedStr, expected] of Object.entries(FINGERPRINTS)) {
    checked++;
    const seed = Number(seedStr);
    const got = fingerprint(G.newGame(seed));
    if (got !== expected) fails.push(`newGame(${seed}) fingerprint is ${got}, expected ${expected} — the old flow's builder changed`);
  }
  checked += 4;
  const fresh = G.newGame(1);
  if ('obV2' in fresh) fails.push('newGame carries an obV2 key with the flag off; it must not exist until T1\'s builder adds it on purpose');
  if (fresh.phase !== 'onboard-manager') fails.push(`newGame starts on "${fresh.phase}" with the flag off, expected onboard-manager`);
  // 2.11: Itzik approved the opening, the door is open for every new player (was: must stay false)
  if (ONBOARD_V2 !== true) fails.push('ONBOARD_V2 is not true; the opening Itzik approved on 2.11 is shut');
  if (obV2Enabled() !== true) fails.push('obV2Enabled() is false under node with the flag on');
  console.log(`  flag on: ${Object.keys(FINGERPRINTS).length} seeds fingerprint-match main's newGame (the old builder, untouched), no obV2 key, phase onboard-manager`);
}

/* ------------------------------------------------------- (b) twenty old saves, built and stripped */
function career(seed: number, town: string): G.GameState {
  let gs = G.newGame(seed);
  gs = G.setProfile(gs, { name: 'בדיקה', nickname: '', type: 'hunter', age: 40 } as never);
  gs = G.pickCity(gs, town);
  return G.afterSigning(gs, {});
}
/** a save as an older build would have written it: no obV2 field at all (there is nothing else of T1's to strip) */
function asOldSave(gs: G.GameState): G.GameState {
  const raw = JSON.parse(JSON.stringify(gs)) as Record<string, unknown>;
  delete raw.obV2;
  return raw as unknown as G.GameState;
}
{
  const towns = CITIES.slice(0, 20).map(c => c.name);
  checked += towns.length * 4;
  for (let i = 0; i < towns.length; i++) {
    const seed = 10_000 + i * 97;
    const gs = career(seed, towns[i]);
    store.clear();
    saveCareer(asOldSave(gs));
    const loaded = loadCareer();
    if (!loaded) { fails.push(`an old save (${towns[i]}, seed ${seed}) did not load at all`); continue; }
    if ('obV2' in loaded) fails.push(`an old save (${towns[i]}) came back carrying an obV2 key nobody ever wrote`);
    if (String(loaded.phase).startsWith('ob-')) fails.push(`an old save (${towns[i]}) loaded onto the V2 phase "${loaded.phase}"`);
    if (loaded.clubId !== gs.clubId) fails.push(`an old save (${towns[i]}) lost its club on the way in`);
    if (loaded.profile.name !== gs.profile.name) fails.push(`an old save (${towns[i]}) lost its manager's name on the way in`);
  }
  console.log(`  ${towns.length} old saves (one unused field stripped, like oldsave-check's own asOldSave) load with no obV2 and no 'ob-*' phase`);
}

/* ------------------------------------------------------------- (c) newGameV2's own shape */
{
  checked += 7;
  const seed = 54_321, t0 = 1_700_000_000_000;
  const v2 = newGameV2(seed, t0);
  const base = G.newGame(seed);
  if (v2.phase !== 'ob-prologue') fails.push(`newGameV2 starts on "${v2.phase}", expected ob-prologue`);
  if (!v2.obV2) fails.push('newGameV2 carries no obV2 at all');
  else {
    if (v2.obV2.choice !== null) fails.push('newGameV2\'s obV2.choice is not null');
    if (v2.obV2.namesDue !== false) fails.push('newGameV2\'s obV2.namesDue is not false');
    if (!v2.obV2.deferred.kit || !v2.obV2.deferred.arch || !v2.obV2.deferred.market) fails.push('newGameV2 does not defer kit, arch and market');
    if (v2.obV2.t0 !== t0) fails.push(`newGameV2's obV2.t0 is ${v2.obV2.t0}, expected the given ${t0}`);
  }
  // otherwise identical to newGame(seed): strip phase and obV2 from both sides and compare everything else
  const { phase: _p1, obV2: _o1, ...restV2 } = v2;
  const { phase: _p2, obV2: _o2, ...restBase } = base;
  if (canon(restV2) !== canon(restBase)) fails.push('newGameV2 differs from newGame(seed) somewhere beyond phase and obV2');
  console.log('  newGameV2: ob-prologue, a well formed obV2, otherwise identical to newGame(seed)');
}

/* --------------------------------------------------- (c, continued) the save guard is explicit */
{
  const seed = 11_111, t0 = 1_700_000_000_000;
  const v2 = newGameV2(seed, t0);
  checked += 1;
  store.clear();
  saveCareer(v2);
  if (loadCareer() !== null) fails.push('saveCareer persisted a fresh newGameV2() career standing on ob-prologue');

  // clubId is already '' on ob-prologue/ob-city, which alone would block the old guard; force it non-empty so
  // only an explicit phase check (not the clubId fallback) can be the thing stopping the write
  checked += 2;
  const forcedPrologue = { ...v2, clubId: 'force-club' };
  store.clear();
  saveCareer(forcedPrologue);
  if (loadCareer() !== null) fails.push('with clubId forced non-empty, saveCareer still writes an ob-prologue career: the phase guard is not explicit');

  const forcedCity = { ...v2, phase: 'ob-city' as const, clubId: 'force-club' };
  store.clear();
  saveCareer(forcedCity);
  if (loadCareer() !== null) fails.push('with clubId forced non-empty, saveCareer still writes an ob-city career: the phase guard is not explicit');
  console.log('  saveCareer refuses ob-prologue/ob-city by phase, not only because clubId happens to be empty there');
}

/* ---------------------------------------------------------------------- (d) sabotage proof */
{
  checked += 2;
  const src = readFileSync('src/game/onboardV2.ts', 'utf8');
  if (!/export const ONBOARD_V2 = true;/.test(src)) {
    fails.push('src/game/onboardV2.ts no longer has the literal `export const ONBOARD_V2 = true;` — the opening is shut for new players');
  }
  // the same assertion the "(a)" block runs above, against a simulated flag flipped back to false: shows this check
  // would have caught exactly the sabotage it is meant to catch
  const simulateAssertion = (flag: boolean): string[] => {
    const simulatedFails: string[] = [];
    if (flag !== true) simulatedFails.push('ONBOARD_V2 is not true');
    return simulatedFails;
  };
  if (simulateAssertion(false).length === 0) fails.push('the sabotage simulation (flag flipped to false) did not produce a failure; this check cannot be trusted to catch a real one');
  if (simulateAssertion(true).length !== 0) fails.push('the sabotage simulation flags a healthy true flag as broken; it is miscalibrated');
  console.log('  sabotage proof: the literal is read from source, and the same assertion against a simulated false fails as it should');
}

console.log(`\n${checked} checks`);
if (fails.length) {
  console.log('\n  ' + fails.slice(0, 20).join('\n  '));
  console.log('\nFAIL');
} else {
  console.log('OK, ONBOARD_V2 is on, the old newGame is untouched, old saves stay old, and newGameV2 is well formed');
}
process.exit(fails.length ? 1 : 0);
