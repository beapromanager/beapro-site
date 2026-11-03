/**
 * From what the worker answers to what the page draws. Pure: no page, no network, no clock but the one it is handed,
 * so scripts/ops-check.mts can run it on fixtures.
 *
 * Two shapes come in:
 *  - "basic": GET /stats as it is live on 2.11 (worker/src/index.ts). All-time funnel of the 18 steps, people, sittings,
 *    returned, people/sittings per UTC day, crashes, and `reach` (divisions, Europe, gift, share, daily gift).
 *  - "full": the same plus `ext`, which only dashboard_worker.patch adds: every closed mark all-time (ob_*, cup_*,
 *    money_*), and per Israeli day: people, sittings, new people and first-reach counts of every step and mark, plus
 *    "yesterday up to this hour". Without it those parts say they need the Worker update instead of drawing zeros.
 */
import { STEP_LABEL, OB_LABEL, OB_NOT_SENT_YET, OB_ROAD, OB_SIDE, LATE_STEPS, labelOf } from './labels.ts';

type SN = { step: string; n: number };
type TN = { tier: number; n: number };
export interface DayRaw { day: string; people: number; sittings: number }
export interface ExtDay { day: string; people: number; sittings: number; fresh: number; steps: Record<string, number> }
export interface StatsRaw {
  ok: true;
  steps?: string[];
  funnel: SN[];
  people: number;
  sittings: number;
  returned: number;
  daily: DayRaw[];
  crashes: { step: string; err: string; n: number; people: number }[];
  reach?: {
    grid?: { tier: number; season: number; n: number }[]; ever?: TN[]; best?: TN[]; seasons?: { season: number; n: number }[];
    titles?: TN[]; europe?: SN[]; gift?: { n: number }[]; share?: { n: number }[]; daily?: SN[]; cup?: SN[];
  };
  ext?: {
    v: number; tz: string; now: number; today: string;
    marks: SN[];
    days: ExtDay[];
    soFar?: { yesterday: Omit<ExtDay, 'day'> };
    weekend?: WeekendRaw | null;
    weekendErr?: 'unwired' | 'timeout' | 'refused' | 'bad' | null;
  };
}
export interface WeekendRaw { phase: string; opens: number; locks: number; kickoff: number; final: number; managers: number; friendLeagues: number; openLeagues: number; openMembers: number; champions: number }

export interface Stage { key: string; label: string; n: number | null; ofTop: number | null; lost: number | null; lostPct: number | null; note?: string }
export interface Card { key: string; label: string; today: number | null; yesterday: number | null; partial: boolean }
export interface TrendDay { day: string; people: number; sittings: number; fresh: number | null; steps: Record<string, number> | null }
export interface ObRow { key: string; label: string; n: number | null; today: number | null; yesterday: number | null; sent: boolean; side: boolean }
export interface View {
  mode: 'basic' | 'full';
  dayZone: 'UTC' | 'ישראל';
  totals: { people: number; sittings: number; returned: number; returnedPct: number | null };
  cards: Card[];
  trend: TrendDay[];
  oldRoad: Stage[];
  newRoad: Stage[];
  newRoadWindow: boolean;     // true: counted over the window, false: all-time
  worst: { from: string; to: string; lost: number; lostPct: number } | null;
  ob: ObRow[];
  cup: { key: string; label: string; n: number | null }[];
  europe: { key: string; label: string; n: number }[];
  depth: { gift10: number };
  share: { tap: number };
  dailyGift: { key: string; label: string; n: number }[];
  money: { key: string; label: string; n: number | null }[];
  reach: { tier: number; ever: number; best: number; won: number }[];
  weekend: WeekendRaw | null;
  crashes: { where: string; err: string; n: number; people: number }[];
}

const pick = (list: SN[] | undefined, k: string): number => list?.find(x => x.step === k)?.n ?? 0;
const pct = (a: number, b: number): number | null => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);

/** UTC calendar day of a moment, YYYY-MM-DD */
export const utcDay = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
/** the day before a YYYY-MM-DD */
export const dayBefore = (d: string): string => utcDay(Date.parse(`${d}T12:00:00Z`) - 86_400_000);

