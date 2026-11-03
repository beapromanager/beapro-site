/**
 * Career persistence. Without this the game forgets you the moment the tab
 * closes, which is the fastest way to lose a player for good.
 *
 * The whole GameState is serialisable (plain data, no class instances), so a
 * straight JSON round trip is enough. The version field lets old saves be
 * rejected cleanly instead of crashing on a changed shape.
 */

import type { GameState, PlayerSeason } from './state.ts';
import { NO_REPORTS, repairStuckCup } from './state.ts';
import { STADIUM_START, FANS_START } from './career.ts';
import { GEMS_AT_START } from './packs.ts';
import { primePlayerIds } from '../data/squadGen.ts';
import { setDerbies } from '../data/clubs.ts';
import { localRival } from '../data/cities.ts';
import { newCoach } from './coach.ts';
import { emptyDaily } from './daily.ts';
import { emptyFixLog } from './fixing.ts';
import { emptyInvite } from './invite.ts';
import { emptyMate } from './mate.ts';
import { emptyScout } from './scout.ts';
import { DEFAULT_FORMATION } from '../data/formations.ts';
import { BRANDS, type BrandId } from '../data/sponsors.ts';
import { renameLegacy } from './renames.ts';

const KEY = 'beapro.career.v1';
const VERSION = 1;

export interface Envelope {
  version: number;
  savedAt: number;
  state: GameState;
}

export interface SaveSummary {
  clubName: string;
  managerName: string;
  week: number;
  rounds: number;
  savedAt: number;
}

export function saveCareer(state: GameState): void {
  // do not persist half finished onboarding, there is nothing to return to
  // (ob-prologue/ob-city already have no clubId, named here too so the guard says so explicitly)
  if (!state.clubId || state.phase === 'onboard-archetype' || state.phase === 'onboard-manager' || state.phase === 'onboard-club'
    || state.phase === 'ob-prologue' || state.phase === 'ob-city') return;
  // A sacked manager is NOT finished any more: the club across town calls on the
  // next screen, so the save is kept and closing the app mid sacking drops you
  // back on the letter rather than losing the career.
  try {
    const env: Envelope = { version: VERSION, savedAt: Date.now(), state };
    localStorage.setItem(KEY, JSON.stringify(env));
  } catch {
    /* storage full or blocked, the game keeps working in memory */
  }
}

/** the one rule for "is this text a career this build can open", shared with the transfer between the two addresses */
export function parseEnvelope(raw: string | null | undefined): Envelope | null {
  try {
    if (!raw) return null;
    const env = JSON.parse(raw) as Envelope;
    if (env?.version !== VERSION || !env.state?.clubId) return null;
    return env;
  } catch {
    return null;
  }
}

