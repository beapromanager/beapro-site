/**
 * Counting, and nothing else.
 *
 * Three questions, and this file exists only to answer them: how many people
 * opened the game, how many came back, and where the ones who stopped stopped.
 * That last one is the whole point. A drop off at "picked a club" is an
 * onboarding problem; a drop off at "played round three" is a game problem;
 * and without the number they are indistinguishable from a feeling.
 *
 * WHAT NEVER LEAVES THE PHONE. The manager's name, his friends' names, his
 * club, his squad, anything he typed. Not "we strip it before sending": there
 * is no path from those values into this file at all, and telemetry-check
 * reads the source to keep it that way. What goes is a random number that
 * means nothing off this device, which step was reached, and when.
 *
 * WHEN THERE IS NOWHERE TO SEND IT. With no endpoint configured every call
 * here is a no op, so the game runs exactly as it did before any of this
 * existed. That is the state the game ships in if the worker is not up yet.
 *
 * WHEN THE NETWORK IS NOT THERE. Events queue in localStorage and go with the
 * next batch, so a career played on a bus is not a hole in the funnel. The
 * queue is capped: a phone that is offline for a month posts its cap and
 * forgets the rest, because a stale event is worth less than a working game.
 */
import { TELEMETRY_URL } from '../data/telemetry.ts';

/** the furthest a player got, in the order he would get there */
export const STEPS = [
  // Not "the title screen drew", which is what this used to say and was not
  // true: it is reported the moment the app mounts, before a frame of the cold
  // open. The difference is the whole of the next line's reason for existing.
  'open',            // the game booted
  /**
   * The title screen is up, with the button on it.
   *
   * Two in five of everybody who opened the game never started a career, the
   * largest fall in the funnel by a distance, and until this step there was no
   * way to tell three different people apart inside that number: the one whose
   * screen never drew, the one who left during four and a half seconds of cold
   * open, and the one who looked at the button and did not press it. They want
   * three different fixes, and guessing which to build would have been exactly
   * that, a guess.
   */
  'title',
  'career_new',      // tapped a new career
  'manager',         // named himself
  'club',            // picked a town and colours
  'archetype',       // picked who he is
  'signing',         // signed the contract
  'friends',         // named his two, or skipped
  'squad',           // met the squad
  'market',          // saw the summer market
  'season',          // walked out into the league
  /**
   * The first LIVE match, started and half played.
   *
   * 21% of devices that walked out into the league never report a played round
   * (463 to 366 on 2.10), and that one number cannot say whether they left on
   * the sheet before kick off or in the middle of the match, which want two
   * different fixes. These two split it: before the whistle, first half, rest.
   */
  'match1_start',    // kicked off his first live match
  'match1_half',     // reached half time in it
  'round_1',         // played one
  'round_3',         // played three
  'round_7',         // half a season
  'season_end',      // finished one
  'season_2',        // came back for another
] as const;
export type Step = typeof STEPS[number];

/** how far along the road each step is, for a funnel that cannot go backwards */
export const STEP_ORDER: Record<Step, number> =
  Object.fromEntries(STEPS.map((s, i) => [s, i])) as Record<Step, number>;

const AID_KEY = 'beapro.aid';
const QUEUE_KEY = 'beapro.tq';
/** beyond this the oldest go, see the note at the top */
export const QUEUE_CAP = 60;

/**
 * Where careers GET TO, which the funnel above cannot say. It stops at "came back for a second season", and a
 * manager who has won two divisions and one who has just survived a season look the same there.
 *
 * Two kinds, both made from numbers and nothing else:
 *   t3s5   a career was in the third division, in its fifth season
 *   w5     a career won the top division
 *
 * They are not steps. A step implies the ones before it, and a division does not: a career can be sacked back down,
 * and reaching the top does not mean having sat in every season on the way. So they are never backfilled, each is
 * reported when it happens, and the server keeps one of each per device like every other step.
 */
export type Milestone = `t${number}s${number}` | `w${number}` | typeof MONEY_MARKS[number] | typeof EURO_MARKS[number] | typeof CUP_MARKS[number] | typeof GIFT_MARKS[number] | typeof SHARE_MARKS[number] | typeof DAILY_MARKS[number] | typeof OB_MARKS[number];
/**
 * The two money facts worth counting, agreed with Itzik on 3.10: a career that
 * fell below zero, and a career the owner ended over debt. The bot simulations
 * cannot say how REAL managers, who buy players, feel the economy; these can.
 */