/** a road of stages: each one against the first and against the one before it */
export function road(keys: readonly string[], get: (k: string) => number | null, notes: Record<string, string> = {}): Stage[] {
  const top = keys.length ? get(keys[0]) : null;
  let prev: number | null = null;
  return keys.map(k => {
    const n = get(k);
    const lost = n !== null && prev !== null ? prev - n : null;
    const st: Stage = {
      key: k, label: labelOf(k), n,
      ofTop: n !== null && top ? pct(n, top) : null,
      lost, lostPct: lost !== null && prev ? pct(lost, prev) : null,
      ...(notes[k] ? { note: notes[k] } : {}),
    };
    if (n !== null) prev = n;
    return st;
  });
}

/**
 * The biggest fall between two neighbouring stages that were both measured for everybody. The late steps (title,
 * match1_*) are left out: their counts start at a later date, so a "fall" into them is the calendar, not the players.
 */
export function worstFall(stages: Stage[], skip: Record<string, string> = LATE_STEPS): View['worst'] {
  const fair = stages.filter(s => s.n !== null && !skip[s.key]);
  let worst: View['worst'] = null;
  for (let i = 1; i < fair.length; i++) {
    const a = fair[i - 1].n!, b = fair[i].n!;
    const lost = a - b;
    if (lost > 0 && (!worst || lost > worst.lost)) worst = { from: fair[i - 1].key, to: fair[i].key, lost, lostPct: pct(lost, a) ?? 0 };
  }
  return worst;
}

/** the classic road, the one the old onboarding walks (manager → club → … → market) */
export const OLD_ROAD = ['open', 'title', 'career_new', 'manager', 'club', 'archetype', 'signing', 'friends', 'squad', 'market', 'season', 'match1_start', 'match1_half', 'round_1', 'round_3', 'round_7', 'season_end', 'season_2'] as const;
/** the new opening: it skips manager…market, so its road has the prologue and the city in their place */
export const NEW_ROAD = ['open', 'title', 'career_new', 'ob_prologue', 'ob_city', 'match1_start', 'match1_half', 'round_1', 'round_3', 'round_7', 'season_end'] as const;

