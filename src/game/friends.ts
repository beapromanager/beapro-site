/**
 * The two you bring with you.
 *
 * At the start of a career the manager names two real friends, gives each of
 * them a standout quality and a position, and they join the club as twenty one
 * year olds who are, honestly, the worst players in the dressing room. That is
 * the whole point. Playing them costs points now, and only playing them turns
 * them into the two men the climb is built on.
 *
 * So they do not grow on the calendar like everybody else. They grow on
 * minutes: a friend who played every week has a summer, and a friend who
 * watched from the bench barely moves. Measured over five seasons, an ordinary
 * twenty one year old out of the generator gains four rating points and never
 * gets near seventy, because growth there is dominated by a hidden factor read
 * off his id and by an age bracket that shuts at twenty four. A friend is not
 * an ordinary player and does not use that road at all. He has his own ceiling,
 * written here, and his own rate, and both of them are Itzik's numbers.
 *
 * For scale, measured across twenty squads a division: the best player in
 * ליגה ג׳ rates 61, in ליגה א׳ 74, in the לאומית 80, in ליגת העל 84, and the
 * generator cannot hand anybody a ceiling above 90. Every quality below tops
 * out past the best man in the לאומית, and the passer, the one who is
 * deliberately dull for two summers, tops out above anything the game can
 * otherwise produce.
 */

import type { Player, Position, Attributes, Rng } from '../engine/matchEngine.ts';
import { overall, playerSeed, positionWeights } from '../engine/matchEngine.ts';
import { makePlayer, NEUTRAL_TRAITS } from '../data/squadGen.ts';
import { leagueCeiling } from '../data/clubs.ts';

export type FriendTraitId = 'bull' | 'wind' | 'brain' | 'engine' | 'boot';

export interface FriendTrait {
  id: FriendTraitId;
  /** the chip on his row */
  label: string;
  /**
   * What the man who has known him since school says about him, with his name
   * in it. This is the only thing on the screen where the choice is made, so
   * it carries the price as well as the promise: the one who goes through
   * people mentions the referee, and the quick one mentions the month out.
   */
  line: string;
  /**
   * How he is shaped at twenty one, in raw attribute points. The shape is
   * applied first and the whole player is then shifted back onto his starting
   * level, so a quality changes what he is good at, never how good he is on
   * day one. Two friends with different qualities arrive equally raw.
   */
  bias: Partial<Record<keyof Attributes, number>>;
  /** the rating he can reach. His own, not the one the generator hands out */
  ceiling: number;
  /** how a booking finds him, 1 = like anybody else */
  cardWeight: number;
  /** and how an injury does */
  injuryWeight: number;
  /** the passer is dull before he is good: three summers at half rate */
  slowStart: boolean;
  /**
   * And how many years late he peaks. A man who plays on his head rather than
   * his legs is still improving at thirty, which is the other half of the
   * gamble: he is the last of them to be any good and the last to stop.
   */
  lateBy: number;
  /** what his presence does to the room every summer */
  squadMorale: number;
}

export const FRIEND_TRAITS: FriendTrait[] = [
  {
    id: 'bull', label: 'פיזי ולא עוצר',
    line: '{שם} נכנס בכל כדור כאילו זה הגמר. מי שעבר לידו זוכר את זה, והשופט גם.',
    bias: { physical: 14, defending: 6, pace: -4 },
    lateBy: 0, ceiling: 80, cardWeight: 2.2, injuryWeight: 1, slowStart: false, squadMorale: 0,
  },
  {
    id: 'wind', label: 'עף ברוח',
    line: 'אף אחד לא השיג את {שם} מהיסודי, וגם היום לא. רק שכניסה אחת חזקה ואתה לא רואה אותו חודש.',
    bias: { pace: 18, dribbling: 6, physical: -6 },
    lateBy: 0, ceiling: 83, cardWeight: 1, injuryWeight: 2.5, slowStart: false, squadMorale: 0,
  },
  {
    id: 'brain', label: 'מסירה ואיטיות',
    line: '{שם} לא ירוץ אחרי אף אחד, אבל הוא רואה את המסירה שלושה מהלכים קדימה. תן לו זמן, הוא הפרויקט הארוך שלך.',
    bias: { passing: 14, pace: -10 },
    lateBy: 3, ceiling: 86, cardWeight: 1, injuryWeight: 1, slowStart: true, squadMorale: 0,
  },
  {
    id: 'engine', label: 'רץ בלי הפסקה',
    line: '{שם} רץ תשעים דקות ואז שואל אם יש עוד. לא נפצע, לא מתלונן, ולא נותן לאף אחד בחדר להוריד ראש.',
    bias: { physical: 8, pace: 4 },
    lateBy: 0, ceiling: 81, cardWeight: 1, injuryWeight: 0.3, slowStart: false, squadMorale: 2,
  },
  {
    id: 'boot', label: 'בעיטה וטכניקה',
    line: 'לרגל של {שם} יש רובה. הוא ינסה מארבעים מטר, וכשזה נכנס אתה סולח לו על השלושים שלא.',
    bias: { shooting: 14, dribbling: 8, defending: -8 },
    lateBy: 0, ceiling: 84, cardWeight: 1, injuryWeight: 1, slowStart: false, squadMorale: 0,
  },
];

