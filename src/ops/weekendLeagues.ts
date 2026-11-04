/**
 * Per-league detail of the weekend league (draft 4.11): from `ext.weekendLeagues`, which only the Worker draft
 * dashboard_weekend_leagues_worker.patch adds (not live, needs Itzik's approval). League names, friend codes, club
 * names, tables and results; never a device id. Pure: no page, no network.
 */
import type { StatsRaw } from './model.ts';
import type { Kind, Status } from './weekend.ts';

export interface TableRow { club: string; played: number; wins: number; losses: number; gf: number; ga: number; points: number; assistant: number }
export interface MatchRaw { home: string; away: string; started: boolean; result: { score: [number, number]; shootout: [number, number] | null; winner: 'home' | 'away' | null; technical: 'home' | 'away' | null; homeAssistant: boolean; awayAssistant: boolean } | null }
export interface RoundRaw { index: number; at: number; bye: string | null; matches: MatchRaw[] }
export interface LeagueDetail { kind: Kind; status: Status; name: string; code: string | null; members: number; capacity: number; table: TableRow[]; rounds: RoundRaw[] }
export interface LeaguesView {
  state: 'not-yet' | 'ok';
  leagues: (LeagueDetail & { label: string; roundsDone: number; current: RoundRaw | null })[];
  total: number;
}

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

export function buildLeagues(raw: StatsRaw): LeaguesView {
  const x = (raw.ext as Record<string, unknown> | undefined)?.weekendLeagues;
  if (!isObj(x) || x.v !== 1 || !Array.isArray(x.leagues)) return { state: 'not-yet', leagues: [], total: 0 };
  const n = { friend: 0, open: 0 };
  const leagues = (x.leagues as LeagueDetail[])
    .slice()
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'friend' ? -1 : 1) || b.members - a.members)
    .map(l => {
      const i = ++n[l.kind];
      const rounds = Array.isArray(l.rounds) ? l.rounds : [];
      const roundsDone = rounds.filter(r => r.matches.length > 0 && r.matches.every(m => m.result)).length;
      const current = rounds.find(r => r.matches.some(m => !m.result)) ?? null;
      return { ...l, table: Array.isArray(l.table) ? l.table : [], rounds, label: l.name || `${l.kind === 'friend' ? 'חברים' : 'פתוחה'} ${i}`, roundsDone, current };
    });
  return { state: 'ok', leagues, total: typeof x.total === 'number' ? x.total : leagues.length };
}

export function scoreText(m: MatchRaw): string {
  if (!m.result) return m.started ? 'משחקים עכשיו' : 'טרם שוחק';
  const [h, a] = m.result.score;
  const so = m.result.shootout ? ` (פנדלים ${m.result.shootout[0]}:${m.result.shootout[1]})` : '';
  const tech = m.result.technical ? ' · טכני' : '';
  return `${h}:${a}${so}${tech}`;
}
