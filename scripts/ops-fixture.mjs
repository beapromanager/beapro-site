/**
 * Made-up answers of GET /stats for scripts/ops-check.mts and scripts/ops-ui.mjs. No real numbers, no real key.
 *   basic(): the shape the Worker answers today (worker/src/index.ts on 07b3bd1)
 *   full():  the same plus `ext`, the shape dashboard_worker.patch adds
 *   withWeekend(): full() plus the five lobby counts of dashboard_weekend.patch (v1)
 *   weekendV2(stage): full() plus the weekend area of dashboard_weekend2.patch, on a made-up second weekend:
 *     'reg' Wednesday 11.11 12:30 Israel (registration open), 'play' Saturday 14.11 14:00 (playing). Made-up counts only.
 *   weekendErr(err): full() with no weekend and why ('unwired' | 'timeout' | 'refused' | 'bad')
 */
export const MOCK_KEY = 'MOCK_KEY_0000_not_a_real_key';
export const NOW = Date.parse('2026-11-02T10:30:00Z');          // 12:30 in Israel
const STEPS = ['open', 'title', 'career_new', 'manager', 'club', 'archetype', 'signing', 'friends', 'squad', 'market', 'season',
  'match1_start', 'match1_half', 'round_1', 'round_3', 'round_7', 'season_end', 'season_2'];
const ALL = [1200, 1100, 700, 640, 600, 560, 520, 500, 470, 450, 430, 410, 330, 300, 210, 150, 90, 40];

const day = ms => new Date(ms).toISOString().slice(0, 10);
const days = (n, now = NOW) => { const out = []; for (let i = n - 1; i >= 0; i--) out.push(day(now - i * 86_400_000)); return out; };

export function basic(now = NOW) {
  return {
    ok: true, steps: STEPS,
    funnel: STEPS.map((step, i) => ({ step, n: ALL[i] })),
    people: 1200, sittings: 3400, returned: 380,
    daily: days(30, now).filter((_, i) => i % 9 !== 4).map((d, i) => ({ day: d, people: 30 + ((i * 7) % 23), sittings: 60 + ((i * 11) % 40) })),
    crashes: [{ step: 'match1_half', err: 'TypeError', n: 3, people: 2 }],
    reach: {
      grid: [], ever: [{ tier: 1, n: 600 }, { tier: 2, n: 120 }, { tier: 3, n: 30 }], best: [{ tier: 1, n: 480 }, { tier: 2, n: 90 }, { tier: 3, n: 30 }],
      seasons: [], titles: [{ tier: 1, n: 60 }, { tier: 2, n: 12 }], europe: [{ step: 'eu_in', n: 14 }, { step: 'eu_final', n: 3 }, { step: 'eu_won', n: 1 }],
      gift: [{ n: 7 }], share: [{ n: 25 }], daily: [{ step: 'daily_1', n: 300 }, { step: 'daily_7', n: 40 }, { step: 'daily_30', n: 2 }],
    },
  };
}

const OB = { ob_prologue: 260, ob_goal5: 240, ob_choice_bench: 120, ob_choice_bottle: 100, ob_skip: 30, ob_fired: 200, ob_call: 190,
  ob_city: 170, ob_named_self: 60, ob_kickoff: 150 };
const MARKS = { ...OB, cup_in: 200, cup_sf: 40, cup_final: 20, cup_won: 9, money_red: 35, money_sack: 11 };

export function full(now = NOW) {
  const b = basic(now);
  const list = days(30, now);
  const perDay = (i, scale) => {
    const steps = {};
    STEPS.forEach((s, j) => { steps[s] = Math.max(0, Math.round((ALL[j] / 40) * scale)); });
    for (const [k, v] of Object.entries(MARKS)) steps[k] = Math.max(0, Math.round((v / 30) * scale));
    return steps;
  };
  const extDays = list.map((d, i) => {
    const scale = i === list.length - 1 ? 0.5 : 0.8 + ((i * 13) % 9) / 10;
    return { day: d, people: Math.round(40 * scale), sittings: Math.round(90 * scale), fresh: Math.round(25 * scale), steps: perDay(i, scale) };
  });
  const y = extDays[extDays.length - 2];
  return {
    ...b,
    ext: {
      v: 1, tz: 'Asia/Jerusalem', now, today: list[list.length - 1],
      marks: Object.entries(MARKS).map(([step, n]) => ({ step, n })),
      days: extDays,
      soFar: { yesterday: { people: Math.round(y.people * 0.5), sittings: Math.round(y.sittings * 0.5), fresh: Math.round(y.fresh * 0.5), steps: Object.fromEntries(Object.entries(y.steps).map(([k, v]) => [k, Math.round(v * 0.5)])) } },
      weekend: null,
    },
  };
}