export const MONEY_MARKS = ['money_red', 'money_sack'] as const;
/**
 * Europe, agreed with Itzik on 7.10: how many careers were drawn into the cup,
 * how many stood in the final, how many lifted it. The door is shut, so nothing
 * is reported until it opens; the worker must know the names BEFORE the game
 * that sends them is out, or they are dropped at its door.
 */
export const EURO_MARKS = ['eu_in', 'eu_final', 'eu_won'] as const;
/**
 * גביע המדינה, stage 1 of the 20.10 cup spec: how many careers were drawn into
 * the domestic cup, how many stood in its semi, how many stood in its final,
 * how many lifted it. The door is shut, so nothing is reported until it opens
 * (CUP_LIVE in cup.ts), the same discipline as Europe's marks above — the
 * worker has to know the names before the game that sends them ships.
 */
export const CUP_MARKS = ['cup_in', 'cup_sf', 'cup_final', 'cup_won'] as const;
/**
 * The loyalty gift, agreed with Itzik on 11.10: how many careers past ten seasons
 * took the man on loan. One name, said once a device, like the rest.
 */
export const GIFT_MARKS = ['gift10'] as const;
/**
 * The share button, agreed with Itzik on 11.10: how many devices ever sent a moment to a friend. One name, said once
 * a device, like the rest. Without it the button would be a hope; with it the dashboard says whether it is used.
 */
export const SHARE_MARKS = ['share_tap'] as const;
/**
 * The daily gift, agreed with Itzik on 12.10: a device took its first gift, reached a full week, reached thirty days.
 * Three names, each said once a device, so the dashboard can say how far the habit goes. They are never sent while
 * the door is shut, because no run can begin.
 */
export const DAILY_MARKS = ['daily_1', 'daily_7', 'daily_30'] as const;
/**
 * ONBOARD_V2 (plan section 8): the rebuilt first run's own milestones, every
 * `ob_*` name the plan lists, sent once a device like the rest. The door is
 * ONBOARD_V2 in onboardV2.ts, false for every player, so none of these ever
 * leave a phone until it opens — and even then the Worker drops them at its
 * door until it is taught these names too (plan T7), which is why the flag
 * must stay off until that deploy is approved and done.
 */
export const OB_MARKS = [
  'ob_prologue', 'ob_goal5', 'ob_choice_bench', 'ob_choice_bottle', 'ob_skip', 'ob_stills',
  'ob_fired', 'ob_call', 'ob_city', 'ob_named_self', 'ob_kickoff', 'ob_match1_end',
  'ob_names', 'ob_names_skip', 'ob_kit', 'ob_arch', 'ob_sponsor', 'ob_market',
] as const;
/** a career older than this is counted in its twentieth season, "twenty or more" */
export const MAX_SEASON = 20;
/** the only shapes the game sends and the worker keeps. The worker holds the same pattern, telemetry-check compares them */
export const MILESTONE = /^(t[1-5]s([1-9]|1[0-9]|20)|w[1-5]|money_red|money_sack|eu_in|eu_final|eu_won|cup_in|cup_sf|cup_final|cup_won|gift10|share_tap|daily_1|daily_7|daily_30|ob_(prologue|goal5|choice_bench|choice_bottle|skip|stills|fired|call|city|named_self|kickoff|match1_end|names|names_skip|kit|arch|sponsor|market))$/;

export function isMilestone(k: unknown): k is Milestone {
  return typeof k === 'string' && MILESTONE.test(k);
}

/** "in this division, in this season", or null for anything that is not one */
export function reachKey(tier: number, season: number): Milestone | null {
  if (!Number.isFinite(tier) || !Number.isFinite(season)) return null;
  const t = Math.round(tier), s = Math.min(MAX_SEASON, Math.round(season));
  return t >= 1 && t <= 5 && s >= 1 ? `t${t}s${s}` : null;
}

/** "won this division" */
export function titleKey(tier: number): Milestone | null {
  if (!Number.isFinite(tier)) return null;
  const t = Math.round(tier);
  return t >= 1 && t <= 5 ? `w${t}` : null;
}

export type Event = {
  /** anonymous device id */
  a: string;
  /** this sitting */
  s: string;
  /** the step reached, a milestone, or 'crash' */
  k: Step | Milestone | 'crash';
  /** when, ms since epoch, from the device clock */
  t: number;
  /** a crash only: the step he had got to when it broke */
  w?: Step | 'none';
  /** a crash only: the KIND of error, from the list below and nothing else */
  n?: ErrorName;
};

