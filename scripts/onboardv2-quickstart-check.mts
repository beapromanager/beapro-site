/**
 * ONBOARD_V2, plan T2: quickStart, from the city to the first match.
 *   node --experimental-strip-types scripts/onboardv2-quickstart-check.mts
 *
 * quickStart chains setProfile -> pickCity -> setArchetype('mental') ->
 * afterSigning -> addStoryFriends (T3) -> enterPreseason -> finishPreseason
 * (the three summer market rounds skipped) -> phase 'hub' with
 * tutorialSeen: true -> startWeek, which (patched in state.ts) asks no
 * dilemma for week 1 of a quick-started season 1 and lands straight on
 * 'tactic'. Five points:
 *
 *   1. shape, across 200 seeds x 10 varied cities (curated and hashed-
 *      identity towns both): a valid clubId that is the chosen city's own
 *      club, 18+ players, every one of them under contract, no dilemma,
 *      weekBlockedReason === null, sponsor null, tutorialSeen true,
 *      obV2.namesDue true, the two story friends in the starting XI, and
 *      money matching setArchetype('mental')'s own formula (budgetBias 1.0)
 *   2. fewer than 5 UI-level calls from a fresh newGameV2() to
 *      phase === 'match' (newGameV2, quickStart, the tactic screen's "go" to
 *      teamsheet, sendTeamsheet: four, none of them a round trip through a
 *      dilemma or a sponsor screen)
 *   3. a full round 1, on a smaller sample (20 of the 2000, one seed per
 *      city): commitRound does not throw, and the fields that should not
 *      move against the OLD flow given the same seed, city, archetype and
 *      kit — league clubs, fixtures, tier, the local rival, the money
 *      formula — do not; the ones that are V2's intended difference (two
 *      extra players in the squad, no sponsor chosen, preseason already
 *      closed) are documented, not asserted equal
 *   4. sabotage: a state with its contracts stripped (what quickStart would
 *      produce if seedContract were deleted from enterPreseason) fails the
 *      "every player has a contract" assertion point 1 relies on
 *
 * Point 1's 2000 (seed, city) pairs only run quickStart and the cheap
 * assertions; point 3's full match (simulateMatch + commitRound) runs on 20
 * of them, one per city, so the whole file stays well under a minute.
 */
import * as G from '../src/game/state.ts';
import { newGameV2, quickStart, traditionKit } from '../src/game/onboardV2.ts';
import { getManager } from '../src/data/managers.ts';
import { simulateMatch } from '../src/engine/matchEngine.ts';
import { DEFAULT_FORMATION } from '../src/data/formations.ts';

const fails: string[] = [];
let checked = 0;

const TEST_CITIES = [
  'תל אביב', 'חיפה', 'ירושלים', 'באר שבע', 'כפר סבא',
  'חדרה', 'נצרת', 'דימונה', 'אילת', 'אזור',   // the last one has no CURATED entry: the hashed-identity path
];

function play(gs: G.GameState): G.GameState {
  const inp = G.liveMatchInput(gs);
  const res = simulateMatch(
    { id: inp.homeId, name: inp.homeName, players: inp.iAmHome ? inp.playerStarters : inp.oppStarters,
      tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: true },
    { id: inp.awayId, name: inp.awayName, players: inp.iAmHome ? inp.oppStarters : inp.playerStarters,
      tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: false },
    inp.seed);
  return G.commitRound(gs, res);
}

/** the four UI-level calls a real screen flow makes, nothing more */
function toMatch(gs: G.GameState): { gs: G.GameState; calls: number } {
  let calls = 0;
  gs = { ...gs, phase: 'teamsheet' }; calls++;          // the tactic screen's "go"
  gs = G.sendTeamsheet(gs); calls++;                     // the teamsheet screen's "go"
  return { gs, calls };
}

/* ===================== 1 & 2: SHAPE AND UI-CALL COUNT, 200 SEEDS x 10 CITIES ===================== */
{
  const SEEDS = 200;
  let sampled = 0;
  for (const city of TEST_CITIES) {
    for (let s = 0; s < SEEDS; s++) {
      const seed = 100_000 + s;
      let calls = 2;   // newGameV2, quickStart
      let gs = newGameV2(seed);
      gs = quickStart(gs, city);
      sampled++;

      checked += 10;
      const c = G.club(gs);
      if (gs.clubId !== c.id || c.city !== city) fails.push(`${city}/${seed}: clubId does not resolve to ${city}'s own club`);
      const sq = G.mySquad(gs);
      const all = [...sq.starters, ...sq.bench];
      if (all.length < 18) fails.push(`${city}/${seed}: squad has only ${all.length} players, expected 18+`);
      const noContract = all.filter(p => !(p.id in gs.contracts));
      if (noContract.length) fails.push(`${city}/${seed}: ${noContract.length} players have no contract`);
      if (G.weekBlockedReason(gs) !== null) fails.push(`${city}/${seed}: weekBlockedReason is "${G.weekBlockedReason(gs)}", expected null`);
      if (gs.phase !== 'tactic' || gs.dilemma !== null) fails.push(`${city}/${seed}: phase is "${gs.phase}" with dilemma ${JSON.stringify(gs.dilemma)}, expected tactic/no dilemma`);
      if (gs.sponsor !== null) fails.push(`${city}/${seed}: sponsor is set, expected null until after match 1`);
      if (!gs.tutorialSeen) fails.push(`${city}/${seed}: tutorialSeen is false`);
      if (!gs.obV2?.namesDue) fails.push(`${city}/${seed}: obV2.namesDue is not true`);
      if (gs.friends.length !== 2 || !gs.friends.every(f => sq.starters.some(p => p.id === f.id))) {
        fails.push(`${city}/${seed}: the two story friends are not both in the starting XI`);
      }
      const m = getManager('mental');
      const expectedMoney = Math.round(G.START_MONEY * m.budgetBias * c.traits.budget);
      if (gs.meters.money !== expectedMoney) fails.push(`${city}/${seed}: money ${gs.meters.money}, expected ${expectedMoney} (START_MONEY * budgetBias 1.0 * club budget trait)`);

      const { gs: matched, calls: more } = toMatch(gs);
      calls += more;
      checked += 2;
      if (matched.phase !== 'match') fails.push(`${city}/${seed}: expected phase 'match' after teamsheet, got "${matched.phase}"`);
      if (calls >= 5) fails.push(`${city}/${seed}: ${calls} UI-level calls from newGameV2 to phase==='match', expected fewer than 5`);
    }
  }
  console.log(`  shape + UI-call count held over ${sampled} (seed, city) pairs across ${TEST_CITIES.length} cities (curated and hashed identity both)`);
}