export function friendTrait(id: FriendTraitId): FriendTrait {
  return FRIEND_TRAITS.find(t => t.id === id) ?? FRIEND_TRAITS[0];
}

/** His line with his name in it, or with the blank left standing. */
export function friendLine(trait: FriendTrait, name: string): string {
  return trait.line.replace('{שם}', name.trim() || 'הוא');
}

/** What the save remembers about each of them, beyond the player himself. */
export interface Friend {
  /** the player's id, which survives ageing, a summer and a sacking */
  id: string;
  name: string;
  trait: FriendTraitId;
  position: Position;
  /** the one who never stops texting. Exactly one of the two */
  texter: boolean;
  /** sold by the manager himself, which the other one does not forget */
  sold?: boolean;
  /** one of the ONBOARD_V2 two, who arrived from the לאומית in session one rather than named at twenty one */
  story?: true;
}

/** They are both twenty one, because that is the age you can still promise. */
export const FRIEND_AGE = 21;

/**
 * How raw they arrive. Nine under the division's own level puts them below
 * every man in the dressing room on day one, which is the price of the story
 * and the reason the payoff is worth anything.
 */
export const FRIEND_BELOW = 9;

export function friendStartLevel(tier: number): number {
  return Math.round(leagueCeiling(tier) - FRIEND_BELOW);
}

/**
 * Move a player onto an exact rating without changing what kind of player he
 * is. The position weights sum to one, so adding the same number to every
 * attribute moves the overall by that number, and the shape survives.
 */
export function shiftTo(p: Player, target: number): void {
  const d = target - overall(p);
  if (!d) return;
  for (const k of Object.keys(p.attrs) as (keyof Attributes)[]) {
    p.attrs[k] = Math.max(25, Math.min(99, Math.round(p.attrs[k] + d)));
  }
  if (p.gk) {
    for (const k of Object.keys(p.gk) as (keyof NonNullable<Player['gk']>)[]) {
      p.gk[k] = Math.max(25, Math.min(99, Math.round(p.gk[k] + d)));
    }
  }
  // rounding on six attributes can leave us a point out either way
  const off = target - overall(p);
  if (off) {
    const k = p.position === 'GK' ? null : (Object.keys(p.attrs) as (keyof Attributes)[])[0];
    if (k) p.attrs[k] = Math.max(25, Math.min(99, p.attrs[k] + off * 3));
  }
}

/**
 * How far above his own rating a quality may push one attribute.
 *
 * The rest of the game reads a man through overall(), so a friend rated 44
 * weakens the side by exactly what 44 says. One number escapes that: the goal
 * model finishes on shooter.attrs.shooting directly, so a low rated man with
 * a high shot converts like somebody he is not.
 *
 * The trap is that overall() weights an attribute differently by position. A
 * centre back's shooting is worth 0.02 of his rating, so handing him a shot
 * costs him nothing and he keeps all of it: measured, the 'boot' quality on a
 * centre back left him shooting eighteen points above his level, which is a
 * free striker standing in defence. So the tilt is scaled per player until no
 * attribute clears his rating by more than this.
 */
export const TILT_CAP = 12;

/**
 * Give a generated player the shape his quality calls for, at his own level.
 *
 * The bias moves attributes and then the whole man is shifted back onto the
 * level he is meant to arrive at, so a quality says what kind of player he is
 * and never how good he is. Since the shift is the weighted average of the
 * bias, the amount any one attribute ends up ahead is known before it is
 * applied, and the whole tilt is scaled down when that would clear the cap.
 */
export function shapeFriend(p: Player, trait: FriendTrait, level: number): void {
  const w = positionWeights(p.position) ?? ({} as Attributes);
  const entries = Object.entries(trait.bias) as [keyof Attributes, number][];
  // what the bias does to the rating, and therefore how far the shift pulls back
  const drift = entries.reduce((sum, [k, v]) => sum + v * (w[k] ?? 0), 0);
  const widest = entries.reduce((m, [, v]) => Math.max(m, v - drift), 0);
  // aimed a point under the cap, because six attributes rounded to whole
  // numbers and a rating rounded after them can hand a point back
  const scale = widest > TILT_CAP ? (TILT_CAP - 1) / widest : 1;
  for (const [k, v] of entries) {
    p.attrs[k] = Math.max(25, Math.min(99, Math.round(p.attrs[k] + v * scale)));
  }
  shiftTo(p, level);
}

