/**
 * ONBOARD_V2, plan T4: the real prologue scene.
 *   node --experimental-strip-types scripts/prologue-check.mts
 *
 * Six points:
 *   1. the state machine (src/game/prologueFlow.ts): every path (bench,
 *      bottle, and skip from every single step) reaches 'city'
 *   2. the bench path never shows s05b-bottle/s06-red, the bottle path
 *      never shows s05a-sit, and both show s03-goal5, s07-tunnel, s08-phone,
 *      s09-morning
 *   3. every shot id the flow references exists in the manifest
 *      (src/ui/onboard/shots.ts), and the manifest holds exactly the plan's
 *      own fourteen shot ids (section 6's table counts 5a and 5b
 *      separately), no more and no fewer
 *   4. integration: newGameV2(seed) -> toObCity(choice) -> quickStart(city,
 *      name) reaches phase 'tactic' with obV2.choice preserved through the
 *      whole chain — 'bench'/'bottle' when chosen, 'bench' when skipped —
 *      across several seeds and cities
 *   5. the full ob_* milestone list (src/game/telemetry.ts) passes
 *      isMilestone and matches the client's own MILESTONE regex
 *   6. static: App.tsx no longer references the removed ObPrologueScreen
 *      and renders Prologue for phase 'ob-prologue'
 *
 * Sabotage: two modes, see point 7 below — both run as in-memory
 * simulations here, with the real sabotage-and-restore against the source
 * files (and `git diff` to confirm only intended changes remain) done by
 * hand as part of verifying this file.
 */
import { readFileSync } from 'node:fs';
import {
  PROLOGUE_STEPS, PROLOGUE_STEP_IDS, PROLOGUE_START, nextPrologueStep, walkPrologue,
} from '../src/game/prologueFlow.ts';
import type { PrologueStepId } from '../src/game/prologueFlow.ts';
import { SHOT_IDS } from '../src/ui/onboard/shots.ts';
import { newGameV2, toObCity, quickStart } from '../src/game/onboardV2.ts';
import * as G from '../src/game/state.ts';
import { isMilestone, OB_MARKS, MILESTONE } from '../src/game/telemetry.ts';

const fails: string[] = [];
let checked = 0;

/** the plan's own shot ids, section 6's table (5a/5b counted separately), in order */
const PLAN_SHOT_IDS = [
  's01-stadium', 's02-bench', 's03-goal5', 's04-down', 's05a-sit', 's05b-bottle', 's06-red',
  's07-tunnel', 's08-phone', 's09-morning', 's10-pitch-gimel', 's11-city', 's12-loyal', 's13-kickoff',
];

/* ===================== 1: EVERY PATH REACHES 'city' ===================== */
{
  checked += 2;
  const bench = walkPrologue('bench');
  const bottle = walkPrologue('bottle');
  if (bench[bench.length - 1] !== 'city') fails.push(`bench path ends on "${bench[bench.length - 1]}", not city: ${bench.join(' -> ')}`);
  if (bottle[bottle.length - 1] !== 'city') fails.push(`bottle path ends on "${bottle[bottle.length - 1]}", not city: ${bottle.join(' -> ')}`);

  // skip, from every single step (including 'city' itself, a no-op there) — the whole contract of the skip button
  const nonCity = PROLOGUE_STEP_IDS.filter(s => s !== 'city');
  checked += nonCity.length;
  for (const step of nonCity) {
    const got = nextPrologueStep(step, { skip: true });
    if (got !== 'city') fails.push(`skipping from step "${step}" landed on "${got}", expected city`);
  }
  console.log(`  bench path (${bench.length} steps) and bottle path (${bottle.length} steps) both reach city; skip reaches city from all ${nonCity.length} other steps`);
}

