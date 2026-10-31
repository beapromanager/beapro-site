/**
 * The weekend league's rules (Itzik, 17.10, WEEKEND.md), with no server in them.
 *
 * This is everything a league is apart from the matches themselves: the
 * calendar (Israel time, Sunday 20:00 to Sunday 20:00), the slot grid an
 * opener picks from, the code, who is in, the squads drawn at the lock, the
 * rounds, the table, the pack every three wins, the assistant's two matches,
 * and the prize at the end. It is plain data and plain functions so a check
 * can walk a whole weekend in a second; the LeagueDO in worker/src/weekend.ts
 * keeps one of these and calls into it.
 *
 * What a league knows of a person: a nickname and a device id. Nothing else
 * is in here, and nothing else should be.
 */

import type { Player, Position } from '../engine/matchEngine.ts';
import { createRng, overall } from '../engine/matchEngine.ts';
import { makePlayer, makeSquad } from '../data/squadGen.ts';
import type { SimpleTactic } from './liveMatch.ts';
import { DEFAULT_FORMATION } from '../data/formations.ts';

/* ------------------------------------------------------------------ sizes */

export const MIN_MEMBERS = 6;
export const MAX_MEMBERS = 12;
export const OPEN_MEMBERS = 6;
export const SQUAD_AVG = 85;
export const SQUAD_SIZE = 18;
export const PACK_EVERY = 3;
export const PACK_OVR = 90;
export const ASSISTANT_MAX = 2;
export const TECH_LOSS: [number, number] = [0, 3];
export const NICK_MAX = 12;
/** a league's code: six letters and digits, no look-alikes */
export const CODE_LEN = 6;
/** a win is three points, a loss none; there are no draws */
export const POINTS_WIN = 3;

/** the prize, in wage rounds of the winner's own division in his career, by place; the rest get 0.25 for finishing themselves */
export const PRIZE_BY_PLACE: Record<number, number> = { 1: 1.5, 2: 0.75, 3: 0.5 };
export const PRIZE_FINISHED = 0.25;
export const GEMS_BY_PLACE: Record<number, number> = { 1: 3, 2: 2, 3: 1 };
export const GEMS_FINISHED = 1;
/** a champion again gets less: 1.5, then 1.0, then 0.75 and it stays there */
export const CHAMPION_AGAIN = [1.5, 1.0, 0.75];

/** the "ready?" window after a round's hour: the matches kick off five minutes past */
export const READY_MS = 5 * 60_000;
/** a league and its matches live a week after the final, then they are gone */
export const KEEP_MS = 7 * 86_400_000;

/**
 * One time only (Itzik, 29.10): registration for the 5–8.11 weekend opens on Monday 2.11 20:00 Israel, a day
 * after the Sunday it would open on (it was Thursday 29.10 until Itzik moved it on 29.10), and runs to Thursday
 * 5.11 17:00 as usual. Israel is on winter time by then (UTC+2), so it is 18:00 UTC. From Sunday 8.11 20:00 the
 * calendar is the ordinary one again; see cycleOf.
 */
export const FIRST_REGISTRATION_OPENS_AT = Date.UTC(2026, 10, 2, 18, 0, 0);
/** the Sunday of that first cycle, 1.11.2026 (the Sunday whose 20:00 would have opened it) */
export const FIRST_CYCLE_SUNDAY: [number, number, number] = [2026, 11, 1];

/* --------------------------------------------------------------- calendar */

const TZ = 'Asia/Jerusalem';
const DAY = 86_400_000;

export interface IlParts { y: number; m: number; d: number; hh: number; mm: number; dow: number }

const FMT = typeof Intl !== 'undefined'
  ? new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false })
  : null;
const DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** the Israeli wall clock of an instant */
export function ilParts(now: number): IlParts {
  if (!FMT) {
    const t = new Date(now + 2 * 3_600_000);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate(), hh: t.getUTCHours(), mm: t.getUTCMinutes(), dow: t.getUTCDay() };
  }
  const o: Record<string, string> = {};
  for (const p of FMT.formatToParts(new Date(now))) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, hh: +o.hour % 24, mm: +o.minute, dow: DOW[o.weekday] ?? 0 };
}

