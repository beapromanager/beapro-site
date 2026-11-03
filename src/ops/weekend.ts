/**
 * The weekend league's area of the dashboard: from `ext.weekend` (what beapro-count passes on from beapro-weekend's
 * /internal/summary, see dashboard_weekend2.patch) to what the tab draws. Pure, like model.ts: no page, no network, no
 * clock but the one it is handed, so scripts/ops-check.mts runs it on fixtures.
 *
 * Five states, each said in words, never as zeros:
 *  - 'no-ext':  the counting worker answers without `ext` (dashboard_worker.patch is not live)
 *  - 'unwired': `ext` but no weekend: beapro-count has no WEEKEND binding or secret yet (or an older beapro-count)
 *  - 'error':   wired, but beapro-weekend refused, was late or answered something strange this time
 *  - 'v1':      beapro-weekend of dashboard_weekend.patch (v1): the five lobby counts only
 *  - 'v2':      dashboard_weekend2.patch: registrations by day, leagues, play, drop-outs, prizes, refusals, history
 *
 * Only counts and times arrive here; the worker side drops names, nicks, codes and ids before anything leaves it.
 */
import type { StatsRaw } from './model.ts';

/** a league needs this many to be played (src/game/weekendCore.ts MIN_MEMBERS, not imported so the game stays out) */
export const MIN_MEMBERS = 6;

export type Phase = 'open' | 'locked' | 'playing';
export type Kind = 'friend' | 'open';
export type Status = 'open' | 'locked' | 'playing' | 'done' | 'cancelled';
export const REFUSALS = ['consent', 'closed', 'already', 'full', 'code', 'nick', 'form', 'other'] as const;
export type Refusal = typeof REFUSALS[number];

export interface WeekendV1 { phase: Phase; opens: number; locks: number; kickoff: number; final: number; managers: number; friendLeagues: number; openLeagues: number; openMembers: number; champions: number }
export interface LeagueRowRaw { kind: Kind; status: Status; members: number; capacity: number; rounds: number; roundsDone: number; matches: number; done: number; stuck: boolean }
export interface HistoryRaw {
  opens: number; final: number; managers: number; leagues: number; friendLeagues: number; openLeagues: number; cancelled: number; cancelledMembers: number;
  done: number; matches: number; done_matches: number; assistant: number; technical: number; absent: number; prizes: number; gems: number; claimed: number;
  returning: number; refused: number; byDay: number[];
}
export interface WeekendV2 extends WeekendV1 {
  v: 2; now: number; first: boolean; since: number; known: number; returning: number;
  byDay: { day: string; n: number }[];
  leagues: LeagueRowRaw[];
  fill: { full: number; enough: number; short: number; seats: number };
  status: Record<Status, number>;
  play: { rounds: number; roundsDone: number; matches: number; started: number; done: number; assistant: number; technical: number; shootouts: number; stuck: number };
  drop: { cancelled: number; cancelledMembers: number; absent: number; technical: number };
  prizes: { awarded: number; gems: number; wageRounds: number; claimed: number };
  refusals: Record<Refusal, number>;
  errors: { matchFails: number; stuck: number };
  history: HistoryRaw[];
}
export type WeekendRawAny = WeekendV1 | WeekendV2;
export type WeekendErr = 'unwired' | 'timeout' | 'refused' | 'bad';

