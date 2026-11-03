/**
 * The counting house.
 *
 * Two doors. POST / takes a batch of events from a game and writes them down.
 * GET /stats, with the key, gives back the numbers: how many people, how many
 * sittings, and where the ones who stopped stopped.
 *
 * WHAT IT REFUSES TO KNOW. It stores no IP, no user agent, no country, no
 * name. The game never sends them, and an event that arrives with extra
 * fields is not written with them: every row is built from the four values
 * below and nothing else, so a future change to the game cannot start
 * collecting something by accident.
 *
 * WHY THE WRITES ARE IDEMPOTENT. A phone that loses its connection mid post
 * keeps the batch and sends it again, so the same event can arrive twice.
 * INSERT OR IGNORE against (aid, step) means the second one changes nothing,
 * and a funnel that counts people cannot be inflated by a bad network.
 *
 * WHY THE DASHBOARD KEY IS CHECKED HERE. Anything the browser holds is public,
 * so a key checked in the page is a lock with the key taped to the door. The
 * numbers only leave this worker when the key sent with the request matches
 * the secret, which lives in the worker and never in the game.
 */

/**
 * The slice of D1 this worker uses, declared here rather than pulled from a
 * types package. Wrangler strips the types on the way up, so the deploy does
 * not depend on an install succeeding, and what the worker expects of the
 * database is readable in the same file that uses it.
 */
interface D1Result<T = Record<string, unknown>> { results: T[] }
interface D1Stmt { bind(...v: unknown[]): D1Stmt; all<T = Record<string, unknown>>(): Promise<D1Result<T>> }
interface D1Database { prepare(sql: string): D1Stmt; batch(s: D1Stmt[]): Promise<unknown> }
// the year's deletes live in their own file: the Workers runtime rejects a number or array exported from the entry module
import { purgeOld } from './retention.ts';

export interface Env {
  DB: D1Database;
  /** the secret behind ?admin=, set with: wrangler secret put ADMIN_KEY */
  ADMIN_KEY: string;
}

/**
 * The steps the game can report, in order; anything else is dropped.
 *
 * This list is the funnel's order on the dashboard, and it must match STEPS in
 * src/game/telemetry.ts exactly. It is copied rather than imported because a
 * worker cannot reach into the game's source, and the copy has already gone
 * stale once: the game's order was corrected and this was not, so the chart
 * showed people picking who they are before naming themselves.
 * telemetry-check compares the two lists now.
 */
const STEPS = [
  'open', 'title', 'career_new', 'manager', 'club', 'archetype', 'signing', 'friends',
  'squad', 'market', 'season', 'match1_start', 'match1_half', 'round_1', 'round_3', 'round_7', 'season_end', 'season_2',
] as const;
type Step = typeof STEPS[number];
const KNOWN = new Set<string>(STEPS);

/**
 * Where careers get to, which are not steps: `t3s5` is a career in the third division in its fifth season, `w5` a
 * career that won the top division. The same pattern as MILESTONE in src/game/telemetry.ts, and telemetry-check
 * compares the two, because a copy nobody compares is a copy that drifts.
 */
const MILESTONE = /^(t[1-5]s([1-9]|1[0-9]|20)|w[1-5]|money_red|money_sack|eu_in|eu_final|eu_won|cup_in|cup_sf|cup_final|cup_won|gift10|share_tap|xfer_offer|xfer_sent|xfer_in|xfer_code|site_new|ob_(prologue|goal5|choice_bench|choice_bottle|skip|stills|fired|call|city|named_self|kickoff|match1_end|names|names_skip|kit|arch|sponsor|market)|daily_1|daily_7|daily_30)$/;

/**
 * What the dashboard asks of the milestones. Plain SQL over the same table as the funnel, one row per device per
 * milestone, so a person counts once however often the game reports it. Exported so a check can run them.
 */