/** the instant of an Israeli wall clock time (summer or winter, whichever that day is) */
export function ilAt(y: number, m: number, d: number, hh: number, mm = 0): number {
  for (const off of [3, 2]) {
    const t = Date.UTC(y, m - 1, d, hh, mm) - off * 3_600_000;
    const p = ilParts(t);
    if (p.y === y && p.m === m && p.d === d && p.hh === hh && p.mm === mm) return t;
  }
  return Date.UTC(y, m - 1, d, hh, mm) - 2 * 3_600_000;
}

/** a calendar day n days on from an Israeli date, as y/m/d */
function shiftDay(y: number, m: number, d: number, n: number): [number, number, number] {
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return [t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()];
}

/** the weekend cycle an instant belongs to: Sunday 20:00 to the next Sunday 20:00, with its Thursday */
export interface Cycle {
  /** Sunday 20:00, when leagues open */
  opens: number;
  /** Thursday 17:00, when the lists close */
  locks: number;
  /** Thursday 20:00, the first round */
  kickoff: number;
  /** Sunday 20:00, the final round, and the end */
  final: number;
  /** the Israeli date of that Sunday, for slot arithmetic */
  sunday: [number, number, number];
}

/** the cycle that opens on a given Sunday's 20:00 */
function cycleOfSunday(sunday: [number, number, number]): Cycle {
  const thu = shiftDay(...sunday, 4);
  const nextSun = shiftDay(...sunday, 7);
  return { opens: ilAt(...sunday, 20), locks: ilAt(...thu, 17), kickoff: ilAt(...thu, 20), final: ilAt(...nextSun, 20), sunday };
}

/** the ordinary calendar: Sunday 20:00 to Sunday 20:00, every week of the year */
export function regularCycleOf(now: number): Cycle {
  const p = ilParts(now);
  let sunday = shiftDay(p.y, p.m, p.d, -p.dow);
  if (now < ilAt(...sunday, 20)) sunday = shiftDay(...sunday, -7);
  return cycleOfSunday(sunday);
}

/**
 * The cycle an instant belongs to. The one exception is the first weekend ever (FIRST_REGISTRATION_OPENS_AT): from
 * Monday 2.11 20:00 until the final of the 5–8.11 weekend the answer is that weekend, with `opens` pinned to the
 * Monday. `opens` is the cycle's identity on the server (the lobby's codes, devices and open leagues are keyed by
 * it), so it is one value for the whole of the first registration. Between Sunday 1.11 20:00 and Monday 2.11 20:00
 * the ordinary calendar already says the 1.11 cycle, but registrationGate keeps the doors shut, so nothing is kept
 * under that `opens` and nothing is swept at the Monday. (Until 29.10 the opening was Thursday 29.10, before that
 * Sunday; the code never assumed a weekday, only that the opening falls before the first lock.) From 8.11 20:00 on,
 * regular.
 */
export function cycleOf(now: number): Cycle {
  const first = cycleOfSunday(FIRST_CYCLE_SUNDAY);
  if (now >= FIRST_REGISTRATION_OPENS_AT && now < first.final) return { ...first, opens: FIRST_REGISTRATION_OPENS_AT };
  return regularCycleOf(now);
}

/** the first weekend ever, the one whose registration opened on Monday 2.11 */
export const isFirstCycle = (c: Cycle): boolean => c.opens === FIRST_REGISTRATION_OPENS_AT;

/**
 * Why nobody can register right now, or null. Before the first registration ever opens the ordinary calendar still
 * says the 25.10 cycle is open, and it is not: nothing is played that weekend. The client and the worker ask this
 * same function, so the bundle's address helps nobody in early.
 */
export function registrationGate(now: number): string | null {
  if (now < FIRST_REGISTRATION_OPENS_AT) return `ההרשמה נפתחת ביום ${ilDayDate(FIRST_REGISTRATION_OPENS_AT)} ב-${ilTime(FIRST_REGISTRATION_OPENS_AT)}`;
  return null;
}

/* ------------------------------------------------------------ words for a day */

export const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
/** "חמישי 5.11": the day's name and its date on the Israeli clock */
export function ilDayDate(at: number): string { const p = ilParts(at); return `${HE_DAYS[p.dow]} ${p.d}.${p.m}`; }
/** "17:00" on the Israeli clock */
export function ilTime(at: number): string { const p = ilParts(at); return `${String(p.hh).padStart(2, '0')}:${String(p.mm).padStart(2, '0')}`; }
/** "5–8.11": the weekend from its kickoff to its final, as people write it */
export function weekendSpan(c: Cycle): string {
  const k = ilParts(c.kickoff), f = ilParts(c.final);
  return k.m === f.m ? `${k.d}-${f.d}.${f.m}` : `${k.d}.${k.m}-${f.d}.${f.m}`;
}