export const PHASE_LABEL: Record<Phase, string> = { open: 'ההרשמה פתוחה', locked: 'ההרשמה נסגרה, לפני השריקה', playing: 'משחקים' };
export const STATUS_LABEL: Record<Status, string> = { open: 'בהרשמה', locked: 'נעולה', playing: 'משחקת', done: 'הסתיימה', cancelled: 'בוטלה' };
export const KIND_LABEL: Record<Kind, string> = { friend: 'חברים', open: 'פתוחה' };
export const REFUSAL_LABEL: Record<Refusal, string> = {
  consent: 'בלי אישור התנאים (גרסה ישנה של המשחק)',
  closed: 'ההרשמה סגורה',
  already: 'כבר רשום בליגה',
  full: 'הליגה מלאה',
  code: 'קוד ליגה שגוי',
  nick: 'כינוי לא תקין או תפוס',
  form: 'טופס חסר',
  other: 'אחר',
};
export const ERR_TEXT: Record<WeekendErr, string> = {
  unwired: 'beapro-count עוד לא מחובר לשרת הליגה (חסרים החיבור WEEKEND או הסוד WEEKEND_STATS_SECRET).',
  timeout: 'שרת הליגה לא ענה בזמן (יותר משנייה וחצי). המספרים של שאר הדשבורד תקינים; נסה רענון.',
  refused: 'שרת הליגה סירב (סוד לא תואם, או ש-beapro-weekend עוד בלי /internal/summary).',
  bad: 'שרת הליגה ענה משהו לא צפוי. לא מוצג כלום כדי לא להציג מספר לא נכון.',
};

export interface Milestone { key: 'opens' | 'locks' | 'kickoff' | 'final'; label: string; at: number; when: 'past' | 'next' | 'later' }
export interface DayBar { day: string; n: number; cum: number; prevCum: number | null; today: boolean }
export interface WeekendView {
  state: 'no-ext' | 'unwired' | 'error' | 'v1' | 'v2';
  err: string | null;
  phase: Phase | null;
  phaseLabel: string;
  first: boolean | null;
  timeline: Milestone[];
  next: Milestone | null;
  heads: { managers: number; friendLeagues: number; openLeagues: number; openMembers: number; champions: number } | null;
  v2: null | {
    since: number;
    seats: number;                       // places taken in the leagues the summary knows (the sum of members)
    returning: number; returningPct: number | null;
    days: DayBar[];
    prevOpens: number | null;
    conv: { visitors: number; managers: number; pct: number | null; days: number } | null;
    fill: WeekendV2['fill'];
    status: WeekendV2['status'];
    rows: (LeagueRowRaw & { label: string; short: boolean })[];
    play: WeekendV2['play'] & { roundsPct: number | null; matchesPct: number | null; assistantPct: number | null };
    drop: WeekendV2['drop'];
    prizes: WeekendV2['prizes'];
    refusals: { key: Refusal; label: string; n: number }[];
    refused: number;
    errors: WeekendV2['errors'];
    history: (HistoryRaw & { regDays: number })[];
  };
}

const PHASES: Phase[] = ['open', 'locked', 'playing'];
const pct = (a: number, b: number): number | null => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);
const fin = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