/**
 * The error kinds worth telling apart, and the only thing about an error that
 * is ever sent.
 *
 * Not the message. A message is free text written by whatever threw, and free
 * text is the one shape that could carry a name a player typed. The class name
 * is a closed list that cannot: it says a TypeError happened on the squad
 * screen, which is what points at a line of code, and nothing about the man it
 * happened to. The rest of the story is in the report he can send by hand.
 */
export const ERROR_NAMES = [
  'Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'other',
] as const;
export type ErrorName = typeof ERROR_NAMES[number];

export function errorName(e: unknown): ErrorName {
  const n = e instanceof Error ? e.name : '';
  return (ERROR_NAMES as readonly string[]).includes(n) ? n as ErrorName : 'other';
}

/**
 * Whether this page is being served by a machine rather than by the internet.
 *
 * The dev server and a local preview are the same code as the live site, with
 * the same address in the same constant, and they were counted the same way.
 * Every career walked to test a screen arrived as a person who had walked a
 * career; every error thrown on a laptop arrived as a crash on somebody's
 * phone, and twice over, because React runs an effect twice in development.
 * The numbers this file exists to produce are read to decide what to build
 * next, and a number that counts its own author is worse than no number.
 *
 * A phone reading the dev server over the wifi is still the dev server, so the
 * private ranges count as the machine too. Nothing the game is actually served
 * from can look like this: it lives on a domain.
 *
 * Read on every call and never cached, so it can be put to the question.
 */
export function servedLocally(): boolean {
  const h = (globalThis as { location?: { hostname?: string } }).location?.hostname;
  if (!h) return false;                       // node, where the checks run
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]') return true;
  if (h.endsWith('.local') || h.endsWith('.localhost')) return true;
  return /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(h);
}

/**
 * Where to post, which a machine that is not the internet does not have.
 *
 * Shipping with no endpoint at all was always a supported state: with nothing
 * to send to, the game counts nothing and behaves exactly as it did before any
 * of this existed. A laptop is now simply another place with no endpoint, so
 * one road covers both and there is no second way to be switched off.
 */
function endpoint(): string {
  return servedLocally() ? '' : TELEMETRY_URL;
}

/**
 * A crash reported at most a few times a sitting.
 *
 * The funnel says WHERE people stop. It cannot say whether they stopped
 * because they were bored or because the screen went black, and those want
 * opposite fixes. Crashes are not deduped the way steps are, because three
 * crashes matter more than one, but a handler that fires in a loop must not
 * be able to post all night, so a sitting reports at most this many.
 */
export const CRASH_CAP = 3;
let crashesThisSitting = 0;

export function trackCrash(e: unknown, at: Step | null): void {
  if (!endpoint() || crashesThisSitting >= CRASH_CAP) return;
  crashesThisSitting++;
  const queue = enqueued(readQueue(), {
    a: deviceId(), s: sessionId, k: 'crash', t: Date.now(),
    w: at ?? 'none', n: errorName(e),
  });
  write(QUEUE_KEY, JSON.stringify(queue));
  void flush();
}

/** A random id with no meaning anywhere but in a count of distinct ids. */
function newId(): string {
  const b = new Uint8Array(9);
  (globalThis.crypto ?? { getRandomValues: (x: Uint8Array) => x.forEach((_, i) => (x[i] = Math.floor(Math.random() * 256))) })
    .getRandomValues(b);
  return Array.from(b, x => x.toString(36).padStart(2, '0')).join('').slice(0, 14);
}

function read(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key: string, v: string): void {
  try { localStorage.setItem(key, v); } catch { /* private mode, and that is fine */ }
}

/** This device, remembered so returning is countable. Made on first use. */
export function deviceId(): string {
  const had = read(AID_KEY);
  if (had) return had;
  const made = newId();
  write(AID_KEY, made);
  return made;
}

/** This sitting. New every time the game is opened, never stored. */
const sessionId = newId();

/**
 * What this sitting has already reported. In memory, and only in memory.
 *
 * It exists to keep one sitting from posting the same step forty times as the
 * screens change, and for nothing else. It used to be written down and kept
 * forever, which quietly made the device the authority on what the server
 * knows: a phone that had once reported a step could never report it again,
 * so when the table was emptied after a bad build, that phone's whole funnel
 * was silenced for good and only "open" ever arrived again. The server is the
 * one that must not double count, and it already does not, because a step is
 * a primary key there. A client that remembers is a client that can disagree.
 */