export type CyclePhase = 'open' | 'locked' | 'playing';
export function cyclePhase(c: Cycle, now: number): CyclePhase {
  return now < c.locks ? 'open' : now < c.kickoff ? 'locked' : 'playing';
}

/* ------------------------------------------------------------------ slots */

export type SlotDay = 'fri' | 'sat' | 'sun';
export interface Slot { key: string; day: SlotDay; hh: number }
const DAY_OFFSET: Record<SlotDay, number> = { fri: 5, sat: 6, sun: 7 };
export const DAY_NAME: Record<SlotDay, string> = { fri: 'שישי', sat: 'שבת', sun: 'ראשון' };

/** the grid an opener picks from; Thursday 20:00 and Sunday 20:00 are not in it, they are every league's */
export const SLOT_GRID: Slot[] = [
  ...[10, 12, 14, 16].map(hh => ({ key: `fri-${hh}`, day: 'fri' as SlotDay, hh })),
  ...[10, 12, 14, 16, 20, 22].map(hh => ({ key: `sat-${hh}`, day: 'sat' as SlotDay, hh })),
  ...[10, 12, 14, 16, 18].map(hh => ({ key: `sun-${hh}`, day: 'sun' as SlotDay, hh })),
];
/** the open league's fixed slots between the two fixed rounds */
export const OPEN_SLOTS = ['fri-12', 'fri-14', 'sat-20'];   // six managers, five rounds: Thursday, these three, Sunday 20:00
export const KICKOFF_KEY = 'thu-20';
export const FINAL_KEY = 'sun-20';

export function slotByKey(key: string): Slot | undefined { return SLOT_GRID.find(s => s.key === key); }

/** when a slot falls in a cycle */
export function slotAt(c: Cycle, key: string): number {
  if (key === KICKOFF_KEY) return c.kickoff;
  if (key === FINAL_KEY) return c.final;
  const s = slotByKey(key);
  if (!s) throw new Error(`no slot ${key}`);
  return ilAt(...shiftDay(...c.sunday, DAY_OFFSET[s.day]), s.hh);
}

/**
 * How many rounds n managers play so that every pair meets once: n-1 when n is even, n when n is odd (a bye each
 * round). 25.10: with an odd count the league had only n-1 rounds, so one man never rested and the last pairs were
 * never played (7 gave 18 of 21).
 */
export function roundsFor(n: number): number { return n % 2 ? n : n - 1; }
/** the slots an opener picks beyond the two fixed rounds: N-3 when N is even, N-2 when N is odd; nine at most */
export function slotsNeeded(n: number): number { return Math.max(0, roundsFor(n) - 2); }

/** the opener's choice: exactly the needed count, every key on the grid, no key twice */
export function slotsProblem(n: number, keys: string[]): string | null {
  const need = slotsNeeded(n);
  if (new Set(keys).size !== keys.length) return 'משבצת נבחרה פעמיים';
  if (keys.some(k => !slotByKey(k))) return 'משבצת שלא בלוח';
  if (keys.length < need) return `עם ${n} חברים צריך עוד ${need - keys.length} ${need - keys.length === 1 ? 'משבצת' : 'משבצות'}`;
  if (keys.length > need) return `עם ${n} חברים יש ${keys.length - need} ${keys.length - need === 1 ? 'משבצת' : 'משבצות'} יותר מדי`;
  return null;
}

/** the round keys of a league in order: kickoff, the chosen slots sorted by time, the final */
export function roundKeys(c: Cycle, chosen: string[]): string[] {
  const mid = [...chosen].sort((a, b) => slotAt(c, a) - slotAt(c, b));
  return [KICKOFF_KEY, ...mid, FINAL_KEY];
}

/* ------------------------------------------------------------------- code */

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function makeCode(rng: () => number): string {
  let s = '';
  for (let i = 0; i < CODE_LEN; i++) s += CODE_ALPHABET[Math.floor(rng() * CODE_ALPHABET.length)];
  return s;
}

/* ----------------------------------------------------------------- nicks */

