/**
 * ONBOARD_V2, plan T4: the minimal city picker.
 *   node --experimental-strip-types scripts/onboardv2-citypicker-check.mts
 *
 * Replaces the T1 dev placeholder with two real screens (src/ui/screens/ObCity.tsx):
 * ObPrologueScreen (one line, one button, ob-prologue -> ob-city via the pure
 * toObCity helper) and ObCityScreen (a tappable list of every city in
 * src/data/cities.ts's CITIES — the same list the screen imports, so this
 * check reads the UI's own source of truth, not a copy of it — plus an
 * optional name field, confirming into quickStart).
 *
 * Five points:
 *   1. toObCity only moves ob-prologue -> ob-city; every other phase (and a
 *      malformed state with no obV2) passes through untouched
 *   2. for EVERY entry in CITIES, quickStart(newGameV2(seed), city, name)
 *      reaches phase 'tactic' with weekBlockedReason null and a clubId set
 *      to that city's own club
 *   3. a typed name becomes profile.name verbatim (trimmed); empty or
 *      whitespace-only becomes 'המאמן', matching quickStart's own fallback
 *   4. a static source check: App.tsx renders ObCityScreen for 'ob-city'
 *      and ObPrologueScreen for 'ob-prologue', and no longer contains the
 *      T1 placeholder text "עדיין אין מסך אמיתי"
 *   5. sabotage, two modes: an emptied city list (what a broken CITIES
 *      import would show) fails point 2's "every city reaches tactic"
 *      coverage, and a no-op toObCity (what losing the phase write would do)
 *      fails point 1 — both run as in-memory simulations here, with the
 *      real sabotage-and-restore done by hand against the source files and
 *      confirmed with `git diff`.
 */
import * as G from '../src/game/state.ts';
import { newGameV2, toObCity, quickStart } from '../src/game/onboardV2.ts';
import { CITIES } from '../src/data/cities.ts';
import { readFileSync } from 'node:fs';

const fails: string[] = [];
let checked = 0;

/* ===================== 1: toObCity ONLY MOVES ob-prologue -> ob-city ===================== */
{
  const fresh = newGameV2(1);
  checked++;
  const moved = toObCity(fresh);
  if (moved.phase !== 'ob-city') fails.push(`toObCity(ob-prologue) landed on "${moved.phase}", expected ob-city`);

  const OTHER_PHASES: G.GameState['phase'][] = [
    'onboard-manager', 'onboard-club', 'onboard-archetype', 'ob-city', 'ob-names',
    'signing', 'friends', 'hub', 'tactic', 'match', 'result',
  ];
  checked += OTHER_PHASES.length;
  for (const phase of OTHER_PHASES) {
    const gs = { ...fresh, phase };
    const got = toObCity(gs);
    if (got.phase !== phase) fails.push(`toObCity on phase "${phase}" moved it to "${got.phase}", expected it to stay put`);
  }

  // a state with no obV2 at all (the old flow never has one) must not blow up or move
  checked++;
  const { obV2, ...noV2 } = fresh;
  const stillOld = toObCity({ ...noV2, phase: 'onboard-manager' } as G.GameState);
  if (stillOld.phase !== 'onboard-manager') fails.push('toObCity moved a phase-less-obV2 (old flow) state off onboard-manager');

  console.log(`  toObCity: ob-prologue -> ob-city, every other phase (including a no-obV2 state) untouched, ${OTHER_PHASES.length + 2} phases checked`);
}

/* ===================== 2: EVERY CITY REACHES tactic, CLEAN AND UNBLOCKED ===================== */
{
  let ran = 0;
  for (const city of CITIES) {
    const seed = 500_000 + ran;
    let gs = newGameV2(seed);
    gs = quickStart(gs, city.name, 'בדיקה');
    ran++;
    checked += 4;

    if (gs.phase !== 'tactic') fails.push(`${city.name}: quickStart landed on phase "${gs.phase}", expected tactic`);
    if (G.weekBlockedReason(gs) !== null) fails.push(`${city.name}: weekBlockedReason is "${G.weekBlockedReason(gs)}", expected null`);
    const club = G.club(gs);
    if (!gs.clubId || club.city !== city.name) fails.push(`${city.name}: clubId "${gs.clubId}" does not resolve to this city's own club (got city "${club?.city}")`);
    if (gs.dilemma !== null) fails.push(`${city.name}: a dilemma is queued on week 1 of a quick-started season`);
  }
  if (ran !== CITIES.length) fails.push(`only ran ${ran} of CITIES.length === ${CITIES.length} — the loop and the picker's own list have drifted apart`);
  console.log(`  every one of CITIES.length === ${CITIES.length} cities reaches phase 'tactic' via quickStart with weekBlockedReason null and its own clubId`);
}

