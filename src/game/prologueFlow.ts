/**
 * ONBOARD_V2, plan T4 (sections 2 and 6): the prologue's own state machine,
 * pure and React-free so prologue-check.mts can walk every path without
 * touching the DOM. A step names the shot(s) (src/ui/onboard/shots.ts) it
 * shows while it is up; nextPrologueStep() is the only way from one step to
 * another, and a skip input always lands on 'city' regardless of where he
 * stood, which is the whole contract of the skip button (plan section 7).
 *
 * 'city' is the end of the prologue, not a screen of its own: the caller
 * (src/ui/screens/onboard/Prologue.tsx) reads a transition INTO 'city' as
 * "hand off to the city picker" and never actually renders that step.
 */

export type ObChoice = 'bench' | 'bottle';

export type PrologueStepId =
  | 'stadium' | 'bench-shot' | 'goal5' | 'down' | 'choice'
  | 'sit' | 'bottle-kick' | 'red-card'
  | 'tunnel' | 'fired' | 'morning' | 'call' | 'squad' | 'city';

export interface PrologueStep {
  id: PrologueStepId;
  /** the shot id(s) (src/ui/onboard/shots.ts) shown while this step is up, in the plan's own naming */
  shots: readonly string[];
}

export const PROLOGUE_STEPS: Readonly<Record<PrologueStepId, PrologueStep>> = {
  stadium: { id: 'stadium', shots: ['s01-stadium'] },
  'bench-shot': { id: 'bench-shot', shots: ['s02-bench'] },
  goal5: { id: 'goal5', shots: ['s03-goal5'] },
  down: { id: 'down', shots: ['s04-down'] },
  choice: { id: 'choice', shots: ['s04-down'] },
  sit: { id: 'sit', shots: ['s05a-sit'] },
  'bottle-kick': { id: 'bottle-kick', shots: ['s05b-bottle'] },
  'red-card': { id: 'red-card', shots: ['s06-red'] },
  tunnel: { id: 'tunnel', shots: ['s07-tunnel'] },
  fired: { id: 'fired', shots: ['s08-phone'] },
  morning: { id: 'morning', shots: ['s09-morning'] },
  // the new owner's call plays over his own office (s09); the new squad on the sand pitch follows it
  call: { id: 'call', shots: ['s09-morning'] },
  squad: { id: 'squad', shots: ['s10-pitch-gimel'] },
  city: { id: 'city', shots: [] },
};

export const PROLOGUE_STEP_IDS = Object.keys(PROLOGUE_STEPS) as PrologueStepId[];

export const PROLOGUE_START: PrologueStepId = 'stadium';

/**
 * One transition. A skip input always wins, from any step at all, and always
 * lands on 'city'. Otherwise the only branch point is 'choice', where the
 * `choice` input picks which half of the dugout story plays: the bench path
 * never visits 'bottle-kick'/'red-card', the bottle path never visits 'sit',
 * and both rejoin at 'tunnel'.
 */
export function nextPrologueStep(step: PrologueStepId, input?: { choice?: ObChoice; skip?: boolean }): PrologueStepId {
  if (input?.skip) return 'city';
  switch (step) {
    case 'stadium': return 'bench-shot';
    case 'bench-shot': return 'goal5';
    case 'goal5': return 'down';
    case 'down': return 'choice';
    case 'choice': return input?.choice === 'bottle' ? 'bottle-kick' : 'sit';
    case 'sit': return 'tunnel';
    case 'bottle-kick': return 'red-card';
    case 'red-card': return 'tunnel';
    case 'tunnel': return 'fired';
    case 'fired': return 'morning';
    case 'morning': return 'call';
    case 'call': return 'squad';
    case 'squad': return 'city';
    case 'city': return 'city';
  }
}

/**
 * Walk a full choice from the start to 'city', for the check and for
 * tooling. Capped well past the longest real path (a dozen steps) so a
 * broken transition that cycles fails loudly instead of hanging whatever
 * called this rather than looping forever.
 */
export function walkPrologue(choice: ObChoice): PrologueStepId[] {
  const path: PrologueStepId[] = [PROLOGUE_START];
  let step = PROLOGUE_START;
  while (step !== 'city') {
    step = nextPrologueStep(step, { choice });
    path.push(step);
    if (path.length > PROLOGUE_STEP_IDS.length + 2) {
      throw new Error(`walkPrologue(${choice}) did not reach 'city' within a sane number of steps: ${path.join(' -> ')}`);
    }
  }
  return path;
}