const BAD_WORDS = ['זונה', 'שרמוטה', 'מניאק', 'בן זונה', 'כוס', 'זין', 'היטלר', 'נאצי', 'fuck', 'shit', 'nazi', 'hitler'];
/**
 * The version of the terms of use and the privacy policy a person ticks before joining (Itzik, 27.10). The server
 * refuses a registration that does not carry it, so a client without the tick cannot get in.
 * 2026-10-31: the weekend league is 16 and up (Itzik, 31.10); the new client ticks the age box too. The weekend worker
 * imports this value, so the site and the beapro-weekend worker must go out together.
 */
export const LEGAL_VERSION = '2026-10-31';

/** the league's name goes through the same filter as a nickname (27.10) */
export function nameProblem(name: string): string | null {
  const n = name.trim();
  if (n.length < 2 || n.length > 24) return 'שם ליגה בין 2 ל-24 תווים';
  const low = n.toLowerCase();
  if (BAD_WORDS.some(w => low.includes(w))) return 'השם הזה לא נכנס לליגה';
  return null;
}

/** an old lobby kept mail opt-ins; there are none now, and a lobby that still has them loses them (27.10) */
export function stripLegacyMails(s: object): boolean {
  if (!('mails' in s)) return false;
  delete (s as { mails?: unknown }).mails;
  return true;
}

export function nickProblem(nick: string): string | null {
  const n = nick.trim();
  if (n.length < 2) return 'כינוי קצר מדי';
  if (n.length > NICK_MAX) return `כינוי עד ${NICK_MAX} תווים`;
  const low = n.toLowerCase();
  if (BAD_WORDS.some(w => low.includes(w))) return 'הכינוי הזה לא נכנס לליגה';
  return null;
}

/* ----------------------------------------------------------------- league */

export interface Member {
  device: string;
  nick: string;
  joined: number;
  /** drawn at the lock, 18 men, the eleven first */
  squad: Player[] | null;
  tactic: SimpleTactic;
  wins: number;
  losses: number;
  gf: number;
  ga: number;
  /** matches the assistant played for him (no choice of his own) */
  assistant: number;
  /** packs earned (every three wins) and opened */
  packs: number;
  opened: number;
  /** players that came from packs, by id */
  fromPacks: string[];
}

export interface MatchSlot {
  home: string;
  away: string;
  /** the match object's id once it exists */
  matchId: string | null;
  result: MatchResult | null;
}
export interface MatchResult {
  score: [number, number];
  shootout: [number, number] | null;
  winner: 'home' | 'away';
  /** the assistant played the whole match for this side */
  homeAssistant: boolean;
  awayAssistant: boolean;
  /** a technical loss: the third match the assistant would have played */
  technical: 'home' | 'away' | null;
}

export interface Round {
  index: number;
  key: string;
  at: number;
  matches: MatchSlot[];
  /** the member who sits this round out, with an odd count */
  bye: string | null;
}

export type LeagueKind = 'friend' | 'open';
export type LeagueStatus = 'open' | 'locked' | 'playing' | 'done' | 'cancelled';

export interface League {
  id: string;
  code: string;
  kind: LeagueKind;
  name: string;
  opener: string;
  seed: number;
  cycle: Cycle;
  /** the opener's chosen slots (not the two fixed rounds) */
  slots: string[];
  /** how many the opener planned for: the capacity, and what the slots were chosen for (the open league: six) */
  planned: number;
  members: Member[];
  status: LeagueStatus;
  rounds: Round[];
  createdAt: number;
  /** the champion's device once done, for the prize */
  prizes: Prize[] | null;
}

export interface Prize {
  device: string;
  place: number;
  /** wage rounds of his own division */
  wageRounds: number;
  gems: number;
  /** finished the weekend himself: chose in at least half his matches */
  finished: boolean;
}

export function defaultTactic(): SimpleTactic {
  return { approach: 'balanced', press: 'mid', formation: DEFAULT_FORMATION, mode: 'normal' };
}

export function newMember(device: string, nick: string, now: number): Member {
  return { device, nick: nick.trim(), joined: now, squad: null, tactic: defaultTactic(), wins: 0, losses: 0, gf: 0, ga: 0, assistant: 0, packs: 0, opened: 0, fromPacks: [] };
}

