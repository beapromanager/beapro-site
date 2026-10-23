/**
 * ONBOARD_V2 (plan T1, 23.10): the flag and the skeleton for a rebuilt first
 * run, nothing else yet. The door is shut (ONBOARD_V2 false) and stays shut
 * for every player; ?obv2=1 or localStorage['beapro.obv2']==='1' opens it on
 * a developer's own machine only, the same way fixing.ts's ?fix and
 * academy.ts's ?youth do. A built game never honours the override.
 */

import {
  newGame, club, mySquad, MAX_SQUAD,
  setProfile, pickCity, setArchetype, afterSigning, enterPreseason, finishPreseason, startWeek,
} from './state.ts';
import type { GameState } from './state.ts';
import { makeStoryFriend, storyLevel, STORY_SPECS, STORY_CONTRACT_YEARS } from './friends.ts';
import { overall, createRng } from '../engine/matchEngine.ts';
import type { Player } from '../engine/matchEngine.ts';
import { nextPlayerId } from '../data/squadGen.ts';
import type { Squad } from '../data/squadGen.ts';
import { findCity, clubFromCity, CITIES } from '../data/cities.ts';
import { nearestKitColor } from '../data/palette.ts';
import type { KitColorId } from '../data/palette.ts';

/** On a developer's machine only, the local override opens the door. A built game never does. */
function devOverride(): boolean {
  try {
    if (!import.meta.env?.DEV) return false;
    if (typeof localStorage !== 'undefined' && localStorage.getItem('beapro.obv2') === '1') return true;
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('obv2') === '1') return true;
    return false;
  } catch {
    return false;
  }
}

/** The door, shut for every player. One line opens it for everybody; the override opens it for a developer alone. */
export const ONBOARD_V2 = false;

/** Whether the rebuilt onboarding is live right now, flag or (dev-only) override. */
export function obV2Enabled(): boolean {
  return ONBOARD_V2 || devOverride();
}

/**
 * A fresh V2 career: the same state newGame builds, standing on the new
 * flow's own first phase instead of the old one. newGame itself is untouched;
 * this only spreads a different phase and the V2 bookkeeping on top of it.
 */
export function newGameV2(seed = 12345, now = Date.now()): GameState {
  return {
    ...newGame(seed),
    phase: 'ob-prologue',
    obV2: { choice: null, namesDue: false, deferred: { kit: true, arch: true, market: true }, t0: now },
  };
}

/**
 * T4: prologue to city, nothing else moves it. Also records the one choice
 * the prologue made (bench or kicked the bottle) onto obV2.choice, so it
 * rides through quickStart (every step below spreads gs, so obV2 — choice
 * included — survives the whole chain untouched) into the saved career.
 * Defaults to 'bench': a player who taps "דלג ›" before choosing gets the
 * same outcome as the one who sat down, never the one who kicked the bottle.
 */
export function toObCity(gs: GameState, choice: 'bench' | 'bottle' = 'bench'): GameState {
  if (gs.phase !== 'ob-prologue') return gs;
  return { ...gs, phase: 'ob-city', obV2: gs.obV2 ? { ...gs.obV2, choice } : gs.obV2 };
}

/** The weakest starter on the given position, or the weakest starter of all when nobody plays it. */
function weakestStarterIndex(starters: Player[], position: Player['position']): number {
  const onPosition = starters.map((_, i) => i).filter(i => starters[i].position === position);
  const pool = onPosition.length ? onPosition : starters.map((_, i) => i);
  return pool.reduce((lo, i) => (overall(starters[i]) < overall(starters[lo]) ? i : lo), pool[0]);
}

/**
 * T3: the two players who come with you (plan section 4). Generated a grade
 * above the division, straight into the starting XI in place of its weakest
 * man on their position, five year contracts, and `story: true` so every
 * protection already written for `gs.friends` (sellPlayer, friendsFollow,
 * friendsSummer, friendsMorale, texterOf) picks them up for free.
 *
 * Needs a club (pickCity already run); idempotent, so calling it again once
 * the two are in gs.friends does nothing.
 */