function readEnvelope(): Envelope | null {
  try {
    return parseEnvelope(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

/** a brand id the game still has, or the first brand: a save can name a brand that has since left the game */
const knownBrand = (b: unknown): BrandId => (BRANDS.some(x => x.id === b) ? (b as BrandId) : BRANDS[0].id);

export function loadCareer(): GameState | null {
  const env = readEnvelope();
  if (!env) return null;
  // a match in progress cannot be resumed mid minute, send them back to the hub
  // (and names that have since left the game are brought up to date first)
  const s = renameLegacy(env.state);
  // an index of every player still in the division, to backfill records that
  // predate name and club being stored on the season stat
  const playerById = new Map<string, { name: string; clubId: string }>();
  for (const [cid, sq] of Object.entries(s.league?.squads ?? {})) {
    for (const p of [...(sq.starters ?? []), ...(sq.bench ?? [])]) {
      playerById.set(p.id, { name: p.name, clubId: cid });
    }
  }
  // prime the id counter past every id in the save, so a pack pull or next
  // season's market never mints an id that collides with an existing player
  const allIds: string[] = [...playerById.keys(), ...(s.market ?? []).map(f => f.player.id)];
  primePlayerIds(allIds);
  // rebuild the geographic derby registry from the saved clubs' rivals, since
  // it is module state that does not survive a reload
  // One pair, worked out from the towns in the division rather than read off
  // whatever rivalIds the save happens to carry. A career saved before this
  // existed has a division full of clubs that were never given one, and this
  // hands it its local fight back on the spot instead of next summer.
  //
  // It only ever reads the clubs that are already there. It cannot put the
  // town's second club in, the way a new division can, because the fixture
  // list is already drawn and rewriting it would throw away the season the
  // manager is standing in the middle of.
  {
    const found = localRival(s.league?.clubs ?? [], s.clubId);
    setDerbies(found ? [[s.clubId, found.id]] : []);
  }
  // gracefully fill fields added in later versions so old saves keep working
  const patched: GameState = {
    ...s,
    // the formation arrived after this save format, default the old ones
    tactic: { ...s.tactic, formation: s.tactic?.formation ?? DEFAULT_FORMATION },
    // Careers saved before the meters were rounded carry values like
    // 76.36000000000001, so they are cleaned on the way in rather than left to
    // print themselves at the top of the screen forever.
    meters: {
      money: Math.round(s.meters?.money ?? 0),
      morale: Math.round(s.meters?.morale ?? 65),
      prestige: Math.round(s.meters?.prestige ?? 30),
      // the terrace arrived after these careers began: nobody has an opinion yet
      fans: Math.round(s.meters?.fans ?? FANS_START),
    },
    sacking: s.sacking ?? null,
    // a brand that is no longer in the game moves to the first brand, with the
    // same deal and the same terms (the kind, the price, the bonus, the crowd,
    // the season), and its run goes on from the season it began
    sponsor: s.sponsor ? {
      ...s.sponsor,
      brand: knownBrand((s.sponsor as { brand: unknown }).brand),
      since: s.sponsor.since ?? s.sponsor.season,
    } : null,
    nemesis: s.nemesis ?? null,
    ultimatumSeason: s.ultimatumSeason ?? null,
    crisisDone: s.crisisDone ?? false,
    purseEarlier: s.purseEarlier ?? 0,
    seasonDilemmas: s.seasonDilemmas ?? [],
    seasonChatEvents: s.seasonChatEvents ?? [],
    euro: s.euro ?? null,
    cup: s.cup ?? null,
    daily: s.daily ?? emptyDaily(),
    loyalGift: s.loyalGift ?? null,
    loans: s.loans ?? {},
    crisisReason: s.crisisReason ?? null,
    youth: s.youth ?? { players: [], graduated: [], ready: [] },
    chronicle: s.chronicle ?? [],
    chronicleSeen: s.chronicleSeen ?? 0,
    inbox: s.inbox ?? [],
    lastLedger: s.lastLedger ?? null,
    chat: s.chat ?? null,
    chatHistory: s.chatHistory ?? [],
    pressHistory: s.pressHistory ?? [],
    suspensions: s.suspensions ?? {},
    emergencyYouth: s.emergencyYouth ?? null,
    fix: s.fix ?? null,
    fixLog: s.fixLog ?? emptyFixLog(),
    youthPool: s.youthPool ?? [],
    youthStamp: s.youthStamp ?? 0,
    youthUp: s.youthUp ?? [],
    youthTripSeason: s.youthTripSeason ?? 0,
    // a sponsor's welcome still waiting in the queue under a brand that is gone is the first brand's now
    notices: (s.notices ?? []).map(n => (n.kind === 'sponsor' ? { ...n, brand: knownBrand((n as { brand: unknown }).brand) } : n)),
    exits: s.exits ?? [],
    sitOut: s.sitOut ?? {},
    sitOutNext: s.sitOutNext ?? {},
    matchMods: s.matchMods ?? {},
    followUps: s.followUps ?? [],
    youthBoost: s.youthBoost ?? [],
    youthLeaveRisk: s.youthLeaveRisk ?? null,
    summerExits: s.summerExits ?? [],
    arrivals: s.arrivals ?? [],
    // a career that started before the two of them existed simply has none
    friends: s.friends ?? [],
    mate: s.mate ?? emptyMate(),
    chatAnswers: s.chatAnswers ?? null,
    queued: s.queued ?? null,
    // anyone with a save from before the flag has been playing for a while
    tutorialSeen: s.tutorialSeen ?? true,
    seats: s.seats ?? null,
    careerStats: s.careerStats ?? {},
    // season records gained name, club and assists. Older saves have none, so
    // recover name and club from the live squads by the player's stable id,
    // otherwise the scoring charts filter the nameless records straight out.
    seasonStats: Object.fromEntries(Object.entries(s.seasonStats ?? {}).map(([id, v]) => {
      const r = v as Partial<PlayerSeason>;
      const at = playerById.get(id);
      return [id, {
        name: r.name || at?.name || '', clubId: r.clubId || at?.clubId || '',
        apps: r.apps ?? 0, goals: r.goals ?? 0, assists: r.assists ?? 0,
        lastGoalWeek: r.lastGoalWeek ?? 0,
      }];
    })),
    captainId: s.captainId ?? null,
    assistant: s.assistant ?? { hired: false, name: '', departed: false },
    season: s.season ?? 1,
    lastReport: s.lastReport ?? null,
    contracts: s.contracts ?? {},
    preWeek: s.preWeek ?? 0,
    preResolved: s.preResolved ?? [],
    fanHistory: s.fanHistory ?? [],
    stadium: s.stadium ?? { capacity: STADIUM_START, project: null },
    stadiumReveal: s.stadiumReveal ?? null,
    marketFocus: s.marketFocus ?? null,
    // a save from before packs existed starts with the opening grant
    gems: s.gems ?? GEMS_AT_START,
    adsWatched: s.adsWatched ?? 0,
    reports: s.reports ?? NO_REPORTS,
    pull: s.pull ?? null,
    /**
     * The gift, owed to every career that existed before it did.
     *
     * A player wrote in locked out of his own save behind his only keeper. The
     * rule that came out of it is that a squad never holds fewer than two, but
     * a rule only helps from here on: a manager already down to one is still
     * down to one. So every career from before carries a free pack with a
     * keeper in it, and the ABSENCE of this field is the record of not having
     * been given it yet. No flag and no date to keep in step.
     */
    gifts: s.gifts ?? 1,
    // a career from before the coach had a CV starts as an amateur on the
    // archetype it was saved with, which no longer exists, so newCoach falls
    // back to a sane default
    coach: s.coach ?? newCoach(s.profile?.type ?? 'mental'),
    // friends brought in, on a save from before there was anybody to bring
    invite: s.invite ?? emptyInvite(),
    inviteFrom: s.inviteFrom ?? null,
    summerMark: s.summerMark ?? null,
    // a career saved before there were season kits simply starts its wardrobe
    // at the next summer, and keeps the shirt it is already wearing until then
    wardrobe: s.wardrobe ?? [],
    kitReveal: s.kitReveal ?? null,
    // a career from before the scout has never hired one
    scout: { ...emptyScout(), ...(s.scout ?? {}) },
  };
  /**
   * A career saved before the manager had a standing has no record of what he
   * achieved, so it is reconstructed from what the save does know: the division
   * he is in is at least as high as any he has managed, and every season above
   * the bottom had to be climbed to. Better an honest floor than a manager who
   * won four divisions being told he is an unknown.
   */
  if (patched.coach) {
    const tier = patched.league?.clubs?.find(c => c.id === patched.clubId)?.tier ?? 1;
    patched.coach = {
      ...patched.coach,
      bestTier: patched.coach.bestTier ?? Math.max(1, tier),
      promotions: patched.coach.promotions ?? Math.max(0, tier - 1),
      titles: patched.coach.titles ?? 0,
    };
  }
  // A summer on an older build could push the reserve keeper into an outfield
  // slot when a starter retired, and the swap rule then kept him there. Put
  // him back on the bench for the first outfield man there, once, on the way in.
  const sq = patched.league?.squads?.[patched.clubId];
  if (sq) {
    const starters = [...sq.starters];
    const bench = [...sq.bench];
    let gks = starters.filter(p => p.position === 'GK').length;
    for (let i = starters.length - 1; i >= 0 && gks > 1; i--) {
      if (starters[i].position !== 'GK') continue;
      const j = bench.findIndex(p => p.position !== 'GK');
      if (j < 0) break;
      [starters[i], bench[j]] = [bench[j], starters[i]];
      gks--;
    }
    patched.league = { ...patched.league, squads: { ...patched.league.squads, [patched.clubId]: { ...sq, starters, bench } } };
  }
  // said out loud, once, on the way back to the hub. A pack nobody is told
  // about is a pack nobody opens
  if ((s as Partial<GameState>).gifts === undefined) {
    patched.notices = [...patched.notices, {
      kind: 'story',
      title: 'חבילת מתנה מחכה לך',
      body: 'לאחר שעברנו על פידבקים שלכם החלטנו לפנק בחבילה מתנה .',
      icon: 'glove',
    }];
  }

  // a staged champion's cup that was left waiting past the week it is played in: catch it up (24.10)
  const caught = repairStuckCup(patched);
  if (caught !== patched) { patched.cup = caught.cup; patched.notices = caught.notices; }

  if (patched.phase === 'match') return { ...patched, phase: 'hub' };
  // a European night closed mid-match is not written: the hub asks for it again.
  // a closed shootout is already paid for; the hub offers it again off euroPensDue
  if (patched.phase === 'euro-match' || patched.phase === 'euro-pens') return { ...patched, phase: 'hub' };
  // the draw is owed again until it was watched; the bracket is a room
  if (patched.phase === 'euro-draw' || patched.phase === 'euro-bracket') return { ...patched, phase: 'hub' };
  // the cup night closed mid-match, or mid-shootout, or standing on its draw or its bracket: all four go back to the
  // hub exactly like Europe's, which asks for them again off cupNight/cupPensDue/cupDrawDue
  if (patched.phase === 'cup-match' || patched.phase === 'cup-pens') return { ...patched, phase: 'hub' };
  if (patched.phase === 'cup-draw' || patched.phase === 'cup-bracket') return { ...patched, phase: 'hub' };
  // the crest card between the tactics and the dressing room is gone; a save
  // that was left standing on it opens on the board that followed it
  if (patched.phase === 'vs') return { ...patched, phase: 'teamsheet' };
  return patched;
}

export function savedSummary(): SaveSummary | null {
  return summaryOf(readEnvelope());
}

/** the title screen's few words about a career, from an envelope already read */
export function summaryOf(env: Envelope | null): SaveSummary | null {
  if (!env) return null;
  const s = renameLegacy(env.state);
  const club = s.league.clubs.find(c => c.id === s.clubId);
  return {
    clubName: club?.name ?? 'המועדון שלי',
    managerName: s.profile.name || 'המאמן',
    week: s.week,
    rounds: s.league.rounds,
    savedAt: env.savedAt,
  };
}

export function clearCareer(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