const sentThisSitting = new Set<Step>();

/**
 * Every step up to and including this one.
 *
 * Reaching round three MEANS having played round one, so a device that reports
 * where it is reports how it got there, and the server keeps whichever it has
 * not seen. That is what makes the numbers self healing: any phone that opens
 * the game again repairs its own history, whatever was lost or wrongly written
 * before. It also keeps the funnel honest by construction, since a bar can
 * never be smaller than one below it.
 */
export function stepsUpTo(step: Step): Step[] {
  return STEPS.slice(0, STEP_ORDER[step] + 1) as unknown as Step[];
}

export function readQueue(): Event[] {
  try {
    const raw = read(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isEvent) : [];
  } catch { return []; }
}

function isEvent(e: unknown): e is Event {
  const x = e as Event;
  return !!x && typeof x.a === 'string' && typeof x.s === 'string'
    && typeof x.t === 'number' && typeof x.k === 'string'
    && (x.k === 'crash' || x.k in STEP_ORDER || isMilestone(x.k));
}

/** The queue with one more on the end, oldest dropped past the cap. */
export function enqueued(queue: Event[], e: Event, cap = QUEUE_CAP): Event[] {
  const next = [...queue, e];
  return next.length > cap ? next.slice(next.length - cap) : next;
}

/**
 * Note that a step was reached.
 *
 * Never throws and never waits: a game that stalls because a counter could not
 * be posted is worse than no counting at all. The call site does not get told
 * whether anything was sent.
 */
export function track(step: Step): void {
  if (!endpoint()) return;
  const fresh = stepsUpTo(step).filter(s => !sentThisSitting.has(s));
  if (!fresh.length) return;

  const a = deviceId();
  const t = Date.now();
  let queue = readQueue();
  for (const s of fresh) {
    sentThisSitting.add(s);
    queue = enqueued(queue, { a, s: sessionId, k: s, t });
  }
  write(QUEUE_KEY, JSON.stringify(queue));
  void flush();
}

/** which milestones this sitting has already said. In memory only, for the same reason as sentThisSitting */
const milestonesThisSitting = new Set<string>();

/**
 * Note that a career got somewhere: this division in this season. Reported when a career is out in the league, so a
 * manager who is still picking a colour is not counted as having reached anything.
 */
export function reached(tier: number, season: number): void {
  const k = reachKey(tier, season);
  if (k) trackMilestone(k);
}

/** Note that a career won a division. */
export function wonLeague(tier: number): void {
  const k = titleKey(tier);
  if (k) trackMilestone(k);
}

/** Note that a career was drawn into the European cup, stood in its final, or lifted it. */
export function euroMark(k: typeof EURO_MARKS[number]): void {
  trackMilestone(k);
}

/** Note that a career was drawn into גביע המדינה, stood in its semi, its final, or lifted it. */
export function cupMark(k: typeof CUP_MARKS[number]): void {
  trackMilestone(k);
}

/** Note how far a daily run has gone on this device: the first gift, a full week, thirty days. */
export function dailyMark(k: typeof DAILY_MARKS[number]): void {
  trackMilestone(k);
}

/** Note that this device sent a big moment to a friend. */
export function shareMark(k: typeof SHARE_MARKS[number]): void {
  trackMilestone(k);
}

/** Note that a career past ten seasons signed the loyalty gift. */
export function giftMark(k: typeof GIFT_MARKS[number]): void {
  trackMilestone(k);
}

/** Note that a V2 prologue/city/first-week milestone was reached. Same no-op-with-no-endpoint path as every other mark. */
export function obMark(k: typeof OB_MARKS[number]): void {
  trackMilestone(k);
}

/** Note that the purse fell below zero, or that the owner ended it over debt. */
export function moneyMark(k: typeof MONEY_MARKS[number]): void {
  trackMilestone(k);
}

function trackMilestone(k: Milestone): void {
  if (!endpoint() || milestonesThisSitting.has(k)) return;
  milestonesThisSitting.add(k);
  write(QUEUE_KEY, JSON.stringify(enqueued(readQueue(), { a: deviceId(), s: sessionId, k, t: Date.now() })));
  void flush();
}

let sending = false;

/**
 * Post whatever is queued, and forget it only once it has landed.
 *
 * It keeps going until the queue is empty rather than sending one batch. A
 * single batch left the queue exactly one behind: anything added while a post
 * was in the air waited for the NEXT call to flush, which for most people is
 * the next time they open the game. The ones who never open it again are
 * precisely the ones this whole file exists to count, so a lag of one session
 * was a hole exactly where it hurts.
 */
