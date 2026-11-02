/**
 * ONBOARD_V2, T3: the two players who come with you.
 *   node --experimental-strip-types scripts/storyfriends-check.mts
 *
 * The old friend (src/game/friends.ts, untouched) is a twenty one year old's
 * gamble that pays off five years and most of a career later. T3's two are
 * the opposite gamble: a central midfielder and a striker who already played
 * in the לאומית, signed for five years and dropped straight into the
 * starting XI, "a grade above the division, not too strong" from the first
 * whistle. Both roads share the same `gs.friends` bookkeeping (sellPlayer,
 * friendsFollow, friendsMorale, texterOf), so most of the old protections
 * apply to them for free; this checks the few that do not and the level and
 * growth math that is entirely their own.
 *
 * Six points, matching plan section 4's own "בדיקה" (plus 1b, the real path):
 *   1. creation level, across seeds and tiers: within the plan's own band
 *      AND equal to its own formula, round(leagueCeiling(tier+1)+3) - no
 *      cap against the league's own best starter (removed; see friends.ts)
 *   1b. the real path: quickStart itself, 200 seeds x 10 cities at tier 1,
 *      both story friends land at 61-62 off mySquad + gs.friends
 *   2. sale blocked; survives a sacking and a rescue; partWays blocked in
 *      season 1; a contract that never expires
 *   3. renaming never reseeds him, so it never moves his overall
 *   4. five seasons of full minutes: still "a grade above", capped
 *   5. balance: V2's season-1 promotion rate against V1's, over 200 seeds
 *   6. sabotage: STORY_GROWTH = 1 breaks point 4
 *
 * Point 5 plays out 200 one-season careers for each of the two flows (400
 * short seasons in total); everything else is either a pure formula or a
 * handful of careers. Measured on this machine, the whole file runs in
 * under fifteen seconds.
 */

import * as G from '../src/game/state.ts';
import { addStoryFriends, newGameV2, quickStart } from '../src/game/onboardV2.ts';
import {
  STORY_SPECS, STORY_GROWTH, STORY_CEILING_MARGIN, STORY_CONTRACT_YEARS,
  storyLevel, storyFriendAfterSummer, friendTrait,
} from '../src/game/friends.ts';
import type { FriendSpec } from '../src/game/friends.ts';
import { overall } from '../src/engine/matchEngine.ts';
import { leagueCeiling } from '../src/data/clubs.ts';
import { buildRegionLeague } from '../src/data/cities.ts';
import { initLeague } from '../src/game/league.ts';
import { simulateMatch } from '../src/engine/matchEngine.ts';
import { DEFAULT_FORMATION } from '../src/data/formations.ts';

const fails: string[] = [];
let checked = 0;

const mine = (gs: G.GameState) => {
  const sq = G.mySquad(gs);
  return [...sq.starters, ...sq.bench];
};

function careerV2(city = 'חיפה', seed = 4242): G.GameState {
  let gs = G.newGame(seed);
  gs = G.setProfile(gs, { name: 'איציק', nickname: '', type: 'mental', age: 40 } as never);
  gs = G.pickCity(gs, city);
  gs = G.afterSigning(gs, {});
  gs = addStoryFriends(gs);
  gs = G.enterSeason({ ...gs, crisisDone: true });
  if (gs.phase === 'sponsor') gs = G.takeSponsor(gs, 'base');
  return gs;
}

const V1_SPECS: FriendSpec[] = [
  { name: 'אורי כהן', position: 'CM', trait: 'engine', texter: true },
  { name: 'שגיא מלול', position: 'ST', trait: 'boot', texter: false },
];

function careerV1(city = 'חיפה', seed = 4242): G.GameState {
  let gs = G.newGame(seed);
  gs = G.setProfile(gs, { name: 'איציק', nickname: '', type: 'mental', age: 40 } as never);
  gs = G.pickCity(gs, city);
  gs = G.afterSigning(gs, {});
  gs = G.addFriends(gs, V1_SPECS);
  gs = G.enterSeason({ ...gs, crisisDone: true });
  if (gs.phase === 'sponsor') gs = G.takeSponsor(gs, 'base');
  return gs;
}

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