export const REACH_SQL = {
  /** how many people were in each division in each season */
  grid: "SELECT CAST(substr(step, 2, 1) AS INTEGER) AS tier, CAST(substr(step, 4) AS INTEGER) AS season, COUNT(*) AS n FROM steps WHERE step GLOB 't[1-5]s*' GROUP BY tier, season ORDER BY tier, season",
  /** people who have ever been in each division */
  ever: "SELECT CAST(substr(step, 2, 1) AS INTEGER) AS tier, COUNT(DISTINCT aid) AS n FROM steps WHERE step GLOB 't[1-5]s*' GROUP BY tier ORDER BY tier",
  /** the highest division each person has reached, counted by division */
  best: "SELECT t AS tier, COUNT(*) AS n FROM (SELECT aid, MAX(CAST(substr(step, 2, 1) AS INTEGER)) AS t FROM steps WHERE step GLOB 't[1-5]s*' GROUP BY aid) GROUP BY t ORDER BY t",
  /** the furthest season each person has reached, counted by season */
  seasons: "SELECT s AS season, COUNT(*) AS n FROM (SELECT aid, MAX(CAST(substr(step, 4) AS INTEGER)) AS s FROM steps WHERE step GLOB 't[1-5]s*' GROUP BY aid) GROUP BY s ORDER BY s",
  /** people who have won each division */
  titles: "SELECT CAST(substr(step, 2, 1) AS INTEGER) AS tier, COUNT(*) AS n FROM steps WHERE step GLOB 'w[1-5]' GROUP BY tier ORDER BY tier",
  /** people drawn into the European cup, people who stood in its final, people who lifted it: one row per mark */
  europe: "SELECT step, COUNT(*) AS n FROM steps WHERE step IN ('eu_in', 'eu_final', 'eu_won') GROUP BY step ORDER BY step",
  /** people past ten seasons who signed the loyalty gift */
  gift: "SELECT COUNT(*) AS n FROM steps WHERE step = 'gift10'",
  /** devices that ever sent a big moment to a friend */
  share: "SELECT COUNT(*) AS n FROM steps WHERE step = 'share_tap'",
  /** devices that took a first daily gift, reached a full week, reached thirty days: one row per mark */
  daily: "SELECT step, COUNT(*) AS n FROM steps WHERE step IN ('daily_1', 'daily_7', 'daily_30') GROUP BY step ORDER BY step",
  /** the move to the new address: offered, sent, arrived by window, arrived by file or code, any sitting there: one row per mark */
  xfer: "SELECT step, COUNT(*) AS n FROM steps WHERE step IN ('xfer_offer', 'xfer_sent', 'xfer_in', 'xfer_code', 'site_new') GROUP BY step ORDER BY step",
};

/** the error kinds the game may report; anything else is dropped */
const ERROR_NAMES = new Set(['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'other']);

/** the most a single post may carry, so one caller cannot fill the table */
const MAX_BATCH = 120;
/** ids are made by the game and are short; anything longer is not one of ours */
const MAX_ID = 40;

function cors(origin: string | null): Record<string, string> {
  return {
    'access-control-allow-origin': origin ?? '*',
    'access-control-allow-methods': 'POST, GET, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
  };
}

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...cors(origin) },
  });