/**
 * The summer's climb, in rating points at full minutes.
 *
 * Front loaded, and it runs out: a friend who plays every week is a different
 * player by twenty four, at the top of his range around twenty nine, and after
 * that the ordinary ageing curve owns him like everybody else. A late bloomer
 * reads the same table a few years shifted, so he is still climbing at an age
 * where the others have stopped.
 */
function rateAt(age: number, lateBy: number): number {
  const a = age - lateBy;
  if (a <= 22) return 7;
  if (a === 23) return 6.5;
  if (a === 24) return 6;
  if (a === 25) return 5;
  if (a === 26) return 4;
  if (a === 27) return 3;
  if (a === 28) return 2.5;
  if (a === 29) return 2;
  if (a === 30) return 1.5;
  return 0;
}

/** How close to the ceiling a man has to be before he starts flattening. */
const TAPER = 6;

/** Half a season on the pitch is most of a summer; none of it is almost none. */
export const MINUTES_FLOOR = 0.15;

export function minutesFactor(apps: number, rounds: number): number {
  if (rounds <= 0) return MINUTES_FLOOR;
  const share = Math.max(0, Math.min(1, apps / rounds));
  return MINUTES_FLOOR + (1 - MINUTES_FLOOR) * share;
}

/**
 * What a friend's rating becomes after one summer. Returns the new rating,
 * never below where he already is: a friend does not go backwards while he is
 * still young, whatever the minutes were.
 */
export function friendAfterSummer(
  current: number, age: number, trait: FriendTrait, apps: number, rounds: number, season: number,
): number {
  const rate = rateAt(age, trait.lateBy);
  if (rate <= 0) return current;
  // the passer is worth watching only after everybody has stopped watching
  const slow = trait.slowStart && season <= 3 ? 0.5 : 1;
  // and everybody flattens as they close on their own ceiling
  const room = Math.max(0, Math.min(1, (trait.ceiling - current) / TAPER));
  const gain = rate * minutesFactor(apps, rounds) * slow * room;
  return Math.min(trait.ceiling, current + gain);
}

/**
 * Roughly how high he tops out, in the same hedged shape the scout uses for
 * everybody else.
 *
 * This matters more than it looks. The card reads a player's ceiling off the
 * generator's hidden potential, which a friend does not have and never uses,
 * so before this it told a manager his friend would peak in the middle fifties
 * while the man was on his way to the eighties. A promise the game makes on
 * one screen and denies on another is worse than no promise.
 */
export function friendBand(trait: FriendTrait, current: number): { lo: number; hi: number } | null {
  if (current >= trait.ceiling - 1) return null;
  return { lo: Math.max(current + 1, trait.ceiling - 3), hi: trait.ceiling + 1 };
}

/** Is this man one of the two? */
export function isFriend(friends: Friend[], p: { id: string }): boolean {
  return friends.some(f => f.id === p.id && !f.sold);
}

export function friendOf(friends: Friend[], p: { id: string }): Friend | undefined {
  return friends.find(f => f.id === p.id && !f.sold);
}

/** What the manager typed in, before anybody exists. */
export interface FriendSpec {
  name: string;
  position: Position;
  trait: FriendTraitId;
  texter: boolean;
}

/**
 * Build one of them. He is generated like any other player so that every
 * derived thing in the game still works on him, and then given his name, his
 * age and his shape. The seed is recomputed off the finished player, because
 * a stable seed is what the rest of the game reads a man's habits from.
 */
export function makeFriend(spec: FriendSpec, tier: number, id: string, rng: Rng): Player {
  const level = friendStartLevel(tier);
  const p = makePlayer(spec.position, level, rng);
  p.id = id;
  p.name = spec.name.trim();
  p.age = FRIEND_AGE;
  p.fitness = 92;
  p.morale = 75;
  shapeFriend(p, friendTrait(spec.trait), level);
  p.seed = playerSeed(p.name, p.position, p.age, p.attrs);
  return p;
}

/**
 * Mark a friend as gone from this club.
 *
 * Nothing did this, and it was load bearing in a way that was invisible: a
 * friend who was let go stayed a friend in every other sense. He kept the
 * badge that says he came with you, friendsFollow would have carried a man who
 * left to your next club, and mate_alone, the phone call where you give your
 * word that the other one is never sold, could never fire at all, because it
 * asks whether one of them has been sold and the answer was always no. The
 * whole promise was unreachable code.
 */