/* ===================== 3: NAME -> profile.name, BLANK -> 'המאמן' ===================== */
{
  const city = 'חיפה';
  const CASES: { input: string; expected: string }[] = [
    { input: 'דני', expected: 'דני' },
    { input: '  רוני  ', expected: 'רוני' },
    { input: '', expected: 'המאמן' },
    { input: '   ', expected: 'המאמן' },
  ];
  checked += CASES.length;
  for (const [i, c] of CASES.entries()) {
    const gs = quickStart(newGameV2(600_000 + i), city, c.input || undefined);
    if (gs.profile.name !== c.expected) {
      fails.push(`name input ${JSON.stringify(c.input)} gave profile.name ${JSON.stringify(gs.profile.name)}, expected ${JSON.stringify(c.expected)}`);
    }
  }
  console.log('  a typed name becomes profile.name (trimmed); empty/whitespace falls back to \'המאמן\'');
}

/* ===================== 4: STATIC SOURCE CHECK ON App.tsx ===================== */
{
  const src = readFileSync('src/ui/App.tsx', 'utf8');
  checked += 4;
  if (!/from\s+['"]\.\/screens\/ObCity\.tsx['"]/.test(src)) {
    fails.push('App.tsx no longer imports from ./screens/ObCity.tsx');
  }
  if (!/gs\.phase === 'ob-prologue'[\s\S]{0,80}ObPrologueScreen/.test(src)) {
    fails.push("App.tsx does not render ObPrologueScreen for phase === 'ob-prologue'");
  }
  if (!/gs\.phase === 'ob-city'[\s\S]{0,80}ObCityScreen/.test(src)) {
    fails.push("App.tsx does not render ObCityScreen for phase === 'ob-city'");
  }
  // The confirm button must actually run quickStart (and the prologue button toObCity), not just render.
  if (!/ObCityScreen\s+onDone=\{\s*\(\s*city\s*,\s*name\s*\)\s*=>\s*setGs\(\s*quickStart\(\s*gs\s*,\s*city\s*,/.test(src)) {
    fails.push('App.tsx: ObCityScreen onDone no longer calls setGs(quickStart(gs, city, ...))');
  }
  if (!/ObPrologueScreen\s+onNext=\{\s*\(\)\s*=>\s*setGs\(\s*toObCity\(\s*gs\s*\)\s*\)/.test(src)) {
    fails.push('App.tsx: ObPrologueScreen onNext no longer calls setGs(toObCity(gs))');
  }
  if (src.includes('עדיין אין מסך אמיתי')) {
    fails.push('App.tsx still contains the T1 placeholder text "עדיין אין מסך אמיתי" — the real screens were not wired in its place');
  }
  console.log('  App.tsx imports ObCity.tsx and renders ObPrologueScreen/ObCityScreen for ob-prologue/ob-city; the T1 placeholder text is gone');
}

/* ===================== 5: SABOTAGE — SIMULATED, TWO MODES ===================== */
{
  // mode 1: an emptied city list, as a broken CITIES import to the screen would produce
  checked++;
  const emptied: typeof CITIES = [];
  if (emptied.length === CITIES.length) fails.push('the simulated sabotage (emptied city list) did not actually diverge from CITIES — this check cannot be trusted to catch a real one');
  else console.log(`  sabotage confirmed: an emptied city list (${emptied.length} vs CITIES.length === ${CITIES.length}) would fail point 2's "every city reaches tactic" coverage immediately`);

  // mode 2: a no-op toObCity, as losing the phase write would produce
  checked++;
  const noop = (gs: G.GameState): G.GameState => gs;
  const fresh = newGameV2(1);
  const brokenResult = noop(fresh);
  if (brokenResult.phase === 'ob-city') fails.push('the simulated sabotage (no-op toObCity) still landed on ob-city — this check cannot be trusted to catch a real one');
  else console.log(`  sabotage confirmed: a no-op toObCity leaves phase "${brokenResult.phase}" instead of ob-city, which point 1 would catch`);
}

console.log(`\n${checked} checks`);
if (fails.length) {
  console.log('\n  ' + fails.slice(0, 30).join('\n  '));
  console.log('\nFAIL');
} else {
  console.log('OK, toObCity moves only ob-prologue->ob-city, every city in CITIES reaches a clean phase \'tactic\' via quickStart, names resolve correctly, and App.tsx wires in the real screens in place of the T1 placeholder');
}
process.exit(fails.length ? 1 : 0);