/** the Israeli calendar day of a moment, YYYY-MM-DD */
export function ilDay(ms: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
}
const nextDay = (d: string): string => new Date(Date.parse(`${d}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

function isV1(x: unknown): x is WeekendV1 {
  const o = x as WeekendV1 | null;
  return !!o && typeof o === 'object' && PHASES.includes(o.phase) && fin(o.opens) && fin(o.managers);
}

export function buildWeekend(raw: StatsRaw, now: number): WeekendView {
  const empty = (state: WeekendView['state'], err: string | null): WeekendView =>
    ({ state, err, phase: null, phaseLabel: '', first: null, timeline: [], next: null, heads: null, v2: null });
  const ext = raw.ext;
  if (!ext || !Array.isArray(ext.days)) return empty('no-ext', null);
  const w = ext.weekend as unknown;
  const errKey = (ext as { weekendErr?: WeekendErr | null }).weekendErr ?? null;
  if (!isV1(w)) {
    if (errKey && errKey !== 'unwired') return empty('error', ERR_TEXT[errKey] ?? ERR_TEXT.bad);
    return empty('unwired', ERR_TEXT.unwired);
  }
  const ms: [Milestone['key'], string][] = [['opens', 'ההרשמה נפתחת'], ['locks', 'ההרשמה ננעלת'], ['kickoff', 'שריקת הפתיחה'], ['final', 'הגמר']];
  let seenNext = false;
  const timeline: Milestone[] = ms.filter(([k]) => fin(w[k]) && w[k] > 0).map(([key, label]) => {
    const at = w[key];
    const when: Milestone['when'] = at <= now ? 'past' : seenNext ? 'later' : 'next';
    if (when === 'next') seenNext = true;
    return { key, label, at, when };
  });
  const base: WeekendView = {
    state: 'v1', err: null, phase: w.phase, phaseLabel: PHASE_LABEL[w.phase],
    first: null, timeline, next: timeline.find(m => m.when === 'next') ?? null,
    heads: { managers: w.managers, friendLeagues: w.friendLeagues, openLeagues: w.openLeagues, openMembers: w.openMembers, champions: w.champions },
    v2: null,
  };
  if ((w as WeekendV2).v !== 2) return base;
  const s = w as WeekendV2;

  /* registrations by Israeli day, from the day registration opened to today (or the lock), against the cycle before */
  const prev = [...(s.history ?? [])].filter(h => h.opens < s.opens).sort((a, b) => b.opens - a.opens)[0] ?? null;
  const today = ilDay(now);
  const lastDay = ilDay(Math.min(now, s.locks || now));
  const got = new Map((s.byDay ?? []).map(d => [d.day, d.n]));
  const days: DayBar[] = [];
  let cum = 0, prevCum = 0;
  for (let d = ilDay(s.opens), i = 0; i < 15; d = nextDay(d), i++) {
    const n = got.get(d) ?? 0;
    cum += n;
    if (prev) prevCum += prev.byDay[i] ?? 0;
    days.push({ day: d, n, cum, prevCum: prev ? prevCum : null, today: d === today });
    if (d >= lastDay) break;
  }

  /* who came to the game in those days against who registered: the days count a person once a day, so someone who
     came on two days is two here; the share is therefore at least this, never more (a different id, too) */
  const regDays = new Set(days.map(d => d.day));
  const inWin = ext.days.filter(d => regDays.has(d.day));
  const visitors = inWin.reduce((a, d) => a + (d.people ?? 0), 0);
  const conv = inWin.length ? { visitors, managers: s.managers, pct: pct(s.managers, visitors), days: inWin.length } : null;

  const play = s.play;
  return {
    ...base,
    state: 'v2',
    first: s.first,
    v2: {
      since: s.since,
      seats: (s.leagues ?? []).reduce((a, r) => a + r.members, 0),
      returning: s.returning, returningPct: pct(s.returning, s.managers),
      days, prevOpens: prev?.opens ?? null, conv,
      fill: s.fill, status: s.status,
      rows: (s.leagues ?? []).map((r, i) => ({ ...r, label: `${KIND_LABEL[r.kind]} ${i + 1}`, short: r.status === 'open' && r.members < MIN_MEMBERS })),
      play: { ...play, roundsPct: pct(play.roundsDone, play.rounds), matchesPct: pct(play.done, play.matches), assistantPct: pct(play.assistant, play.done) },
      drop: s.drop, prizes: s.prizes,
      refusals: REFUSALS.map(k => ({ key: k, label: REFUSAL_LABEL[k], n: s.refusals?.[k] ?? 0 })),
      refused: REFUSALS.reduce((a, k) => a + (s.refusals?.[k] ?? 0), 0),
      errors: s.errors,
      history: [...(s.history ?? [])].sort((a, b) => b.opens - a.opens).map(h => ({ ...h, regDays: h.byDay.length })),
    },
  };
}

/** "א׳ 8.11 20:00" in Israel */
export function whenText(ms: number): string {
  const p = new Intl.DateTimeFormat('he-IL', { timeZone: 'Asia/Jerusalem', weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(ms));
  const g = (t: string) => p.find(x => x.type === t)?.value ?? '';
  return `${g('weekday')} ${g('day')}.${g('month')} ${g('hour')}:${g('minute')}`;
}

/** "עוד 2 ימים ו-5 שעות" */
export function leftText(ms: number): string {
  if (ms <= 0) return 'עכשיו';
  const m = Math.floor(ms / 60_000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `עוד ${d === 1 ? 'יום' : `${d} ימים`}${h % 24 ? ` ו-${h % 24} שע׳` : ''}`;
  if (h > 0) return `עוד ${h} שע׳${m % 60 ? ` ו-${m % 60} דק׳` : ''}`;
  return `עוד ${m} דק׳`;
}
