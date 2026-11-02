/**
 * Made-up answers of GET /stats for scripts/ops-check.mts and scripts/ops-ui.mjs. No real numbers, no real key.
 *   basic(): the shape the Worker answers today (worker/src/index.ts on 07b3bd1)
 *   full():  the same plus `ext`, the shape dashboard_worker.patch adds
 */
export const MOCK_KEY = 'MOCK_KEY_0000_not_a_real_key';
export const NOW = Date.parse('2026-11-02T10:30:00Z');          // 12:30 in Israel
const STEPS = ['open', 'title', 'career_new', 'manager', 'club', 'archetype', 'signing', 'friends', 'squad', 'market', 'season',
  'match1_start', 'match1_half', 'round_1', 'round_3', 'round_7', 'season_end', 'season_2'];
const ALL = [1200, 1100, 700, 640, 600, 560, 520, 500, 470, 450, 430, 410, 330, 300, 210, 150, 90, 40];

const day = ms => new Date(ms).toISOString().slice(0, 10);
const days = n => { const out = []; for (let i = n - 1; i >= 0; i--) out.push(day(NOW - i * 86_400_000)); return out; };

export function basic() {
  return {
    ok: true, steps: STEPS,
    funnel: STEPS.map((step, i) => ({ step, n: ALL[i] })),
    people: 1200, sittings: 3400, returned: 380,
    daily: days(30).filter((_, i) => i % 9 !== 4).map((d, i) => ({ day: d, people: 30 + ((i * 7) % 23), sittings: 60 + ((i * 11) % 40) })),
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

export function full() {
  const b = basic();
  const list = days(30);
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
      v: 1, tz: 'Asia/Jerusalem', now: NOW, today: list[list.length - 1],
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