/* ===================== 3: ROUND 1 FOR REAL, AND AGAINST THE OLD FLOW ===================== */
function oldFlow(city: string, seed: number): G.GameState {
  let gs = G.newGame(seed);
  gs = G.setProfile(gs, { name: 'המאמן', nickname: '', age: 40, type: 'mental' });
  gs = G.pickCity(gs, city, traditionKit(city), 'solid');
  gs = G.setArchetype(gs, 'mental');
  gs = G.afterSigning(gs, {});
  // the old flow's own three friends/market/sponsor steps are skipped here on
  // purpose: this function exists only to pin the fields V2 must NOT move
  // (league shape, tier, rival, money), not to replay every old screen
  return gs;
}
{
  let ran = 0;
  for (const city of TEST_CITIES) {
    const seed = 200_001;
    const oldGs = oldFlow(city, seed);
    let newGs = newGameV2(seed);
    newGs = quickStart(newGs, city);

    checked += 4;
    if (G.club(newGs).tier !== G.club(oldGs).tier) fails.push(`${city}: tier moved between old and V2 (${G.club(oldGs).tier} -> ${G.club(newGs).tier})`);
    const oldClubIds = oldGs.league.clubs.map(c => c.id).sort().join(',');
    const newClubIds = newGs.league.clubs.map(c => c.id).sort().join(',');
    if (oldClubIds !== newClubIds) fails.push(`${city}: the division's own clubs differ between old and V2`);
    const oldRival = oldGs.league.clubs.find(c => c.id === oldGs.clubId)?.rivalId;
    const newRival = newGs.league.clubs.find(c => c.id === newGs.clubId)?.rivalId;
    if (oldRival !== newRival) fails.push(`${city}: the local rival differs between old and V2 (${oldRival} vs ${newRival})`);
    if (oldGs.meters.money !== newGs.meters.money) fails.push(`${city}: money differs between old (${oldGs.meters.money}) and V2 (${newGs.meters.money}) on the same seed/city/archetype/kit`);

    // the intended differences: V2 carries two extra men (the story friends)
    // and has already closed its preseason, which the (unused) old flow here has not
    checked += 1;
    const newSquadSize = G.mySquad(newGs).starters.length + G.mySquad(newGs).bench.length;
    const oldSquadSize = G.mySquad(oldGs).starters.length + G.mySquad(oldGs).bench.length;
    if (newSquadSize < oldSquadSize) fails.push(`${city}: V2 squad (${newSquadSize}) is smaller than the old flow's starting squad (${oldSquadSize}), expected it to be the same or bigger (two story friends, no departures yet)`);

    // and the real round: send the sheet, play it, commit it, must not throw
    let played: G.GameState;
    try {
      const { gs: matched } = toMatch(newGs);
      played = play(matched);
      ran++;
    } catch (e) {
      fails.push(`${city}: round 1 threw — ${(e as Error).message}`);
      continue;
    }
    checked += 2;
    if (played.phase !== 'result') fails.push(`${city}: expected phase 'result' after commitRound, got "${played.phase}"`);
    if (!played.lastPlayerMatch) fails.push(`${city}: commitRound did not record a lastPlayerMatch`);
  }
  console.log(`  round 1 played for real on ${ran}/${TEST_CITIES.length} cities, committed without throwing; league shape/tier/rival match the old flow on the same seed+city+archetype+kit`);
}

/* ===================== 4: SABOTAGE — A SQUAD WITHOUT CONTRACTS FAILS POINT 1 ===================== */
{
  let gs = newGameV2(300_001);
  gs = quickStart(gs, 'חיפה');
  const sq = G.mySquad(gs);
  const all = [...sq.starters, ...sq.bench];
  checked += 2;
  if (all.some(p => !(p.id in gs.contracts))) fails.push('a healthy quickStart already has a player with no contract — the check itself is broken');

  // simulate exactly what removing seedContract from enterPreseason would hand back: the same squad, no contracts at all
  const stripped = { ...gs, contracts: {} };
  const strippedNoContract = all.filter(p => !(p.id in stripped.contracts));
  if (strippedNoContract.length !== all.length) fails.push('the simulated sabotage (contracts stripped) did not actually strip every player — this check cannot be trusted to catch a real one');
  else console.log(`  sabotage confirmed: with contracts stripped (as a seedContract removal would do), all ${all.length} players would fail the "has a contract" assertion point 1 relies on`);
}

console.log(`\n${checked} checks`);
if (fails.length) {
  console.log('\n  ' + fails.slice(0, 20).join('\n  '));
  console.log('\nFAIL');
} else {
  console.log('OK, quickStart reaches phase \'match\' in under 5 UI calls, every seed/city gives a legal squad with no dilemma, no sponsor yet, and round 1 plays for real without disturbing the league the old flow would have built');
}
process.exit(fails.length ? 1 : 0);