export function addStoryFriends(gs: GameState): GameState {
  if (!gs.clubId || gs.friends.length) return gs;
  const tier = club(gs).tier;
  const level = storyLevel(tier);
  const rng = createRng(gs.seasonSeed * 53 + 19937);
  const sq = mySquad(gs);
  const taken = new Set([...sq.starters, ...sq.bench].map(p => p.name));
  const made = STORY_SPECS.map(spec => makeStoryFriend(spec, level, nextPlayerId(), rng, taken));

  let starters = [...sq.starters];
  const displaced: Player[] = [];
  for (let i = 0; i < made.length; i++) {
    const idx = weakestStarterIndex(starters, STORY_SPECS[i].position);
    displaced.push(starters[idx]);
    starters = starters.map((p, j) => (j === idx ? made[i] : p));
  }
  let bench = [...sq.bench, ...displaced];
  while (starters.length + bench.length > MAX_SQUAD && bench.length) {
    const worst = bench.reduce((lo, p, i) => (overall(p) < overall(bench[lo]) ? i : lo), 0);
    bench = bench.filter((_, i) => i !== worst);
  }
  const squad: Squad = { starters, bench };

  const contracts = { ...gs.contracts };
  for (const p of made) contracts[p.id] = STORY_CONTRACT_YEARS;

  return {
    ...gs,
    league: { ...gs.league, squads: { ...gs.league.squads, [gs.clubId]: squad } },
    friends: made.map((p, i) => ({
      id: p.id, name: p.name, trait: STORY_SPECS[i].trait, position: STORY_SPECS[i].position,
      texter: STORY_SPECS[i].texter, story: true as const,
    })),
    contracts,
  };
}

/**
 * The city's own identity colour, snapped onto the fourteen kit shades —
 * exactly what pickCity's `region.clubs[myId].primary` already carries
 * before any override, read the same way buildRegionLeague picks the city
 * (findCity, falling back to CITIES[0]) so a quick start never disagrees
 * with the club it is about to build.
 */
export function traditionKit(city: string): KitColorId {
  const c = findCity(city) ?? CITIES[0];
  return nearestKitColor(clubFromCity(c, 1).primary).id;
}

/**
 * T2: from the city to the first match, in one call (plan section "quick
 * Start"). Chains existing onboarding steps with nothing of its own: a
 * placeholder profile, the city's own colours in a plain pattern, the
 * neutral archetype, no signing effect, the two story friends (T3), and
 * straight through the summer without its three market rounds (every
 * player signs through seedContract exactly as enterPreseason always has,
 * nobody is yet old enough to expire). The sponsor and kit reveal are left
 * for later screens (T4+): the kit was already chosen on the way in
 * (afterSigning's wearChosenKit), so the summer never raises one, and the
 * sponsor is simply skipped rather than answered, same as a null sponsor is
 * everywhere else (sponsorRound(null) === 0).
 */
export function quickStart(gs: GameState, city: string, name?: string): GameState {
  gs = setProfile(gs, { name: name?.trim() || 'המאמן', nickname: '', age: 40, type: 'mental' });
  gs = pickCity(gs, city, traditionKit(city), 'solid');
  gs = setArchetype(gs, 'mental');
  gs = afterSigning(gs, {});
  // enterPreseason before addStoryFriends: it reads "is this the squad's
  // first ever contract round" off an empty gs.contracts, which is only true
  // before the two story friends' five-year deals go in. The other way round
  // would quietly hand every inherited player a flat three-year deal instead
  // of enterPreseason's own 1..3 year seedContract spread.
  gs = enterPreseason(gs);
  gs = addStoryFriends(gs);
  gs = finishPreseason(gs);   // the three summer rounds, skipped; nobody expires in year one anyway
  gs = { ...gs, phase: 'hub', tutorialSeen: true };   // sponsor deferred (T4+): stays null, same as everywhere else
  if (gs.obV2) gs = { ...gs, obV2: { ...gs.obV2, namesDue: true } };   // names asked after match 1 (T6)
  return startWeek(gs);
}