/* 1. CREATION: A GRADE ABOVE, EXACTLY THE PLAN'S FORMULA.
      200 seeds, every tier: level is always within [floor, roof] AND equal to
      round(leagueCeiling(tier+1)+3) - the league's own best starter plays no
      part in it (an earlier draft capped him at that best minus three, which
      on real region leagues routinely pulled him under the plan's own floor;
      see friends.ts's storyLevel doc). */
{
  const SEEDS = 200;
  const TIERS = [1, 2, 3, 4, 5];
  let lo = Infinity, hi = -Infinity;
  let outRated = 0, outRatedTotal = 0;
  for (const tier of TIERS) {
    for (let s = 0; s < SEEDS; s++) {
      const built = buildRegionLeague('חיפה', tier);
      const league = initLeague(built.clubs, 1000 + s);
      const level = storyLevel(tier);
      checked += 3;
      const floor = Math.round(leagueCeiling(tier) + 4);
      const roof = Math.round(leagueCeiling(tier + 1) + 4);
      const expected = Math.round(leagueCeiling(tier + 1) + 3);
      if (level < floor) fails.push(`tier ${tier} seed ${s}: level ${level} is under ${floor}`);
      if (level > roof) fails.push(`tier ${tier} seed ${s}: level ${level} is over ${roof}`);
      if (level !== expected) fails.push(`tier ${tier} seed ${s}: level ${level} is not the plan's own round(leagueCeiling(tier+1)+3) = ${expected}`);
      // informational: how often he now out-rates the best starter of every
      // other club in the league, now that nothing caps him against it
      const otherClubsBest = Object.entries(league.squads)
        .filter(([clubId]) => clubId !== built.clubs[0]?.id)
        .flatMap(([, sq]) => sq.starters.map(overall));
      if (otherClubsBest.length) {
        outRatedTotal++;
        if (level > Math.max(...otherClubsBest)) outRated++;
      }
      lo = Math.min(lo, level);
      hi = Math.max(hi, level);
    }
  }
  console.log(`  creation level over ${TIERS.length * SEEDS} (tier, seed) pairs: ${lo}-${hi}, always round(leagueCeiling(tier+1)+3)`);
  console.log(`  informational: out-rates the best starter of every other club in the league in ${outRated}/${outRatedTotal} (tier, seed) pairs (${(100 * outRated / outRatedTotal).toFixed(1)}%)`);
}

/* 1b. THE REAL PATH: quickStart itself, tier 1, varied cities.
       200 seeds x 10 cities, read off mySquad + gs.friends the way the game
       would, land both story friends at 61-62 - the plan's own headline
       number, not just the formula in isolation. */
{
  const SEEDS = 200;
  const CITIES10 = ['חיפה', 'תל אביב', 'ירושלים', 'באר שבע', 'נתניה', 'אשדוד', 'חולון', 'רמת גן', 'אשקלון', 'הרצליה'];
  let lo = Infinity, hi = -Infinity;
  for (const city of CITIES10) {
    for (let s = 0; s < SEEDS; s++) {
      // since 2.11 quickStart brings nobody: the two sign only on the friends
      // scene's yes after match 1 (answerFriends -> addStoryFriends, same call)
      const started = quickStart(newGameV2(s), city);
      checked++;
      if (started.friends.length !== 0) fails.push(`${city}/${s}: quickStart already brought ${started.friends.length} friends, expected none before the friends scene`);
      const gs = addStoryFriends(started);
      const story = gs.friends.filter(f => f.story);
      checked += story.length;
      const all = mine(gs);
      for (const f of story) {
        const p = all.find(x => x.id === f.id);
        const ovr = p ? overall(p) : -1;
        if (ovr < 61 || ovr > 62) fails.push(`${city}/${s}: story friend ${f.name} overall ${ovr} is not in [61, 62]`);
        lo = Math.min(lo, ovr);
        hi = Math.max(hi, ovr);
      }
    }
  }
  console.log(`  real path (quickStart + the scene's yes), ${CITIES10.length} cities x ${SEEDS} seeds at tier 1: story friends land ${lo}-${hi}`);
}