export function withWeekend() {
  const f = full();
  f.ext.weekend = { phase: 'open', opens: NOW - 3_600_000, locks: NOW + 86_400_000, kickoff: NOW + 90_000_000, final: NOW + 170_000_000,
    managers: 37, friendLeagues: 5, openLeagues: 3, openMembers: 21, champions: 0 };
  return f;
}

export function weekendErr(err) {
  const f = full();
  f.ext.weekendErr = err;
  return f;
}

/* the made-up second weekend: registration opened Sunday 8.11 20:00 Israel, locks Thursday 12.11 17:00 */
export const WK = { opens: Date.parse('2026-11-08T18:00:00Z'), locks: Date.parse('2026-11-12T15:00:00Z'), kickoff: Date.parse('2026-11-12T18:00:00Z'), final: Date.parse('2026-11-15T18:00:00Z') };
export const WK_NOW = { reg: Date.parse('2026-11-11T10:30:00Z'), play: Date.parse('2026-11-14T12:00:00Z') };
const FIRST = { opens: Date.parse('2026-11-02T18:00:00Z'), final: Date.parse('2026-11-08T18:00:00Z'), managers: 31, leagues: 5, friendLeagues: 3, openLeagues: 2,
  cancelled: 1, cancelledMembers: 4, done: 4, matches: 90, done_matches: 90, assistant: 30, technical: 5, absent: 9, prizes: 4, gems: 300, claimed: 3,
  returning: 0, refused: 6, byDay: [4, 10, 9, 8] };
const L = (kind, members, capacity, status, rounds = 0, roundsDone = 0, matches = 0, done = 0, stuck = false) => ({ kind, status, members, capacity, rounds, roundsDone, matches, done, stuck });

export function weekendV2(stage = 'reg') {
  const now = WK_NOW[stage];
  const f = full(now);
  const reg = stage === 'reg';
  const leagues = reg
    ? [L('friend', 12, 12, 'open'), L('friend', 8, 12, 'open'), L('friend', 5, 12, 'open'), L('open', 6, 6, 'open'), L('open', 5, 6, 'open')]
    : [L('friend', 12, 12, 'playing', 11, 6, 66, 33), L('friend', 8, 12, 'playing', 7, 4, 28, 16, true), L('open', 6, 6, 'playing', 5, 3, 15, 9), L('friend', 5, 12, 'cancelled'), L('open', 5, 6, 'cancelled')];
  const st = { open: 0, locked: 0, playing: 0, done: 0, cancelled: 0 };
  for (const l of leagues) st[l.status]++;
  f.ext.weekend = {
    v: 2, now, phase: reg ? 'open' : 'playing', ...WK,
    managers: 36, friendLeagues: 3, openLeagues: 2, openMembers: 11, champions: 4,
    first: false, since: Date.parse('2026-11-04T06:00:00Z'), known: 5, returning: 14,
    byDay: reg ? [{ day: '2026-11-08', n: 9 }, { day: '2026-11-09', n: 14 }, { day: '2026-11-10', n: 8 }, { day: '2026-11-11', n: 5 }]
      : [{ day: '2026-11-08', n: 9 }, { day: '2026-11-09', n: 14 }, { day: '2026-11-10', n: 8 }, { day: '2026-11-11', n: 5 }],
    leagues,
    fill: reg ? { full: 2, enough: 1, short: 2, seats: 12 } : { full: 2, enough: 1, short: 0, seats: 0 },
    status: st,
    play: reg ? { rounds: 0, roundsDone: 0, matches: 0, started: 0, done: 0, assistant: 0, technical: 0, shootouts: 0, stuck: 0 }
      : { rounds: 23, roundsDone: 13, matches: 109, started: 64, done: 58, assistant: 22, technical: 3, shootouts: 4, stuck: 1 },
    drop: reg ? { cancelled: 0, cancelledMembers: 0, absent: 0, technical: 0 } : { cancelled: 2, cancelledMembers: 10, absent: 7, technical: 3 },
    prizes: reg ? { awarded: 0, gems: 0, wageRounds: 0, claimed: 0 } : { awarded: 13, gems: 130, wageRounds: 13, claimed: 9 },
    refusals: { consent: 2, closed: reg ? 0 : 1, already: 3, full: 1, code: 4, nick: 2, form: 0, other: 0 },
    errors: { matchFails: reg ? 0 : 1, stuck: reg ? 0 : 1 },
    history: [FIRST],
  };
  f.ext.weekendErr = null;
  return f;
}