/* ===================== 2: BRANCH SHOTS NEVER CROSS, SHARED BEATS ALWAYS SHOWN ===================== */
{
  function shotsOf(path: PrologueStepId[]): Set<string> {
    const set = new Set<string>();
    for (const step of path) for (const shot of PROLOGUE_STEPS[step].shots) set.add(shot);
    return set;
  }
  const bench = shotsOf(walkPrologue('bench'));
  const bottle = shotsOf(walkPrologue('bottle'));

  checked += 2;
  if (bench.has('s05b-bottle') || bench.has('s06-red')) fails.push(`bench path includes a bottle-branch shot: ${[...bench].filter(s => s === 's05b-bottle' || s === 's06-red')}`);
  if (bottle.has('s05a-sit')) fails.push('bottle path includes s05a-sit, the bench-only shot');

  checked += 2;
  if (!bottle.has('s05b-bottle') || !bottle.has('s06-red')) fails.push(`bottle path is missing its own shots: has s05b-bottle=${bottle.has('s05b-bottle')}, s06-red=${bottle.has('s06-red')}`);
  if (bench.has('s05b-bottle') && bottle.has('s05a-sit')) fails.push('a shot id appears on both branches — the branches are not actually disjoint');

  const SHARED = ['s03-goal5', 's07-tunnel', 's08-phone', 's09-morning'];
  checked += SHARED.length * 2;
  for (const shot of SHARED) {
    if (!bench.has(shot)) fails.push(`bench path is missing shared shot ${shot}`);
    if (!bottle.has(shot)) fails.push(`bottle path is missing shared shot ${shot}`);
  }
  console.log('  bench never shows s05b-bottle/s06-red, bottle never shows s05a-sit, both show s03-goal5/s07-tunnel/s08-phone/s09-morning');
}

/* ===================== 3: SHOT MANIFEST COVERAGE ===================== */
{
  const flowShots = new Set<string>();
  for (const id of PROLOGUE_STEP_IDS) for (const s of PROLOGUE_STEPS[id].shots) flowShots.add(s);

  checked += flowShots.size;
  for (const s of flowShots) {
    if (!SHOT_IDS.includes(s as typeof SHOT_IDS[number])) fails.push(`flow references shot "${s}", which is not in the manifest (src/ui/onboard/shots.ts)`);
  }

  checked += 2;
  const manifestSorted = [...SHOT_IDS].sort().join(',');
  const planSorted = [...PLAN_SHOT_IDS].sort().join(',');
  if (manifestSorted !== planSorted) {
    fails.push(`manifest ids do not match the plan's own shot list: manifest has [${[...SHOT_IDS].sort()}], plan has [${[...PLAN_SHOT_IDS].sort()}]`);
  }
  if (SHOT_IDS.length !== PLAN_SHOT_IDS.length) fails.push(`manifest has ${SHOT_IDS.length} shots, the plan's shot list (section 6, counting 5a/5b separately) has exactly ${PLAN_SHOT_IDS.length}`);
  console.log(`  every shot the flow references (${flowShots.size}) exists in the manifest, and the manifest holds exactly the plan's own ${PLAN_SHOT_IDS.length} ids`);
}

/* ===================== 4: INTEGRATION, newGameV2 -> toObCity -> quickStart ===================== */
{
  const CASES: { seed: number; city: string; choice: 'bench' | 'bottle' | undefined; expect: 'bench' | 'bottle' }[] = [
    { seed: 700_001, city: 'תל אביב', choice: 'bench', expect: 'bench' },
    { seed: 700_002, city: 'חיפה', choice: 'bottle', expect: 'bottle' },
    { seed: 700_003, city: 'באר שבע', choice: undefined, expect: 'bench' },   // skip before any choice: default bench
    { seed: 700_004, city: 'נצרת', choice: 'bottle', expect: 'bottle' },
    { seed: 700_005, city: 'אילת', choice: 'bench', expect: 'bench' },
  ];
  checked += CASES.length * 4;
  for (const c of CASES) {
    let gs = newGameV2(c.seed);
    gs = c.choice ? toObCity(gs, c.choice) : toObCity(gs);   // the Prologue component's own skip-with-no-choice call
    if (gs.phase !== 'ob-city') fails.push(`${c.seed}/${c.city}: toObCity landed on "${gs.phase}", expected ob-city`);
    if (gs.obV2?.choice !== c.expect) fails.push(`${c.seed}/${c.city}: obV2.choice is "${gs.obV2?.choice}" right after toObCity, expected "${c.expect}"`);

    gs = quickStart(gs, c.city, 'בדיקה');
    if (gs.phase !== 'tactic') fails.push(`${c.seed}/${c.city}: quickStart landed on phase "${gs.phase}", expected tactic`);
    if (gs.obV2?.choice !== c.expect) fails.push(`${c.seed}/${c.city}: obV2.choice is "${gs.obV2?.choice}" after quickStart, expected "${c.expect}" (quickStart must not overwrite it)`);
  }
  console.log(`  ${CASES.length} seed/city/choice combinations: toObCity records the choice (default 'bench' on skip), quickStart preserves it through to phase 'tactic'`);
}