export function buildView(raw: StatsRaw, now: number, windowDays = 30): View {
  const ext = raw.ext && Array.isArray(raw.ext.days) && Array.isArray(raw.ext.marks) ? raw.ext : undefined;
  const mode: View['mode'] = ext ? 'full' : 'basic';
  const all = new Map<string, number>();
  for (const s of raw.funnel ?? []) all.set(s.step, s.n);
  for (const s of ext?.marks ?? []) if (!all.has(s.step)) all.set(s.step, s.n);
  const allOf = (k: string): number | null => (all.has(k) ? all.get(k)! : (k in STEP_LABEL ? 0 : null));

  /* the days, oldest first, with no holes: a day nobody came is a zero, not a missing bar */
  const today = ext?.today ?? utcDay(now);
  const order: string[] = [];
  { let d = today; for (let i = 0; i < windowDays; i++) { order.unshift(d); d = dayBefore(d); } }
  const byDay = new Map<string, TrendDay>();
  if (ext) for (const d of ext.days) byDay.set(d.day, { day: d.day, people: d.people, sittings: d.sittings, fresh: d.fresh, steps: d.steps ?? {} });
  else for (const d of raw.daily ?? []) byDay.set(d.day, { day: d.day, people: d.people, sittings: d.sittings, fresh: null, steps: null });
  const trend: TrendDay[] = order.map(d => byDay.get(d) ?? { day: d, people: 0, sittings: 0, fresh: ext ? 0 : null, steps: ext ? {} : null });

  const tDay = trend[trend.length - 1];
  const yDay = trend[trend.length - 2] ?? null;
  const ySoFar = ext?.soFar?.yesterday;
  const stepToday = (k: string): number | null => (tDay.steps ? tDay.steps[k] ?? 0 : null);
  const stepYest = (k: string): number | null => (ySoFar ? ySoFar.steps[k] ?? 0 : yDay?.steps ? yDay.steps[k] ?? 0 : null);
  const partial = !!ySoFar;
  const cards: Card[] = [
    { key: 'people', label: 'אנשים שנכנסו', today: tDay.people, yesterday: ySoFar ? ySoFar.people : yDay?.people ?? null, partial },
    { key: 'sittings', label: 'כניסות', today: tDay.sittings, yesterday: ySoFar ? ySoFar.sittings : yDay?.sittings ?? null, partial },
    { key: 'fresh', label: 'חדשים', today: tDay.fresh, yesterday: ySoFar ? ySoFar.fresh : yDay?.fresh ?? null, partial },
    { key: 'career_new', label: 'פתחו קריירה', today: stepToday('career_new'), yesterday: stepYest('career_new'), partial },
    { key: 'ob_prologue', label: 'התחילו את הפרולוג', today: stepToday('ob_prologue'), yesterday: stepYest('ob_prologue'), partial },
    { key: 'round_1', label: 'סיימו מחזור 1', today: stepToday('round_1'), yesterday: stepYest('round_1'), partial },
  ];

  const oldRoad = road(OLD_ROAD, allOf, LATE_STEPS);
  /* the new road over the window (first reaches inside it) when the days carry steps; all-time otherwise */
  const winSum = (k: string): number | null => (ext ? trend.reduce((a, d) => a + (d.steps?.[k] ?? 0), 0) : null);
  const newRoad = ext
    ? road(NEW_ROAD, winSum)
    : road(NEW_ROAD, k => (k.startsWith('ob_') ? null : allOf(k)), LATE_STEPS);

  const ob: ObRow[] = [...OB_ROAD, ...OB_SIDE].map(k => ({
    key: k, label: OB_LABEL[k], n: ext ? all.get(k) ?? 0 : null,
    today: stepToday(k), yesterday: stepYest(k), sent: !OB_NOT_SENT_YET.includes(k), side: (OB_SIDE as readonly string[]).includes(k),
  }));

  const cupSrc = raw.reach?.cup ?? (ext ? ext.marks : undefined);
  const cup = ['cup_in', 'cup_sf', 'cup_final', 'cup_won'].map(k => ({ key: k, label: labelOf(k), n: cupSrc ? pick(cupSrc, k) : null }));
  const europe = ['eu_in', 'eu_final', 'eu_won'].map(k => ({ key: k, label: labelOf(k), n: pick(raw.reach?.europe, k) }));
  const dailyGift = ['daily_1', 'daily_7', 'daily_30'].map(k => ({ key: k, label: labelOf(k), n: pick(raw.reach?.daily, k) }));
  const money = ['money_red', 'money_sack'].map(k => ({ key: k, label: labelOf(k), n: ext ? pick(ext.marks, k) : null }));
  const reach = [1, 2, 3, 4, 5].map(t => ({
    tier: t,
    ever: raw.reach?.ever?.find(x => x.tier === t)?.n ?? 0,
    best: raw.reach?.best?.find(x => x.tier === t)?.n ?? 0,
    won: raw.reach?.titles?.find(x => x.tier === t)?.n ?? 0,
  }));

  return {
    mode, dayZone: ext ? 'ישראל' : 'UTC',
    totals: { people: raw.people ?? 0, sittings: raw.sittings ?? 0, returned: raw.returned ?? 0, returnedPct: pct(raw.returned ?? 0, raw.people ?? 0) },
    cards, trend, oldRoad, newRoad, newRoadWindow: !!ext,
    worst: worstFall(oldRoad),
    ob, cup, europe,
    depth: { gift10: raw.reach?.gift?.[0]?.n ?? 0 },
    share: { tap: raw.reach?.share?.[0]?.n ?? 0 },
    dailyGift, money, reach,
    weekend: ext?.weekend ?? null,
    crashes: (raw.crashes ?? []).map(c => ({ where: labelOf(c.step), err: c.err, n: c.n, people: c.people })),
  };
}