export function markFriendGone(friends: Friend[], playerId: string): Friend[] {
  return friends.map(f => (f.id === playerId ? { ...f, sold: true } : f));
}

/*
 * ONBOARD_V2, T3: the two who come with you from the לאומית.
 *
 * They are not a raw twenty one year old's gamble, they are already "a grade
 * above the division, not too strong": a central midfielder and a striker,
 * fit, settled, and signed for five years, straight into the starting XI. The
 * old friend (above) is untouched by any of this; a story friend is a second,
 * separate road through the same Friend bookkeeping.
 */

/** They played in the לאומית, so they are not twenty one. */
export const STORY_AGES: readonly [number, number] = [25, 27];
export const STORY_FITNESS = 92;
export const STORY_MORALE = 80;
/** Five seasons, set directly on signing rather than drawn from seedContract. */
export const STORY_CONTRACT_YEARS = 5;
/**
 * A quarter of the ordinary friend's summer rate.
 *
 * The plan's own first guess was half rate, but measured against the
 * five-season, full-minutes 'engine' trait (ceiling 81, ages 25-29, where the
 * ordinary rate table is at its most generous) half rate alone reaches 70 -
 * eleven and a half above ליגה ב׳'s own ceiling, past the sanity margin the
 * plan sets in the same section. Quartered, he reaches 66 over the same five
 * seasons: still visibly better for having played, never close to the
 * division above being unable to tell him from one of its own.
 */
export const STORY_GROWTH = 0.25;
/** A story friend tops out four short of his quality's own ceiling, so playing him never quite hands the squad a man as good as the best the game can draw. */
export const STORY_CEILING_MARGIN = 4;
/** How far past next season's level he arrives, before the league-wide cap. */
export const STORY_LEVEL_MARGIN = 3;
/** Never above the best man the league itself can show, minus this. */
export const STORY_BEST_MARGIN = 3;

export interface StoryFriendSpec {
  age: number;
  position: Position;
  trait: FriendTraitId;
  texter: boolean;
}

/** One a central midfielder, one a striker; the minimum of decisions the plan calls for. */
export const STORY_SPECS: readonly StoryFriendSpec[] = [
  { age: STORY_AGES[0], position: 'CM', trait: 'engine', texter: true },
  { age: STORY_AGES[1], position: 'ST', trait: 'boot', texter: false },
];

/**
 * A grade above the division he is about to play in, and never above the best
 * man the whole league can show. `leagueBest` is the highest overall() among
 * every club's starting XI, read off the league the way the scout would.
 */
export function storyLevel(tier: number, leagueBest: number): number {
  const target = Math.round(leagueCeiling(tier + 1) + STORY_LEVEL_MARGIN);
  return Math.min(target, Math.round(leagueBest) - STORY_BEST_MARGIN);
}

/**
 * Build one of the two. Generated like any other player at his level and
 * then given his age, his fitness and his shape, exactly like makeFriend
 * does for the old flow.
 *
 * Unlike makeFriend, his seed is never touched: it stays whatever
 * makePlayer gave the temporary name he arrives with, so that renaming him on
 * the names screen later (T3's deferred naming) never shifts his seed and
 * never shifts what he is capable of mid-career.
 */
export function makeStoryFriend(
  spec: StoryFriendSpec, level: number, id: string, rng: Rng, usedNames?: Set<string>,
): Player {
  const p = makePlayer(spec.position, level, rng, NEUTRAL_TRAITS, usedNames);
  p.id = id;
  p.age = spec.age;
  p.fitness = STORY_FITNESS;
  p.morale = STORY_MORALE;
  shapeFriend(p, friendTrait(spec.trait), level);
  return p;
}

/**
 * A story friend's summer: half the ordinary friend's rate, and a ceiling
 * four short of his quality's own. Built for a man who arrives at 25-27 and
 * is meant to still be "a grade above" the division years later, not for the
 * ordinary friend's twenty one year old curve, which would otherwise age him
 * out within a season or two.
 */
export function storyFriendAfterSummer(
  current: number, age: number, trait: FriendTrait, apps: number, rounds: number, season: number,
  growth: number = STORY_GROWTH, ceilingMargin: number = STORY_CEILING_MARGIN,
): number {
  const ceiling = trait.ceiling - ceilingMargin;
  const rate = rateAt(age, trait.lateBy) * growth;
  if (rate <= 0) return current;
  const slow = trait.slowStart && season <= 3 ? 0.5 : 1;
  const room = Math.max(0, Math.min(1, (ceiling - current) / TAPER));
  const gain = rate * minutesFactor(apps, rounds) * slow * room;
  return Math.min(ceiling, current + gain);
}