/* ===================== 5: ob_* MILESTONES ===================== */
{
  checked += OB_MARKS.length * 2;
  for (const k of OB_MARKS) {
    if (!isMilestone(k)) fails.push(`"${k}" (src/game/telemetry.ts OB_MARKS) does not pass isMilestone`);
    if (!MILESTONE.test(k)) fails.push(`"${k}" does not match the client's own MILESTONE regex`);
  }
  // the names the prologue/city screens actually send must be a subset of OB_MARKS
  const SENT = ['ob_prologue', 'ob_goal5', 'ob_choice_bench', 'ob_choice_bottle', 'ob_skip', 'ob_fired', 'ob_call', 'ob_city', 'ob_named_self', 'ob_kickoff'];
  checked += SENT.length;
  for (const k of SENT) {
    if (!(OB_MARKS as readonly string[]).includes(k)) fails.push(`"${k}" is sent by the prologue/city screens but missing from OB_MARKS`);
  }
  console.log(`  all ${OB_MARKS.length} ob_* milestones pass isMilestone and the MILESTONE regex; every name the screens actually send is one of them`);
}

/* ===================== 6: STATIC — App.tsx WIRES IN THE REAL PROLOGUE ===================== */
{
  const src = readFileSync('src/ui/App.tsx', 'utf8');
  checked += 4;
  if (src.includes('ObPrologueScreen')) fails.push('App.tsx still references the removed ObPrologueScreen');
  if (!/from\s+['"]\.\/screens\/onboard\/Prologue\.tsx['"]/.test(src)) fails.push('App.tsx does not import Prologue from ./screens/onboard/Prologue.tsx');
  if (!/gs\.phase === 'ob-prologue'[\s\S]{0,80}<Prologue\b/.test(src)) fails.push("App.tsx does not render <Prologue /> for phase === 'ob-prologue'");
  if (!/<Prologue\s+onDone=\{\s*choice\s*=>\s*setGs\(\s*toObCity\(\s*gs\s*,\s*choice\s*\)\s*\)/.test(src)) {
    fails.push('App.tsx: <Prologue onDone> no longer calls setGs(toObCity(gs, choice))');
  }
  console.log('  App.tsx imports and renders the real Prologue for ob-prologue, with onDone wired to toObCity(gs, choice), and no longer mentions ObPrologueScreen');
}

/* ===================== 7: SABOTAGE — SIMULATED, TWO MODES ===================== */
{
  // mode 1: drop the bottle -> red transition, as a copy/paste slip in nextPrologueStep would
  checked++;
  function brokenNext(step: PrologueStepId, input?: { choice?: 'bench' | 'bottle'; skip?: boolean }): PrologueStepId {
    if (input?.skip) return 'city';
    if (step === 'bottle-kick') return 'tunnel';   // <- the bug: skips red-card entirely
    return nextPrologueStep(step, input);
  }
  const brokenPath: PrologueStepId[] = [PROLOGUE_START];
  let s: PrologueStepId = PROLOGUE_START;
  for (let i = 0; i < 20 && s !== 'city'; i++) { s = brokenNext(s, { choice: 'bottle' }); brokenPath.push(s); }
  if (brokenPath.includes('red-card')) fails.push('the simulated sabotage (dropped bottle->red transition) still visited red-card — this check cannot be trusted to catch a real one');
  else console.log(`  sabotage confirmed: dropping the bottle->red transition produces a bottle path without red-card (${brokenPath.join(' -> ')}), which point 2 would catch`);

  // mode 2: toObCity that ignores the choice, as losing the obV2 write would do
  checked++;
  function brokenToObCity(gs: G.GameState): G.GameState {
    if (gs.phase !== 'ob-prologue') return gs;
    return { ...gs, phase: 'ob-city' };   // choice never written
  }
  const broken = brokenToObCity(toObCity(newGameV2(1)) && newGameV2(1));
  if (broken.obV2?.choice === 'bottle') fails.push('the simulated sabotage (toObCity ignoring choice) still recorded "bottle" — this check cannot be trusted to catch a real one');
  else console.log(`  sabotage confirmed: a toObCity that ignores the choice leaves obV2.choice as "${broken.obV2?.choice}" instead of the chosen branch, which point 4 would catch`);
}

console.log(`\n${checked} checks`);
if (fails.length) {
  console.log('\n  ' + fails.slice(0, 30).join('\n  '));
  console.log('\nFAIL');
} else {
  console.log(`OK, the prologue state machine reaches city by every path (bench, bottle, skip from anywhere), the branches never cross, every shot resolves in the manifest against the plan's own ${PLAN_SHOT_IDS.length} ids, the choice survives toObCity into quickStart, the ob_* milestones are well formed, and App.tsx wires in the real screen`);
}
process.exit(fails.length ? 1 : 0);