export function createLeague(input: { id: string; kind: LeagueKind; name: string; opener: string; nick: string; slots: string[]; seed: number; size?: number }, now: number): League | string {
  const gate = registrationGate(now); if (gate) return gate;
  const cycle = cycleOf(now);
  if (cyclePhase(cycle, now) !== 'open') return 'ההרשמה סגורה עד ראשון ב-20:00';
  const name = input.name.trim();
  const planned = input.kind === 'open' ? OPEN_MEMBERS : (input.size ?? MAX_MEMBERS);
  if (input.kind === 'friend') {
    const nmp = nameProblem(name); if (nmp) return nmp;
    const np = nickProblem(input.nick); if (np) return np;
    if (!Number.isInteger(planned) || planned < MIN_MEMBERS || planned > MAX_MEMBERS) return `ליגה של ${MIN_MEMBERS} עד ${MAX_MEMBERS} חברים`;
  }
  const slots = input.kind === 'open' ? OPEN_SLOTS : input.slots;
  if (input.kind === 'friend' && slots.some(k => !slotByKey(k)) || new Set(slots).size !== slots.length) return 'משבצת שלא בלוח';
  if (input.kind === 'friend') { const sp = slotsProblem(planned, slots); if (sp) return sp; }
  const league: League = {
    id: input.id, code: makeCode(createRng(input.seed)), kind: input.kind, name: input.kind === 'open' ? 'הליגה הפתוחה' : name,
    opener: input.opener, seed: input.seed, cycle, slots, planned, members: [], status: 'open', rounds: [], createdAt: now, prizes: null,
  };
  if (input.kind === 'friend') league.members.push(newMember(input.opener, input.nick, now));
  return league;
}

/** how many can be in: the open league's six, or what the opener planned for (25.10: it was always twelve, and more than planned broke the rounds) */
export function capacity(l: League): number { return l.kind === 'open' ? OPEN_MEMBERS : (l.planned ?? MAX_MEMBERS); }

export function join(l: League, device: string, nick: string, now: number): string | null {
  const gate = registrationGate(now); if (gate) return gate;
  if (l.status !== 'open') return 'הליגה כבר סגורה';
  if (now >= l.cycle.locks) return 'ההרשמה נסגרה בחמישי ב-17:00';
  if (l.members.some(m => m.device === device)) return null;   // already in, that is fine
  if (l.members.length >= capacity(l)) return 'הליגה מלאה';
  const np = nickProblem(nick); if (np) return np;
  if (l.members.some(m => m.nick.trim() === nick.trim())) return 'הכינוי תפוס בליגה הזאת';
  l.members.push(newMember(device, nick, now));
  return null;
}

/* ------------------------------------------------------------------ lobby */

/**
 * What the lobby keeps about who is where (the LobbyDO holds one of these). Every record carries the `opens` of its
 * cycle, which is the cycle's identity. `last` is where a device's league goes when its cycle ends, so a manager who
 * comes in on Sunday after 20:00 still finds his final, his table and his prize (25.10: he found nothing, the
 * lobby had already forgotten him for the new cycle while his league was still playing).
 */
export interface LobbyCore {
  codes: Record<string, { id: string; opens: number }>;
  devices: Record<string, { id: string; opens: number; final?: number }>;
  open: { id: string; opens: number; count: number }[];
  last: Record<string, { id: string; final: number }>;
}

/**
 * How many times a device was champion is kept for a year after its last championship, and then deleted (Itzik,
 * 29.10). `championsAt` is when each device was last champion; a lobby written before 29.10 has counts without it, and
 * those are stamped with the moment they are first read (stampChampions), so their year starts then.
 * 365 days, never more than twelve months.
 */
export const CHAMPIONS_KEEP_MS = 365 * 86_400_000;
export interface ChampionsBook { champions: Record<string, number>; championsAt?: Record<string, number> }

/** gives every count without a time the time `now`; true if anything was stamped */
export function stampChampions(s: ChampionsBook, now: number): boolean {
  const at = (s.championsAt ??= {});
  let changed = false;
  for (const d of Object.keys(s.champions)) if (typeof at[d] !== 'number') { at[d] = now; changed = true; }
  for (const d of Object.keys(at)) if (!(d in s.champions)) { delete at[d]; changed = true; }
  return changed;
}