export async function flush(): Promise<void> {
  if (!endpoint() || sending) return;
  sending = true;
  try {
    // at most a few rounds: each one either empties the queue or fails
    for (let round = 0; round < 5; round++) {
      const queue = readQueue();
      if (!queue.length) return;
      const res = await fetch(endpoint(), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ e: queue }),
        // the counting must never keep a tab alive or block a navigation
        keepalive: true,
      });
      if (!res.ok) return;   // the worker is unhappy; it waits in the queue
      // only what was sent is dropped: anything added meanwhile stays
      const now = readQueue();
      write(QUEUE_KEY, JSON.stringify(now.slice(queue.length)));
    }
  } catch {
    // offline, blocked, or the worker is down. It waits in the queue.
  } finally {
    sending = false;
  }
}

/**
 * Send what is left when the page is going away.
 *
 * A phone locked, an app switched, a tab closed: on mobile that is usually the
 * END of the visit and there is no later. visibilitychange is the only event
 * that reliably fires there, and the post is keepalive so it outlives the page.
 */
export function flushOnLeaving(): () => void {
  if (!endpoint() || typeof document === 'undefined') return () => {};
  const go = () => { if (document.visibilityState === 'hidden') void flush(); };
  document.addEventListener('visibilitychange', go);
  window.addEventListener('pagehide', () => { void flush(); });
  return () => document.removeEventListener('visibilitychange', go);
}

/**
 * How far along the road this state is.
 *
 * Read off the game rather than announced by the screens: a track() call
 * sprinkled at each turning point is one refactor away from a silent hole in
 * the funnel, and a hole is indistinguishable from people leaving. The phase
 * a player is ON means the step before it is DONE, which is why the names are
 * one behind the cases.
 *
 * Only ever called with a state, never with anything he typed.
 */
export function stepFor(g: { phase: string; season: number; week: number }): Step | null {
  if (g.season >= 2) return 'season_2';
  if (g.phase === 'season-end') return 'season_end';
  // The week is the round he is ON, and it starts at one, so rounds PLAYED is
  // one less. Reading it as rounds played made every brand new career report
  // its first match before a ball was kicked, which would have put the whole
  // funnel at a hundred percent exactly where it is meant to fall off.
  if (g.week - 1 >= 7) return 'round_7';
  if (g.week - 1 >= 3) return 'round_3';
  if (g.week - 1 >= 1) return 'round_1';
  // his first live match: the whistle has gone but no round is on the books yet
  if (g.phase === 'match' && g.week === 1) return 'match1_start';
  // The order below is the order the game walks, which is not the order the
  // screens are named in: a manager names himself, THEN picks a town, THEN
  // picks who he is, and only then signs. It was written the other way round
  // from the names alone and the funnel reported people moving backwards.
  switch (g.phase) {
    case 'onboard-manager': return null;        // the first screen; nothing done yet
    // ONBOARD_V2: the prologue and the city picker come before anything the old funnel names; career_new is
    // already said by startNew, so nothing here (falling through to 'season' would count a stranger as in the league)
    case 'ob-prologue':
    case 'ob-city': return null;
    case 'ob-names': return 'round_1';
    case 'onboard-club': return 'manager';
    case 'onboard-archetype': return 'club';
    case 'signing': return 'archetype';
    case 'friends': return 'signing';
    case 'squad': return 'friends';
    case 'preseason':
    case 'preseason-market': return 'squad';
    // the summer ends in the shirt and the sponsor, which is the market behind him
    case 'kit':
    case 'sponsor': return 'market';
    default: return 'season';                   // the hub, and everything the league holds
  }
}

/**
 * The widest gap between two steps in a row.
 *
 * The one number that answers "what do I fix next". Not the smallest bar,
 * which is always the last one and says only that careers are long: the
 * question is where people STOP, and that is the biggest single fall.
 */
export function biggestDrop(funnel: { step: string; n: number }[]): { from: string; to: string; lost: number } | null {
  let worst: { from: string; to: string; lost: number } | null = null;
  for (let i = 1; i < funnel.length; i++) {
    const lost = funnel[i - 1].n - funnel[i].n;
    if (lost > 0 && (!worst || lost > worst.lost)) {
      worst = { from: funnel[i - 1].step, to: funnel[i].step, lost };
    }
  }
  return worst;
}
