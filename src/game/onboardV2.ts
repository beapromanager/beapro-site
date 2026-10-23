/**
 * ONBOARD_V2 (plan T1, 23.10): the flag and the skeleton for a rebuilt first
 * run, nothing else yet. The door is shut (ONBOARD_V2 false) and stays shut
 * for every player; ?obv2=1 or localStorage['beapro.obv2']==='1' opens it on
 * a developer's own machine only, the same way fixing.ts's ?fix and
 * academy.ts's ?youth do. A built game never honours the override.
 */

import { newGame } from './state.ts';
import type { GameState } from './state.ts';

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