/* 2. PROTECTED: NO SALE, A SACKING SURVIVED, SEASON ONE IS UNTOUCHABLE,
      AND A CONTRACT THAT DOES NOT RUN OUT. */
{
  const gs = careerV2();
  checked += 2;
  if (gs.friends.length !== 2) fails.push(`${gs.friends.length} came with him, not two`);
  if (!gs.friends.every(f => f.story)) fails.push('a story friend did not come marked story:true');

  for (const f of gs.friends) {
    checked += 5;
    const reason = G.sellBlockedReason(gs, f.id);
    if (!reason) fails.push(`${f.name} can be sold, which is not how a friend works`);
    const sold = G.sellPlayer(gs, f.id);
    if (!mine(sold).some(p => p.id === f.id)) fails.push(`sellPlayer removed ${f.name} from the squad despite the block`);
    // season one: parting ways is shut, whatever the window or the books say
    if (!G.partBlockedReason(gs, f.id)) fails.push(`${f.name} has no partBlockedReason in season 1`);
    if (G.partOptions(gs, f.id).length) fails.push(`${f.name} has a parting-ways option in season 1`);
    const afterPart = G.partWays(gs, f.id, 'transfer');
    if (!mine(afterPart).some(p => p.id === f.id)) fails.push(`partWays removed ${f.name} from the squad in season 1`);
  }

  // the contract: five years, and it never counts down to a renewal card
  checked += 2;
  const storyIds = new Set(gs.friends.map(f => f.id));
  for (const id of storyIds) {
    if (gs.contracts[id] !== STORY_CONTRACT_YEARS) fails.push(`a story friend signed for ${gs.contracts[id]}, not ${STORY_CONTRACT_YEARS}`);
  }
  let preseason = gs;
  for (let season = 0; season < 7; season++) {
    preseason = G.enterPreseason(preseason);
    for (const id of storyIds) {
      if (G.preseasonEvents(preseason).some(e => e.id === `renew-${id}`)) {
        fails.push(`a story friend turned up on a renewal card in preseason year ${season + 1}`);
      }
      if (preseason.contracts[id] !== STORY_CONTRACT_YEARS) fails.push(`a story friend's contract read ${preseason.contracts[id]} after preseason year ${season + 1}, not ${STORY_CONTRACT_YEARS}`);
    }
    preseason = { ...preseason, phase: 'hub' as const };
  }

  // the sacking: a new club, a new town, both of them on the new bench.
  // The lineup is rigged to lose (the player's own slot fields the
  // opponent's players) exactly as friends-check.mts does for the same
  // scene: with two strong starters now in the eleven, playing it straight
  // would take far more than twenty rounds to lose enough to be sacked.
  let s2 = careerV2('חיפה', 31);
  s2 = { ...s2, meters: { ...s2.meters, money: -3_000_000 } };
  const ids = s2.friends.map(f => f.id);
  for (let w = 1; w <= 20 && !s2.sacking; w++) {
    const inp = G.liveMatchInput(s2);
    const res = simulateMatch(
      { id: inp.homeId, name: 'h', players: inp.iAmHome ? inp.oppStarters : inp.playerStarters,
        tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: true },
      { id: inp.awayId, name: 'a', players: inp.iAmHome ? inp.playerStarters : inp.oppStarters,
        tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: false },
      inp.seed);
    s2 = G.commitRound(s2, res);
  }
  checked++;
  if (!s2.sacking) fails.push('could not get the manager sacked to test the move');
  else {
    const offer = G.rescueOffer(s2);
    checked += 2;
    if (!offer) fails.push('no club called after the sacking');
    else {
      const after = G.takeRescue(s2);
      const there = mine(after).map(p => p.id);
      const missing = ids.filter(id => !there.includes(id));
      if (missing.length) fails.push(`${missing.length} of the two did not follow him to ${G.club(after).name}`);
      else console.log(`  sacked, and both story friends turn up at ${G.club(after).name}`);
    }
  }
}

/* 3. RENAMING NEVER RESEEDS HIM.
      makeFriend reseeds off the chosen name; makeStoryFriend never does, so
      that naming him on the deferred names screen cannot move his overall
      mid-career. Simulated here exactly as a rename will apply it: the
      player's own name and the matching friends[] entry change, his seed
      does not. */
{
  const gs = careerV2('תל אביב', 909);
  for (const f of gs.friends) {
    const before = mine(gs).find(p => p.id === f.id)!;
    const seedBefore = before.seed;
    const ovrBefore = overall(before);
    const renamed = {
      ...gs,
      league: {
        ...gs.league,
        squads: {
          ...gs.league.squads,
          [gs.clubId]: {
            starters: G.mySquad(gs).starters.map(p => (p.id === f.id ? { ...p, name: 'שם חדש' } : p)),
            bench: G.mySquad(gs).bench.map(p => (p.id === f.id ? { ...p, name: 'שם חדש' } : p)),
          },
        },
      },
      friends: gs.friends.map(x => (x.id === f.id ? { ...x, name: 'שם חדש' } : x)),
    };
    const after = mine(renamed).find(p => p.id === f.id)!;
    checked += 2;
    if (after.seed !== seedBefore) fails.push(`${f.name} was reseeded by a rename (${seedBefore} -> ${after.seed})`);
    if (overall(after) !== ovrBefore) fails.push(`${f.name}'s overall moved from ${ovrBefore} to ${overall(after)} on a rename`);
  }
  console.log('  a rename changes the name on the card and nothing a number is read off');
}

