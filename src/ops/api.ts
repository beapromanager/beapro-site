/**
 * The one door to the numbers: GET https://beapro-count.beapromanager.workers.dev/stats, the endpoint that is live today.
 *
 * The key is typed by the owner into the form and held in this module's memory only: never in localStorage, sessionStorage,
 * a cookie, the address bar or the bundle. It is sent to that one address and nowhere else, with cache 'no-store', no
 * cookies and no referrer. A reload, "צא", a wrong key or thirty idle minutes forget it.
 *
 * How it is sent: first in an `Authorization: Bearer` header. The Worker that is live on 2.11 does not allow that header
 * (its CORS answer names only content-type), so the browser refuses before anything is sent and we fall back to
 * `?key=` in the query, which is exactly how the in-game admin screen has always asked. Once the additive Worker patch
 * (dashboard_worker.patch) is deployed the header works and the key leaves the URL by itself. The choice is remembered in
 * memory for the sitting, so the failed try costs one preflight once.
 */
import type { StatsRaw } from './model.ts';

export const STATS_URL = 'https://beapro-count.beapromanager.workers.dev/stats';

let key = '';
let mode: 'header' | 'query' | null = null;

export const setKey = (k: string): void => { key = k.trim(); };
export const clearKey = (): void => { key = ''; mode = null; };
export const hasKey = (): boolean => key !== '';
/** for the checks: how the key went the last time (null before the first answer) */
export const sentAs = (): 'header' | 'query' | null => mode;

export type Result =
  | { kind: 'ok'; data: StatsRaw; at: number }
  | { kind: 'unauthorized' }
  | { kind: 'rate' }
  | { kind: 'down' };

const INIT: RequestInit = { method: 'GET', cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error' };

async function ask(days: number, how: 'header' | 'query'): Promise<Response> {
  const u = new URL(STATS_URL);
  u.searchParams.set('days', String(days));
  if (how === 'query') {
    u.searchParams.set('key', key);
    return fetch(u.href, INIT);
  }
  return fetch(u.href, { ...INIT, headers: { authorization: `Bearer ${key}` } });
}

export async function getStats(days: number): Promise<Result> {
  if (!key) return { kind: 'unauthorized' };
  const d = Math.min(90, Math.max(1, Math.round(days) || 30));
  let res: Response | null = null;
  const order: ('header' | 'query')[] = mode ? [mode] : ['header', 'query'];
  for (const how of order) {
    try {
      res = await ask(d, how);
      // An old Worker reads only ?key=, so a header it cannot see answers 401 even with the right key (when CORS ever
      // lets it through). Only a 401 to the query form means the key is wrong.
      if (res.status === 401 && how === 'header' && order.length > 1) { res = null; continue; }
      mode = how;
      break;
    } catch {
      res = null;            // refused by CORS (old Worker) or no network: try the next way, if any
    }
  }
  if (!res) return { kind: 'down' };
  if (res.status === 401 || res.status === 403) { mode = null; return { kind: 'unauthorized' }; }
  if (res.status === 429) return { kind: 'rate' };
  if (!res.ok) return { kind: 'down' };
  try {
    const data = await res.json() as StatsRaw;
    if (!data || data.ok !== true || !Array.isArray(data.funnel)) return { kind: 'down' };
    return { kind: 'ok', data, at: Date.now() };
  } catch { return { kind: 'down' }; }
}