/** deletes the count (and its time) of every device whose last championship is CHAMPIONS_KEEP_MS old; true if any went */
export function pruneChampions(s: ChampionsBook, now: number): boolean {
  const at = (s.championsAt ??= {});
  let changed = false;
  for (const d of Object.keys(s.champions)) {
    if (typeof at[d] === 'number' && now >= at[d] + CHAMPIONS_KEEP_MS) { delete s.champions[d]; delete at[d]; changed = true; }
  }
  return changed;
}

/** when the next count is due to go, or null if there is none */
export function nextChampionExpiry(s: ChampionsBook): number | null {
  let next: number | null = null;
  for (const t of Object.values(s.championsAt ?? {})) { const due = t + CHAMPIONS_KEEP_MS; if (next === null || due < next) next = due; }
  return next;
}

/** the end of the cycle a record was made in */
function finalOf(rec: { opens: number; final?: number }): number {
  return rec.final ?? cycleOf(rec.opens).final;
}

/**
 * The cycle moved on: codes and open leagues of earlier cycles are forgotten, and a device's league of an earlier
 * cycle moves to `last`, where it stays until that league is deleted (its final plus KEEP_MS).
 */
export function sweepLobby(s: LobbyCore, cycle: Cycle, now: number): void {
  for (const k of Object.keys(s.codes)) if (s.codes[k].opens !== cycle.opens) delete s.codes[k];
  for (const k of Object.keys(s.devices)) {
    const rec = s.devices[k];
    if (rec.opens === cycle.opens) continue;
    s.last[k] = { id: rec.id, final: finalOf(rec) };
    delete s.devices[k];
  }
  for (const k of Object.keys(s.last)) if (now > s.last[k].final + KEEP_MS) delete s.last[k];
  s.open = s.open.filter(o => o.opens === cycle.opens);
}

/** where a device stands: its league this cycle, and the league it was in last, while that one still exists */
export function mineOf(s: LobbyCore, device: string, cycle: Cycle, now: number): { league: string | null; last: string | null } {
  const mine = s.devices[device];
  const last = s.last[device];
  return {
    league: mine && mine.opens === cycle.opens ? mine.id : null,
    last: last && now <= last.final + KEEP_MS ? last.id : null,
  };
}

/* ------------------------------------------------------------------ squads */

const XI: Position[] = ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'ST', 'LW'];

export function squadAvg(squad: Player[]): number {
  return squad.reduce((s, p) => s + overall(p), 0) / squad.length;
}

/** eighteen men whose average is SQUAD_AVG give or take half a point, with ids that are the league's own */
export function drawSquad(seed: number, prefix: string): Player[] {
  let base = SQUAD_AVG + 1;
  for (let attempt = 0; attempt < 8; attempt++) {
    const rng = createRng(seed + attempt * 1_000_003);
    const sq = makeSquad(base, rng);
    const squad = [...sq.starters, ...sq.bench].map((p, i) => ({ ...p, id: `${prefix}-${i}`, fitness: 100, morale: 75 }));
    const avg = squadAvg(squad);
    if (Math.abs(avg - SQUAD_AVG) <= 0.5) return squad;
    base += avg > SQUAD_AVG ? -1 : 1;
  }
  const rng = createRng(seed);
  const sq = makeSquad(base, rng);
  return [...sq.starters, ...sq.bench].map((p, i) => ({ ...p, id: `${prefix}-${i}`, fitness: 100, morale: 75 }));
}

export function starters(m: Member): Player[] { return (m.squad ?? []).slice(0, 11); }
export function bench(m: Member): Player[] { return (m.squad ?? []).slice(11); }

/* ------------------------------------------------------------------ rounds */