/* 4. FIVE SEASONS, FULL MINUTES: STILL A GRADE ABOVE, STILL CAPPED.
      The pure formula, the same way friends-check measures the old road: a
      full season's minutes every year, for five years, starting at the level
      a tier 1 opening gives him. "A grade above" reads against the division
      one up from where he signed (the frame storyLevel itself uses); capped
      means no more than eight over that same division's ceiling, which is
      the plan's own margin. */
function fiveSeasonRoad(growth: number): { id: string; final: number }[] {
  const tier = 1;
  return STORY_SPECS.map(spec => {
    const trait = friendTrait(spec.trait);
    let ovr = storyLevel(tier);
    let age = spec.age;
    for (let s = 1; s <= 5; s++) {
      ovr = storyFriendAfterSummer(ovr, age, trait, 14, 14, s, growth, STORY_CEILING_MARGIN);
      age++;
    }
    return { id: spec.trait, final: ovr };
  });
}
{
  const roof = leagueCeiling(1 + 1) + 8;
  const floor = leagueCeiling(1 + 1);
  const road = fiveSeasonRoad(STORY_GROWTH);
  checked += road.length * 2;
  for (const r of road) {
    if (r.final <= floor) fails.push(`${r.id}: ${r.final.toFixed(2)} after five seasons is not above ${floor}`);
    if (r.final > roof) fails.push(`${r.id}: ${r.final.toFixed(2)} after five seasons is over the ${roof} sanity cap`);
  }
  console.log(`  five seasons at full minutes: ${road.map(r => `${r.id} ${r.final.toFixed(1)}`).join(', ')} (cap ${roof.toFixed(1)})`);
}

/* 5. BALANCE: V2 DOES NOT HAND SEASON ONE AWAY.
      addFriends puts the old two on the bench, which a headless season never
      touches, so V1's rate here is the plain baseline. addStoryFriends puts
      the new two straight into the eleven, which does move the number -
      that is the point of starting them - and this bounds how much. */
{
  const SEEDS = 200;
  let v1Up = 0, v2Up = 0;
  for (let s = 0; s < SEEDS; s++) {
    const seed = 5000 + s;
    let g1 = careerV1('חיפה', seed);
    for (let w = 1; w <= g1.league.rounds && !g1.sacking; w++) g1 = play(g1);
    if (!g1.sacking) { g1 = G.startNextSeason(g1); if (G.club(g1).tier > 1) v1Up++; }

    let g2 = careerV2('חיפה', seed);
    for (let w = 1; w <= g2.league.rounds && !g2.sacking; w++) g2 = play(g2);
    if (!g2.sacking) { g2 = G.startNextSeason(g2); if (G.club(g2).tier > 1) v2Up++; }
  }
  const v1Rate = (100 * v1Up) / SEEDS;
  const v2Rate = (100 * v2Up) / SEEDS;
  checked++;
  if (v2Rate - v1Rate > 10) fails.push(`season 1 promotion: V1 ${v1Rate}% vs V2 ${v2Rate}%, up ${(v2Rate - v1Rate).toFixed(1)} points, over the 10 point allowance`);
  console.log(`  season 1 promotion over ${SEEDS} seeds: V1 ${v1Rate}%, V2 ${v2Rate}% (+${(v2Rate - v1Rate).toFixed(1)} points)`);
}

/* 6. SABOTAGE: STORY_GROWTH = 1 BREAKS POINT 4.
      Not a different formula, the same one point 4 used, with the one
      number the plan names turned up to a full rate instead of a quarter. */
{
  const roof = leagueCeiling(1 + 1) + 8;
  const road = fiveSeasonRoad(1);
  checked += road.length;
  const broken = road.filter(r => r.final > roof);
  if (!broken.length) fails.push(`STORY_GROWTH = 1 did not break point 4 (got ${road.map(r => r.final.toFixed(1)).join(', ')}, cap ${roof.toFixed(1)})`);
  else console.log(`  sabotage confirmed: at growth 1, ${broken.map(r => `${r.id} ${r.final.toFixed(1)}`).join(', ')} clear the ${roof.toFixed(1)} cap point 4 enforces`);
}

console.log(`\n${checked} checks`);
if (fails.length) console.log('\n  ' + fails.slice(0, 12).join('\n  '));
console.log(fails.length ? '\nFAIL' : '\nOK, the two who came from the לאומית stay a grade above, and nothing about them moves on its own');
process.exit(fails.length ? 1 : 0);