/** YYYY-MM-DD, worked out here rather than trusted from a device clock */
function today(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

type Incoming = { a?: unknown; s?: unknown; k?: unknown; t?: unknown; w?: unknown; n?: unknown };

/**
 * An event, or nothing. The only shape that reaches the database.
 *
 * A crash carries two extra values and both are closed lists: the step it
 * happened on, and the class of error. Neither can be free text, which is
 * what keeps a name a player typed from ever having a way in here.
 */
function clean(e: Incoming, now: number): { aid: string; sid: string; step: string; ts: number; where: string; err: string } | null {
  const aid = typeof e.a === 'string' ? e.a.slice(0, MAX_ID) : '';
  const sid = typeof e.s === 'string' ? e.s.slice(0, MAX_ID) : '';
  const step = typeof e.k === 'string' ? e.k : '';
  if (!aid || !sid || !(KNOWN.has(step) || MILESTONE.test(step) || step === 'crash')) return null;
  const where = typeof e.w === 'string' && (KNOWN.has(e.w) || e.w === 'none') ? e.w : 'none';
  const err = typeof e.n === 'string' && ERROR_NAMES.has(e.n) ? e.n : 'other';
  // a device clock can be anything at all, so it is only trusted to be a
  // number and never to be right: far past lands on arrival, and so does any
  // future, so `ts` is never later than the row's arrival and the year of
  // RETAIN_MS is counted from no later than the day it came (29.10)
  const raw = typeof e.t === 'number' && Number.isFinite(e.t) ? e.t : now;
  const ts = raw > now || now - raw > 1000 * 60 * 60 * 24 * 30 ? now : Math.round(raw);
  return { aid, sid, step, ts, where, err };
}

export default {
  /** once a day (wrangler.toml [triggers]): rows older than RETAIN_MS are deleted */
  async scheduled(_event: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<void> {
    ctx.waitUntil(purgeOld(env.DB, Date.now()));
  },

  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const origin = req.headers.get('origin');

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });

    if (req.method === 'POST' && (url.pathname === '/' || url.pathname === '/e')) {
      let body: { e?: Incoming[] };
      try { body = await req.json(); } catch { return json({ ok: false }, 400, origin); }
      const list = Array.isArray(body?.e) ? body.e.slice(0, MAX_BATCH) : [];
      const now = Date.now();
      const rows = list.map(e => clean(e, now)).filter((x): x is NonNullable<typeof x> => x !== null);
      if (!rows.length) return json({ ok: true, n: 0 }, 200, origin);

      const stmts = [
        // a step counts once per device, whatever the network did
        ...rows.filter(r => r.step !== 'crash').map(r => env.DB
          .prepare('INSERT OR IGNORE INTO steps (aid, step, ts, day) VALUES (?, ?, ?, ?)')
          .bind(r.aid, r.step, r.ts, today(r.ts))),
        // a crash is not deduped: three crashes matter more than one
        ...rows.filter(r => r.step === 'crash').map(r => env.DB
          .prepare('INSERT INTO crashes (aid, sid, ts, day, where_step, err) VALUES (?, ?, ?, ?, ?, ?)')
          .bind(r.aid, r.sid, r.ts, today(r.ts), r.where, r.err)),
        // a sitting counts once, and only an open starts one
        ...rows.filter(r => r.step === 'open').map(r => env.DB
          .prepare('INSERT OR IGNORE INTO sessions (sid, aid, ts, day) VALUES (?, ?, ?, ?)')
          .bind(r.sid, r.aid, r.ts, today(r.ts))),
      ];
      try { await env.DB.batch(stmts); } catch { return json({ ok: false }, 500, origin); }
      return json({ ok: true, n: rows.length }, 200, origin);
    }

    if (req.method === 'GET' && url.pathname === '/stats') {
      const key = url.searchParams.get('key') ?? '';
      // constant work whatever the key, so a wrong one cannot be narrowed down
      // by how long the answer took
      if (!env.ADMIN_KEY || !safeEqual(key, env.ADMIN_KEY)) {
        return json({ ok: false }, 401, origin);
      }
      const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days') ?? 30)));
      const since = today(Date.now() - days * 86400000);

      const [funnel, totals, daily, returning, crashes, grid, ever, best, seasons, titles, europe, gift, share, dailyGift, xferRows] = await Promise.all([
        env.DB.prepare('SELECT step, COUNT(*) AS n FROM steps GROUP BY step').all(),
        env.DB.prepare(
          'SELECT (SELECT COUNT(DISTINCT aid) FROM sessions) AS people,' +
          ' (SELECT COUNT(*) FROM sessions) AS sittings'
        ).all(),
        env.DB.prepare(
          'SELECT day, COUNT(DISTINCT aid) AS people, COUNT(*) AS sittings' +
          ' FROM sessions WHERE day >= ? GROUP BY day ORDER BY day'
        ).bind(since).all(),
        // people who opened it on more than one day, which is the only
        // retention number worth reading this early
        env.DB.prepare(
          'SELECT COUNT(*) AS n FROM (SELECT aid FROM sessions GROUP BY aid HAVING COUNT(DISTINCT day) > 1)'
        ).all(),
        // where it broke, and on how many different phones, which is the
        // difference between one unlucky device and a real fault
        env.DB.prepare(
          'SELECT where_step AS step, err, COUNT(*) AS n, COUNT(DISTINCT aid) AS people' +
          ' FROM crashes GROUP BY where_step, err ORDER BY n DESC LIMIT 12'
        ).all(),
        env.DB.prepare(REACH_SQL.grid).all(),
        env.DB.prepare(REACH_SQL.ever).all(),
        env.DB.prepare(REACH_SQL.best).all(),
        env.DB.prepare(REACH_SQL.seasons).all(),
        env.DB.prepare(REACH_SQL.titles).all(),
        env.DB.prepare(REACH_SQL.europe).all(),
        env.DB.prepare(REACH_SQL.gift).all(),
        env.DB.prepare(REACH_SQL.share).all(),
        env.DB.prepare(REACH_SQL.daily).all(),
        env.DB.prepare(REACH_SQL.xfer).all(),
      ]);

      const counts: Record<string, number> = {};
      for (const r of funnel.results as { step: string; n: number }[]) counts[r.step] = r.n;

      return json({
        ok: true,
        steps: STEPS,
        funnel: STEPS.map(s => ({ step: s, n: counts[s] ?? 0 })),
        people: (totals.results[0] as { people: number })?.people ?? 0,
        sittings: (totals.results[0] as { sittings: number })?.sittings ?? 0,
        returned: (returning.results[0] as { n: number })?.n ?? 0,
        daily: daily.results,
        crashes: crashes.results,
        // where careers get to, from the milestones: empty until the game that reports them is out
        reach: { grid: grid.results, ever: ever.results, best: best.results, seasons: seasons.results, titles: titles.results, europe: europe.results, gift: gift.results, share: share.results, daily: dailyGift.results, xfer: xferRows.results },
      }, 200, origin);
    }

    return json({ ok: false }, 404, origin);
  },
};

/** Compare without giving away where two keys first differ. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