/** Berger's round robin: every pair once, a bye when the count is odd */
export function roundRobin(ids: string[]): { pairs: [string, string][]; bye: string | null }[] {
  const list = [...ids];
  if (list.length % 2 === 1) list.push('');
  const n = list.length;
  const out: { pairs: [string, string][]; bye: string | null }[] = [];
  let ring = [...list];
  for (let r = 0; r < n - 1; r++) {
    const pairs: [string, string][] = [];
    let bye: string | null = null;
    for (let i = 0; i < n / 2; i++) {
      const a = ring[i], b = ring[n - 1 - i];
      if (!a || !b) { bye = a || b; continue; }
      pairs.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    out.push({ pairs, bye });
    ring = [ring[0], ring[n - 1], ...ring.slice(1, n - 1)];
  }
  return out;
}

/**
 * Thursday 17:00: the list closes. Under six, the league is cancelled. Otherwise
 * the squads are drawn, the slots trimmed from the end if fewer came than the
 * opener planned for, and the rounds written.
 */
export function lock(l: League, now: number): League {
  if (l.status !== 'open') return l;
  if (l.members.length < MIN_MEMBERS) { l.status = 'cancelled'; return l; }
  const n = l.members.length;
  const need = slotsNeeded(n);
  let chosen = l.slots;
  if (chosen.length > need) chosen = [...chosen].sort((a, b) => slotAt(l.cycle, a) - slotAt(l.cycle, b)).slice(0, need);
  l.slots = chosen;
  l.members.forEach((m, i) => { m.squad = drawSquad(l.seed + 17 * (i + 1), `${l.code}-${i}`); });
  const keys = roundKeys(l.cycle, chosen);
  const rr = roundRobin(l.members.map(m => m.device));
  l.rounds = keys.map((key, i) => ({
    index: i, key, at: slotAt(l.cycle, key), bye: rr[i]?.bye ?? null,
    matches: (rr[i]?.pairs ?? []).map(([home, away]) => ({ home, away, matchId: null, result: null })),
  }));
  l.status = 'locked';
  return l;
}

/** the round whose slot has come and whose matches have not been made */
export function dueRound(l: League, now: number): Round | null {
  return l.rounds.find(r => r.at <= now && r.matches.some(m => !m.matchId)) ?? null;
}

export function member(l: League, device: string): Member | undefined { return l.members.find(m => m.device === device); }

/** what a manager's round is: his match, or a bye */
export function myMatch(l: League, r: Round, device: string): MatchSlot | null {
  return r.matches.find(m => m.home === device || m.away === device) ?? null;
}

/* ----------------------------------------------------------------- results */

/**
 * A match is in. The assistant rule: the third match the assistant would play
 * for a man is a technical loss 0:3 (Itzik, 17.10), and the wins count packs.
 */
export function recordResult(l: League, r: Round, slot: MatchSlot, raw: { score: [number, number]; shootout: [number, number] | null; winner: 'home' | 'away'; chose: { home: number; away: number }; decisions: number }): MatchResult {
  const h = member(l, slot.home)!, a = member(l, slot.away)!;
  const homeAssistant = raw.decisions > 0 && raw.chose.home === 0;
  const awayAssistant = raw.decisions > 0 && raw.chose.away === 0;
  let technical: MatchResult['technical'] = null;
  if (homeAssistant && h.assistant >= ASSISTANT_MAX) technical = 'home';
  else if (awayAssistant && a.assistant >= ASSISTANT_MAX) technical = 'away';
  if (homeAssistant) h.assistant++;
  if (awayAssistant) a.assistant++;
  let score = raw.score, winner = raw.winner, shootout = raw.shootout;
  if (technical === 'home') { score = [TECH_LOSS[0], TECH_LOSS[1]]; winner = 'away'; shootout = null; }
  if (technical === 'away') { score = [TECH_LOSS[1], TECH_LOSS[0]]; winner = 'home'; shootout = null; }
  const res: MatchResult = { score, shootout, winner, homeAssistant, awayAssistant, technical };
  slot.result = res;
  h.gf += score[0]; h.ga += score[1]; a.gf += score[1]; a.ga += score[0];
  if (winner === 'home') { h.wins++; a.losses++; } else { a.wins++; h.losses++; }
  h.packs = Math.floor(h.wins / PACK_EVERY);
  a.packs = Math.floor(a.wins / PACK_EVERY);
  return res;
}

export interface Row { device: string; nick: string; played: number; wins: number; losses: number; gf: number; ga: number; gd: number; points: number; assistant: number }

/** the table: points, goal difference, goals for, then head to head, then the nick for a stable order */
export function standings(l: League): Row[] {
  const rows: Row[] = l.members.map(m => ({
    device: m.device, nick: m.nick, played: m.wins + m.losses, wins: m.wins, losses: m.losses, gf: m.gf, ga: m.ga, gd: m.gf - m.ga, points: m.wins * POINTS_WIN, assistant: m.assistant,
  }));
  const h2h = (a: string, b: string): number => {
    for (const r of l.rounds) for (const m of r.matches) if (m.result && ((m.home === a && m.away === b) || (m.home === b && m.away === a))) {
      const winner = m.result.winner === 'home' ? m.home : m.away;
      return winner === a ? -1 : 1;
    }
    return 0;
  };
  return rows.sort((x, y) => y.points - x.points || y.gd - x.gd || y.gf - x.gf || h2h(x.device, y.device) || x.nick.localeCompare(y.nick, 'he'));
}

/** the matches a manager could have chosen in, and the ones he did; "finished" is half of them or more */
export function finishedHimself(l: League, device: string): boolean {
  let mine = 0, his = 0;
  for (const r of l.rounds) for (const m of r.matches) {
    if (m.home !== device && m.away !== device) continue;
    if (!m.result) continue;
    mine++;
    const byAssistant = m.home === device ? m.result.homeAssistant : m.result.awayAssistant;
    if (!byAssistant) his++;
  }
  return mine > 0 && his * 2 >= mine;
}

/** the end: every match in, the table final, a prize per manager */
export function settle(l: League, championsBefore: Record<string, number> = {}): Prize[] {
  const table = standings(l);
  const prizes: Prize[] = table.map((row, i) => {
    const place = i + 1;
    const fin = finishedHimself(l, row.device);
    let wageRounds = PRIZE_BY_PLACE[place] ?? (fin ? PRIZE_FINISHED : 0);
    if (place === 1) { const again = championsBefore[row.device] ?? 0; wageRounds = CHAMPION_AGAIN[Math.min(again, CHAMPION_AGAIN.length - 1)]; }
    const gems = GEMS_BY_PLACE[place] ?? (fin ? GEMS_FINISHED : 0);
    return { device: row.device, place, wageRounds, gems, finished: fin };
  });
  l.prizes = prizes;
  l.status = 'done';
  return prizes;
}

/* ------------------------------------------------------------------- packs */

/** a pack: a man of PACK_OVR at the chosen place, in for the weakest man who holds it (or the weakest outfielder); the squad stays eighteen */
export function openWeekendPack(l: League, m: Member, position: Position): Player | string {
  if (!m.squad) return 'אין סגל עדיין';
  if (m.opened >= m.packs) return 'אין חבילה לפתוח';
  if (!XI.includes(position)) return 'עמדה לא מוכרת';
  const rng = createRng(l.seed + 9_001 * (m.opened + 1) + m.device.length);
  const used = new Set(m.squad.map(p => p.name));
  let man = makePlayer(position, PACK_OVR, rng, undefined, used);
  // makePlayer may shave a young man by three; a pack is the number on the box
  for (let k = 0; k < 6 && Math.abs(overall(man) - PACK_OVR) > 1; k++) man = makePlayer(position, PACK_OVR + (PACK_OVR - overall(man)), createRng(l.seed + k + 77 * (m.opened + 1)), undefined, used);
  man = { ...man, id: `${l.code}-pk-${m.device.length}-${m.opened}`, fitness: 100, morale: 80 };
  const same = m.squad.map((p, i) => ({ p, i })).filter(x => x.p.position === position && !m.fromPacks.includes(x.p.id));
  const pool = same.length ? same : m.squad.map((p, i) => ({ p, i })).filter(x => x.p.position !== 'GK' && !m.fromPacks.includes(x.p.id));
  const out = pool.reduce((a, b) => (overall(b.p) < overall(a.p) ? b : a));
  m.squad[out.i] = man;
  m.fromPacks.push(man.id);
  m.opened++;
  return man;
}

/* ----------------------------------------------------------------- lineup */

/** the manager's eleven and shape for the next match: eleven ids from his squad, no man twice */
export function setLineup(m: Member, ids: string[], tactic: SimpleTactic): string | null {
  if (!m.squad) return 'אין סגל עדיין';
  if (ids.length !== 11 || new Set(ids).size !== 11) return 'צריך בדיוק אחד עשר';
  if (ids.some(id => !m.squad!.some(p => p.id === id))) return 'שחקן שלא בסגל';
  if (!ids.some(id => m.squad!.find(p => p.id === id)!.position === 'GK')) return 'בלי שוער אי אפשר';
  const chosen = ids.map(id => m.squad!.find(p => p.id === id)!);
  const rest = m.squad.filter(p => !ids.includes(p.id));
  m.squad = [...chosen, ...rest];
  m.tactic = { approach: tactic.approach, press: tactic.press, formation: tactic.formation ?? DEFAULT_FORMATION, mode: 'normal' };
  return null;
}