/* draft 4.11: ext.weekendLeagues (dashboard_weekend_leagues_worker.patch), made-up clubs and codes */
const T = (club, played, wins, gf, ga) => ({ club, played, wins, losses: played - wins, gf, ga, points: wins * 3, assistant: 0 });
const R = (index, at, pairs) => ({ index, at, bye: null, matches: pairs.map(([home, away, s]) => ({ home, away, started: !!s, result: s && s.length ? { score: s, shootout: null, winner: s[0] > s[1] ? 'home' : 'away', technical: null, homeAssistant: false, awayAssistant: index === 1 && home === 'הפועל שכונה' } : null })) });
export function weekendLeaguesWorld(stage) {
  if (stage === 'zero') {
    const f = weekendV2('reg');
    Object.assign(f.ext.weekend, { managers: 0, friendLeagues: 0, openLeagues: 0, openMembers: 0, known: 0, returning: 0, leagues: [], byDay: [{ day: '2026-11-08', n: 0 }], fill: { full: 0, enough: 0, short: 0, seats: 0 }, status: { open: 0, locked: 0, playing: 0, done: 0, cancelled: 0 } });
    f.ext.weekendLeagues = { v: 1, now: WK_NOW.reg, total: 0, leagues: [] };
    return f;
  }
  if (stage === 'reg') {
    const f = weekendV2('reg');
    const m = (names) => names.map(n => T(n, 0, 0, 0, 0));
    f.ext.weekendLeagues = { v: 1, now: WK_NOW.reg, total: 3, leagues: [
      { kind: 'friend', status: 'open', name: 'החבר׳ה מהעבודה', code: 'WX4P9', members: 4, capacity: 12, table: m(['מכבי איציק', 'הפועל שכונה', 'בית״ר דודו', 'עירוני רון']), rounds: [] },
      { kind: 'friend', status: 'open', name: 'ליגת השכונה', code: 'QH7M2', members: 2, capacity: 12, table: m(['אדומים', 'כחולים']), rounds: [] },
      { kind: 'open', status: 'open', name: '', code: null, members: 5, capacity: 6, table: m(['נשרים', 'אריות', 'כרישים', 'זאבים', 'נמרים']), rounds: [] },
    ] };
    return f;
  }
  const f = weekendV2('play');
  const k = Date.parse('2026-11-12T18:00:00Z'), H = 3_600_000;
  const clubs = ['מכבי איציק', 'הפועל שכונה', 'בית״ר דודו', 'עירוני רון', 'אדומים', 'כחולים'];
  f.ext.weekendLeagues = { v: 1, now: WK_NOW.play, total: 2, leagues: [
    { kind: 'friend', status: 'playing', name: 'החבר׳ה מהעבודה', code: 'WX4P9', members: 6, capacity: 12,
      table: [T(clubs[0], 3, 3, 8, 2), T(clubs[2], 3, 2, 6, 4), T(clubs[1], 3, 2, 5, 4), T(clubs[3], 3, 1, 3, 5), T(clubs[4], 3, 1, 2, 5), T(clubs[5], 3, 0, 1, 5)],
      rounds: [
        R(0, k, [[clubs[0], clubs[1], [3, 1]], [clubs[2], clubs[3], [2, 0]], [clubs[4], clubs[5], [1, 0]]]),
        R(1, k + 20 * H, [[clubs[1], clubs[2], [2, 1]], [clubs[0], clubs[4], [3, 0]], [clubs[3], clubs[5], [2, 1]]]),
        R(2, k + 24 * H, [[clubs[0], clubs[3], [2, 1]], [clubs[2], clubs[5], [3, 0]], [clubs[1], clubs[4], [2, 1]]]),
        R(3, k + 44 * H, [[clubs[0], clubs[2], []], [clubs[1], clubs[3], null], [clubs[4], clubs[5], null]]),
      ] },
    { kind: 'open', status: 'done', name: '', code: null, members: 6, capacity: 6,
      table: [T('נשרים', 5, 4, 11, 4), T('אריות', 5, 3, 9, 7), T('כרישים', 5, 3, 8, 8), T('זאבים', 5, 2, 6, 8), T('נמרים', 5, 2, 5, 7), T('דובים', 5, 1, 4, 9)],
      rounds: [R(0, k, [['נשרים', 'דובים', [3, 0]], ['אריות', 'נמרים', [2, 1]], ['כרישים', 'זאבים', [1, 2]]])] },
  ] };
  return f;
}
