import { weekendOutcome, weekendDate, emptyWeekend, type WeekendRecord, type WeekendPrizeInput } from './weekendPrize.ts';
export { weekendMoney, weekendMonthKey, WEEKEND_TRIPLE_GEMS, WEEKEND_FANS, type CabinetEntry } from './weekendPrize.ts';
import type { Club } from '../data/clubs.ts';
import { surnameOf } from '../data/names.ts';
import type { ManagerId, ManagerType } from '../data/managers.ts';
import { getManager } from '../data/managers.ts';
import type { Squad } from '../data/squadGen.ts';
import { playerValue, squadAvgOvr, nextPlayerId, makePlayer, makeSquad, NEUTRAL_TRAITS } from '../data/squadGen.ts';
import { rarityForOvr } from './cards.ts';
import { DAILY_LIVE, GOLD_EVERY, GOLD_LIFT, emptyDaily, dailyView, today as dailyDay, dailyPackFor } from './daily.ts';
import type { DailyState } from './daily.ts';
import { FACTORIES, describeFriendly } from '../data/friendly.ts';
import { moneyShort } from '../data/money.ts';
import {
  EURO_LIVE, euroEntry, drawEuro, nightFor, ROUND_NAMES, legsIn, strengthOf, recordMyLeg, needsPens, settleMyPens,
  serveBans, banFor, playAiRound, advanceRound, playOutWithoutMe, prizeFor, aggregate, myTie,
  euroWeeks, closeEuroSeason, euroVerdict, euroMarks, ROUND_IN,
  GATE_SHARE, TRAVEL, SECURITY,
} from './euro.ts';
import type { EuroState, EuroNight, EuroTie } from './euro.ts';
import { euroClub, asClub } from '../data/europeClubs.ts';
import { makeEuroName } from '../data/europeNames.ts';
import {
  CUP_LIVE, CUP_MIN_TIER, CUP_TIRED, CUP_INJURY_RISK, CUP_GATE_SHARE, CUP_TRAVEL,
  cupEntry, drawCup, nightFor as cupNightFor,
  strengthOf as cupStrengthOf, recordMyLeg as cupRecordMyLeg, needsPens as cupNeedsPens, settleMyPens as cupSettleMyPens,
  serveBans as cupServeBans, banFor as cupBanFor, playAiRound as cupPlayAiRound, advanceRound as cupAdvanceRound,
  playOutWithoutMe as cupPlayOutWithoutMe, stepAiRound as cupStepAiRound, prizeFor as cupPrizeFor, myTie as cupMyTieOf,
  cupWeeks, closeCupSeason, cupVerdict, cupMarks, isUpset, roundDone as cupRoundDone,
} from './cup.ts';
import type { CupState, CupNight, CupTie } from './cup.ts';
import type { FriendlyReport, FriendlyEvent } from '../data/friendly.ts';
import type { MatchResult, TeamInput, Approach, Press, Player, Position, Rng } from '../engine/matchEngine.ts';
import { simulateMatch, overall, createRng } from '../engine/matchEngine.ts';
import type { LeagueState, Fixture, Standing } from './league.ts';
import { initLeague, applyResult, sortedTable, buildFixtures, emptyTable } from './league.ts';
import { LEAGUE_C, isDerby, LEAGUE_NAMES, setDerbies, leagueCeiling } from '../data/clubs.ts';
import { buildRegionLeague, buildSiblingLeague, siblingClub, localRival, furthestFrom, isRealTown, LOCAL_KM, cityClubsForTier } from '../data/cities.ts';
import type { LocalKind, LocalRival } from '../data/cities.ts';
export type { LocalKind, LocalRival };
import { kitColor, type KitColorId } from '../data/palette.ts';
import { isLegend, isLegendClub, withLegend } from '../data/legends.ts';
import type { Friend, FriendSpec } from './friends.ts';
import {
  makeFriend, friendTrait, friendAfterSummer, shiftTo, isFriend, markFriendGone,
  storyFriendAfterSummer, STORY_CONTRACT_YEARS,
} from './friends.ts';
import type { MateMemory } from './mate.ts';
import { emptyMate, texterOf, pickMateTrigger, afterRound as mateAfterRound } from './mate.ts';
import type { MateAnswer, MateTrigger } from '../data/mateChats.ts';
import { mateThread, fillMate } from '../data/mateChats.ts';
import { seasonKit, firstKit, reasonFor } from '../data/seasonKit.ts';
import type { SeasonKit } from '../data/seasonKit.ts';
import type { KitPattern } from '../data/kits.ts';
import { debtState, debtLine, debtLimit } from './finance.ts';
import { emptyYouth, seedYouth, advanceYouth, outlook } from './youth.ts';
import type { Outlook } from './youth.ts';
import type { Youth } from './youth.ts';
import { emptyFixLog, FIX_LIVE, FIX_CAUGHT, FIX_TOP_TIER, FIX_ASKS_PER_LEAGUE, FIX_FIRST_WEEK, FIX_LAST_MARGIN, fixPayout } from './fixing.ts';
import type { FixDeal, FixLog } from './fixing.ts';
import { FIX_SITUATIONS, FIX_CLEAR_TEXT } from '../data/fixingText.ts';
import { promotionText, COACH } from '../data/academyText.ts';
import { makeForeignName, foreignCount, FOREIGN_MAX, isForeign } from '../data/foreignNames.ts';
import type { CoachNote } from '../data/academyText.ts';
import { YOUTH_V2, ACADEMY_MAX, TRIP_FEE, CALL_UPS_PER_ROUND, OWN_INTAKE, FREE_POT_CAP, routeOf, drawPool, makeYouthKid, foldMinutes, toNewRules, rangeOf, reachNow } from './academy.ts';
import type { YouthOffer } from './academy.ts';
import {
  emptyScout, scoutWindowKey, SCOUT_TIER, SCOUT_FEE, SCOUT_ROUNDS, SCOUT_TEXT, findKeen, arrivedKeen,
  pickSafe, safeFee, feeRange, scoutBudget, SAFE_NEAREST, SAFE_POTENTIAL, findOld, oldFee, starterAt,
} from './scout.ts';
import type { RivalKid } from './scout.ts';
import type { ScoutState, ScoutStyle } from './scout.ts';
export type { Youth };
import { sponsorOffers, signSponsor, sponsorRound, sponsorName } from './sponsor.ts';
import type { Sponsor, SponsorOffer, SponsorId } from './sponsor.ts';
export type { Sponsor, SponsorOffer, SponsorId };
export { sponsorName } from './sponsor.ts';
import { brandById, type BrandId } from '../data/sponsors.ts';
export { BRANDS, brandById } from '../data/sponsors.ts';
export type { BrandId, Brand } from '../data/sponsors.ts';
import type { DebtState } from './finance.ts';
export { debtLine };
export type { DebtState };
import { DEFAULT_FORMATION, formationForClub, formation, fillFormation, effectiveOverall } from '../data/formations.ts';
import { ADS_LIVE } from '../data/ads.ts';
import type { FormationId } from '../data/formations.ts';
import { MATE_TIERS, inTier } from '../data/leagueGate.ts';
import { TOP_MATE } from '../data/topFlightText.ts';
import { TEMPLATES, eligible, rollDilemma, templatesForTier } from '../data/dilemmas.ts';
import type { RolledDilemma, DilemmaEffect, Ctx as DilemmaCtx, Act, Who } from '../data/dilemmas.ts';
import { pickPressQuestion } from '../data/press.ts';
import {
  emptyInvite, myCode, deviceId, makeThanks, verifyThanks, addClaim, claimsThisSeason,
  GEMS_PER_FRIEND, GEMS_FOR_JOINING, ROUNDS_TO_COUNT,
} from './invite.ts';
import type { InviteState } from './invite.ts';
import { pickPressQuestions } from '../data/pressFacts.ts';
import { matchFacts } from '../data/matchFacts.ts';
import { pickTrigger, rollChat } from '../data/chats.ts';
import { fansAfterResult, fansDrift, fansAfterSeason, crowdMultiplier, FANS_STAR_SOLD } from './fans.ts';
import type { ChatTrigger } from '../data/chats.ts';
import type { RolledChat } from '../data/chats.ts';
import { fanMessage } from '../data/fans.ts';
import type { Post, FeedContext } from '../data/feed.ts';
import { buildFeed } from '../data/feed.ts';
import type { FanContext, FanMessage, FanTiming } from '../data/fans.ts';
import type { Outlet, PressQuestion, PressContext } from '../data/press.ts';
import type { FreeAgent } from './transfers.ts';
import { makeMarket, refreshMarket, settleMarket, windowState, sellPrice, transferFee, contractTerms, MIN_SQUAD, MAX_SQUAD, MIN_KEEPERS } from './transfers.ts';
import {
  PRE_ROUNDS, seedContract, contractYears, renewTerms, raiseBonus,
  starTarget, starFee, feeSweetener, youngTarget,
} from './preseason.ts';
import type { ChronicleEntry } from './chronicle.ts';
// type only, the same way chronicle.ts reaches for it: no runtime dependency
// on the interface from the game logic
import type { IconName } from '../ui/components/Icon.tsx';
import { chronicleAfterRound, chronicleAtSeasonEnd } from './chronicle.ts';
import type { SeasonReport } from './career.ts';
import {
  buildNextSeason, matchPrize, roundCosts, fillWithYouth, TOP_TIER, playerWage, potentialOf, wageBill,
  STADIUM_START, FANS_START, requiredCapacity, stadiumImageTier, gateIncome, crowdDemand, signageRound, expansionOptions,
  purseInstalment, seasonPurse, SECURITY_HOME,
} from './career.ts';
import type { RoundCosts, ExpansionOption } from './career.ts';
import type { Coach } from './coach.ts';
import {
  newCoach, coachChemistry, coachAttBias, coachDefBias,
  coachMoraleBias, coachYouthGrowth, qualifiedFor, requiredLicence,
  licence, applyCourse, coachFitnessBonus, coachCardBias, nextLicence, licenceRank,
} from './coach.ts';
import type { PackPull, PackId } from './packs.ts';
import {
  openPack, pullOf, packById, GEMS_AT_START, GEMS_PER_AD, GEMS_ON_PROMOTION, adFreeGems,
  ADS_PER_SEASON, PACK_CONTRACT_YEARS,
} from './packs.ts';

export type Phase =
  | 'onboard-archetype' | 'onboard-manager' | 'onboard-club' | 'signing' | 'friends' | 'squad' | 'hub' | 'transfers' | 'invite'
  | 'dilemma' | 'tactic' | 'vs' | 'teamsheet' | 'match' | 'result' | 'press' | 'season-end' | 'chronicle'
  | 'captain' | 'assistant' | 'coach' | 'preseason' | 'preseason-market' | 'inbox' | 'chat' | 'table' | 'stadium'
  | 'packs' | 'sacked' | 'sponsor' | 'ultimatum' | 'rescue' | 'youth' | 'kit' | 'scout' | 'youth-decision' | 'fix-verdict'
  /* the midweek match with the works team, told after the sheet is sent */
  | 'friendly'
  /* the European night, played live before the week's league round, and its shootout when the tie is level */
  | 'euro-match' | 'euro-pens'
  /* the draw from his seat, once a season, and the competition as it stands */
  | 'euro-draw' | 'euro-bracket'
  /* גביע המדינה: the same shape as Europe's, one knockout leg at a time */
  | 'cup-match' | 'cup-pens'
  | 'cup-draw' | 'cup-bracket'
  /* ONBOARD_V2 (plan T1): the rebuilt first run, behind the flag in onboardV2.ts */
  | 'ob-prologue' | 'ob-city' | 'ob-names';

export type MarketLine = 'gk' | 'def' | 'mid' | 'atk';

/**
 * The fourth meter is the terrace: what the town's own crowd makes of him,
 * as against prestige, which is what the trade makes of him. It starts in
 * the middle, because a new manager is neither loved nor hated yet, and for
 * now only what he says into a microphone moves it.
 */
export interface Meters { money: number; morale: number; prestige: number; fans: number; }

/** Faults reported and thanked, per season. Lives here so report.ts can lean on the state without a cycle. */
export interface ReportLog { season: number; count: number; }
export const NO_REPORTS: ReportLog = { season: 0, count: 0 };

/**
 * The club that sacked you, pinned to the division it was in.
 *
 * It does not move while you are gone. You drop a level, take the other club in
 * the same town, and if you climb back you walk into the same league as the
 * people who let you go, with the derby already written. That is the whole point
 * of being sacked here: it is not an ending, it is the start of the grudge.
 */
export interface Nemesis {
  clubId: string;
  name: string;
  short: string;
  city: string;
  /** the division they stay in until you get back to it */
  tier: number;
  season: number;
}

/** The day it ended, kept so the letter can say what actually happened. */
export interface Sacking {
  /** debt: the owner could not carry it. fixing: a match was sold and the federation closed the club (fixing.ts) */
  reason: 'debt' | 'fixing';
  debt: number;
  limit: number;
  week: number;
  season: number;
  league: string;
  /** who let you go, kept whole so the club across town can be found */
  clubId: string;
  club: string;
  short: string;
  city: string;
  tier: number;
  position: number;
  teams: number;
}

/** The home ground and any expansion currently under construction. */
export interface StadiumProject { label: string; addSeats: number; roundsLeft: number; total: number; }
export interface Stadium { capacity: number; project: StadiumProject | null; }
/** A just finished build, to unveil the new ground on the result screen. */
export interface StadiumReveal { image: number; capacity: number; addSeats: number; upgraded: boolean; }

/** What the round earned and what it cost to run. */
export interface RoundLedger extends RoundCosts {
  prize: number; gate: number; sponsor: number; signage: number; net: number;
  /** this round's share of the season's guaranteed purse. Absent on a ledger saved before the purse was paid in rounds */
  purse?: number;
}
export interface Tactic { approach: Approach; press: Press; formation: FormationId; }

/** Something the manager must be told on the way back to the hub. */
export type SquadNotice =
  | { kind: 'suspended'; playerId: string; name: string; rival: string; needYouth: boolean }
  | { kind: 'youth_back'; name: string }
  | { kind: 'window'; weeks: number }
  | { kind: 'story'; title: string; body: string; icon?: IconName }
  /** the brand that just took the shirt, with the shirt */
  | { kind: 'sponsor'; brand: BrandId }
  /** the scout is back, three rounds after he was sent */
  | { kind: 'scout' };

/** A man of yours who went to another club in the league. */
export interface PlayerExit {
  id: string;
  name: string;
  clubId: string;
  season: number;
  week: number;
}

/** What a pre match answer changed about the match. Cleared when the week ends. */
export interface MatchMods {
  /** condition for this match only, by player id */
  fitness?: Record<string, number>;
  /** chance a man sits the round after, by player id */
  injury?: Record<string, number>;
  /** both sides slower and sloppier */
  mud?: boolean;
  /** gate money multiplier */
  gate?: number;
  /** the owner's boy, coming on at half time */
  guest?: Player | null;
  /** the terrace was promised a result */
  promiseWin?: boolean;
  /** a man promised a place in the eleven, by the manager's own word */
  promised?: { id: string; name: string };
  /** the phone will buzz about what he said this week, after the match */
  chatAfter?: { trigger: ChatTrigger; onlyIfWon?: boolean };
  /** a bonus promised to the squad, paid out of the purse only on a win */
  winBonus?: number;
  /** the works team's friendly: agreed this week, played when the sheet goes in, paid when the popup closes */
  friendly?: { factory: string; fee: number; report?: FriendlyReport };
}

/** What breaking a promise to a player costs the dressing room. */
export const BROKEN_PROMISE_MORALE = -8;

/**
 * And what selling the man you swore you never would costs.
 *
 * Worse than a broken place in the eleven, because that promise was for one
 * match and this one had no expiry date: he asked after you had already sold
 * his friend, and you said never. There is no undoing it either, which is why
 * it is also the only one that goes in the chronicle by name.
 */
export const BROKEN_WORD_MORALE = -16;

/** A word that comes back to the hub in a few weeks. */
export interface FollowUp {
  season: number;
  week: number;
  title: string;
  body: string;
}

export interface RoundResult { homeId: string; awayId: string; hg: number; ag: number; }

export interface ManagerProfile {
  name: string;
  nickname: string;
  age: number;
  type: ManagerId;
}

/**
 * Who you turn out to be. Nobody picks this at the start, it is counted from
 * the choices you actually make: backing the dressing room, playing the media,
 * or protecting the budget. That makes the identity yours rather than a menu.
 */
/**
 * A player's current season. Kept for EVERY player in the division, not just
 * your squad, because a golden boot race with only your own strikers in it is
 * not a race. Name and club are stored on the record so the charts render even
 * after a player moves or retires.
 */
export interface PlayerSeason {
  name: string;
  clubId: string;
  apps: number;
  goals: number;
  assists: number;
  lastGoalWeek: number;   // 0 = never scored this season
  /** minutes in a friendly: they quiet the forgotten man's complaint but are no league appearance */
  friendlyApps?: number;
}

/** One finished season on a player's record, so a card can show a history. */
export interface CareerSeason {
  season: number;
  tier: number;
  clubShort: string;
  apps: number;
  goals: number;
  assists: number;
}

const blankSeason = (name = '', clubId = ''): PlayerSeason =>
  ({ name, clubId, apps: 0, goals: 0, assists: 0, lastGoalWeek: 0 });

export interface ManagerStyle {
  players: number;   // sided with the squad
  media: number;     // played the press and the standing
  money: number;     // guarded the wallet
}

export function styleTitle(style: ManagerStyle): { title: string; note: string } {
  const { players, media, money } = style;
  const total = players + media + money;
  if (total < 4) return { title: 'מאמן חדש', note: 'עוד לא הספיקו להכיר אותך' };
  const top = Math.max(players, media, money);
  if (top === players) return { title: 'איש של השחקנים', note: 'בחדר ההלבשה הולכים אחריך באש ובמים' };
  if (top === media) return { title: 'איש התקשורת', note: 'אתה יודע לשחק את המשחק גם מחוץ למגרש' };
  return { title: 'מנהל עם ראש על הכתפיים', note: 'לא זורק שקל, והבעלים מעריך את זה' };
}

export interface GameState {
  /** which set of renamed names this save has been brought up to (see game/renames.ts) */
  namesVersion?: number;
  phase: Phase;
  /**
   * The rebuilt first run's own bookkeeping (onboardV2.ts, plan T1). Absent on
   * every save written before it, and on any career started with the flag off:
   * the field is optional precisely so the loader never has to invent one.
   */
  obV2?: { choice: 'bench' | 'bottle' | null; namesDue: boolean; deferred: { kit: boolean; arch: boolean; market: boolean }; t0: number };
  seasonSeed: number;
  clubId: string;
  profile: ManagerProfile;
  meters: Meters;
  tactic: Tactic;
  week: number;
  league: LeagueState;
  market: FreeAgent[];
  /** the position line the market opens filtered to, when reached from a gap */
  marketFocus: MarketLine | null;
  dilemma: RolledDilemma | null;
  dilemmaHistory: string[];
  /** a talk booked by an answer, for a coming week */
  queued: { id: string; week: number } | null;
  /** messages that can wait, read from the hub whenever you like */
  inbox: RolledDilemma[];
  /** questions already asked THIS season, for the ones allowed only once in it */
  seasonDilemmas: string[];
  /** the season nights the phone already rang for: clinched, crowned, sealed */
  seasonChatEvents: string[];
  /** ליגת אירופה this season, when the title opened the door; null otherwise */
  euro: EuroState | null;
  /** גביע המדינה this season, drawn every summer a club lands in tier 4 or 5; null otherwise */
  cup: CupState | null;
  /** the loyalty gift past ten seasons: null until it is shown, then the season and the man it brought */
  loyalGift: { season: number; playerId: string | null } | null;
  /** men here on loan, by the league rounds they have left */
  loans: Record<string, number>;
  /** the daily gift: the run, the last day taken, the last day a round was played */
  daily: DailyState;
  /** the money in and out of the round just played, shown on the result screen */
  lastLedger: RoundLedger | null;
  /** what the season's purse has already paid round by round, so the summer pays only the rest */
  purseEarlier: number;
  /** the conversation waiting on the phone after a week worth talking about */
  chat: RolledChat | null;
  /** when the phone is his, the three things you can write back */
  chatAnswers: { answers: MateAnswer[]; mateId: string; trigger: MateTrigger } | null;
  chatHistory: string[];
  /** press question ids asked lately, so the reporter does not repeat himself */
  pressHistory: string[];
  /**
   * Who sits out. A red card puts a man here as PENDING (-1) during the round
   * it happened in; the end of that week turns it into the one round he misses,
   * and the end of that round clears it. No week arithmetic, so a red in the
   * last round carries cleanly into the first round of next season.
   */
  suspensions: Record<string, number>;
  /**
   * A youth registered for one round so the team sheet has sixteen eligible
   * names. He is on the list and never on the pitch, and he goes back down
   * the moment the round is over.
   */
  emergencyYouth: string | null;
  /**
   * The academy v2 (academy.ts): the boys on offer, the stamp of the half season they were drawn for, the boys registered
   * to this round's match day squad, and the season the scout's trip was taken. A registered boy sits in the squad for
   * the round, is not counted in the sixteen to twenty, and goes back down when the week ends.
   */
  /** a request to lose a match, agreed and waiting for the match or the verdict, and what has been asked so far (fixing.ts) */
  fix: FixDeal | null;
  fixLog: FixLog;
  /** the weekend league's prizes already in this career (by nonce), and how many weekends it won. Absent on saves from before */
  /** the neighbourhood league in this career: prizes taken (by nonce), titles, the months, the cabinet (weekendPrize.ts) */
  weekend?: WeekendRecord;
  youthPool: YouthOffer[];
  youthStamp: number;
  youthUp: string[];
  youthTripSeason: number;
  /** what the manager has to be told before he sees the hub again */
  notices: SquadNotice[];
  /** men sold to clubs in this league, so the story can follow them */
  exits: PlayerExit[];
  /** men out of this round by the manager's own decision, id to the chip that says why */
  sitOut: Record<string, string>;
  /** the same, owed for the round after (an injury risk that came in) */
  sitOutNext: Record<string, string>;
  /** what this round's answers changed about the match itself */
  matchMods: MatchMods;
  /** words that come back to the hub later */
  followUps: FollowUp[];
  /** academy kids training with the seniors, boosted in the summer */
  youthBoost: string[];
  /** the academy kid who may walk in the summer, and how likely */
  youthLeaveRisk: { name: string; p: number } | null;
  /** men who agreed to stay until the summer, and then go */
  summerExits: string[];
  /** who joined this season, latest last, so "the new man" is a real man */
  arrivals: string[];
  /**
   * The two he brought with him. They are ordinary players in every squad
   * function; this is only what the game has to remember about them that the
   * player object does not carry: which quality they were given, and which of
   * the two is the one who never stops texting.
   */
  friends: Friend[];
  /** what has to be carried between rounds for the friend's phone to work */
  mate: MateMemory;
  /**
   * The first-week explainer has been read. A flag in the save rather than a
   * moment in the UI: it used to fire off the step that led to the hub, and
   * the day a sponsor screen was put between the summer and the hub it never
   * fired again. The hub itself now asks, and a refresh mid-explainer does
   * not lose it.
   */
  tutorialSeen: boolean;
  /**
   * Who the manager put in which shirt, eleven ids in the formation's slot
   * order, or null when he has not arranged anything. It is a preference laid
   * over the automatic seating, not the seating itself: a sale, a ban, a new
   * season change the eleven and the pins that still apply still apply. A new
   * formation clears it.
   */
  seats: string[] | null;
  pendingOutcome: string | null;
  lastPlayerMatch: MatchResult | null;
  lastRound: RoundResult[];
  /** the question on screen, plus whatever the reporter still has waiting.
   *  q is kept as the current one so a save written before the second question
   *  existed still opens on a valid press room. */
  press: {
    outlet: Outlet; q: PressQuestion; queue?: PressQuestion[];
    /** the answer given to the question on screen, once it has been given */
    answered?: number;
    /** the meters as they stood before that answer, so the room can show what it did */
    before?: { morale: number; prestige: number; fans?: number };
  } | null;
  /** set the moment the owner ends it, and never cleared: the career is over */
  sacking: Sacking | null;
  /** the shirt deal for this season, re-negotiated every summer */
  sponsor: Sponsor | null;
  /** the club that let you go, waiting a division above until you climb back */
  nemesis: Nemesis | null;
  /** the season the owner delivered his ultimatum, so it is delivered once */
  ultimatumSeason: number | null;
  /** the club's money has already collapsed once, and it only happens once */
  crisisDone: boolean;
  /** what actually happened to the money, for the owner to explain */
  crisisReason: string | null;
  /** the youth academy: 16-18 year olds training toward the senior squad */
  youth: Youth;
  style: ManagerStyle;
  /** per player season record for the whole division, drives the charts */
  seasonStats: Record<string, PlayerSeason>;
  /** finished seasons per player, so you can read a career off a card */
  careerStats: Record<string, CareerSeason[]>;
  form: ('W' | 'D' | 'L')[];   // most recent last
  seasonOver: boolean;
  /** Autobiography that writes itself, see chronicle.ts */
  chronicle: ChronicleEntry[];
  /** How many chronicle entries the manager has already looked at */
  chronicleSeen: number;
  /** recently shown fan line ids, so the terrace does not repeat itself */
  fanHistory: string[];
  /** which season of the career this is, 1 based */
  season: number;
  /** what happened last time the season rolled over, drives the summary screen */
  lastReport: SeasonReport | null;
  /** the armband. null means fall back to the highest ranked candidate */
  captainId: string | null;
  /** the assistant coach, all heart and no clue, see below */
  assistant: Assistant;
  /** the home ground, which grows with the club across seasons */
  stadium: Stadium;
  /** set the round a build opens, drives the unveil on the result screen */
  stadiumReveal: StadiumReveal | null;
  /** years left on each of my players' contracts, defaulted from a hash */
  contracts: Record<string, number>;
  /** which summer round we are on, 1..3, or 0 when the league is running */
  preWeek: number;
  /** pre season events already handled, so a saga does not reappear */
  preResolved: string[];
  /** premium currency for packs. Never convertible from shekels, see packs.ts */
  gems: number;
  /** ads watched for gems this season, capped at ADS_PER_SEASON */
  adsWatched: number;
  /** faults reported this season, for the thank you's cap. See report.ts */
  reports: ReportLog;
  /** friends brought in, and who brought me */
  invite: InviteState;
  /** the screen to return to when the invite sheet closes */
  inviteFrom: Phase | null;
  /** what the club looked like when this summer round opened, so the game can
   *  tell a manager who is about to skip a round he has not used */
  summerMark: string | null;
  /** every shirt this career has worn, newest last. A career you can read */
  wardrobe: SeasonKit[];
  /** the shirt waiting to be unveiled, cleared once he has seen it */
  kitReveal: SeasonKit | null;
  /** the card just pulled from a pack, waiting to be signed or sold */
  pull: PackPull | null;
  /**
   * Packs owed to the manager rather than bought by him.
   *
   * Undefined in a save written before this existed, and the loader reads that
   * absence as "this career has not been given its one yet", which is how
   * everybody already playing gets theirs exactly once. See save.ts.
   */
  gifts: number;
  /** the manager's own career: his abilities, his badge, his seasons */
  coach: Coach;
  /** the scout: one hired a season, three rounds away, back with a name */
  scout: ScoutState;
}

/**
 * The assistant coach. He loves football more than anyone and understands it
 * less than the tea lady. His whole job is to agree with the manager and repeat
 * the question back as if it were an answer. He never actually helps, and the
 * day the club reaches ליגה א' he leaves to manage a team of his own.
 */
export interface Assistant {
  hired: boolean;
  name: string;
  departed: boolean;
}

/** Tier at which the assistant graduates to a manager and leaves. */
export const ASSISTANT_LEAVES_TIER = 3;   // ליגה א'

const ASSISTANT_NAMES = ['שוקי', 'בוזי', 'ג׳קי', 'מוטי', 'ציון', 'פפו'];

export const START_MONEY = 180_000;

/** Manager age changes how the dressing room and the boardroom treat you. */
export function ageProfile(age: number) {
  if (age <= 35) return { label: 'מאמן צעיר', note: 'קרוב לשחקנים, פחות כבוד מהמערכת', morale: +5, prestige: -6, youth: 1.15 };
  if (age <= 49) return { label: 'בשיא הדרך', note: 'איזון בין ניסיון לאנרגיה', morale: 0, prestige: 0, youth: 1.0 };
  return { label: 'מאמן ותיק', note: 'מכובד מאוד, פחות סבלנות מהצעירים', morale: -4, prestige: +8, youth: 0.9 };
}

export function newGame(seed = 12345): GameState {
  return {
    phase: 'onboard-manager',
    seasonSeed: seed,
    clubId: '',
    profile: { name: '', nickname: '', age: 38, type: 'mental' },
    meters: { money: START_MONEY, morale: 65, prestige: 30, fans: FANS_START },
    tactic: { approach: 'balanced', press: 'mid', formation: DEFAULT_FORMATION },
    week: 1,
    league: initLeague(LEAGUE_C, seed),
    market: [],
    marketFocus: null,
    dilemma: null,
    dilemmaHistory: [],
    queued: null,
    inbox: [],
    seasonDilemmas: [],
    seasonChatEvents: [],
    euro: null,
    cup: null,
    loyalGift: null,
    loans: {},
    daily: emptyDaily(),
    lastLedger: null,
    purseEarlier: 0,
    chat: null,
    chatAnswers: null,
    chatHistory: [],
    pressHistory: [],
    suspensions: {},
    emergencyYouth: null,
    fix: null,
    fixLog: emptyFixLog(),
    youthPool: [],
    youthStamp: 0,
    youthUp: [],
    youthTripSeason: 0,
    notices: [],
    exits: [],
    sitOut: {},
    sitOutNext: {},
    matchMods: {},
    followUps: [],
    youthBoost: [],
    youthLeaveRisk: null,
    summerExits: [],
    arrivals: [],
    friends: [],
    mate: emptyMate(),
    tutorialSeen: false,
    seats: null,
    pendingOutcome: null,
    lastPlayerMatch: null,
    lastRound: [],
    press: null,
    sacking: null,
    sponsor: null,
    nemesis: null,
    ultimatumSeason: null,
    crisisDone: false,
    crisisReason: null,
    youth: emptyYouth(),
    style: { players: 0, media: 0, money: 0 },
    seasonStats: {},
    careerStats: {},
    form: [],
    seasonOver: false,
    chronicle: [],
    chronicleSeen: 0,
    fanHistory: [],
    season: 1,
    lastReport: null,
    captainId: null,
    assistant: { hired: false, name: '', departed: false },
    stadium: { capacity: STADIUM_START, project: null },
    stadiumReveal: null,
    contracts: {},
    preWeek: 0,
    preResolved: [],
    gems: GEMS_AT_START + adFreeGems(),
    adsWatched: 0,
    reports: NO_REPORTS,
    invite: emptyInvite(),
    inviteFrom: null,
    summerMark: null,
    wardrobe: [],
    kitReveal: null,
    pull: null,
    gifts: 0,
    coach: newCoach('mental'),
    scout: emptyScout(),
  };
}

export function club(gs: GameState): Club {
  return gs.league.clubs.find(c => c.id === gs.clubId) ?? gs.league.clubs[0];
}
export function manager(gs: GameState): ManagerType {
  return getManager(gs.profile.type);
}
export function mySquad(gs: GameState): Squad {
  return gs.league.squads[gs.clubId];
}
export function playerFixture(gs: GameState): Fixture | null {
  return gs.league.fixtures.find(f => f.round === gs.week && (f.homeId === gs.clubId || f.awayId === gs.clubId)) ?? null;
}
export function transferWindow(gs: GameState) {
  // the market is always open during the pre season summer
  if (gs.preWeek > 0) {
    return { open: true, label: 'שוק הקיץ', weeksLeft: PRE_ROUNDS - gs.preWeek + 1, nextOpensWeek: null };
  }
  return windowState(gs.week, gs.league.rounds);
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * The seed every in-season draw is made from: the career, the SEASON, the week
 * and a salt that keeps two draws in the same week apart.
 *
 * Every one of these used to mix only the career seed and the week, each with a
 * home-made formula, and seasonSeed never changes for the life of a career. So
 * round N of season one and round N of season fifteen drew the same lottery:
 * the same penalty in the same minute, the same red card for the same line, the
 * same question from the same reporter. A player who stayed twenty two seasons
 * wrote the script out from memory. One function, with the season in it, makes
 * every future draw right by default and findable by grep.
 */
export function drawSeed(gs: Pick<GameState, 'seasonSeed' | 'season' | 'week'>, salt: number): number {
  return gs.seasonSeed * 1009 + gs.season * 524287 + gs.week * 131 + salt;
}

/**
 * The three meters the manager reads are whole numbers, always.
 *
 * Morale drifted fractional because the coach's motivation is worth a fraction
 * of a point per match (coachMoraleBias), and 70 + 6 + 0.36 was stored and then
 * printed as 76.36000000000001. Anything shown as a number is rounded where it
 * is STORED, not where it is drawn, so it cannot come back somewhere else.
 */
const meter = (v: number) => Math.round(clamp(v, 0, 100));

/**
 * How the dressing room actually moves.
 *
 * Good news is worth less the higher the mood already is, bad news is worth all
 * of it. A flat +6 a win had a squad at 85 by the sixth round and 92 by the end
 * of a first season, which made the whole meter decoration: it was pinned near
 * the top from the spring of year one and never came down.
 *
 * Now a happy squad is hard to make happier and just as easy to upset, so
 * ninety is a run you went on rather than a number you passed through.
 */
function moraleShift(current: number, delta: number): number {
  if (delta <= 0) return meter(current + delta);
  const room = clamp((100 - current) / 50, 0.2, 1);
  return meter(current + delta * room);
}
const cash = (v: number) => Math.round(v);

/* ------------------------------------------------------------- onboarding */

/** Your name, the first thing the chairman asks for. */
export function setProfile(gs: GameState, profile: ManagerProfile): GameState {
  return { ...gs, profile, phase: 'onboard-club' };
}

/**
 * The CV, asked for once the chairman knows who you are and which club you are
 * joining. It comes after the club, so the budget the club set has to be redone
 * here: a recruiter talks his way into more money than a youth coach does.
 */
export function setArchetype(gs: GameState, id: ManagerId): GameState {
  const c = club(gs);
  const m = getManager(id);
  const ap = ageProfile(gs.profile.age);
  return {
    ...gs,
    profile: { ...gs.profile, type: id },
    coach: newCoach(id),
    meters: {
      ...gs.meters,
      money: Math.round(START_MONEY * m.budgetBias * c.traits.budget),
      prestige: clamp(c.traits.prestige + ap.prestige, 0, 100),
    },
    phase: 'signing',
  };
}

/** Club choice sets the money, the prestige and the squad you inherit. */
/**
 * Pick your city. The bottom division is rebuilt around it, your town plus the
 * seven nearest real towns, and the club of your city becomes yours. This is
 * the belonging hook, so the whole region is real, not a menu of invented names.
 */
export function pickCity(gs: GameState, cityName: string, kit?: KitColorId, pattern?: KitPattern): GameState {
  const region = buildRegionLeague(cityName, 1);
  // the manager's chosen colours and pattern become the club's, so the crest,
  // the shirts and the dots on the pitch all follow from one choice
  const themed = (kit || pattern)
    ? region.clubs.map(c => (c.id === region.myId
        ? {
            ...c,
            ...(kit ? { primary: kitColor(kit).hex, accent: kitColor(kit).trim } : {}),
            ...(pattern ? { kitPattern: pattern } : {}),
          }
        : c))
    : region.clubs;
  // somebody to hate, from the very first season. Before initLeague, because
  // the fixture list is drawn there and the twin has to be in the division
  // before it is, not after
  const local = withLocalRival(themed, {}, region.myId, 1);
  registerLocalRivalry(local.clubs, region.myId);
  const league = initLeague(local.clubs, gs.seasonSeed, gs.profile.name);
  // the chosen city rides on the club itself (club.city), no extra state needed
  return pickClub({ ...gs, league }, region.myId);
}

export function pickClub(gs: GameState, clubId: string): GameState {
  const c = gs.league.clubs.find(x => x.id === clubId)!;
  const m = getManager(gs.profile.type);
  const ap = ageProfile(gs.profile.age);
  const rng = createRng(gs.seasonSeed + 777);
  const squad = gs.league.squads[clubId];
  const takenNames = new Set([...squad.starters, ...squad.bench].map(p => p.name));
  return {
    ...gs,
    clubId,
    meters: {
      money: Math.round(START_MONEY * m.budgetBias * c.traits.budget),
      morale: clamp(65 + ap.morale, 0, 100),
      prestige: clamp(c.traits.prestige + ap.prestige, 0, 100),
      fans: FANS_START,
    },
    market: makeMarket(c.tier, rng, 12, takenNames),
    phase: 'onboard-archetype',
  };
}

/* ------------------------------------------------ sacked, and the way back */

/** Who is on the phone the morning after, and what they are asking. */
export interface RescueOffer {
  club: Club;
  /** the division they are in, one below the club that let you go */
  tier: number;
  league: string;
  /** the full name, since both clubs in a town share the short one */
  nemesisName: string;
  nemesisLeague: string;
  city: string;
  /** true when the sacking was in the bottom division and there is no lower one */
  sameLeague: boolean;
}

/**
 * The club across town, a division below, calling the morning after.
 *
 * Every Israeli city has two clubs and they cannot stand each other, so the
 * people who never liked your old employer are exactly the people who want the
 * man he just threw out. Take it, drag them up, and the season after that you
 * are in his league with a derby circled on the calendar.
 */
export function rescueOffer(gs: GameState): RescueOffer | null {
  const s = gs.sacking;
  if (!s) return null;
  // a club closed for a sold match is followed by the bottom division, whatever season and league it was in
  const tier = s.reason === 'fixing' ? 1 : Math.max(1, s.tier - 1);
  const club = siblingClub(s.city, tier, s.clubId);
  return {
    club, tier, league: LEAGUE_NAMES[tier],
    nemesisName: s.club, nemesisLeague: s.league,
    city: s.city, sameLeague: tier === s.tier,
  };
}

/**
 * Take it. A new club, a new division, the same manager: the badge, the money
 * and the table start again, while the profile, the coach and the whole
 * chronicle carry over, because the story is his and not the club's.
 */
export function takeRescue(gs: GameState): GameState {
  const offer = rescueOffer(gs);
  const s = gs.sacking;
  if (!offer || !s) return gs;
  const seed = gs.seasonSeed + gs.season * 131 + 17;
  const region = buildSiblingLeague(s.city, offer.tier, s.clubId);
  const nemesis: Nemesis = {
    clubId: s.clubId, name: s.club, short: s.short, city: s.city, tier: s.tier, season: s.season,
  };
  let league = initLeague(region.clubs, seed, gs.profile.name);

  // Sacked in the bottom division there is nothing below it, so the club across
  // town is in the same league and the derby is this season rather than the one
  // after. Put him in the division now, since that is what the call promised.
  let clubs = region.clubs;
  if (offer.sameLeague) {
    const staged = { ...gs, clubId: region.myId, nemesis } as GameState;
    const swap = returnOfTheNemesis(staged, clubs, league.squads, offer.tier);
    if (swap.met) {
      clubs = swap.clubs;
      league = {
        ...league,
        clubs,
        squads: swap.squads,
        ovr: Object.fromEntries(Object.entries(swap.squads).map(([id, sq]) => [id, squadAvgOvr(sq)])),
        fixtures: buildFixtures(clubs.map(x => x.id)),
        table: emptyTable(clubs),
      };
    }
  }
  // The club across town is now MINE, so the town no longer supplies the fight:
  // sacked anywhere but the bottom division the old club is a division above,
  // and there may be nobody near. Same rule as everywhere else, and it runs
  // before the fixture list is redrawn below.
  {
    const local = withLocalRival(clubs, league.squads, region.myId, offer.tier);
    if (local.clubs !== clubs) {
      clubs = local.clubs;
      league = {
        ...league,
        clubs,
        squads: local.squads,
        ovr: Object.fromEntries(Object.entries(local.squads).map(([id, sq]) => [id, squadAvgOvr(sq)])),
        fixtures: buildFixtures(clubs.map(x => x.id)),
        table: emptyTable(clubs),
      };
    }
  }
  registerLocalRivalry(clubs, region.myId);
  const c = clubs.find(x => x.id === region.myId)!;
  const squad = league.squads[region.myId];
  const rng = createRng(seed + 777);
  const taken = new Set([...squad.starters, ...squad.bench].map(p => p.name));

  return {
    ...gs,
    sacking: null,
    euro: null,
    cup: null,
    loans: {},
    ultimatumSeason: null,
    // he does not move while you are away, and the day you get back he is there.
    // Already in the same division, the account is open on the pitch instead.
    nemesis: offer.sameLeague ? null : nemesis,
    clubId: region.myId,
    league: { ...league, squads: friendsFollow(gs, league.squads, region.myId) },
    seasonSeed: seed,
    season: gs.season + 1,
    week: 1,
    meters: {
      // a club that just called a sacked manager is not a rich club
      money: cash(START_MONEY * 0.8 * c.traits.budget),
      morale: meter(58),
      prestige: meter(Math.max(18, gs.meters.prestige - 8)),
      // a new town has not made its mind up about him yet
      fans: FANS_START,
    },
    market: makeMarket(offer.tier, rng, 12, taken),
    marketFocus: null,
    sponsor: null,
    youth: { ...emptyYouth(), players: seedYouth(offer.tier, createRng(seed + 5501), taken) },
    stadium: { capacity: STADIUM_START, project: null },
    stadiumReveal: null,
    lastLedger: null,
    purseEarlier: 0,
    lastPlayerMatch: null,
    lastRound: [],
    form: [],
    seasonStats: {},
    seasonOver: false,
    contracts: {},
    captainId: null,
    dilemma: null,
    inbox: [],
    press: null,
    chat: null,
    pendingOutcome: null,
    chronicle: [...gs.chronicle, {
      id: `rescue-s${gs.season}`,
      kind: 'sacked' as const,
      week: 0,
      title: `${c.name} התקשרו`,
      body: s.reason === 'fixing'
        ? `${c.name} ב${s.city} נתנו הזדמנות שנייה למאמן של ${s.short}, שנסגר בגלל משחק שנמכר. ${LEAGUE_NAMES[offer.tier]}, מהתחלה.`
        : `הקבוצה השנייה ב${s.city}, זאת שתמיד הייתה בצל של ${s.short}, רצתה דווקא את מי ש${s.short} זרקו. ${LEAGUE_NAMES[offer.tier]}, מהתחלה, ועם חשבון פתוח.`,
      icon: 'flag' as const,
      tint: 'gold' as const,
    }],
    // the same welcome the first club got: the announcement, the badge and the
    // first question from the press. A new club is a new beginning or it is not one.
    phase: 'signing',
  };
}

/**
 * Give a freshly signed club its youth intake, if it has none yet. Rescued
 * managers keep whatever academy they walked into.
 */
function ensureYouth(gs: GameState): GameState {
  if (gs.youth.players.length) return gs;
  const rng = createRng(gs.seasonSeed + 5501);
  const sq = mySquad(gs);
  const used = new Set([...sq.starters, ...sq.bench].map(p => p.name));
  return { ...gs, youth: { ...emptyYouth(), players: seedYouth(club(gs).tier, rng, used) } };
}

/* --------------------------------------------------------- youth academy */

/** Move a player who has turned 18 up into the senior squad on a youth deal. */
export function promoteYouth(gs: GameState, playerId: string): GameState {
  const kid = gs.youth.players.find(p => p.id === playerId);
  if (!kid || kid.age < 18 || squadSize(gs) >= MAX_SQUAD) return gs;
  const sq = mySquad(gs);
  const next = writeSquad(gs, { starters: sq.starters, bench: [...sq.bench, kid] });
  return {
    ...next,
    youth: {
      ...gs.youth,
      players: gs.youth.players.filter(p => p.id !== playerId),
      ready: gs.youth.ready.filter(n => n !== kid.name),
    },
    contracts: { ...gs.contracts, [kid.id]: 3 },
    pendingOutcome: YOUTH_V2
      ? `${promotionText(kid.name, club(gs).short, club(gs).tier)} ${squadSize(next)} שחקנים בסגל עכשיו.`
      : `${kid.name} חתם חוזה בכיר ועלה לסגל. ${squadSize(next)} שחקנים בסגל עכשיו.`,
  };
}

/* ------------------------------------------------ the eighteen year olds, decided */

/**
 * The kids who turned eighteen this summer and are waiting for the manager's
 * word, best first. Before this they left the academy list on their birthday and
 * survived only as a name that no screen showed, so nobody could ever be signed.
 */
export function youthGraduates(gs: GameState): Player[] {
  return gs.youth.players.filter(p => p.age >= 18).sort((a, b) => overall(b) - overall(a));
}

/** The band he can reach, and what the youth coach makes of him. */
export function graduateOutlook(gs: GameState, p: Player): Outlook {
  return outlook(p, club(gs).tier);
}

/** How many men over the maximum the squad is: the number that has to go before the league starts. */
export function overSquadBy(gs: GameState): number {
  return Math.max(0, squadSize(gs) - MAX_SQUAD);
}

/**
 * A senior deal for one of them. Signing past the maximum is allowed here, on
 * purpose: the manager decides on the kids first and on who makes room after,
 * and the summer will not start until the squad is back under the limit.
 */
export function signGraduate(gs: GameState, playerId: string): GameState {
  const kid = youthGraduates(gs).find(p => p.id === playerId);
  if (!kid) return gs;
  const sq = mySquad(gs);
  return {
    ...writeSquad(gs, { starters: sq.starters, bench: [...sq.bench, kid] }),
    youth: {
      ...gs.youth,
      players: gs.youth.players.filter(p => p.id !== playerId),
      ready: gs.youth.ready.filter(n => n !== kid.name),
    },
    contracts: { ...gs.contracts, [kid.id]: 3 },
  };
}

/** Let him go, altogether: nothing of him is kept, not in the squad, not on a list, not in the story. */
export function releaseGraduate(gs: GameState, playerId: string): GameState {
  const kid = youthGraduates(gs).find(p => p.id === playerId);
  if (!kid) return gs;
  return {
    ...gs,
    youth: {
      ...gs.youth,
      players: gs.youth.players.filter(p => p.id !== playerId),
      ready: gs.youth.ready.filter(n => n !== kid.name),
    },
  };
}

/** Everyone the youth coach does not recommend, released in one go. */
export function releaseUnrecommended(gs: GameState): GameState {
  let g = gs;
  for (const kid of youthGraduates(gs)) if (!graduateOutlook(gs, kid).recommend) g = releaseGraduate(g, kid.id);
  return g;
}

/** On to the summer, once every one of them has an answer. */
export function finishYouthDecision(gs: GameState): GameState {
  if (gs.phase !== 'youth-decision' || youthGraduates(gs).length) return gs;
  return { ...gs, phase: 'preseason' };
}

/** Let a youth player go, whatever his age. */
export function releaseYouth(gs: GameState, playerId: string): GameState {
  const kid = gs.youth.players.find(p => p.id === playerId);
  if (!kid) return gs;
  return {
    ...gs,
    youth: {
      ...gs.youth,
      players: gs.youth.players.filter(p => p.id !== playerId),
      ready: gs.youth.ready.filter(n => n !== kid.name),
    },
    pendingOutcome: `${kid.name} שוחרר מהמחלקה.`,
  };
}

/** A senior squad player, 18 or under, can be sent down to keep developing. */
export function demoteToYouth(gs: GameState, playerId: string): GameState {
  const sq = mySquad(gs);
  const p = [...sq.starters, ...sq.bench].find(x => x.id === playerId);
  if (!p || p.age > 18 || squadSize(gs) <= MIN_SQUAD) return gs;
  const next = removePlayer(gs, playerId);
  return {
    ...next,
    youth: { ...next.youth, players: [...next.youth.players, p] },
    pendingOutcome: `${p.name} ירד למחלקת הנוער כדי לקבל דקות ולהתפתח.`,
  };
}

export function openYouth(gs: GameState): GameState { return { ...refreshYouthPool(gs), phase: 'youth', pendingOutcome: null }; }
export function closeYouth(gs: GameState): GameState { return { ...gs, phase: 'hub', pendingOutcome: null }; }
export function clearYouthOutcome(gs: GameState): GameState { return { ...gs, pendingOutcome: null }; }

/** Signing done, now go and look at the squad you inherited. */
export function afterSigning(gs: GameState, effect: { morale?: number; prestige?: number }): GameState {
  // A rescued manager has already met a squad and run a club. He does not need
  // the onboarding tour again, he needs somebody on the shirt. A rescue is the
  // one path that arrives here with a nemesis set, so that, not the incidental
  // crisisDone, is what tells a returning manager from a first timer.
  const next = gs.nemesis ? 'sponsor' as const : 'friends' as const;
  gs = ensureYouth(gs);
  // the shirt he arrives in goes into the wardrobe here, not at the season
  // opening, because a fresh career walks to the squad screen and never passes
  // through enterSeason at all. Without this his first shirt is missing and the
  // summer after it reads as a first season, so he is never handed a new kit
  gs = wearChosenKit(gs);
  return {
    ...gs,
    meters: {
      money: cash(gs.meters.money),
      morale: moraleShift(gs.meters.morale, (effect.morale ?? 0)),
      prestige: meter(gs.meters.prestige + (effect.prestige ?? 0)),
      fans: gs.meters.fans,
    },
    style: scoreStyle(gs.style, effect),
    phase: next,
  };
}

/**
 * The two friends join, on the bench, where they belong on day one: they are
 * the worst players here and the manager is about to find that out.
 *
 * Nothing else in the game needs to know they are special. They are in the
 * squad like anybody else, they can be picked, dropped, and sold, and the only
 * thing that separates them is the summer they have, which startNextSeason
 * reads off this list.
 */
export function addFriends(gs: GameState, specs: FriendSpec[]): GameState {
  if (gs.friends.length || !specs.length) return { ...gs, phase: 'squad' };
  const tier = club(gs).tier;
  const rng = createRng(gs.seasonSeed * 31 + 7717);
  const sq = mySquad(gs);
  const made = specs.map(spec => {
    const p = makeFriend(spec, tier, nextPlayerId(), rng);
    return { p, spec };
  });
  const squads = {
    ...gs.league.squads,
    [gs.clubId]: { starters: [...sq.starters], bench: [...sq.bench, ...made.map(m => m.p)] },
  };
  return {
    ...gs,
    league: { ...gs.league, squads },
    friends: made.map(({ p, spec }) => ({
      id: p.id, name: p.name, trait: spec.trait, position: spec.position, texter: spec.texter,
    })),
    phase: 'squad',
  };
}

/**
 * Their summer, which is their minutes.
 *
 * The ordinary ageing pass has already run over them with everybody else, and
 * whatever it decided is overwritten here: a friend's road is his own. It is
 * read off the rating he had before the summer, not after, so the two curves
 * never compound.
 */
function friendsSummer(
  gs: GameState, before: Squad, aged: Squad, rounds: number,
): Squad {
  if (!gs.friends.length) return aged;
  const was = new Map([...before.starters, ...before.bench].map(p => [p.id, overall(p)]));
  const grow = (p: Player): Player => {
    const f = gs.friends.find(x => x.id === p.id && !x.sold);
    const start = was.get(p.id);
    if (!f || start === undefined) return p;
    const apps = gs.seasonStats[p.id]?.apps ?? 0;
    // the rate belongs to the season he just played, not to the birthday he
    // has just had, so his first summer is the one he spent being twenty one.
    // A story friend (T3) does not read the twenty-one-year-old curve at all:
    // he arrived at 25-27 and uses his own, slower road, capped short of the
    // ordinary ceiling.
    const target = f.story
      ? storyFriendAfterSummer(start, p.age - 1, friendTrait(f.trait), apps, rounds, gs.season)
      : friendAfterSummer(start, p.age - 1, friendTrait(f.trait), apps, rounds, gs.season);
    const out: Player = { ...p, attrs: { ...p.attrs }, gk: p.gk ? { ...p.gk } : undefined };
    shiftTo(out, Math.round(target));
    return out;
  };
  return { starters: aged.starters.map(grow), bench: aged.bench.map(grow) };
}

/**
 * They leave with you.
 *
 * Being sacked hands the manager a new club in a new town with a squad he has
 * never met, and the two men he started the whole thing with would otherwise
 * simply cease to exist. So they come: the same players, the same ids, the
 * same ratings they had earned, onto the new bench. If there is no room, the
 * weakest man there makes it, because he is a name from a generator and they
 * are the reason this save is worth keeping.
 */
function friendsFollow(gs: GameState, squads: Record<string, Squad>, toClubId: string): Record<string, Squad> {
  const mine = gs.league.squads[gs.clubId];
  if (!gs.friends.length || !mine) return squads;
  const here = [...mine.starters, ...mine.bench];
  const coming = gs.friends.filter(x => !x.sold).map(x => here.find(p => p.id === x.id)).filter((p): p is Player => !!p);
  if (!coming.length) return squads;

  const sq = squads[toClubId];
  let bench = [...sq.bench];
  const weakest = () => bench.reduce((lo, p, i) => (overall(p) < overall(bench[lo]) ? i : lo), 0);
  for (const p of coming) {
    if (sq.starters.length + bench.length >= MAX_SQUAD && bench.length) bench.splice(weakest(), 1);
    bench.push({ ...p, fitness: 90, morale: 70 });
  }
  return { ...squads, [toClubId]: { starters: sq.starters, bench } };
}

/**
 * Ids of the two ONBOARD_V2 story friends (T3), still here. A story friend
 * must never turn up as a summer departure saga or an expiring contract (plan
 * section 4), which the ordinary friend was never promised, so this stays
 * narrower than isFriend on purpose.
 */
function storyFriendIds(gs: GameState): Set<string> {
  return new Set(gs.friends.filter(f => f.story && !f.sold).map(f => f.id));
}

/** A squad with the two story friends taken out, for the one place (starTarget) that must never see them. */
function squadWithoutStoryFriends(gs: GameState, sq: Squad): Squad {
  const story = storyFriendIds(gs);
  if (!story.size) return sq;
  return { starters: sq.starters.filter(p => !story.has(p.id)), bench: sq.bench.filter(p => !story.has(p.id)) };
}

/** What the two of them do to the room every summer, by their qualities. */
export function friendsMorale(gs: GameState): number {
  return gs.friends
    .filter(f => !f.sold && isFriend(gs.friends, { id: f.id }))
    .reduce((s, f) => s + friendTrait(f.trait).squadMorale, 0);
}

/* ------------------------------------------------------------- pre season */

/**
 * Open the summer. Runs once between seasons: every contract ticks down a year,
 * the map is pruned to the men actually here, and any player new to us signs on
 * fresh. From here the three market rounds play out before the league starts.
 */
export function enterPreseason(gs: GameState): GameState {
  const sq = mySquad(gs);
  const ids = [...sq.starters, ...sq.bench].map(p => p.id);
  const firstEver = Object.keys(gs.contracts).length === 0;
  const story = storyFriendIds(gs);
  const contracts: Record<string, number> = {};
  for (const id of ids) {
    // a story friend (T3) never runs down to a renewal he never asked for:
    // his deal is simply kept at its full five years every summer, so he
    // never surfaces in expiringPlayers or the preseason's renewal cards
    if (story.has(id)) { contracts[id] = STORY_CONTRACT_YEARS; continue; }
    if (id in gs.contracts) contracts[id] = clamp(gs.contracts[id] - 1, 0, 5);
    // the opening squad gets full 1..3 year deals, so nobody expires in the
    // first summer. Contracts only bite from the second season, once these
    // have ticked down, which keeps ליגה ג׳ amateur to begin with.
    else if (firstEver) contracts[id] = seedContract(id);
    else contracts[id] = 3;   // a kid up from the youth signs a three year deal
  }
  const opened = { ...gs, phase: 'preseason-market' as const, preWeek: 1, preResolved: [], contracts, pendingOutcome: null, arrivals: [], scout: scoutArrives(gs, gs.scout) };
  return { ...opened, summerMark: summerFingerprint(opened) };
}

/* --------------------------------------------------- using the summer */

/**
 * Everything a summer round lets a manager change, in one string.
 *
 * Taken as a fingerprint rather than a counter incremented by each action, so
 * it cannot drift: anything new that touches the squad, the contracts, the
 * ground, the badge or the academy registers here without being told to.
 */
export function summerFingerprint(gs: GameState): string {
  const sq = mySquad(gs);
  return [
    [...sq.starters, ...sq.bench].map(p => p.id).sort().join(','),
    gs.preResolved.length,
    gs.stadium.project ? `${gs.stadium.project.label}:${gs.stadium.project.roundsLeft}` : '',
    gs.coach.licence,
    gs.gems,
    gs.youth.players.length,
    Object.keys(gs.contracts).length,
  ].join('|');
}

/**
 * Is the manager about to skip a summer round without having used it? The
 * window is the one part of the year where the squad can actually be changed,
 * so walking past it in silence is a decision worth asking about once.
 */
export function summerUntouched(gs: GameState): boolean {
  return gs.summerMark !== null && summerFingerprint(gs) === gs.summerMark;
}

/* ------------------------------------------------------- coaching badges */

/** Is the manager unqualified for the division he is about to open? */
export function courseRequired(gs: GameState): boolean {
  return !qualifiedFor(gs.coach.licence, club(gs).tier);
}

/**
 * The badge on offer this summer, or null when there is nothing to take. The one the division demands comes first. After
 * that, a manager may take the next badge early (Itzik, 15.10: a user with 45M could not buy the international badge,
 * because it was never on offer to anyone): the badge for the division above his own, and at the top the international one.
 */
export function courseOnOffer(gs: GameState) {
  const tier = club(gs).tier;
  if (!qualifiedFor(gs.coach.licence, tier)) return licence(requiredLicence(tier));
  const next = nextLicence(gs.coach.licence);
  if (!next) return null;
  const early = tier >= TOP_TIER ? next.id === 'international' : licenceRank(next.id) <= licenceRank(requiredLicence(tier + 1));
  return early ? next : null;
}

/** True when the badge on offer is only a head start and nothing in the way of the season. */
export function courseIsOptional(gs: GameState): boolean {
  return !!courseOnOffer(gs) && !courseRequired(gs);
}

/**
 * Money for the course. A required badge that the purse cannot pay may go on the club's account, as long as the debt it makes
 * is still a warned one and not a final one (a season that cannot open because of a fee would be a trap, and the owner's rope
 * is already the rule for every other debt). A head start is paid in cash only.
 */
export function courseFunding(gs: GameState): { fee: number; cash: number; onAccount: number; ok: boolean; reason: string | null } {
  const l = courseOnOffer(gs);
  if (!l) return { fee: 0, cash: 0, onAccount: 0, ok: false, reason: null };
  const money = gs.meters.money;
  if (money >= l.cost) return { fee: l.cost, cash: l.cost, onAccount: 0, ok: true, reason: null };
  if (courseRequired(gs)) {
    const after = debtState(money - l.cost, club(gs).tier, gs.meters.fans);
    if (after.ratio < 0.75) return { fee: l.cost, cash: Math.max(0, money), onAccount: l.cost - Math.max(0, money), ok: true, reason: null };
    return { fee: l.cost, cash: Math.max(0, money), onAccount: l.cost - Math.max(0, money), ok: false, reason: 'הקורס עולה יותר ממה שהמועדון יכול לשאת, גם על חשבון הבעלים. צריך למכור שחקן לפני' };
  }
  return { fee: l.cost, cash: Math.max(0, money), onAccount: 0, ok: false, reason: 'אין מספיק תקציב לקורס' };
}

export function courseBlockedReason(gs: GameState): string | null {
  if (!courseOnOffer(gs)) return null;
  return courseFunding(gs).reason;
}

/**
 * Take the course. Costs money, upgrades the badge and the man. The way he went through it counts: the subject he chose to
 * dig into adds two points to that group, and a distinction in the exam adds one to each.
 */
export function takeCourse(gs: GameState, how: { focus?: 'training' | 'mental'; distinction?: boolean } = {}): GameState {
  const l = courseOnOffer(gs);
  if (!l || courseBlockedReason(gs)) return gs;
  const extra = { training: 0, mental: 0 };
  if (how.focus) extra[how.focus] += 2;
  if (how.distinction) { extra.training += 1; extra.mental += 1; }
  return {
    ...gs,
    meters: { ...gs.meters, money: cash(gs.meters.money - l.cost) },
    coach: applyCourse(gs.coach, l.id, extra),
    pendingOutcome: `סיימת את ${l.course}${how.distinction ? ' בהצטיינות' : ''}. מהיום אתה ${l.name}.`,
  };
}

/** Return to the summer board after a trip to the open market. No state moves. */
export function backToPreseason(gs: GameState): GameState {
  return { ...gs, phase: 'preseason-market', pendingOutcome: null };
}

/**
 * Why the summer cannot be closed yet, or null when it can. Contracts are the
 * one thing you are not allowed to walk past: leaving the window with men who
 * have no deal would quietly cost you the squad, so the whistle waits until
 * every expiring contract has been answered, renewed or released.
 */
export function preseasonBlockedReason(gs: GameState): string | null {
  if (gs.preWeek < PRE_ROUNDS) return null;
  // a squad that signed the academy's eighteen year olds past the maximum has to be
  // brought back under it before a ball is kicked. DRAFT WORDING, Itzik's to correct.
  const over = overSquadBy(gs);
  if (over > 0) {
    return `הסגל עומד על ${squadSize(gs)} ומותר ${MAX_SQUAD} לכל היותר. צריך למכור או לשחרר ${over === 1 ? 'שחקן אחד' : `${over} שחקנים`} לפני שהעונה מתחילה`;
  }
  // the badge comes first: a division you are not qualified for will not let
  // you take the touchline at all, whatever else you sorted out this summer
  if (courseRequired(gs)) {
    return `בלי ${licence(requiredLicence(club(gs).tier)).name} אי אפשר לפתוח עונה ב${LEAGUE_NAMES[club(gs).tier]}`;
  }
  const open = preseasonEvents(gs).filter(e => e.kind === 'renew');
  if (!open.length) return null;
  return open.length === 1
    ? 'נשאר חוזה אחד לסגור לפני שהעונה מתחילה'
    : `נשארו ${open.length} חוזים לסגור לפני שהעונה מתחילה`;
}

/** Advance one summer round, or kick the season off after the third. */
export function advancePreseason(gs: GameState): GameState {
  if (gs.preWeek >= PRE_ROUNDS) {
    if (preseasonBlockedReason(gs)) return gs;   // contracts must be answered first
    return finishPreseason(gs);
  }
  // the window moves on: whoever was on notice has signed elsewhere, new names
  // come in, and the last round of the summer brings the one big name
  const next = gs.preWeek + 1;
  const sq = mySquad(gs);
  const taken = new Set([...sq.starters, ...sq.bench].map(p => p.name));
  const market = refreshMarket(
    gs.market, club(gs).tier, createRng(gs.seasonSeed + 4100 + next * 31), taken,
    { marquee: next >= PRE_ROUNDS },
  );
  const opened = { ...gs, preWeek: next, market, pendingOutcome: null };
  // a fresh mark for the new round, so each one is judged on its own
  return { ...opened, summerMark: summerFingerprint(opened) };
}

/**
 * The whistle. Anyone still out of contract and not renewed now walks for free,
 * but never below a legal squad, then the league begins.
 */
function finishPreseason(gs: GameState): GameState {
  let next = gs;
  const expiring = expiringPlayers(gs);
  for (const p of expiring) {
    if (squadSize(next) <= MIN_SQUAD) break;   // cannot gut the whole team
    next = removePlayer(next, p.id);
  }
  // if summer sales left the squad short, blood youth up to a legal minimum
  const contracts = { ...next.contracts };
  if (squadSize(next) < MIN_SQUAD) {
    const rng = createRng(gs.seasonSeed * 733 + gs.season * 97 + 5);
    const filled = fillWithYouth(mySquad(next), rng, club(next).tier, MIN_SQUAD);
    next = writeSquad(next, filled.squad);
    for (const p of [...filled.squad.starters, ...filled.squad.bench]) {
      if (!(p.id in contracts)) contracts[p.id] = 3;
    }
  }
  // whoever we were forced to keep gets a bare one year deal so they are legal
  for (const p of expiringPlayers({ ...next, contracts })) contracts[p.id] = 1;
  return enterSeason({ ...next, contracts, preWeek: 0, preResolved: [], pendingOutcome: null });
}

export function enterSeason(gs: GameState): GameState {
  // the summer is over, so its warnings and its star are over too, and the
  // questions allowed once a season may be asked again
  gs = { ...gs, market: settleMarket(gs.market), scout: { ...gs.scout, offer: null }, seasonDilemmas: [], seasonChatEvents: [] };
  gs = seasonWithLegend(gs);
  gs = dressForTheSeason(gs);
  // the new shirt is unveiled before anything else, because it is the first
  // thing a club shows the world in the summer
  if (gs.kitReveal) return { ...gs, phase: 'kit' };
  return afterKit(gs);
}

/** The rest of the summer, once the shirt is on the table. */
function afterKit(gs: GameState): GameState {
  // the shirt is sold before a ball is kicked, and re-sold every summer
  if (!gs.sponsor || gs.sponsor.season !== gs.season) return { ...gs, phase: 'sponsor' };
  return maybeAssistantDeparture({ ...gs, phase: 'hub' });
}

/**
 * This season's shirt, unveiled before a ball is kicked.
 *
 * The colour never moves, because the colour is who the club is. What changes
 * is the cut, the shade and the trim, and what decides them is what the manager
 * did last season: gold across the chest for a title, a deeper shade for the
 * year you went up. Over a career the wardrobe stops being decoration and turns
 * into a record you can read without a word of text.
 *
 * Written onto the club as kitShirt and kitTrim rather than onto primary, so the
 * crest and the club's identity stay exactly where they were.
 */
function dressForTheSeason(gs: GameState): GameState {
  const worn = gs.wardrobe ?? [];
  if (worn.some(k => k.season === gs.season && k.clubId === gs.clubId)) return gs;  // already dressed

  const me = club(gs);
  const last = previousKit(gs);
  const reason = last ? reasonFor(gs.lastReport?.result, gs.season) : 'first';

  // his first season at a club is the shirt HE chose on the way in, recorded as
  // it is. There is nothing to unveil either: a reveal needs a shirt to stand
  // the new one beside, and at the first one there is none
  if (reason === 'first') return wearChosenKit(gs);

  const kit = seasonKit(me, gs.season, reason, last);
  const clubs = gs.league.clubs.map(c =>
    c.id === gs.clubId ? { ...c, kitShirt: kit.shirt, kitTrim: kit.trim, kitPattern: kit.pattern } : c);

  return {
    ...gs,
    league: { ...gs.league, clubs },
    wardrobe: [...worn, kit],
    kitReveal: kit,
  };
}

/**
 * Record the shirt he chose, as he chose it.
 *
 * Nothing is generated and nothing is unveiled: he picked these colours and this
 * pattern himself on the way in, so the wardrobe simply opens with them. It is
 * what every later kit is a change FROM, which is why it has to be here even
 * though it looks like it does nothing.
 */
function wearChosenKit(gs: GameState): GameState {
  const worn = gs.wardrobe ?? [];
  if (worn.some(k => k.clubId === gs.clubId)) return gs;
  return { ...gs, wardrobe: [...worn, firstKit(club(gs), gs.season)] };
}

/** He has seen the new shirt; on with the summer. */
export function closeKitReveal(gs: GameState): GameState {
  return afterKit({ ...gs, kitReveal: null });
}

/**
 * The shirt this club wore last, for standing the new one beside.
 *
 * Same club only. A sacked manager's wardrobe spans two clubs, and holding up
 * the shirt of the people who let him go as "last season" would be nonsense.
 */
export function previousKit(gs: GameState): SeasonKit | null {
  const mine = (gs.wardrobe ?? []).filter(k => k.clubId === gs.clubId && k.season < gs.season);
  return mine.length ? mine[mine.length - 1] : null;
}

/**
 * One of the ראש העין regulars is in the dressing room when the season opens.
 *
 * They were being put in when a career BEGINS and again when a season rolls
 * over, and that missed the case that matters most: a career already in
 * progress. Itzik opened a season in ראש העין and there was nobody, because his
 * squad was built before any of this existed and the rollover had not come
 * round yet. The season opening is the boundary every career crosses, new or
 * old, so it is the honest place for it.
 *
 * Does nothing at any other club, and nothing if one of them is already here.
 */
function seasonWithLegend(gs: GameState): GameState {
  const me = club(gs);
  if (!isLegendClub(me.city)) return gs;
  const squad = mySquad(gs);
  const next = withLegend(
    squad, me.city, gs.profile.name,
    createRng(gs.seasonSeed + gs.season * 811 + 5501), nextPlayerId,
    { mode: 'join', maxSquad: MAX_SQUAD },
  );
  if (next === squad) return gs;
  return { ...gs, league: { ...gs.league, squads: { ...gs.league.squads, [gs.clubId]: next } } };
}

/** The deals on the table this summer, every brand at this summer's price. */
export function sponsorChoices(gs: GameState): SponsorOffer[] {
  return sponsorOffers(club(gs).tier, gs.meters.prestige, gs.league.rounds, gs.sponsor, gs.season);
}

/**
 * Sign the deal. The brand is optional; today one brand offers every kind, and
 * it is there for the day two brands offer the same kind. The welcome is
 * queued as a notice, so it is the first thing seen on the way to the hub.
 */
export function takeSponsor(gs: GameState, id: SponsorId, brand?: BrandId): GameState {
  const all = sponsorChoices(gs);
  const offer = all.find(o => o.id === id && (!brand || o.brand === brand)) ?? all.find(o => o.id === id) ?? all[0];
  return maybeAssistantDeparture({
    ...gs, phase: 'hub', sponsor: signSponsor(offer, gs.season, gs.sponsor),
    notices: [...gs.notices, { kind: 'sponsor', brand: offer.brand }],
  });
}

/** What the shirt is worth this round, given who is in the ground. */
export function sponsorThisRound(gs: GameState, isDerby = false): number {
  return sponsorRound(gs.sponsor, club(gs).tier, homeAttendance(gs, isDerby));
}

/* ------------------------------------------------- pre season, the business */

export type PreEventKind = 'star' | 'young' | 'renew';

export interface PreEvent {
  id: string;
  kind: PreEventKind;
  player: Player;
  /** the money attached: a suitor's fee, a raise, or a renewal bonus */
  amount: number;
  /** what else is in the deal, down where the money is not the point */
  sweetener?: string | null;
}

/** My players whose contract has run out this summer. */
function expiringPlayers(gs: GameState): Player[] {
  const sq = mySquad(gs);
  const story = storyFriendIds(gs);
  return [...sq.starters, ...sq.bench].filter(p => !story.has(p.id) && contractYears(gs.contracts, p.id) <= 0);
}

/**
 * What is on the manager's desk this summer round. Departure sagas surface in
 * the first round, the out of contract men from the second, and everything
 * stays until it is dealt with.
 */
export function preseasonEvents(gs: GameState): PreEvent[] {
  const done = new Set(gs.preResolved);
  const out: PreEvent[] = [];
  const sq = mySquad(gs);

  // a player caught in an unresolved saga is not also listed as a renewal, so
  // one man never fills two cards at once
  const inSaga = new Set<string>();
  if (!done.has('dep-star') && club(gs).tier < TOP_TIER) {
    const star = starTarget(squadWithoutStoryFriends(gs, sq));
    if (star) {
      out.push({
        id: 'dep-star', kind: 'star', player: star,
        amount: starFee(star, club(gs).tier),
        sweetener: feeSweetener(club(gs).tier, gs.seasonSeed + star.name.length),
      });
      inSaga.add(star.id);
    }
  }
  // the whole contract business, raises and renewals, only starts the second
  // summer. The first season is amateur ליגה ג׳ football: no contracts, just
  // build a squad. It gives the player a clean first year before the paperwork.
  if (gs.season >= 2) {
    if (!done.has('dep-young')) {
      const young = youngTarget(sq);
      if (young) { out.push({ id: 'dep-young', kind: 'young', player: young, amount: raiseBonus(young) }); inSaga.add(young.id); }
    }
    if (gs.preWeek >= 2) {
      for (const p of expiringPlayers(gs)) {
        if (inSaga.has(p.id)) continue;
        if (!done.has(`renew-${p.id}`)) out.push({ id: `renew-${p.id}`, kind: 'renew', player: p, amount: renewTerms(p, club(gs).tier).signOn });
      }
    }
  }
  return out;
}

/** Remove a player from my squad entirely, keeping eleven on the field. */
function removePlayer(gs: GameState, playerId: string): GameState {
  const sq = mySquad(gs);
  let starters = sq.starters.filter(p => p.id !== playerId);
  let bench = sq.bench.filter(p => p.id !== playerId);
  // if a starter left, pull the first bench player up so the eleven stays whole
  if (starters.length < sq.starters.length && bench.length) {
    const gone = sq.starters.find(p => p.id === playerId)!;
    const idx = gone.position === 'GK'
      ? bench.findIndex(p => p.position === 'GK')
      : bench.findIndex(p => p.position !== 'GK');
    const take = idx >= 0 ? idx : 0;
    starters = [...starters, bench[take]];
    bench = bench.filter((_, i) => i !== take);
  }
  const contracts = { ...gs.contracts };
  delete contracts[playerId];
  return { ...writeSquad(gs, { starters, bench }), contracts };
}

/**
 * Answer a transfer saga. The star can be cashed in or kept, the kid can be
 * given his raise or told to earn it. Every path lands an outcome bubble.
 */
export function resolveDeparture(gs: GameState, kind: 'star' | 'young', optionIndex: number): GameState {
  const sq = mySquad(gs);
  if (kind === 'star') {
    const p = starTarget(squadWithoutStoryFriends(gs, sq));
    if (!p) return gs;
    const fee = starFee(p, club(gs).tier);
    const extra = feeSweetener(club(gs).tier, gs.seasonSeed + p.name.length);
    const resolved = [...gs.preResolved, 'dep-star'];
    if (optionIndex === 0) {
      // cash in: he gets his move, you get the money and a weaker team
      const next = removePlayer(gs, p.id);
      return {
        ...next, preResolved: resolved,
        meters: { ...gs.meters, money: cash(gs.meters.money + fee), morale: moraleShift(gs.meters.morale, 2), fans: meter(gs.meters.fans + FANS_STAR_SOLD) },
        style: scoreStyle(gs.style, { money: fee, morale: 2 }),
        // the count is said out loud, because a squad that reads the same size
        // afterwards (the summer tops it back up) made the sale look ignored
        pendingOutcome: (extra
          ? `${p.name} נמכר תמורת ${formatK(fee)} ו${extra}. הסגל איבד את השחקן הכי טוב שלו, אבל לפחות יש ציוד.`
          : `${p.name} נמכר תמורת ${formatK(fee)}. הכסף בקופה, אבל הסגל איבד את השחקן הכי טוב שלו.`)
          + ` נשארתם עם ${squadSize(next)} שחקנים.`,
      };
    }
    // block the move: he stays, the dressing room grumbles
    return {
      ...gs, preResolved: resolved,
      meters: { ...gs.meters, morale: moraleShift(gs.meters.morale, -(5)) },
      style: scoreStyle(gs.style, { morale: -5, prestige: 1 }),
      pendingOutcome: `אמרת לא. ${p.name} נשאר, אבל הוא לא מרוצה והחדר הרגיש את זה.`,
    };
  }

  const p = youngTarget(sq);
  if (!p) return gs;
  const resolved = [...gs.preResolved, 'dep-young'];
  if (optionIndex === 0) {
    // the raise: a loyalty bonus now, a longer deal, a happy kid
    const bonus = raiseBonus(p);
    const contracts = { ...gs.contracts, [p.id]: 3 };
    return {
      ...gs, preResolved: resolved, contracts,
      meters: { ...gs.meters, money: cash(gs.meters.money - bonus), morale: moraleShift(gs.meters.morale, 4) },
      style: scoreStyle(gs.style, { money: -bonus, morale: 4 }),
      pendingOutcome: `${p.name} חתם חוזה חדש ומחייך. ${formatK(bonus)} מהקופה, אבל הכישרון נשאר בבית לשלוש שנים.`,
    };
  }
  // refuse: saves the money, costs you the mood, and he remembers. He still
  // sees out at least this season, so an already expired deal ticks up to one.
  const kept = Math.max(1, contractYears(gs.contracts, p.id));
  return {
    ...gs, preResolved: resolved,
    contracts: { ...gs.contracts, [p.id]: kept },
    meters: { ...gs.meters, morale: moraleShift(gs.meters.morale, -(4)) },
    style: scoreStyle(gs.style, { money: 1, morale: -4 }),
    pendingOutcome: `סירבת להעלאה. ${p.name} בלע את זה, אבל הפעם הבאה שהחוזה שלו ייגמר, הוא כבר לא יבקש יפה.`,
  };
}

/** Keep an out of contract player on a fresh deal. */
export function renewContract(gs: GameState, playerId: string): GameState {
  const sq = mySquad(gs);
  const p = [...sq.starters, ...sq.bench].find(x => x.id === playerId);
  if (!p) return gs;
  const terms = renewTerms(p, club(gs).tier);
  const contracts = { ...gs.contracts, [playerId]: terms.years };
  return {
    ...gs, contracts,
    preResolved: [...gs.preResolved, `renew-${playerId}`],
    meters: { ...gs.meters, money: cash(gs.meters.money - terms.signOn) },
    pendingOutcome: `${p.name} חתם חוזה ל${terms.years === 1 ? 'עונה' : `${terms.years} עונות`}. ${formatK(terms.signOn)} דמי חתימה.`,
  };
}

/** Let an out of contract player walk now instead of at the whistle. */
export function releasePlayer(gs: GameState, playerId: string): GameState {
  const sq = mySquad(gs);
  if (squadSize(gs) <= MIN_SQUAD) {
    return { ...gs, pendingOutcome: `אי אפשר לרדת מתחת ל-${MIN_SQUAD} שחקנים. תחתים מישהו קודם.` };
  }
  const keeper = lastKeeperReason(gs, playerId);
  if (keeper) return { ...gs, pendingOutcome: `${keeper}. תחתים שוער קודם.` };
  const p = [...sq.starters, ...sq.bench].find(x => x.id === playerId);
  if (!p) return gs;
  return {
    ...removePlayer(gs, playerId),
    preResolved: [...gs.preResolved, `renew-${playerId}`],
    pendingOutcome: `${p.name} עוזב חופשי. חסכת את השכר, אבל הסגל מצטמצם.`,
  };
}

/** Dismiss the outcome bubble on the pre season board. */
export function clearPreseasonOutcome(gs: GameState): GameState {
  return { ...gs, pendingOutcome: null };
}

/** Compact money label for the short outcome lines, e.g. 120K, 1.4M. */
function formatK(n: number): string {
  return moneyShort(n);
}

/* -------------------------------------------------------------- the ground */

export function openStadium(gs: GameState): GameState { return { ...gs, phase: 'stadium' }; }

/** Which stadium photo is showing right now (0 is the opening ground). */
export function stadiumImg(gs: GameState): 0 | 1 | 2 | 3 | 4 {
  return stadiumImageTier(gs.stadium.capacity);
}

/** How full the ground gets, from standing, form and the occasion. */
export function attendanceFill(gs: GameState, isDerby: boolean): number {
  const recent = gs.form.slice(-3);
  const formBump = recent.reduce((s, r) => s + (r === 'W' ? 0.03 : r === 'L' ? -0.02 : 0), 0);
  // and the terrace: a crowd that loves him comes, one that does not stays home
  const f = (0.5 + gs.meters.prestige / 250 + formBump + (isDerby ? 0.12 : 0)) * crowdMultiplier(gs.meters.fans);
  return Math.max(0.35, Math.min(0.99, f));
}

/** A representative home gate, for showing on the stadium screen. */
/** What the boards pay each round, which is why a bigger ground is worth more. */
export function signageEstimate(gs: GameState): number {
  return gs.sponsor ? signageRound(club(gs).tier, gs.stadium.capacity) : 0;
}

export function homeGateEstimate(gs: GameState): number {
  return gateIncome(homeAttendance(gs, false), club(gs).tier);
}

/**
 * The people actually in the ground: the smaller of the seats you own and the
 * crowd the town will turn out, times how full that gets. Seats past the town's
 * appetite earn nothing, which is why over building for a division is waste
 * rather than free money.
 */
/** How many the town would come if there were room, whatever the ground holds. */
export function crowdWanted(gs: GameState): number {
  return crowdDemand(club(gs).tier, gs.meters.prestige);
}

export function homeAttendance(gs: GameState, isDerby: boolean): number {
  const want = crowdDemand(club(gs).tier, gs.meters.prestige) * (isDerby ? 1.15 : 1);
  return Math.round(Math.min(gs.stadium.capacity, want) * attendanceFill(gs, isDerby));
}

/**
 * What this season is FOR, in one glance.
 *
 * The hub used to show a table and leave the manager to work out what it meant.
 * Nothing on the home screen said what winning looks like, how close he was, or
 * what he stood to lose, so there was nothing pulling him into the next round.
 * This is that missing sentence, and the ladder above it is the same fact drawn
 * rather than written.
 */
export interface SeasonGoal {
  pos: number;
  teams: number;
  pts: number;
  played: number;
  /** rounds still to play */
  left: number;
  zone: 'promo' | 'safe' | 'drop';
  /** what the season is being played for */
  target: string;
  /** the one line under the ladder */
  line: string;
  /** promotion is on the pitch but the ground is too small */
  blocked: boolean;
  /** there is a division above to climb to, and one below to fall into */
  up: boolean;
  down: boolean;
}

export function seasonGoal(gs: GameState): SeasonGoal {
  const table = sortedTable(gs.league);
  const i = Math.max(0, table.findIndex(s => s.clubId === gs.clubId));
  const me = table[i];
  const pos = i + 1, teams = table.length;
  const tier = club(gs).tier;
  const up = tier < TOP_TIER;          // somewhere to climb to
  const down = tier > 1;               // and something to fall out of
  const left = Math.max(0, gs.league.rounds - me.played);
  const gate = stadiumGate(gs);
  const blocked = up && pos <= 2 && !!gate && !gate.meets;

  const zone: SeasonGoal['zone'] =
    up && pos <= 2 ? 'promo' : down && pos >= teams ? 'drop' : 'safe';
  // a side in the drop is not playing for promotion, whatever the table says
  const target = zone === 'drop' ? 'להישאר בליגה'
    : up ? `עלייה ל${LEAGUE_NAMES[tier + 1]}` : 'אליפות המדינה';
  const ptsAt = (n: number) => table[Math.min(teams, Math.max(1, n)) - 1]?.pts ?? 0;
  const pt = (n: number) => `${n} ${n === 1 ? 'נקודה' : 'נקודות'}`;
  const rounds = `${left} ${left === 1 ? 'מחזור' : 'מחזורים'}`;

  let line: string;
  if (me.played === 0) {
    line = up ? 'שני המקומות הראשונים עולים ליגה. מתחילים.' : 'העונה נפתחת, והכל עוד פתוח.';
  } else if (blocked) {
    line = 'אתם במקום שעולה, אבל האצטדיון קטן מדי לליגה מעל.';
  } else if (zone === 'promo') {
    line = pos === 1
      ? `ראשונים, ${pt(Math.max(0, me.pts - ptsAt(3)))} מעל אזור העלייה.`
      : `במקום שעולה, ${pt(Math.max(0, me.pts - ptsAt(3)))} מעל הרודף.`;
  } else if (zone === 'drop') {
    line = `אחרונים. ${pt(Math.max(0, ptsAt(teams - 1) - me.pts))} מהצלה, ${rounds} נשארו.`;
  } else {
    const need = Math.max(0, (up ? ptsAt(2) : ptsAt(1)) - me.pts);
    if (need === 0) {
      line = up ? 'צמודים למקום שעולה. ניצחון אחד וזה שלכם.' : 'צמודים לפסגה. ניצחון אחד ואתם שם.';
      // two points a round clawed back is already a heroic run; past that
      // the promotion talk stops being encouraging and starts being a taunt
    } else if (need <= left * 2) {
      line = `${pt(need)} מ${up ? 'אזור העלייה' : 'הפסגה'}, ${rounds} נשארו.`;
    } else {
      // The climb is gone this season. Telling a manager he is fifteen points
      // off with five games left is just rubbing it in, so the goal shrinks to
      // the one place he can still take: the club immediately above him.
      const above = table[i - 1];
      const name = above ? (gs.league.clubs.find(c => c.id === above.clubId)?.short ?? '') : '';
      line = above
        ? `העלייה כבר לא בהישג. עקפו את ${name} (${pt(above.pts - me.pts)} מעליכם) וסיימו גבוה.`
        : `${rounds} לסיום. סיימו את העונה בכבוד ותבנו סגל לעונה הבאה.`;
    }
  }

  return { pos, teams, pts: me.pts, played: me.played, left, zone, target, line, blocked, up, down };
}

/**
 * The season the money goes.
 *
 * Once in a career, in ליגה א׳ or the לאומית, the club's money collapses under
 * the manager, the way it does at that level in Israel every other year. It is
 * not a punishment for playing badly: the owner explains it to his face, and
 * then the ordinary rules take over: a warning, and the next defeat.
 *
 * The debt used to be imposed PAST the line (1.5x), which read as a story but
 * played as a sentence: measured over 100 careers that reached ליגה א׳, every
 * single one was sacked that season, selling or not, because a sale raises
 * ~170K against a 400K hole beyond the line. Itzik's standing rule is "hard,
 * never impossible", so now it lands at nine tenths of the rope: a final
 * warning, selling unlocked, and the manager who wins and sells climbs out,
 * while the one who keeps losing still meets the letter.
 */
const CRISIS_TIERS = [3, 4];
const CRISIS_WEEK = 4;

const CRISIS_REASONS = [
  'העסק של הבעלים קרס, והחשבון של המועדון הלך איתו.',
  'הגיע חוב מס משנים שלפניך, והוא נחת עליך.',
  'הספונסר הראשי ביטל את החוזה באמצע העונה ולקח את הכסף בחזרה.',
  'הבעלים משך את ההשקעה כדי לכסות חובות אחרים שלו.',
];

/** Has the money already gone, or is this the round it goes? */
function maybeCrisis(gs: GameState): GameState {
  if (gs.crisisDone) return gs;
  const t = club(gs).tier;
  if (!CRISIS_TIERS.includes(t) || gs.week < CRISIS_WEEK) return gs;
  const reason = CRISIS_REASONS[Math.abs(gs.seasonSeed + gs.season) % CRISIS_REASONS.length];
  // nine tenths of what the owner will carry: the final warning, not the axe
  const hole = -Math.round(debtLimit(t) * 0.9);
  return {
    ...gs,
    crisisDone: true,
    crisisReason: reason,
    meters: { ...gs.meters, money: cash(Math.min(gs.meters.money, hole)) },
  };
}

/**
 * What the summer will pay at the whistle if the table stayed as it is today: the money for the place he is in
 * less what has already come in round by round. The promotion bonus is not counted, it is for a manager to earn.
 * Null once the season is over, when the summer screen says it with the real number.
 */
export function purseOutlook(gs: GameState): { expected: number; position: number } | null {
  if (gs.phase === 'season-end' || gs.week > gs.league.rounds) return null;
  const table = sortedTable(gs.league);
  const position = Math.max(1, table.findIndex(s => s.clubId === gs.clubId) + 1);
  const total = seasonPurse(club(gs).tier, position, gs.league.clubs.length);
  return { expected: Math.max(0, total - gs.purseEarlier), position };
}

/** The books as the owner sees them, and how close he is to acting. */
export function debt(gs: GameState): DebtState {
  return debtState(gs.meters.money, club(gs).tier, gs.meters.fans);
}

/** The promotion gate: what the division above wants, and whether we meet it. */
export function stadiumGate(gs: GameState): { nextTier: number; need: number; meets: boolean } | null {
  const t = club(gs).tier;
  if (t >= TOP_TIER) return null;
  const need = requiredCapacity(t + 1);
  if (need <= 0) return null;
  return { nextTier: t + 1, need, meets: gs.stadium.capacity >= need };
}

export function expansions(gs: GameState): ExpansionOption[] {
  return expansionOptions(club(gs).tier);
}

/** Why an expansion cannot be started, or null when it can. */
export function expansionBlockedReason(gs: GameState, opt: ExpansionOption): string | null {
  if (gs.stadium.project) return 'כבר יש בנייה בתהליך';
  if (gs.meters.money < opt.cost) return 'אין מספיק תקציב';
  return null;
}

/** Commit money to a build. It finishes a few rounds later, in commitRound. */
export function startStadiumProject(gs: GameState, key: ExpansionOption['key']): GameState {
  const opt = expansions(gs).find(o => o.key === key);
  if (!opt || expansionBlockedReason(gs, opt)) return gs;
  return {
    ...gs,
    meters: { ...gs.meters, money: cash(gs.meters.money - opt.cost) },
    stadium: {
      capacity: gs.stadium.capacity,
      project: { label: opt.label, addSeats: opt.addSeats, roundsLeft: opt.rounds, total: opt.rounds },
    },
  };
}

/** Move a build one round on. Returns the ground, a chronicle, and an unveil. */
function advanceStadium(gs: GameState): { stadium: Stadium; done: ChronicleEntry | null; reveal: StadiumReveal | null } {
  const p = gs.stadium.project;
  if (!p) return { stadium: gs.stadium, done: null, reveal: null };
  if (p.roundsLeft > 1) {
    return { stadium: { ...gs.stadium, project: { ...p, roundsLeft: p.roundsLeft - 1 } }, done: null, reveal: null };
  }
  const capacity = gs.stadium.capacity + p.addSeats;
  const upgraded = stadiumImageTier(capacity) !== stadiumImageTier(gs.stadium.capacity);
  const id = `stadium-${capacity}`;
  const done: ChronicleEntry | null = gs.chronicle.some(e => e.id === id) ? null : {
    id, kind: 'season_end', week: gs.week, icon: 'flag', tint: 'gold',
    title: 'האצטדיון גדל',
    body: `הבנייה הסתיימה. הקיבולת עלתה ל${capacity.toLocaleString('en-US')} מקומות, ועוד אוהדים אומרים שהם ישמעו יותר טוב מעכשיו.`,
  };
  const reveal: StadiumReveal = { image: stadiumImageTier(capacity), capacity, addSeats: p.addSeats, upgraded };
  return { stadium: { capacity, project: null }, done, reveal };
}

/** The player closed the stadium unveil overlay. */
export function clearStadiumReveal(gs: GameState): GameState {
  return { ...gs, stadiumReveal: null };
}
export function openSquad(gs: GameState): GameState {
  return { ...gs, phase: 'squad' };
}
export function openTransfers(gs: GameState, focus: MarketLine | null = null): GameState {
  return { ...gs, phase: 'transfers', marketFocus: focus };
}
export function backToHub(gs: GameState): GameState {
  return { ...gs, phase: 'hub' };
}

/** Whether the first-week explainer is owed: the hub, nothing in the way, unread. */
export function tutorialDue(gs: GameState): boolean {
  return gs.phase === 'hub' && gs.notices.length === 0 && !gs.tutorialSeen;
}
export function markTutorialSeen(gs: GameState): GameState {
  return gs.tutorialSeen ? gs : { ...gs, tutorialSeen: true };
}

/* ---------------------------------------------------------- squad editing */

function writeSquad(gs: GameState, squad: Squad): GameState {
  return {
    ...gs,
    league: { ...gs.league, squads: { ...gs.league.squads, [gs.clubId]: squad } },
  };
}

/* -------------------------------------------------------------- discipline */

/**
 * A red card costs the next match, and the manager has to deal with it
 * himself: the man is still in his squad, he is simply not allowed on the team
 * sheet, so the round will not start while he is in the eleven. The sheet also
 * needs sixteen eligible names, and a squad of sixteen with one man banned has
 * fifteen, so a youth is registered for the round to make up the number. He
 * never plays; he goes back to the academy the moment the round is over.
 */
const PENDING = -1;

/** Sitting out the coming round. */
export function isSuspended(gs: GameState, playerId: string): boolean {
  return (gs.suspensions[playerId] ?? 0) > 0;
}

/** On the sheet but not allowed on the pitch: suspended, or the registered youth. */
export function isUnavailable(gs: GameState, playerId: string): boolean {
  return isSuspended(gs, playerId) || gs.emergencyYouth === playerId || !!gs.sitOut[playerId];
}

/** Names the league will accept on the sheet: the squad less the suspended. */
export function eligibleCount(gs: GameState): number {
  const sq = mySquad(gs);
  return [...sq.starters, ...sq.bench].filter(p => !isSuspended(gs, p.id)).length;
}

/** Why the round cannot start yet, or null when the sheet is in order. */
export function weekBlockedReason(gs: GameState): string | null {
  const sq = mySquad(gs);
  const banned = sq.starters.find(p => isSuspended(gs, p.id));
  if (banned) return `${banned.name} מורחק למחזור הזה. תוציא אותו מההרכב.`;
  const sitting = sq.starters.find(p => gs.sitOut[p.id]);
  if (sitting) return `${sitting.name} ${gs.sitOut[sitting.id]} במחזור הזה, כמו שהחלטת. תוציא אותו מההרכב.`;
  const n = eligibleCount(gs);
  if (n < MIN_SQUAD) return `יש רק ${n} שמות כשירים לסגל, הליגה דורשת ${MIN_SQUAD}. תרשום שחקן מהנוער למחזור.`;
  return null;
}

/** The sheet is short and the academy is the only place a name can come from. */
export function needsEmergencyYouth(gs: GameState): boolean {
  return eligibleCount(gs) < MIN_SQUAD && !gs.emergencyYouth;
}

/**
 * Register a youth for one round, any age. He fills the sixteenth line on the
 * sheet and nothing else: not the eleven, not the bench, and after the round
 * he is back at the academy.
 */
export function registerYouthEmergency(gs: GameState, playerId: string): GameState {
  const kid = gs.youth.players.find(p => p.id === playerId);
  if (!kid || !needsEmergencyYouth(gs) || squadSize(gs) >= MAX_SQUAD) return gs;
  const sq = mySquad(gs);
  const next = writeSquad(gs, { starters: sq.starters, bench: [...sq.bench, kid] });
  return {
    ...next,
    emergencyYouth: kid.id,
    youth: { ...gs.youth, players: gs.youth.players.filter(p => p.id !== playerId) },
    pendingOutcome: `${kid.name} נרשם לסגל למחזור. הוא לא ישחק, ויחזור לנוער אחרי המשחק.`,
  };
}

/** After the round: the registered youth goes back down, with a word to the manager. */
function returnEmergencyYouth(gs: GameState): GameState {
  const id = gs.emergencyYouth;
  if (!id) return gs;
  const sq = mySquad(gs);
  const kid = [...sq.starters, ...sq.bench].find(p => p.id === id);
  const cleared = { ...gs, emergencyYouth: null };
  if (!kid) return cleared;   // sold or released in the meantime, nothing to send down
  const next = removePlayer(cleared, id);
  return {
    ...next,
    youth: { ...next.youth, players: [...next.youth.players, kid] },
    notices: [...next.notices, { kind: 'youth_back', name: kid.name }],
  };
}

/**
 * Bank the reds from the match just played. They sit as pending until the
 * week ends, so the round they happened in is not also the round they cost.
 */
function bookSuspensions(gs: GameState, r: MatchResult): Record<string, number> {
  const out = { ...gs.suspensions };
  for (const e of r.events ?? []) {
    if (e.type === 'red' && e.teamId === gs.clubId && e.playerId) out[e.playerId] = PENDING;
  }
  return out;
}

/**
 * The week is over: pending reds become the one round they cost, the round
 * just served is cleared, and the manager is told about anyone newly banned
 * before he sees the hub, with the sixteen names problem spelled out when his
 * squad is exactly sixteen.
 */
function serveSuspensions(gs: GameState): GameState {
  const sq = mySquad(gs);
  const all = [...sq.starters, ...sq.bench];
  const suspensions: Record<string, number> = {};
  const notices: SquadNotice[] = [...gs.notices];
  for (const [id, v] of Object.entries(gs.suspensions)) {
    if (v === PENDING) suspensions[id] = 1;
    else if (v > 1) suspensions[id] = v - 1;
  }
  const after = { ...gs, suspensions };
  const nextFx = playerFixture({ ...after, week: gs.week + 1 });
  const rivalId = nextFx ? (nextFx.homeId === gs.clubId ? nextFx.awayId : nextFx.homeId) : null;
  const rival = gs.league.clubs.find(c => c.id === rivalId)?.short ?? 'היריבה הבאה';
  for (const [id, v] of Object.entries(gs.suspensions)) {
    if (v !== PENDING) continue;
    const p = all.find(x => x.id === id);
    if (!p) continue;
    notices.push({ kind: 'suspended', playerId: id, name: p.name, rival, needYouth: eligibleCount(after) < MIN_SQUAD });
  }
  return { ...after, notices };
}

/** The manager has read the notice on top of the pile. */
export function dismissNotice(gs: GameState): GameState {
  return { ...gs, notices: gs.notices.slice(1) };
}

/* ---------------------------------------------------------- the team sheet */

/**
 * The eleven in the formation's slot order: who wears which shirt.
 *
 * The automatic seating is the base, by fit; the manager's pins are laid over
 * it, each pinned man swapped into his slot. A pin whose man is no longer a
 * starter is simply skipped, so nothing has to be repaired when the eleven
 * change under it.
 */
export function lineup(gs: GameState): Player[] {
  const sq = mySquad(gs);
  const f = formation(gs.tactic.formation);
  const out = fillFormation(sq.starters, f);
  if (!gs.seats) return out;
  gs.seats.forEach((id, i) => {
    if (!id || i >= out.length) return;
    const j = out.findIndex(p => p.id === id);
    if (j < 0 || j === i) return;
    const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
  });
  return out;
}

/** The slot a starter is in, or -1 off the sheet. */
export function slotOf(gs: GameState, playerId: string): number {
  return lineup(gs).findIndex(p => p.id === playerId);
}

/** Why two men on the sheet cannot change shirts, or null when they can. */
export function moveBlockedReason(gs: GameState, aId: string, bId: string): string | null {
  const men = lineup(gs);
  const a = men.find(p => p.id === aId), b = men.find(p => p.id === bId);
  if (!a || !b) return 'שניהם צריכים להיות בהרכב';
  if (a.id === b.id) return null;
  const f = formation(gs.tactic.formation);
  const ia = men.indexOf(a), ib = men.indexOf(b);
  const gkA = f.slots[ia]?.line === 'GK', gkB = f.slots[ib]?.line === 'GK';
  // the goal is the one shirt that does not move: only a keeper wears it, and
  // the keeper wears nothing else
  if (gkA || gkB || a.position === 'GK' || b.position === 'GK') return 'בשער משחק רק שוער, והשוער נשאר בשער';
  return null;
}

/** Two men on the sheet change shirts. Anyone can wear any outfield shirt. */
export function movePlayers(gs: GameState, aId: string, bId: string): GameState {
  if (moveBlockedReason(gs, aId, bId)) return gs;
  const men = lineup(gs);
  const ia = men.findIndex(p => p.id === aId), ib = men.findIndex(p => p.id === bId);
  const seats = men.map(p => p.id);
  seats[ia] = bId; seats[ib] = aId;
  return { ...gs, seats };
}

/* ---------------------------------------------------------- squad editing */

/** Why a swap is not allowed, or null when it is fine. */
/**
 * Is there anybody left in the squad who can actually keep goal this round.
 *
 * Not "is there a keeper", which there always is now, but is one of them free
 * to play: not banned, not sat out by an answer the manager gave, not the
 * youth registered for the sheet alone.
 */
export function noKeeperAvailable(gs: GameState): boolean {
  const sq = mySquad(gs);
  return ![...sq.starters, ...sq.bench].some(p =>
    p.position === 'GK' && !isUnavailable(gs, p.id));
}

export function swapBlockedReason(a: Player, b: Player, gs?: GameState): string | null {
  const aGk = a.position === 'GK', bGk = b.position === 'GK';
  // The rule is that exactly one keeper is in the eleven after the swap, not
  // that a keeper only ever swaps with a keeper. The old wording trapped a
  // reserve keeper who had been pushed into an outfield slot over the summer:
  // he was not in goal, and still nobody but a keeper could replace him.
  const gksNow = gs ? mySquad(gs).starters.filter(p => p.position === 'GK').length : 1;
  const gksAfter = gksNow - (aGk ? 1 : 0) + (bGk ? 1 : 0);
  // An eleven with nobody in goal is normally refused. The one exception is the
  // night there is nobody to put there: both keepers banned, injured or sat out
  // by an answer the manager gave. Then a defender goes in goal, which is what
  // happens on a real pitch, and it costs him about half again as many goals.
  // Without this door the career simply stops, and one did.
  if (gksAfter === 0 && !(gs && noKeeperAvailable(gs))) return 'חייב להישאר שוער אחד בשער';
  if (gksAfter > 1) return 'יש כבר שוער בשער, שוער שני לא עולה';
  // the bench man is the one coming in
  if (gs && isSuspended(gs, b.id)) return `${b.name} מורחק למחזור הזה, הוא לא יכול לעלות להרכב`;
  if (gs && gs.emergencyYouth === b.id) return `${b.name} רשום לסגל בלבד, הוא לא משחק במחזור הזה`;
  if (gs && gs.sitOut[b.id]) return `${b.name} ${gs.sitOut[b.id]} במחזור הזה, כמו שהחלטת`;
  return null;
}

/** Move a starter to the bench and a bench player into the XI. */
/**
 * How much better a man on the bench has to be before it is worth saying.
 *
 * One point is noise, and nagging about noise teaches a manager to stop
 * reading the line it is written on.
 */
export const UPGRADE_WORTH_SAYING = 3;

export interface Upgrade { out: Player; in: Player; gain: number }

/**
 * The bench man most worth bringing into the eleven, or nobody.
 *
 * A squad improves from underneath. The boys on the bench grow over a summer
 * and the men in the eleven age, and nothing in the game ever said so: measured
 * over eight careers, by the fourth season the worst man in the eleven averaged
 * 43 while the best on the bench averaged 57, and in eight out of eight
 * somebody better was sitting down. A manager watching the same eleven every
 * week reasonably concludes that his players never develop, and one wrote in to
 * say exactly that. The breakout that now lifts one boy a summer lands on the
 * bench too, so without this it would never reach a pitch.
 *
 * Judged in the shirt, not on the raw rating: effectiveOverall for that slot is
 * the same number the match engine reads, so a striker is never recommended
 * into a centre back's shirt on the strength of being a better striker. Every
 * candidate goes through swapBlockedReason first, so a suspended man, one the
 * manager sat out, and the keeper who has to stay in goal are never suggested.
 *
 * It suggests one, the biggest. The screen offers it and the manager taps it,
 * or does not: an eleven rearranged behind his back is not his eleven.
 */
export function bestUpgrade(gs: GameState, minGain = UPGRADE_WORTH_SAYING): Upgrade | null {
  const form = formation(gs.tactic?.formation);
  const onPitch = lineup(gs);
  const bench = mySquad(gs).bench;
  let best: Upgrade | null = null;
  onPitch.forEach((p, i) => {
    const role = form.slots[i]?.role;
    if (!role) return;
    const his = effectiveOverall(p, role, overall(p));
    for (const b of bench) {
      if (swapBlockedReason(p, b, gs)) continue;
      const gain = effectiveOverall(b, role, overall(b)) - his;
      if (gain >= minGain && (!best || gain > best.gain)) best = { out: p, in: b, gain };
    }
  });
  return best;
}

export function swapPlayers(gs: GameState, starterId: string, benchId: string): GameState {
  const sq = mySquad(gs);
  const si = sq.starters.findIndex(p => p.id === starterId);
  const bi = sq.bench.findIndex(p => p.id === benchId);
  if (si < 0 || bi < 0) return gs;
  if (swapBlockedReason(sq.starters[si], sq.bench[bi], gs)) return gs;

  // the man coming on takes the shirt of the man going off, so the sheet
  // does not reshuffle around a substitution
  const seats = lineup(gs).map(p => p.id === starterId ? benchId : p.id);
  const starters = [...sq.starters];
  const bench = [...sq.bench];
  const tmp = starters[si];
  starters[si] = bench[bi];
  bench[bi] = tmp;
  return { ...writeSquad(gs, { starters, bench }), seats };
}

/* ------------------------------------------------------------- transfers */

export function squadSize(gs: GameState): number {
  const sq = mySquad(gs);
  // a man on loan is not the club's: he neither fills the cap nor holds up the floor. Nor is a boy registered from the
  // academy for one round
  return [...sq.starters, ...sq.bench].filter(p => !isOnLoan(gs, p.id) && !(gs.youthUp ?? []).includes(p.id)).length;
}

export function signBlockedReason(gs: GameState, fa: FreeAgent): string | null {
  if (!transferWindow(gs).open) return 'החלון סגור';
  if (gs.meters.money < fa.fee) return 'אין מספיק תקציב';
  if (squadSize(gs) >= MAX_SQUAD) return `הסגל מלא, מקסימום ${MAX_SQUAD} שחקנים`;
  if (isForeign(fa.player) && foreignCount([...mySquad(gs).starters, ...mySquad(gs).bench]) >= FOREIGN_MAX) {
    return `אפשר עד ${FOREIGN_MAX} זרים בסגל`;
  }
  return null;
}

export function signPlayer(gs: GameState, playerId: string): GameState {
  const fa = gs.market.find(f => f.player.id === playerId);
  if (!fa || signBlockedReason(gs, fa)) return gs;
  const sq = mySquad(gs);
  const next = { ...writeSquad(gs, { starters: sq.starters, bench: [...sq.bench, fa.player] }), arrivals: [...gs.arrivals, fa.player.id] };
  return {
    ...next,
    meters: { ...gs.meters, money: cash(gs.meters.money - fa.fee) },
    market: gs.market.filter(f => f.player.id !== playerId),
    contracts: { ...gs.contracts, [fa.player.id]: contractTerms(fa, club(gs).tier).years },
  };
}

/** How many men in the squad can keep goal. */
export function keeperCount(gs: GameState): number {
  const sq = mySquad(gs);
  return [...sq.starters, ...sq.bench].filter(p => p.position === 'GK').length;
}

/**
 * Why this man cannot leave: he is one of the last two keepers.
 *
 * DRAFT WORDING, Itzik's to write. Short because the sell screen prints the
 * reason on the button itself, where there is room for about that much.
 */
export function lastKeeperReason(gs: GameState, playerId: string): string | null {
  const sq = mySquad(gs);
  const p = [...sq.starters, ...sq.bench].find(x => x.id === playerId);
  if (!p || p.position !== 'GK') return null;
  if (keeperCount(gs) > MIN_KEEPERS) return null;
  return `חייבים ${MIN_KEEPERS} שוערים בסגל`;
}

export function sellBlockedReason(gs: GameState, playerId?: string): string | null {
  // A club in the red is always allowed to sell. Without this the owner could
  // sack you for a debt you had no way to pay off, which is a trap, not pressure.
  if (playerId && isOnLoan(gs, playerId)) return 'מושאל, לא למכירה';
  if (playerId && (gs.youthUp ?? []).includes(playerId)) return 'הוא בסגל המחזור מהנוער, ואחריו חוזר למחלקה';
  if (!transferWindow(gs).open && debt(gs).level === 'clear') return 'החלון סגור';
  if (squadSize(gs) <= MIN_SQUAD) return `אי אפשר להיות פחות מ-${MIN_SQUAD} שחקנים בסגל`;
  if (playerId && isFriend(gs.friends, { id: playerId })) return 'חבר שלך. אפשר רק מהכרטיס המלא';
  if (playerId) {
    const keeper = lastKeeperReason(gs, playerId);
    if (keeper) return keeper;
    // A man in the eleven can go now, but only if somebody is allowed to take
    // his shirt. Refusing here rather than inside the sale means the button
    // says why instead of doing nothing when it is pressed.
    if (mySquad(gs).starters.some(p => p.id === playerId) && !benchReplacementFor(gs, playerId)) {
      return 'אין מי שיחליף אותו בהרכב';
    }
  }
  return null;
}

/**
 * Who takes the shirt when a man is sold out of the eleven.
 *
 * His own position first, then anyone on his line, then simply the best man
 * left. The candidates are filtered through swapBlockedReason rather than
 * beside it, because that is where the eleven's rules already live: the keeper
 * who has to stay in goal, the man suspended this round, the one sat out by an
 * answer the manager gave. A second list of the same rules here would be one
 * refactor away from disagreeing with the first.
 */
function benchReplacementFor(gs: GameState, starterId: string): Player | null {
  const sq = mySquad(gs);
  const out = sq.starters.find(p => p.id === starterId);
  if (!out) return null;
  const line = LINE[out.position] ?? 'MID';
  const legal = sq.bench.filter(b => !swapBlockedReason(out, b, gs));
  if (!legal.length) return null;
  const fit = (b: Player) =>
    b.position === out.position ? 2 : (LINE[b.position] ?? 'MID') === line ? 1 : 0;
  return [...legal].sort((a, b) => fit(b) - fit(a) || overall(b) - overall(a))[0];
}

/**
 * Sell a man, off the bench or straight out of the eleven.
 *
 * It used to be the bench alone, and the market said so in as many words: take
 * him out on the squad screen first. A reader in ליגה ג׳ found what was wrong
 * with that. The summer is the one window that is always open, and the summer
 * has no squad screen, so a manager who walked into it wanting rid of a man in
 * his eleven was told to do something the game gave him nowhere to do, and
 * then had to carry that man through the summer and seven more rounds before
 * the winter window would have him.
 *
 * So the eleven empties itself now: the best man on the bench who is allowed
 * to take that shirt takes it, and the sale goes through from there. The move
 * runs through swapPlayers, so the eleven that comes out the other side obeys
 * exactly what an ordinary substitution obeys, and a sale with no legal
 * replacement behind it is refused before any money moves rather than halfway
 * through.
 *
 * And never one of the two he brought with him. They are ordinary players in
 * every other respect, which was the problem: one of them sitting on the
 * bench appeared in the market with a price and a Sell button, one tap from
 * gone. A friend can still be let go, but from his own card, deliberately,
 * and the screen asks first. The refusal lives here rather than only in the
 * market, so no screen can sell one by accident later.
 */
export function sellPlayer(gs: GameState, playerId: string): GameState {
  if (sellBlockedReason(gs, playerId)) return gs;
  if (isFriend(gs.friends, { id: playerId })) return gs;

  let g = gs;
  if (mySquad(g).starters.some(p => p.id === playerId)) {
    const inn = benchReplacementFor(g, playerId);
    if (!inn) return gs;
    g = swapPlayers(g, playerId, inn.id);
    // swapPlayers refuses by returning the state untouched, so the eleven is
    // asked whether it worked rather than assumed to have done as it was told
    if (mySquad(g).starters.some(p => p.id === playerId)) return gs;
  }

  const sq = mySquad(g);
  const p = sq.bench.find(x => x.id === playerId);
  if (!p) return gs;
  const next = writeSquad(g, { starters: sq.starters, bench: sq.bench.filter(x => x.id !== playerId) });
  const moved = moveToLeagueClub(next, p);
  return {
    ...moved.gs,
    meters: { ...gs.meters, money: cash(gs.meters.money + sellPrice(p, club(gs).tier)) },
  };
}

/* ------------------------------------------------- where a sold man goes */

const LINE: Record<string, 'GK' | 'DEF' | 'MID' | 'FWD'> = {
  GK: 'GK', CB: 'DEF', LB: 'DEF', RB: 'DEF', LWB: 'DEF', RWB: 'DEF',
  CDM: 'MID', CM: 'MID', CAM: 'MID', LM: 'MID', RM: 'MID',
  LW: 'FWD', RW: 'FWD', ST: 'FWD', CF: 'FWD',
};

/**
 * A man sold in the window goes somewhere real: a club in this league, and
 * he plays for it. He takes the shirt of their weakest man on his line when
 * he is the better player, otherwise their bench, so you will meet him, and
 * if he scores against you the reporter will know exactly who he is. The
 * buyer is the club that needs him most on his line, ties broken by the seed.
 */
export function moveToLeagueClub(
  gs: GameState, p: Player, preferId?: string | null,
): { gs: GameState; clubId: string } {
  const rng = createRng(drawSeed(gs, 10_000 + hashId(p.id)));
  const line = LINE[p.position] ?? 'MID';
  const others = gs.league.clubs.filter(c => c.id !== gs.clubId && gs.league.squads[c.id]);
  // the club whose weakest starter on his line is weakest of all wants him most
  const weakest = (id: string) => {
    const s = gs.league.squads[id].starters.filter(x => (LINE[x.position] ?? 'MID') === line);
    return s.length ? Math.min(...s.map(overall)) : 0;
  };
  const ranked = [...others].sort((a, b) => weakest(a.id) - weakest(b.id) || rng() - 0.5);
  // a named club takes him whatever his line needs, which is how a man goes
  // somewhere for a reason rather than wherever the table has a gap
  const asked = preferId ? others.find(c => c.id === preferId) : undefined;
  const buyer = asked ?? ranked[0] ?? others[0];
  if (!buyer) return { gs, clubId: gs.clubId };

  const sq = gs.league.squads[buyer.id];
  const starters = [...sq.starters];
  let bench = [...sq.bench];
  const onLine = starters.map((x, i) => ({ x, i })).filter(({ x }) => (LINE[x.position] ?? 'MID') === line);
  const worst = onLine.sort((a, b) => overall(a.x) - overall(b.x))[0];
  if (worst && overall(p) > overall(worst.x)) {
    bench.push(worst.x);
    starters[worst.i] = p;
  } else {
    bench.push(p);
  }
  // their squad does not grow forever: the weakest reserve makes room
  if (starters.length + bench.length > MAX_SQUAD) {
    const drop = [...bench].sort((a, b) => overall(a) - overall(b))[0];
    bench = bench.filter(x => x !== drop);
  }
  const exit: PlayerExit = { id: p.id, name: p.name, clubId: buyer.id, season: gs.season, week: gs.week };
  return {
    clubId: buyer.id,
    gs: {
      ...gs,
      league: { ...gs.league, squads: { ...gs.league.squads, [buyer.id]: { starters, bench } } },
      exits: [...gs.exits, exit],
      chronicle: [...gs.chronicle, {
        id: `sold-${p.id}-s${gs.season}`, kind: 'sold', week: gs.week,
        title: `${p.name} עבר ל${buyer.short}`,
        body: `נפרדתם בחלון. בפעם הבאה שתפגשו הוא בצד השני, ואל תתפלא אם הוא ירצה להוכיח משהו.`,
        icon: 'handshake', tint: 'draw',
      }],
    },
  };
}

function hashId(s: string): number {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 100000;
}

/** Men of yours now wearing the next opponent's shirt, most recent first. */
export function exesAtNextOpponent(gs: GameState): PlayerExit[] {
  const fx = playerFixture(gs);
  if (!fx) return [];
  const oppId = fx.homeId === gs.clubId ? fx.awayId : fx.homeId;
  const there = new Set([...gs.league.squads[oppId].starters, ...gs.league.squads[oppId].bench].map(p => p.id));
  return gs.exits.filter(e => e.clubId === oppId && there.has(e.id)).reverse();
}

/* ---------------------------------------------------------- parting ways */

/**
 * Letting a man go from his own card, two ways.
 *
 * In the window he is told to find himself a club and the club takes most of
 * his value. Out of the window, when the books are in the red, the two of you
 * part as friends: a quarter of his value, and his wage off the bill from the
 * next round, which is the point of it. The second is a way out of debt that
 * costs something, so it is only offered when the club is actually short.
 */
export type PartKind = 'transfer' | 'friends';
export interface PartOption {
  kind: PartKind;
  label: string;
  /** what the club receives */
  fee: number;
  /** his weekly wage, which stops with him */
  wage: number;
  detail: string;
}

/** Why he cannot be let go at all right now, or null. */
export function partBlockedReason(gs: GameState, playerId: string): string | null {
  const sq = mySquad(gs);
  const p = [...sq.starters, ...sq.bench].find(x => x.id === playerId);
  if (!p) return 'הוא לא בסגל שלך';
  // T3: a story friend cannot be parted with in the season he arrived in
  if (gs.season === 1 && storyFriendIds(gs).has(playerId)) return 'חבר שלך מהעונה הראשונה. אפשר רק מהעונה השנייה, מהכרטיס המלא';
  if (gs.emergencyYouth === playerId || (gs.youthUp ?? []).includes(playerId)) return 'הוא רשום רק למחזור הזה, אחריו הוא חוזר לנוער';
  if (squadSize(gs) <= MIN_SQUAD) return `אי אפשר לרדת מתחת ל-${MIN_SQUAD} שחקנים. תחתים מישהו קודם.`;
  const keeper = lastKeeperReason(gs, playerId);
  if (keeper) return `${keeper}. תחתים שוער קודם.`;
  return null;
}

/** The ways this man can be let go this week. Empty when none apply. */
export function partOptions(gs: GameState, playerId: string): PartOption[] {
  if (partBlockedReason(gs, playerId)) return [];
  const sq = mySquad(gs);
  const p = [...sq.starters, ...sq.bench].find(x => x.id === playerId)!;
  const tier = club(gs).tier;
  const wage = playerWage(p, tier);
  const out: PartOption[] = [];
  if (transferWindow(gs).open) {
    out.push({
      kind: 'transfer', label: 'תחפש לך קבוצה אחרת', fee: sellPrice(p, tier), wage,
      detail: 'הוא עובר בחלון, והמועדון מקבל 85% מהשווי שלו.',
    });
  } else if (debt(gs).level !== 'clear') {
    out.push({
      kind: 'friends', label: 'נפרדים כידידים', fee: Math.round(transferFee(p, tier) * 0.25 / 1000) * 1000, wage,
      detail: 'החלון סגור והקופה במינוס. הוא משוחרר, המועדון מקבל 25% מהשווי, והשכר שלו יורד מההוצאות מהמחזור הבא.',
    });
  }
  return out;
}

/* ------------------------------------------------------- the local rivalry */

/**
 * Every season has somebody to hate, and this is what guarantees it.
 *
 * Measured over 236 seasons of played out careers: 69% of divisions already
 * hold a town inside ten kilometres, and 31% hold nothing at all. Ramat Gan has
 * Givatayim nine hundred metres away; Beersheba's nearest neighbour in its own
 * division is sixteen kilometres off and Eilat's is a hundred and seventeen.
 *
 * So where the map gives nobody, the town gives somebody: the other club in the
 * same city, the one that was always in the shadow, which the game already
 * knows how to build because a sacked manager is handed exactly that club. It
 * takes the place AND the squad of the town furthest away, the least local club
 * in the division, so the size of the league and the fixture list are untouched.
 * That is the same move returnOfTheNemesis makes, for the same reason.
 *
 * It must run BEFORE the fixtures are drawn, which is why every caller does it
 * while the division is still just a list of clubs.
 */
function withLocalRival(
  clubs: Club[], squads: Record<string, Squad>, myId: string, tier: number,
): { clubs: Club[]; squads: Record<string, Squad>; rival: LocalRival | null } {
  let next = clubs;
  let nextSquads = squads;
  let found = localRival(next, myId);

  if (!found) {
    const me = next.find(c => c.id === myId);
    const out = furthestFrom(next, myId);
    // a town that is not on the map has no second club to make, and the dev
    // league of invented villages is exactly that case
    if (me && out && isRealTown(me.city)) {
      // The short name has to say which of the two this is. siblingClub hands
      // back the town as the short name, the same one my club already carries,
      // and the table, the fixture list and the match header all read shorts:
      // measured on אילת and on טבריה, the division printed the same word
      // twice. The word in front of the town is what tells the two apart on any table, so
      // the second club goes by its full name.
      const made = siblingClub(me.city, tier, myId);
      const twin = { ...made, short: made.name };
      next = next.map(c => (c.id === out.id ? twin : c));
      nextSquads = { ...squads };
      if (nextSquads[out.id]) { nextSquads[twin.id] = nextSquads[out.id]; delete nextSquads[out.id]; }
      found = localRival(next, myId);
    }
  }

  // written on both clubs, because that is what the derby registry reads
  if (found) {
    const them = found.id;
    next = next.map(c =>
      c.id === myId ? { ...c, rivalId: them }
        : c.id === them ? { ...c, rivalId: myId }
          : c);
  }
  return { clubs: next, squads: nextSquads, rival: found };
}

/**
 * Hand the registry my one rivalry and nothing else.
 *
 * It used to be handed every club's rivalId, and isDerby is symmetric, so any
 * club whose nearest town was mine made that fixture a derby too: measured, one
 * season in five had two to four different "derbies" in it, and one had eight
 * of its fourteen rounds. Nobody ever asks whether two OTHER clubs are rivals,
 * only whether tonight is, so one pair is all the registry needs to hold.
 */
function registerLocalRivalry(clubs: Club[], myId: string): void {
  const found = localRival(clubs, myId);
  setDerbies(found ? [[myId, found.id]] : []);
}

/** My local rival in the division right now, and which kind it is. */
export function myLocalRival(gs: GameState): LocalRival | null {
  return localRival(gs.league.clubs, gs.clubId);
}

/**
 * The club the derby is against, when it is in the division.
 *
 * Every region league is built with one, and the club's own rivalId is the
 * same club the builder calls the derby, so the second road here is a
 * formality that has never been walked. It is kept because a card that
 * promises a derby must not be written by a function that can return anyone.
 */
function derbyRivalId(gs: GameState): string | null {
  const here = (id: string | null | undefined): id is string =>
    !!id && id !== gs.clubId && !!gs.league.squads[id] && gs.league.clubs.some(c => c.id === id);
  const mine = club(gs).rivalId;
  if (here(mine)) return mine;
  const other = gs.league.clubs.find(c =>
    c.id !== gs.clubId && !!gs.league.squads[c.id] && isDerby(gs.clubId, c.id));
  return other?.id ?? null;
}

/** Let him go the chosen way. A kind that is not on offer this week does nothing. */
export function partWays(gs: GameState, playerId: string, kind: PartKind): GameState {
  const opt = partOptions(gs, playerId).find(o => o.kind === kind);
  if (!opt) return gs;
  const sq = mySquad(gs);
  const p = [...sq.starters, ...sq.bench].find(x => x.id === playerId)!;
  // one of the two he brought with him, and whether he had given his word
  const wasFriend = isFriend(gs.friends, { id: playerId });
  const brokeWord = wasFriend && !!gs.mate.neverSell;
  const gone = removePlayer(gs, playerId);
  // a transfer is to somewhere: he joins a club in this league and plays there.
  // One of the two does not drift off to whoever happens to need a midfielder.
  // He signs for the derby, because the shirt he ends up in has to be a shirt
  // this manager will have to look at again.
  const toRival = wasFriend ? derbyRivalId(gs) : null;
  const moved = kind === 'transfer' ? moveToLeagueClub(gone, p, toRival) : { gs: gone, clubId: null };
  const next = moved.gs;
  const buyer = moved.clubId ? gs.league.clubs.find(c => c.id === moved.clubId)?.short : null;
  return {
    ...next,
    friends: wasFriend ? markFriendGone(next.friends, playerId) : next.friends,
    // and he hears where the man went the way everyone else hears it
    notices: wasFriend && buyer && moved.clubId === toRival
      ? [...next.notices, {
          kind: 'story' as const,
          title: `${surnameOf(p.name)} חתם ביריבה`,
          body: `${p.name} חתם ב${buyer}. בדרבי הקרוב הוא יעמוד מולך, והיציע שלהם כבר יודע מאיפה הוא הגיע.`,
        }]
      : next.notices,
    meters: {
      ...next.meters,
      money: cash(next.meters.money + opt.fee),
      // A word given to a friend and then broken is not the same as a squad
      // decision. The room watched him give it, and the room watches it break.
      morale: brokeWord ? moraleShift(next.meters.morale, BROKEN_WORD_MORALE) : next.meters.morale,
    },
    // and it comes back at him next week, the way a word does. A line in a
    // list he would have to go and open is not a consequence.
    followUps: brokeWord
      ? [...next.followUps, {
          season: gs.season, week: gs.week + 1,
          title: `${kind === 'transfer' ? 'מכרת' : 'שיחררת'} את מי שהבטחת לו`,
          body: `אמרת ל${p.name} שאותו לא תמכור לעולם. ${kind === 'transfer' ? 'מכרת' : 'שיחררת אותו'}. בשכונה יודעים.`,
        }]
      : next.followUps,
    preResolved: [...next.preResolved, `renew-${playerId}`],
    pendingOutcome: kind === 'transfer'
      ? `${p.name} עבר ל${buyer ?? 'קבוצה אחרת'}. ${formatShekels(opt.fee)} נכנסו לקופה.`
      : `${p.name} שוחרר בהסכמה. ${formatShekels(opt.fee)} נכנסו, ו-${formatShekels(opt.wage)} לשבוע ירדו מההוצאות.`,
  };
}

function formatShekels(n: number): string {
  return `₪${moneyShort(n)}`;
}

export { playerValue, sellPrice, MIN_SQUAD, MAX_SQUAD, MIN_KEEPERS };

/* ------------------------------------------------------------- friends */

/**
 * Rounds of football this manager has actually played, across every season of
 * the career. This is the number a friend has to reach before he is worth
 * anything to whoever invited him, which is what makes faking an invite cost
 * more than the gem it pays.
 */
export function roundsPlayed(gs: GameState): number {
  const perSeason = gs.league?.rounds ?? 14;
  return Math.max(0, (gs.season - 1) * perSeason + gs.week - 1);
}

/** The code this manager sends back to whoever invited him, once he has played. */
export function thanksCode(gs: GameState): string | null {
  const inviter = gs.invite?.invitedBy;
  if (!inviter) return null;
  const played = roundsPlayed(gs);
  if (played < ROUNDS_TO_COUNT) return null;
  return makeThanks(deviceId(), inviter, played);
}

/** How many more rounds before the thank you code exists. */
export function roundsUntilThanks(gs: GameState): number {
  return Math.max(0, ROUNDS_TO_COUNT - roundsPlayed(gs));
}

/** Remember who brought this manager in, and hand him his welcome gems. */
export function acceptInvite(gs: GameState, ref: string): GameState {
  // only once, and never your own code
  if (gs.invite?.invitedBy || ref === myCode()) return gs;
  return {
    ...gs,
    gems: gs.gems + GEMS_FOR_JOINING,
    invite: { ...(gs.invite ?? emptyInvite()), invitedBy: ref },
  };
}

export interface RedeemResult {
  gs: GameState; ok: boolean; message: string;
  /** for a weekend prize: in, already in (the same nonce), or no career to put it in; the phone keeps the token only on the last */
  reason?: 'applied' | 'duplicate' | 'no-career';
}

/**
 * The weekend league's prize comes home (Itzik, 25.10, option A). The money is a fixed sum by the division the
 * manager is in (weekendMoney: a week of daily gifts for a first title, the token's wageRounds as the factor), never
 * the squad's wage bill, which could be blown up by signing three stars the day before; the division is the lower of
 * where the career is and where it was when the phone first saw the prize, so a promotion in between does not inflate
 * it. The fans go up by place. No gems with a prize, whatever the token says: gems only for the third title of a
 * month (Israel's calendar, by the final), once a month. Places one to three go in the cabinet. A nonce comes in once.
 */
export function applyWeekendPrize(gs: GameState, token: WeekendPrizeInput): RedeemResult {
  const had = gs.weekend ?? emptyWeekend();
  if (had.applied.includes(token.nonce)) return { gs, ok: false, message: 'הפרס הזה כבר בקופה', reason: 'duplicate' };
  if (!gs.clubId) return { gs, ok: false, message: 'צריך קריירה כדי לקבל את הפרס', reason: 'no-career' };
  const o = weekendOutcome(had, token, club(gs).tier);
  const date = weekendDate(token.final);
  const clubName = club(gs).name;
  const cash = o.money > 0 ? `₪${o.money.toLocaleString('en-US')}` : '';
  let title: string, body: string, message: string;
  if (token.place === 1) {
    title = `🏆 אלוף ליגת השכונה ${date}`;
    body = `${token.leagueName}: מקום 1. ${cash} נכנסו לקופה של ${clubName}, והיציע שר. התואר ה-${o.titleNo}.${o.triple ? ` שלוש אליפויות בחודש, ${o.gems} יהלומים.` : ''}`;
    message = `${cash} בקופה, ואוהדים +${o.fans}.${o.triple ? ` משולש החודש: ${o.gems} יהלומים.` : ''} התואר ה-${o.titleNo} שלך בליגת השכונה.`;
  } else {
    title = token.place === 2 ? `סגן אלוף הסופשבוע ${date}` : token.place === 3 ? `מקום שלישי בסופשבוע ${date}` : token.finished ? `שיחקת את הסופשבוע ${date}` : `הסופשבוע ${date}`;
    body = o.money > 0
      ? `${token.leagueName}: מקום ${token.place}. ${cash} נכנסו לקופה של ${clubName}. הבעלים שמע.`
      : `${token.leagueName}: מקום ${token.place}. העוזר שיחק במקומך, אז הפעם בלי מעטפה.`;
    message = o.money > 0 ? `${cash} בקופה.${o.fans ? ` אוהדים +${o.fans}.` : ''} ${title}.` : title;
  }
  const next: GameState = {
    ...gs,
    meters: { ...gs.meters, money: gs.meters.money + o.money, fans: Math.max(0, Math.min(100, gs.meters.fans + o.fans)) },
    gems: gs.gems + o.gems,
    weekend: o.record,
    chronicle: [...gs.chronicle, { id: `weekend-${token.nonce}`, kind: 'season_end' as const, week: gs.week, title, body, icon: 'trophy' as const, tint: token.place === 1 ? 'gold' as const : 'win' as const }],
  };
  return { gs: next, ok: true, message, reason: 'applied' };
}

/**
 * A prize kept on the phone (the career was not open when it came) meets the career: put it in, and say whether the
 * phone still has to keep it. It is dropped once it is in or was already in; with no career to take it, it waits.
 */
export function resolvePending(loaded: GameState, pending: WeekendPrizeInput): { gs: GameState; keep: boolean } {
  const r = applyWeekendPrize(loaded, pending);
  return { gs: r.ok ? r.gs : loaded, keep: !r.ok && r.reason !== 'duplicate' };
}

/** Read a friend's thank you code and pay for him if it holds up. */
export function redeemThanks(gs: GameState, text: string): RedeemResult {
  const state = gs.invite ?? emptyInvite();
  const v = verifyThanks(text, myCode(), state, gs.season);
  if (!v.ok) return { gs, ok: false, message: v.why };
  return {
    gs: { ...gs, gems: gs.gems + GEMS_PER_FRIEND, invite: addClaim(state, v.friend, gs.season) },
    ok: true,
    message: `נספר. ${GEMS_PER_FRIEND} יהלומים נכנסו לחשבון.`,
  };
}

/** Friends counted this season, and how many the cap still allows. */
/** Open and close the invite screen, remembering where the manager was. */
export function openInvite(gs: GameState): GameState {
  return gs.phase === 'invite' ? gs : { ...gs, inviteFrom: gs.phase, phase: 'invite' };
}
export function closeInvite(gs: GameState): GameState {
  return { ...gs, phase: gs.inviteFrom ?? 'hub', inviteFrom: null };
}

export function friendsThisSeason(gs: GameState): number {
  return claimsThisSeason(gs.invite ?? emptyInvite(), gs.season);
}

/* -------------------------------------------------------- gems and packs */

export function openPacks(gs: GameState): GameState {
  return { ...gs, phase: 'packs' };
}

/** The ad on the shirt, if the sponsor has one: it leads the season's rotation. */
export function sponsorAdId(gs: GameState): string | null {
  return gs.sponsor ? (brandById(gs.sponsor.brand).adId ?? null) : null;
}

export function adsLeft(gs: GameState): number {
  return Math.max(0, ADS_PER_SEASON - gs.adsWatched);
}

/**
 * How many sittings are actually on offer right now.
 *
 * Not the same question as how many are left in the season: while the clips
 * are not running there are none to be had, and the button says so. The
 * arithmetic above stays honest either way, which is what the ad checks
 * measure, and this is what the screens ask.
 */
export function adsOffered(gs: GameState): number {
  return ADS_LIVE ? adsLeft(gs) : 0;
}

/**
 * The ad reward. Deliberately capped per season: a gem that can be farmed is
 * not a premium currency, and an uncapped ad loop is the thing that makes a
 * game feel like a slot machine.
 */
export function watchAdForGem(gs: GameState): GameState {
  if (adsLeft(gs) <= 0) return gs;
  return { ...gs, gems: gs.gems + GEMS_PER_AD, adsWatched: gs.adsWatched + 1 };
}

export function packBlockedReason(gs: GameState, id: PackId): string | null {
  const spec = packById(id);
  if (id === 'gift' && giftsWaiting(gs) <= 0) return 'אין לך חבילת מתנה';
  if (gs.gems < spec.cost) return `צריך ${spec.cost} יהלומים`;
  if (squadSize(gs) >= MAX_SQUAD) return `הסגל מלא, מקסימום ${MAX_SQUAD} שחקנים`;
  return null;
}

/** Packs owed to this manager. Reads an old save's missing field as none. */
export function giftsWaiting(gs: GameState): number {
  return gs.gifts ?? 0;
}

/**
 * Spend the gems and roll the card. The pull is held on the state rather than
 * applied straight away, so the reveal screen can play out and the manager
 * still gets to choose: into the squad, or sold on for cash.
 */
export function buyPack(gs: GameState, id: PackId): GameState {
  if (packBlockedReason(gs, id)) return gs;
  const spec = packById(id);
  const sq = mySquad(gs);
  const taken = new Set([...sq.starters, ...sq.bench].map(p => p.name));
  // bias the roll toward whichever line is thinnest, so a reward is never a
  // twelfth striker while the defence is bare
  const rng = createRng(gs.seasonSeed + gs.season * 7919 + gs.gems * 131 + gs.adsWatched * 17);
  // the gift is always a keeper, because a missing keeper is what it is for.
  // Every other pack leans toward whichever line is thinnest
  const spot = id === 'gift' ? { position: 'GK' as Position, slotOvr: undefined } : weakSpot(gs, rng);
  const pull = openPack(spec, club(gs).tier, rng, { position: spot.position, slotOvr: spot.slotOvr, taken });
  return {
    ...gs,
    gems: gs.gems - spec.cost,
    gifts: id === 'gift' ? giftsWaiting(gs) - 1 : giftsWaiting(gs),
    pull,
  };
}

/**
 * Where a pack should land: one of the three weakest men in the eleven (a keeper only when the squad holds fewer than two),
 * and what that man is rated, so the card can be rolled above him. It used to be the line with the fewest heads, which sent a
 * pack to a position that was already a strength (Itzik, 15.10).
 */
function weakSpot(gs: GameState, rng: Rng): { position: Position; slotOvr: number | undefined } {
  const sq = mySquad(gs);
  const keepers = [...sq.starters, ...sq.bench].filter(p => p.position === 'GK').length;
  if (keepers < MIN_KEEPERS) return { position: 'GK', slotOvr: undefined };
  const weakest = sq.starters.filter(p => p.position !== 'GK').sort((a, b) => overall(a) - overall(b)).slice(0, 3);
  if (!weakest.length) return { position: thinnestPosition(gs, rng), slotOvr: undefined };
  const pick = weakest[Math.floor(rng() * weakest.length)];
  return { position: pick.position, slotOvr: overall(pick) };
}

/** The position the squad is shortest of, for biasing a pack roll. */
function thinnestPosition(gs: GameState, rng: Rng): Position {
  const sq = mySquad(gs);
  const all = [...sq.starters, ...sq.bench];
  const counts: Record<MarketLine, number> = { gk: 0, def: 0, mid: 0, atk: 0 };
  for (const p of all) counts[lineOfPosition(p.position)]++;
  /**
   * A keeper is only ever wanted when there are fewer than two, and now the
   * code actually says so.
   *
   * It used to put him in the race carrying his raw count, and a squad always
   * holds fewer keepers than defenders, midfielders or forwards, so the
   * thinnest line was ALWAYS the goalkeepers. Measured before the fix: of 120
   * packs opened across forty careers and all three prices, 120 came back a
   * goalkeeper. Every pack in the game, including the eighteen gem one.
   *
   * At two or more he is simply not a candidate.
   */
  const order: [MarketLine, number, Position[]][] = [
    ...(counts.gk < MIN_KEEPERS
      ? [['gk', -99, ['GK']] as [MarketLine, number, Position[]]]
      : []),
    ['def', counts.def, ['CB', 'LB', 'RB']],
    ['mid', counts.mid, ['CDM', 'CM', 'CAM']],
    ['atk', counts.atk, ['ST', 'LW', 'RW']],
  ];
  order.sort((a, b) => a[1] - b[1]);
  const picks = order[0][2];
  return picks[Math.floor(rng() * picks.length)];
}

function lineOfPosition(pos: Position): MarketLine {
  if (pos === 'GK') return 'gk';
  if (pos === 'CB' || pos === 'LB' || pos === 'RB') return 'def';
  if (pos === 'CDM' || pos === 'CM' || pos === 'CAM') return 'mid';
  return 'atk';
}

/** Take the pulled card into the squad, on a short deal. */
export function signPull(gs: GameState): GameState {
  const pull = gs.pull;
  if (!pull) return gs;
  if (squadSize(gs) >= MAX_SQUAD) return gs;
  const sq = mySquad(gs);
  const next = { ...writeSquad(gs, { starters: sq.starters, bench: [...sq.bench, pull.player] }), arrivals: [...gs.arrivals, pull.player.id] };
  return {
    ...next,
    pull: null,
    contracts: { ...gs.contracts, [pull.player.id]: PACK_CONTRACT_YEARS },
  };
}

/** Sell the pulled card on instead. There is never an empty pack. */
export function sellPull(gs: GameState): GameState {
  const pull = gs.pull;
  if (!pull) return gs;
  return {
    ...gs,
    pull: null,
    meters: { ...gs.meters, money: cash(gs.meters.money + pull.cashValue) },
  };
}

/* ---------------------------------------------------------------- the captain */

/**
 * Captaincy score. The armband goes to standing, which here is quality plus the
 * years a player has on him. Pure and explainable, no hidden dice.
 */
export function captainScore(p: Player): number {
  const seniority = Math.min(14, Math.max(0, p.age - 21)) * 0.9;
  return overall(p) + seniority;
}

/** The whole squad, best captaincy candidate first. */
export function captainCandidates(gs: GameState): Player[] {
  const sq = mySquad(gs);
  return [...sq.starters, ...sq.bench].sort((a, b) => captainScore(b) - captainScore(a));
}

/** Who wears the armband. Falls back to the top candidate when unset. */
export function currentCaptainId(gs: GameState): string | null {
  if (gs.captainId && captainCandidates(gs).some(p => p.id === gs.captainId)) return gs.captainId;
  return captainCandidates(gs)[0]?.id ?? null;
}

export function captain(gs: GameState): Player | null {
  const id = currentCaptainId(gs);
  const sq = mySquad(gs);
  return [...sq.starters, ...sq.bench].find(p => p.id === id) ?? null;
}

export function setCaptain(gs: GameState, playerId: string): GameState {
  return { ...gs, captainId: playerId };
}

/* -------------------------------------------------------------- the assistant */

/** Hire the assistant coach, a permanent source of useless encouragement. */
export function hireAssistant(gs: GameState): GameState {
  if (gs.assistant.hired) return gs;
  const rng = createRng(gs.seasonSeed * 53 + 17);
  const name = ASSISTANT_NAMES[Math.floor(rng() * ASSISTANT_NAMES.length)];
  return { ...gs, assistant: { hired: true, name, departed: false } };
}

export function fireAssistant(gs: GameState): GameState {
  return { ...gs, assistant: { hired: false, name: '', departed: false } };
}

/** Is the assistant around to chip in right now. */
export function assistantActive(gs: GameState): boolean {
  return gs.assistant.hired && !gs.assistant.departed;
}

/**
 * When the club reaches ליגה א' the assistant is finally offered a job of his
 * own, and off he goes, still not knowing his 4-4-2 from his elbow. Records the
 * goodbye in the chronicle. No-op until the club actually climbs that high.
 */
export function maybeAssistantDeparture(gs: GameState): GameState {
  if (!gs.assistant.hired || gs.assistant.departed) return gs;
  if (club(gs).tier < ASSISTANT_LEAVES_TIER) return gs;
  const id = `assistant-left-t${club(gs).tier}`;
  if (gs.chronicle.some(e => e.id === id)) return gs;
  const entry: ChronicleEntry = {
    id, kind: 'season_end', week: gs.week, icon: 'handshake', tint: 'gold',
    title: `${gs.assistant.name} עוזב לנהל`,
    body: `הגענו לליגה א׳, ו${gs.assistant.name} קיבל הצעה לנהל קבוצה משלו. הוא לא הבין אף פעם כלום מהמשחק, אבל אהב אותו יותר מכולם. בהצלחה, אלוף.`,
  };
  return {
    ...gs,
    assistant: { ...gs.assistant, departed: true },
    chronicle: [...gs.chronicle, entry],
  };
}

/**
 * The assistant's contribution to any choice: he repeats it back to you. Give
 * him the option labels, he hands you the same options dressed as advice.
 */
export function assistantEcho(gs: GameState, options: string[], salt = 0): string | null {
  if (!assistantActive(gs) || options.length < 2) return null;
  const a = options[0], b = options[1];
  const lines = [
    `אני אומר לך בלב שלם, או ${a} או ${b}. אחד מהם בטוח נכון.`,
    `תשמע, לדעתי ${a}. אבל גם ${b}, אה? קשה להגיד.`,
    `המספרים לא משקרים, אחי. או ${a} או ${b}.`,
    `אתה המאמן, אבל אני הייתי הולך על ${a}. או ${b}, תלוי איך אתה מרגיש.`,
    `יש לי הרגשה ממש טובה על ${a}. או ${b}. הרגשה זה הכל.`,
    `וואי איזו התלבטות. ${a}? ${b}? שתיהן אש. תבחר אתה.`,
  ];
  const rng = createRng(drawSeed(gs, 20_000 + salt));
  return lines[Math.floor(rng() * lines.length)];
}

/* ---------------------------------------------------------------- the fans */

/** Build what the terrace regulars actually know about right now. */
export function fanContext(gs: GameState, timing: FanTiming): FanContext {
  const fx = playerFixture(gs);
  const iAmHome = fx ? fx.homeId === gs.clubId : true;
  const oppId = fx ? (iAmHome ? fx.awayId : fx.homeId) : gs.clubId;
  const rival = gs.league.clubs.find(c => c.id === oppId)?.short ?? 'היריבה';
  const sq = mySquad(gs);

  // a forward who has not scored for a while
  let coldStriker: string | null = null;
  let coldWeeks = 0;
  const forwards = sq.starters.filter(p => ['ST', 'LW', 'RW', 'CAM'].includes(p.position));
  for (const p of forwards) {
    const rec = gs.seasonStats[p.id];
    const since = rec?.lastGoalWeek ? gs.week - rec.lastGoalWeek : (rec?.apps ?? 0);
    if (since > coldWeeks) { coldWeeks = since; coldStriker = p.name; }
  }

  const kid = sq.bench.concat(sq.starters).find(p => p.age <= 20);
  const table = sortedTable(gs.league);
  const tablePos = Math.max(1, table.findIndex(s => s.clubId === gs.clubId) + 1);

  let streak = 0;
  for (let i = gs.form.length - 1; i >= 0 && gs.form[i] === 'L'; i--) streak++;

  const ctx: FanContext = {
    timing, isDerby: fx ? isDerby(fx.homeId, fx.awayId) : false,
    isHome: iAmHome, rival, city: club(gs).city,
    tier: club(gs).tier,
    coldStriker, coldWeeks,
    youngster: kid?.name ?? null,
    approach: gs.tactic.approach,
    tablePos, totalTeams: gs.league.clubs.length,
    played: table.find(t => t.clubId === gs.clubId)?.played ?? 0,
    justUp: gs.chronicle.some(e => e.id === `season-${gs.season - 1}-promoted` || (club(gs).tier < TOP_TIER && e.id === `season-${gs.season - 1}-champion`)),
    newSeason: gs.season > 1 && !gs.chronicle.some(e => e.id === `season-${gs.season - 1}-promoted` || (club(gs).tier < TOP_TIER && e.id === `season-${gs.season - 1}-champion`)),
    club: club(gs).short,
    fans: gs.meters.fans,
    streak,
  };

  if (timing === 'post' && gs.lastPlayerMatch) {
    const r = gs.lastPlayerMatch;
    const my = iAmHome ? r.score[0] : r.score[1];
    const opp = iAmHome ? r.score[1] : r.score[0];
    ctx.result = my > opp ? 'win' : my === opp ? 'draw' : 'loss';
    ctx.scoreLine = `${my}:${opp}`;
    const myGoal = r.events.find(e => (e.type === 'goal' || e.type === 'penalty_goal') && e.teamId === gs.clubId);
    ctx.scorer = myGoal?.playerName ?? null;
  }
  return ctx;
}

/** How many recent fan lines to remember, so the terrace stops repeating. */
export const FAN_HISTORY = 16;

/**
 * The club's timeline, built from what has actually happened this save. Stable
 * for a given week so it does not reshuffle while the manager is reading it.
 */
/**
 * Where the club stood before the round just played. The table only keeps the
 * present, so the round's results are taken back off a copy of it and the
 * copy is sorted the way the real one is.
 */
export function positionBeforeRound(gs: GameState): number {
  const table: Record<string, Standing> = {};
  for (const [id, row] of Object.entries(gs.league.table)) table[id] = { ...row };
  for (const m of gs.lastRound) {
    const h = table[m.homeId], a = table[m.awayId];
    if (!h || !a) continue;
    h.played--; a.played--;
    h.gf -= m.hg; h.ga -= m.ag; a.gf -= m.ag; a.ga -= m.hg;
    if (m.hg > m.ag) { h.won--; h.pts -= 3; a.lost--; }
    else if (m.hg < m.ag) { a.won--; a.pts -= 3; h.lost--; }
    else { h.drawn--; a.drawn--; h.pts--; a.pts--; }
  }
  const before = sortedTable({ ...gs.league, table });
  return Math.max(1, before.findIndex(t => t.clubId === gs.clubId) + 1);
}

export function clubFeed(gs: GameState): Post[] {
  const c = club(gs);
  const sq = mySquad(gs);
  const all = [...sq.starters, ...sq.bench];
  const table = sortedTable(gs.league);
  const pos = Math.max(1, table.findIndex(t => t.clubId === gs.clubId) + 1);
  const shortOf = (id: string) => gs.league.clubs.find(x => x.id === id)?.short ?? '';

  // our last match, from the round just played. Where it was played and what
  // it did to the table both go in, because the timeline used to say "a point
  // away" after a home draw and "up the table" after every win
  const mine = gs.lastRound.find(m => m.homeId === gs.clubId || m.awayId === gs.clubId);
  const last = mine
    ? (() => {
        const home = mine.homeId === gs.clubId;
        return {
          opponent: shortOf(home ? mine.awayId : mine.homeId),
          mine: home ? mine.hg : mine.ag,
          theirs: home ? mine.ag : mine.hg,
          isDerby: isDerby(mine.homeId, mine.awayId),
          home,
          climbed: pos < positionBeforeRound(gs),
        };
      })()
    : null;

  // who is scoring, and who has stopped
  const goalsOf = (p: Player) => gs.seasonStats[p.id]?.goals ?? 0;
  const scorer = [...all].sort((a, b) => goalsOf(b) - goalsOf(a))[0];
  const topScorer = scorer && goalsOf(scorer) > 0
    ? { name: scorer.name, goals: goalsOf(scorer) } : null;

  let coldStriker: FeedContext['coldStriker'] = null;
  for (const p of sq.starters.filter(x => ['ST', 'LW', 'RW', 'CAM'].includes(x.position))) {
    const rec = gs.seasonStats[p.id];
    const since = rec?.lastGoalWeek ? gs.week - rec.lastGoalWeek : (rec?.apps ?? 0);
    if (since > (coldStriker?.weeks ?? 0)) coldStriker = { name: p.name, weeks: since };
  }

  const rivalId = c.rivalId;
  const ctx: FeedContext = {
    clubName: c.name, clubShort: c.short, city: c.city,
    league: LEAGUE_NAMES[c.tier] ?? '',
    tier: c.tier,
    pos, teams: gs.league.clubs.length,
    form: gs.form,
    last,
    otherResults: gs.lastRound
      .filter(m => m.homeId !== gs.clubId && m.awayId !== gs.clubId)
      .map(m => ({ home: shortOf(m.homeId), away: shortOf(m.awayId), hg: m.hg, ag: m.ag })),
    topScorer,
    coldStriker,
    youngster: [...all].filter(p => p.age <= 21).sort((a, b) => overall(b) - overall(a))[0] ?? null,
    star: [...all].sort((a, b) => overall(b) - overall(a))[0] ?? null,
    marketTarget: gs.market.length ? gs.market[0].player : null,
    rival: rivalId ? shortOf(rivalId) : null,
  };
  return buildFeed(ctx, createRng(drawSeed(gs, 30_000)));
}

/** The message shown this week, stable for a given week and timing. */
export function fanNote(gs: GameState, timing: FanTiming): FanMessage {
  const seed = drawSeed(gs, 40_000 + (timing === 'pre' ? 1 : 2));
  return fanMessage(fanContext(gs, timing), createRng(seed), gs.fanHistory);
}

/* ------------------------------------------------------------- scouting */

export interface Scout {
  oppShort: string;
  mine: number;
  opp: number;
  iAmHome: boolean;
  /** who the bookies would back */
  verdict: 'favourite' | 'even' | 'underdog';
  /** a plain read for the manager, tuned to the matchup */
  line: string;
}

function avgStarterOvr(sq: Squad): number {
  const xs = sq.starters.map(overall);
  return xs.reduce((s, x) => s + x, 0) / (xs.length || 1);
}

/** What we know about this week's opponent, shown before picking a tactic. */
export function matchupScout(gs: GameState): Scout | null {
  const fx = playerFixture(gs);
  if (!fx) return null;
  const iAmHome = fx.homeId === gs.clubId;
  const oppId = iAmHome ? fx.awayId : fx.homeId;
  const oppClub = gs.league.clubs.find(c => c.id === oppId)!;
  const mine = avgStarterOvr(mySquad(gs));
  const opp = avgStarterOvr(gs.league.squads[oppId]);
  // a home game is worth roughly a couple of rating points on the read
  const edge = (mine - opp) + (iAmHome ? 2 : -1);
  const verdict: Scout['verdict'] = edge >= 4 ? 'favourite' : edge <= -4 ? 'underdog' : 'even';

  const derby = isDerby(gs.clubId, oppId);
  const pool = derby ? SCOUT_LINES.derby : SCOUT_LINES[verdict];
  // stable for this fixture, different from one round to the next, so the same
  // advice does not greet him fourteen weeks running
  const line = pool[lineSeed(`${gs.season}|${gs.week}|${oppId}`) % pool.length];

  return { oppShort: oppClub.short, mine: Math.round(mine), opp: Math.round(opp), iAmHome, verdict, line };
}

/**
 * What the assistant says before a tactic is picked.
 *
 * One fixed line per verdict used to do this, and one of the three ended with
 * "אל תיפתחו מטומטם", which is not a thing a coach says and is not advice
 * either. These are: every line names something the manager can actually go and
 * do on the tactic screen he is about to open — a shape, a line of defence, a
 * way of playing — so the read of the opponent turns into a decision instead of
 * a mood.
 *
 * A derby has its own pool, because a derby is not a harder or easier fixture,
 * it is a different kind of night.
 */
const SCOUT_LINES: Record<'favourite' | 'underdog' | 'even' | 'derby', string[]> = {
  favourite: [
    'על הנייר אתם חזקים יותר. אל תשחקו פתוח. אמצע חזק, ותנו להם לבוא אליכם.',
    'אתם הקבוצה הטובה יותר, אז הסכנה כאן היא מתפרצת. קו הגנה מסודר ולא לרוץ קדימה כולם ביחד.',
    'הפער לטובתכם. תחזיקו כדור, תשחקו סבלני, ואל תיתנו להם מצבים במתנה.',
    'אתם פייבוריט. תיכנסו רציני מהדקה הראשונה, קבוצה כזאת חיה על רבע שעה של הפתעה.',
  ],
  underdog: [
    'הם טובים מכם. קו הגנה נמוך, אמצע צפוף, ומתפרצות. לא להתפתות.',
    'על הנייר אתם מתחת. תשחקו סגור ותיקחו את המשחק לכדורים עומדים ולפרטים.',
    'הם חזקים. משחק פתוח מול קבוצה כזאת נגמר רע, תשמרו על הרשת וחכו לרגע.',
    'קבוצה מעליכם. תסבלו, תישארו במשחק עד ה-70, ואז תראו מה יש על הספסל.',
  ],
  even: [
    'מאבק שקול. מי שייקח את האמצע ייקח את המשחק, אז אל תוותרו עליו.',
    'קבוצות באותה רמה. תשחקו מאוזן ואל תיפתחו, השער הראשון פה שווה כפול.',
    'שקול לגמרי. תשמרו על הכדור, אל תמהרו, ותנצלו כל כדור עומד שתקבלו.',
    'אין פייבוריט. תשמרו כוחות לרבע השעה האחרונה, שם המשחק הזה ייפול.',
  ],
  derby: [
    'דרבי. תשכחו מהטבלה, תיכנסו חזק מהדקה הראשונה. פה מי שרוצה יותר לוקח.',
    'דרבי. היציע לא יסלח על משחק רך, אבל בלי כרטיסים מיותרים. הרחקה כאן הורגת משחק.',
    'זה דרבי. אמצע חזק וקור רוח, ואל תיסחפו אחרי האווירה.',
    'דרבי. אל תשחקו פתוח בשביל הכבוד, תוצאה אחת מספיקה כדי להציל עונה.',
  ],
};

/* --------------------------------------------------------------- the flares */

/**
 * Why the terrace is lighting flares tonight, or null on an ordinary round.
 *
 * Four nights in a season are not like the others, and a crowd says so before
 * the whistle rather than after. Only one of the four was a thing the game knew
 * about, so the other three are defined here:
 *
 *  - the opener, which is simply the first round;
 *  - the local fight, and only the FIRST meeting of it in a season, so it stays
 *    an occasion rather than becoming a fixture. It comes in two kinds and they
 *    are not the same night: a DERBY is the same town, two clubs and one city,
 *    and a REGION is the town next door, up to ten kilometres. What the game
 *    used to call a derby was almost always the second one;
 *  - promotion and relegation, in the last two rounds, and only while the
 *    question is still open: not already won, not already lost.
 *
 * Measured over careers played out: 69% of seasons are a region and 31% a
 * derby, and every season is one or the other, because where the map offers
 * nobody the town's second club is put in the division. See withLocalRival.
 */
export type FlareReason = 'promotion' | 'relegation' | 'derby' | 'region' | 'opener';

/**
 * The round we first meet the club we are local to, or null when there is none.
 *
 * Read off the fixture list rather than remembered, so it needs nothing on the
 * save and an old career gets it for free.
 */
export function firstLocalRound(gs: GameState): number | null {
  const found = myLocalRival(gs);
  if (!found) return null;
  let first: number | null = null;
  for (const f of gs.league.fixtures) {
    if (f.homeId !== gs.clubId && f.awayId !== gs.clubId) continue;
    const opp = f.homeId === gs.clubId ? f.awayId : f.homeId;
    if (opp !== found.id) continue;
    if (first === null || f.round < first) first = f.round;
  }
  return first;
}

/**
 * Is promotion, or relegation, still an open question going into this round.
 *
 * Read off the table as it stands, counting the points still to play for with
 * tonight included. Open means both halves of it: it can still happen, and it
 * is not settled already. A club that is up whatever happens gets no flare, and
 * nor does one that is already down or already safe.
 *
 * Goal difference is not modelled here. Equal points counts as "could still
 * pass me", which errs towards the night being live, and that is the side to
 * err on: a flare at a match that turned out not to matter costs nothing, a
 * dark terrace at the match that decided the season costs the moment.
 */
export function seasonStakes(gs: GameState): { promotion: boolean; relegation: boolean } {
  const me = gs.league.table[gs.clubId];
  if (!me) return { promotion: false, relegation: false };
  const teams = gs.league.clubs.length;
  const tier = club(gs).tier;
  const left = gs.league.rounds - gs.week + 1;       // rounds still to play, tonight counted
  const ceiling = me.pts + 3 * left;
  const others = gs.league.clubs
    .filter(c => c.id !== gs.clubId)
    .map(c => gs.league.table[c.id])
    .filter((s): s is Standing => !!s);

  const couldPassMe = others.filter(s => s.pts + 3 * left >= me.pts).length;
  const beyondMe = others.filter(s => s.pts > ceiling).length;

  // two places go up: secure the moment at most one club can still get above us
  const promotion = tier < TOP_TIER && couldPassMe > 1 && beyondMe < 2;
  // the bottom club goes down: safe the moment one club can no longer catch us,
  // and settled the other way when every other club is already out of reach
  const relegation = tier > 1
    && !others.some(s => s.pts + 3 * left < me.pts)
    && beyondMe !== teams - 1;

  return { promotion, relegation };
}

/**
 * The reason the flares are up for the match about to be played, if any.
 *
 * When two reasons land on the same night the bigger stake wins, because the
 * season coming down to one match is rarer than a derby and rarer than an
 * opening day. A derby beats an opener for the same reason.
 */
export function flareReason(gs: GameState): FlareReason | null {
  if (gs.preWeek > 0) return null;                  // the summer has no crowd
  if (!playerFixture(gs)) return null;
  if (gs.week >= gs.league.rounds - 1) {
    const s = seasonStakes(gs);
    if (s.promotion) return 'promotion';
    if (s.relegation) return 'relegation';
  }
  const local = myLocalRival(gs);
  if (local && gs.week === firstLocalRound(gs)) return local.kind;
  if (gs.week === 1) return 'opener';
  return null;
}

/** Stable 0..999 from a string, so a fixture always gets the same line. */
function lineSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 1000;
}

export interface MatchPreview {
  home: Club; away: Club;
  homeOvr: number; awayOvr: number;
  iAmHome: boolean; isDerby: boolean;
  myForm: ('W' | 'D' | 'L')[];
  verdict: Scout['verdict'];
  line: string;
  /** men you sold who now wear the other shirt */
  exes: string[];
}

/** Everything the cinematic VS screen needs before kickoff. */
export function matchPreview(gs: GameState): MatchPreview | null {
  const fx = playerFixture(gs);
  const scout = matchupScout(gs);
  if (!fx || !scout) return null;
  const home = gs.league.clubs.find(c => c.id === fx.homeId)!;
  const away = gs.league.clubs.find(c => c.id === fx.awayId)!;
  // the starting eleven's real average, same figure the scout and squad screen
  // use, so the number here matches everywhere else
  const ovrOf = (id: string) => Math.round(avgStarterOvr(gs.league.squads[id]));
  return {
    home, away,
    homeOvr: ovrOf(fx.homeId), awayOvr: ovrOf(fx.awayId),
    iAmHome: scout.iAmHome, isDerby: isDerby(fx.homeId, fx.awayId),
    myForm: gs.form.slice(-5),
    exes: exesAtNextOpponent(gs).map(e => e.name),
    verdict: scout.verdict, line: scout.line,
  };
}

/* --------------------------------------------------------------- the week */

function topPlayerName(sq: Squad): string {
  const best = [...sq.starters].sort((a, b) => overall(b) - overall(a))[0];
  return surnameOf(best.name);
}

const FORWARD = new Set(['ST', 'CF', 'SS', 'LW', 'RW']);
const surname = surnameOf;

/**
 * The facts a dilemma is allowed to know about you. Everything here comes from
 * the live save, so the reserve who corners you really is the man you have not
 * picked, and the table position he quotes is the one on your screen.
 */
/** a club is short of money when its till covers fewer than this many rounds of its wages (20.10) */
export const TIGHT_ROUNDS = 3;

function dilemmaCtx(gs: GameState, star: string, rivalShort: string, rivalId: string): DilemmaCtx {
  const sq = mySquad(gs);
  // The ראש העין regulars are never the man asking to leave or demanding a move.
  // He lives up the road, the club is his home, and the whole point of him is
  // that he stayed. He is still eligible to be the scorer or the veteran, which
  // are things that happen TO him rather than demands he makes.
  const all = [...sq.starters, ...sq.bench].filter(p => !isLegend(p));
  const apps = (p: Player) => gs.seasonStats[p.id]?.apps ?? 0;
  // a friendly's minutes quiet the forgotten man, though they are no league appearance
  const minutes = (p: Player) => apps(p) + (gs.seasonStats[p.id]?.friendlyApps ?? 0);
  const goals = (p: Player) => gs.seasonStats[p.id]?.goals ?? 0;

  // the forgotten man: fewest appearances, bench first, oldest as the tie break
  const forgotten = [...sq.bench, ...sq.starters].filter(p => !isLegend(p))
    .sort((a, b) => minutes(a) - minutes(b) || b.age - a.age)[0];
  const kid = all.filter(p => p.age <= 20).sort((a, b) => overall(b) - overall(a))[0];
  const old = all.filter(p => p.age >= 32).sort((a, b) => b.age - a.age)[0];
  const scorer = [...all].sort((a, b) => goals(b) - goals(a))[0];
  const drought = all
    .filter(p => FORWARD.has(p.position) && goals(p) === 0 && apps(p) >= 3)
    .sort((a, b) => apps(b) - apps(a))[0];

  const table = sortedTable(gs.league);
  const pos = Math.max(1, table.findIndex(t => t.clubId === gs.clubId) + 1);

  return {
    star, rival: rivalShort, club: club(gs).short, money: cash(gs.meters.money),
    tight: gs.meters.money < TIGHT_ROUNDS * wageBill(mySquad(gs), club(gs).tier),
    benched: forgotten && minutes(forgotten) <= 1 ? surname(forgotten.name) : '',
    benchedApps: forgotten ? minutes(forgotten) : 0,
    benchedForeign: (() => {
      const played = table.find(t => t.clubId === gs.clubId)?.played ?? 0;
      const man = sq.bench.filter(p => isForeign(p) && !isLegend(p) && played >= 3 && apps(p) <= played - 3)
        .sort((a, b) => apps(a) - apps(b) || overall(b) - overall(a))[0];
      return man ? surname(man.name) : '';
    })(),
    youngster: kid ? surname(kid.name) : '',
    veteranName: old ? surname(old.name) : '',
    scorer: scorer && goals(scorer) > 0 ? surname(scorer.name) : '',
    dry: drought ? surname(drought.name) : '',
    newcomer: (() => { const him = [...gs.arrivals].reverse().map(id => all.find(p => p.id === id)).find(Boolean); return him ? surname(him.name) : ''; })(),
    // the academy, for the youth coach: his best kid, and the first three by name
    academy: [...gs.youth.players].sort((a, b) => overall(b) - overall(a))[0]?.name ?? '',
    kids3: gs.youth.players.length >= 3
      ? gs.youth.players.slice(0, 3).map(p => surname(p.name)).reduce((s, n, i, a) => i === 0 ? n : i === a.length - 1 ? `${s} ו${n}` : `${s}, ${n}`, '')
      : '',
    squadSize: squadSize(gs),
    room: Math.max(0, MAX_SQUAD - squadSize(gs)),
    pos, teams: gs.league.clubs.length,
    week: gs.week,
    isDerby: isDerby(gs.clubId, rivalId),
    queued: gs.queued && gs.queued.week <= gs.week ? gs.queued.id : '',
    sponsor: sponsorName(gs.sponsor),
    sponsorWants: gs.sponsor ? brandById(gs.sponsor.brand).wants : [],
    city: club(gs).city,
    tier: club(gs).tier,
    isHome: (() => { const f = playerFixture(gs); return !!f && f.homeId === gs.clubId; })(),
    lostLast: gs.form[gs.form.length - 1] === 'L',
    winStreak: (() => { let n = 0; for (let i = gs.form.length - 1; i >= 0 && gs.form[i] === 'W'; i--) n++; return n; })(),
    lead: table[0]?.clubId === gs.clubId ? (table[0]?.pts ?? 0) - (table[1]?.pts ?? 0) : 0,
    gap: Math.max(0, (table[0]?.pts ?? 0) - (table.find(s => s.clubId === gs.clubId)?.pts ?? 0)),
    winterOpen: windowState(gs.week, gs.league.rounds).open,
    winterLast: windowState(gs.week, gs.league.rounds).open && !windowState(gs.week + 1, gs.league.rounds).open,
    starFee: (() => { const all = [...mySquad(gs).starters, ...mySquad(gs).bench]; const best = [...all].sort((a, b) => overall(b) - overall(a))[0]; return best ? sellPrice(best, club(gs).tier) : 0; })(),
    gk: (() => { const k = [...mySquad(gs).starters, ...mySquad(gs).bench].find(p => p.position === 'GK'); return k ? surnameOf(k.name) : ''; })(),
    starIsForward: (() => { const best = [...mySquad(gs).starters].sort((a, b) => overall(b) - overall(a))[0]; return !!best && FORWARD.has(best.position); })(),
    ...youthCtx(gs),
  };
}

/**
 * The European night due this week, before the league round, or null. Read
 * off the save, never stored: the door shut means there is never one.
 */
/** `live` is the flag; a check opens the door by parameter, the way euroEntry takes it. */
export function euroNight(gs: GameState, live: boolean = EURO_LIVE): EuroNight | null {
  if (!live || !gs.euro) return null;
  return nightFor(gs.euro, gs.clubId, gs.league.rounds, gs.week);
}

/* ------------------------------------------------------- the European night */

/** What a European night takes out of the legs of every man who played, for the week's league match. */
export const EURO_TIRED = -12;
/** The chance a man who played the European night is hurt for the week's league match. Itzik's to set. */
export const EURO_INJURY_RISK = 0.06;

/** His shootout is due: the legs are in, the aggregate is level, and he has not taken it yet. */
export function euroPensDue(gs: GameState, live: boolean = EURO_LIVE): boolean {
  return live && !!gs.euro && gs.euro.status === 'on' && needsPens(gs.euro, gs.clubId);
}

/** The men banned from this European match: a red here costs the next match here, nowhere else. */
export function euroBanned(gs: GameState): Set<string> {
  return new Set(Object.entries(gs.euro?.bans ?? {}).filter(([, n]) => n > 0).map(([id]) => id));
}

/**
 * The other side, born for this leg: a squad at the round's strength, every
 * man renamed for his country so a Belgrade side does not score through a
 * Cohen. Seeded on the leg, so a reload meets the same men.
 */
function euroOpponent(gs: GameState, night: EuroNight): Squad {
  const rng = createRng(drawSeed(gs, 151_000 + night.round * 10 + night.leg));
  const sq = makeSquad(strengthOf(gs.euro!, night.oppId, night.round), rng);
  const country = euroClub(night.oppId)?.country ?? '';
  const used = new Set<string>();
  // ids of their own, off the club: the generator's running counter would hand out different ids on every reload
  const named = (p: Player, i: number): Player => ({ ...p, id: `${night.oppId}-${i}`, name: makeEuroName(rng, country, used) });
  return { starters: sq.starters.map(named), bench: sq.bench.map((p, i) => named(p, i + 11)) };
}

/**
 * The live engine's input for the European night. The same shape as the
 * league's, so the broadcast does not know the difference: his eleven less
 * the unavailable and the European-banned, the other side at the round's
 * strength, the final on neutral ground. This week's story has not been
 * asked yet, so no mods of the week touch it.
 */
export function euroMatchInput(gs: GameState, live: boolean = EURO_LIVE) {
  const night = euroNight(gs, live);
  if (!night) throw new Error('no European night this week');
  const banned = euroBanned(gs);
  const ok = (p: Player) => !isUnavailable(gs, p.id) && !banned.has(p.id);
  const sq = mySquad(gs);
  let starters = lineup(gs).filter(ok);
  let bench = sq.bench.filter(ok);
  if (starters.length < 11) {
    starters = fillFormation([...starters, ...bench], formation(gs.tactic.formation)).slice(0, 11);
    bench = bench.filter(p => !starters.includes(p));
  }
  const opp = euroOpponent(gs, night);
  const me = club(gs);
  const them = euroClub(night.oppId)!;
  const iAmHome = night.host !== false;        // the final sits him at home for the indexes; the ground is neutral
  return {
    seed: drawSeed(gs, 150_000 + night.round * 10 + night.leg),
    homeId: iAmHome ? me.id : them.id, homeName: iAmHome ? me.name : them.name,
    awayId: iAmHome ? them.id : me.id, awayName: iAmHome ? them.name : me.name,
    iAmHome,
    neutral: night.host === null,
    playerStarters: starters, playerBench: bench, playerTactic: gs.tactic, seated: true,
    oppStarters: opp.starters, oppBench: opp.bench,
    guestId: null,
    moraleBias: (gs.meters.morale - 65) / 100,
    friends: gs.friends, tier: me.tier,
    captainId: currentCaptainId(gs),
    coach: {
      chemistry: coachChemistry(gs.coach),
      att: coachAttBias(gs.coach),
      def: coachDefBias(gs.coach),
      cards: coachCardBias(gs.coach),
    },
  };
}

/** The two clubs on the broadcast bar: his own and the European side, home first; the final seats him home on neutral ground. */
export function euroMatchClubs(gs: GameState, live: boolean = EURO_LIVE): { home: Club; away: Club } {
  const night = euroNight(gs, live);
  const me = club(gs);
  if (!night) return { home: me, away: me };
  const them = asClub(euroClub(night.oppId)!);
  return night.host === false ? { home: them, away: me } : { home: me, away: them };
}

/** His tie this round, for the screens. */
export function euroMyTie(gs: GameState) {
  return gs.euro ? myTie(gs.euro, gs.clubId) : null;
}

/**
 * Who stands where in his shootout: his takers (the outfield eleven, best
 * first), his keeper, and the other side's names in their own language, drawn
 * on the round so the same men walk up after a reload.
 */
export function euroPensSides(gs: GameState): { opp: ReturnType<typeof euroClub>; takers: Player[]; keeper: Player | undefined; theirNames: string[] } {
  const tie = euroMyTie(gs);
  const opp = tie ? euroClub(tie.a === gs.clubId ? tie.b : tie.a) : undefined;
  const banned = euroBanned(gs);
  const eleven = lineup(gs).filter(p => !isUnavailable(gs, p.id) && !banned.has(p.id));
  const keeper = eleven.find(p => p.position === 'GK') ?? mySquad(gs).starters.find(p => p.position === 'GK');
  const takers = eleven.filter(p => p.position !== 'GK').sort((a, b) => overall(b) - overall(a));
  const rng = createRng(drawSeed(gs, 154_000 + (gs.euro?.round ?? 0)));
  const used = new Set<string>();
  const theirNames = Array.from({ length: 10 }, () => makeEuroName(rng, opp?.country ?? '', used));
  return { opp, takers, keeper, theirNames };
}

/**
 * The words on the entrance and the broadcast bar. Itzik's rule for the
 * ground: at home it is Israel and his own town, away it is their club, their
 * city and their country; the final is neutral ground.
 */
export function euroEntranceLines(gs: GameState, live: boolean = EURO_LIVE): { round: string; leg: string; homePlace: string; awayPlace: string; venue: string } | null {
  const night = euroNight(gs, live);
  if (!night) return null;
  const them = euroClub(night.oppId);
  const myPlace = `${club(gs).city}, ישראל`;
  const theirPlace = `${them?.city ?? ''}, ${them?.country ?? ''}`;
  const leg = legsIn(night.round) === 1 ? 'הגמר, משחק אחד' : night.leg === 0 ? 'משחק ראשון' : 'המשחק החוזר';
  const venue = night.host === null ? 'מגרש ניטרלי'
    : night.host ? `בבית, ${myPlace}` : `בחוץ, אצל ${them?.name ?? ''}, ${theirPlace}`;
  const iAmHome = night.host !== false;
  return {
    round: ROUND_NAMES[night.round], leg,
    homePlace: iAmHome ? myPlace : theirPlace,
    awayPlace: iAmHome ? theirPlace : myPlace,
    venue,
  };
}

/** The draw was made in the summer; the ceremony is owed once, until he has watched it or skipped it. */
export function euroDrawDue(gs: GameState, live: boolean = EURO_LIVE): boolean {
  return live && !!gs.euro && !gs.euro.seen && gs.euro.status === 'on';
}
export function openEuroDraw(gs: GameState, live: boolean = EURO_LIVE): GameState {
  if (gs.phase !== 'hub' || !euroDrawDue(gs, live)) return gs;
  return { ...gs, phase: 'euro-draw' };
}
/** Watched or skipped, either way it is not owed again. */
export function finishEuroDraw(gs: GameState): GameState {
  if (!gs.euro) return { ...gs, phase: 'hub' };
  return { ...gs, euro: { ...gs.euro, seen: true }, phase: 'hub' };
}
/** The competition as it stands, from the hub's room; shut with the door. */
export function openEuroBracket(gs: GameState, live: boolean = EURO_LIVE): GameState {
  if (gs.phase !== 'hub' || !live || !gs.euro) return gs;
  return { ...gs, phase: 'euro-bracket' };
}

/** From the hub to the European night (or its shootout), only when one is due. */
export function startEuroNight(gs: GameState, live: boolean = EURO_LIVE): GameState {
  if (gs.phase !== 'hub') return gs;
  if (euroPensDue(gs, live)) return { ...gs, phase: 'euro-pens' };
  if (!euroNight(gs, live)) return gs;
  return { ...gs, phase: 'euro-match' };
}

/**
 * His tie is settled: the other ties of the round are played, the round
 * moves on, the prize for reaching the next round is paid, and when he is
 * out the rest of the competition plays itself to a champion.
 */
function euroAfterTie(gs: GameState, euro: EuroState, money: number): { euro: EuroState; money: number; line: string } {
  const me = gs.clubId;
  const mine = myTie(euro, me);
  if (!mine?.winner) return { euro, money, line: '' };
  let e = playAiRound(euro, me, drawSeed(gs, 155_000 + euro.round));
  e = advanceRound(e, me);
  let line = '';
  if (e.status === 'won') {
    money += prizeFor(4);
    line = 'הגביע שלך. הפרס על הזכייה נכנס לקופה.';
  } else if (e.status === 'on') {
    money += prizeFor(e.round);
    line = `עלית ל${ROUND_NAMES[e.round]}. הפרס על ההעפלה נכנס לקופה.`;
  } else {
    e = playOutWithoutMe(e, me, drawSeed(gs, 156_000));
    line = 'הדרך באירופה נגמרה העונה.';
  }
  return { euro: e, money, line };
}

/** The night's score as the manager reads it, [mine, theirs], from the engine's [home, away]. */
function myGoals(gs: GameState, r: MatchResult): [number, number] {
  return r.home.id === gs.clubId ? [r.score[0], r.score[1]] : [r.score[1], r.score[0]];
}

/**
 * The European night is over. Nothing of the league is touched: no table, no
 * season record, no form, no ledger. What it leaves behind is the leg in the
 * tie, the men's legs for the week's league match (EURO_TIRED), anyone hurt
 * out of that league match (sitOut, this week, one match), a red card as a
 * European ban only, and the money straight to the purse: the gate share
 * less security at home, the trip away, nothing on neutral ground. A level
 * tie after the legs goes to the shootout, which he takes on the next screen;
 * everything else is written before that, so a closed tab loses nothing.
 */
export function commitEuroLeg(gs: GameState, r: MatchResult, onPitchIds: string[], live: boolean = EURO_LIVE): GameState {
  const night = euroNight(gs, live);
  if (!night || !gs.euro) return gs;
  const me = gs.clubId;
  const goals = myGoals(gs, r);
  // the ban served tonight is spent, and tonight's red is the next ban
  let euro = serveBans(gs.euro).next;
  for (const e of r.events ?? []) if (e.type === 'red' && e.teamId === me && e.playerId) euro = banFor(euro, e.playerId);
  euro = recordMyLeg(euro, me, goals);
  // everyone who played: the eleven that kicked off, and whoever was on the grass or sent off at the end
  const starters = euroMatchInput(gs, live).playerStarters.map(p => p.id);
  const played = [...new Set([...starters, ...onPitchIds])];
  const fitness = { ...(gs.matchMods.fitness ?? {}) };
  for (const id of played) fitness[id] = (fitness[id] ?? 0) + EURO_TIRED;
  const sitOut = { ...gs.sitOut };
  const hurt = euroInjuries(gs, night, played);
  for (const id of hurt) sitOut[id] = 'פצוע';
  // the money, straight to the purse
  let money = gs.meters.money;
  if (night.host === true) money += Math.round(gateIncome(homeAttendance(gs, false), club(gs).tier) * GATE_SHARE) - SECURITY;
  else if (night.host === false) money -= TRAVEL;
  const pensDue = needsPens(euro, me);
  const after = pensDue ? { euro, money, line: '' } : euroAfterTie(gs, euro, money);
  const notice = euroNightNotice(gs, night, goals, myTie(euro, me), after.line, hurt);
  return markPlayed({
    ...gs,
    euro: after.euro,
    meters: { ...gs.meters, money: after.money },
    matchMods: { ...gs.matchMods, fitness },
    sitOut,
    notices: pensDue ? gs.notices : [...gs.notices, notice],
    phase: pensDue ? 'euro-pens' : 'hub',
  });
}

/** Who the night hurt, for this week's league match: seeded on the leg, one roll a man. */
export function euroInjuries(gs: GameState, night: EuroNight, played: string[]): string[] {
  const rng = createRng(drawSeed(gs, 153_000 + night.round * 10 + night.leg));
  return played.filter(() => rng() < EURO_INJURY_RISK);
}

/** The shootout he took is in: the tie has its winner and the round moves on. */
export function finishEuroPens(gs: GameState, score: [number, number]): GameState {
  if (!gs.euro || !needsPens(gs.euro, gs.clubId)) return { ...gs, phase: 'hub' };
  const euro = settleMyPens(gs.euro, gs.clubId, score);
  const after = euroAfterTie(gs, euro, gs.meters.money);
  const tie = myTie(euro, gs.clubId)!;
  const opp = euroClub(tie.a === gs.clubId ? tie.b : tie.a);
  const won = tie.winner === gs.clubId;
  const title = won ? 'עברת בפנדלים' : 'הודחת בפנדלים';
  const body = `${score[0]}:${score[1]} בפנדלים מול ${opp?.name ?? ''}. ${after.line}`.trim();
  return {
    ...gs,
    euro: after.euro,
    meters: { ...gs.meters, money: after.money },
    notices: [...gs.notices, { kind: 'story', title, body }],
    phase: 'hub',
  };
}

/**
 * The season is over: the competition is closed if it is not already, and the
 * way it went is written in the chronicle once, whatever the road. No money
 * moves here (every round paid its own prize on the night it was reached), the
 * league is not touched, and a season that had no competition leaves nothing.
 */
export function settleEuroSeason(gs: GameState): GameState {
  if (!gs.euro || gs.euro.season !== gs.season) return gs;
  const euro = closeEuroSeason(gs.euro, gs.clubId, drawSeed(gs, 157_000));
  const v = euroVerdict(euro, gs.clubId);
  const id = `euro-s${gs.season}`;
  // Europe belongs to the ליגת העל and to nothing below it: a cup on a club in a lower division is shut but never written down
  if (!v || club(gs).tier < TOP_TIER || gs.chronicle.some(c => c.id === id)) return { ...gs, euro };
  const legs = v.played === 1 ? 'משחק אחד' : `${v.played} משחקים`;
  const paid = v.prize > 0 ? ` הפרסים שנכנסו לקופה: ${formatShekels(v.prize)}.` : '';
  const entry: ChronicleEntry = v.outcome === 'won'
    ? { id, kind: 'season_end', week: gs.week, icon: 'trophy', tint: 'gold',
        title: 'ליגת אירופה: הגביע אצלנו', body: `${legs} בארבעה סבבים, ובסוף הגביע.${paid}` }
    : v.outcome === 'cut'
      ? { id, kind: 'season_end', week: gs.week, icon: 'flag', tint: 'draw',
          title: `ליגת אירופה: העונה נגמרה ${ROUND_IN[v.round]}`, body: `הזוג לא הוכרע בזמן ונחשב הפסד.${paid}` }
      : { id, kind: 'season_end', week: gs.week, icon: 'flag', tint: 'draw',
          title: `ליגת אירופה: הדרך נגמרה ${ROUND_IN[v.round]}`, body: `${legs} באירופה.${paid} הדרך חזרה עוברת דרך אליפות נוספת.` };
  return { ...gs, euro, chronicle: [...gs.chronicle, entry] };
}

/** How the manager's season in Europe went, for the season-end screen. Null when there was none. */
export function euroSeasonVerdict(gs: GameState): ReturnType<typeof euroVerdict> {
  // only the top flight ever shows Europe, whatever a save carries
  return club(gs).tier >= TOP_TIER ? euroVerdict(gs.euro, gs.clubId) : null;
}

/** What this career reports about Europe: nothing outside the ליגת העל, and nothing while there is no cup. */
export function euroMarksFor(gs: GameState): ReturnType<typeof euroMarks> {
  return club(gs).tier >= TOP_TIER ? euroMarks(gs.euro, gs.clubId) : [];
}

/** Is the door open for players? The season-end words only promise Europe while it is. */
export const euroDoorOpen = (): boolean => EURO_LIVE;

/** The word on the hub after the night: the score, where it leaves the tie, and who is hurt. */
function euroNightNotice(gs: GameState, night: EuroNight, goals: [number, number], tie: EuroTie | undefined, line: string, hurt: string[]): SquadNotice {
  const opp = euroClub(night.oppId);
  // Itzik's rule for the ground: at home it is Israel and his own town; away it is their club, their city and their country
  const where = night.host === null ? 'במגרש ניטרלי' : night.host ? `בבית, ב${club(gs).city}` : `בחוץ, אצל ${opp?.name ?? ''} ב${opp?.city ?? ''}, ${opp?.country ?? ''}`;
  const title = `${ROUND_NAMES[night.round]}: ${goals[0]}:${goals[1]} מול ${opp?.name ?? ''}`;
  const parts: string[] = [`${where}.`];
  if (tie && legsIn(night.round) === 2 && night.leg === 0) {
    parts.push('המשחק החוזר בשבוע הבא.');
  } else if (tie) {
    const [a, b] = aggregate(tie);
    const mine = tie.a === gs.clubId ? a : b, theirs = tie.a === gs.clubId ? b : a;
    if (legsIn(night.round) === 2) parts.push(`סך הכל ${mine}:${theirs}.`);
  }
  if (line) parts.push(line);
  const names = hurt.map(id => [...mySquad(gs).starters, ...mySquad(gs).bench].find(p => p.id === id)?.name).filter(Boolean);
  if (names.length === 1) parts.push(`${names[0]} נפצע ויחמיץ את משחק הליגה השבוע.`);
  else if (names.length > 1) parts.push(`${names.join(', ')} נפצעו ויחמיצו את משחק הליגה השבוע.`);
  parts.push('מי ששיחק הערב יגיע עייף למחזור.');
  return { kind: 'story', title, body: parts.join(' ') };
}

/* ----------------------------------------------------------------- the cup night */

/**
 * גביע המדינה, the domestic cup. Built the same way as the European block
 * above, with the differences the product spec asks for: one leg a round
 * (no aggregate to wait on), entry from tier 4 and 5 every season rather than
 * only the reigning top-tier champion, and a staged entrant (seeded) who
 * joins at the quarter. Salts for drawSeed live at 170_000 and up, each purpose
 * at least 1000 apart, the same discipline Europe's own salt blocks keep.
 */

/** The cup night due this week, before the league round, or null. */
export function cupNight(gs: GameState, live: boolean = CUP_LIVE): CupNight | null {
  if (!live || !gs.cup) return null;
  return cupNightFor(gs.cup, gs.clubId, gs.league.rounds, gs.week);
}

/** His leg is in, level, and the shootout is due. */
export function cupPensDue(gs: GameState, live: boolean = CUP_LIVE): boolean {
  return live && !!gs.cup && gs.cup.status === 'on' && cupNeedsPens(gs.cup, gs.clubId);
}

/** The staged entrant before the pre-bracket is decided and he is paired into the quarter: nothing to play yet, just a wait. */
export function cupWaiting(gs: GameState, live: boolean = CUP_LIVE): boolean {
  return live && !!gs.cup && gs.cup.status === 'waiting';
}

/** The men banned from this cup match: a red here costs the next match here, nowhere else. */
export function cupBanned(gs: GameState): Set<string> {
  return new Set(Object.entries(gs.cup?.bans ?? {}).filter(([, n]) => n > 0).map(([id]) => id));
}

/**
 * The real club behind a cup opponent id: his own league's rival when the
 * draw happens to meet one, otherwise the city it was drawn from (ב.3's
 * roster, tier 4 and 5). The crest and colours come from the same component
 * as every Israeli club, so a cup night never looks invented.
 */
export function cupClub(gs: GameState, id: string): Club {
  if (id === gs.clubId) return club(gs);
  const real = gs.league.clubs.find(c => c.id === id);
  if (real) return real;
  const tier = gs.cup?.clubs.find(c => c.id === id)?.tier ?? CUP_MIN_TIER;
  return cityClubsForTier(tier).find(c => c.id === id)
    ?? cityClubsForTier(CUP_MIN_TIER + 1).find(c => c.id === id)
    ?? club(gs);
}

/**
 * The other side for a cup leg, keyed on the opponent and the round alone
 * (never the night object), so the same squad and names come back whether
 * this is called for the live match input or, after the leg is already
 * recorded, for the shootout screen. The real squad when the draw met a club
 * from the manager's own league ("meeting Maccabi X again"), otherwise a
 * fresh one at the round's strength (ב.3: the cup is hard regardless of which
 * division the shirt plays in day to day). Israeli names throughout —
 * makeSquad's own default — never makeEuroName.
 */
function cupOpponentSquad(gs: GameState, oppId: string, round: number): Squad {
  const real = gs.league.squads[oppId];
  if (real) return real;
  const rng = createRng(drawSeed(gs, 171_000 + round));
  const sq = makeSquad(cupStrengthOf(gs.cup!, oppId, round), rng);
  const named = (p: Player, i: number): Player => ({ ...p, id: `${oppId}-${i}` });
  return { starters: sq.starters.map(named), bench: sq.bench.map((p, i) => named(p, i + 11)) };
}

/** The live engine's input for the cup night: the same shape as the league's and Europe's. */
export function cupMatchInput(gs: GameState, live: boolean = CUP_LIVE) {
  const night = cupNight(gs, live);
  if (!night) throw new Error('no cup night this week');
  const banned = cupBanned(gs);
  const ok = (p: Player) => !isUnavailable(gs, p.id) && !banned.has(p.id);
  const sq = mySquad(gs);
  let starters = lineup(gs).filter(ok);
  let bench = sq.bench.filter(ok);
  if (starters.length < 11) {
    starters = fillFormation([...starters, ...bench], formation(gs.tactic.formation)).slice(0, 11);
    bench = bench.filter(p => !starters.includes(p));
  }
  const opp = cupOpponentSquad(gs, night.oppId, night.round);
  const me = club(gs);
  const them = cupClub(gs, night.oppId);
  const iAmHome = night.host !== false;        // the final sits him at home for the indexes; the ground is neutral
  return {
    seed: drawSeed(gs, 170_000 + night.round),
    homeId: iAmHome ? me.id : them.id, homeName: iAmHome ? me.name : them.name,
    awayId: iAmHome ? them.id : me.id, awayName: iAmHome ? them.name : me.name,
    iAmHome,
    neutral: night.host === null,
    playerStarters: starters, playerBench: bench, playerTactic: gs.tactic, seated: true,
    oppStarters: opp.starters, oppBench: opp.bench,
    guestId: null,
    moraleBias: (gs.meters.morale - 65) / 100,
    friends: gs.friends, tier: me.tier,
    captainId: currentCaptainId(gs),
    coach: {
      chemistry: coachChemistry(gs.coach),
      att: coachAttBias(gs.coach),
      def: coachDefBias(gs.coach),
      cards: coachCardBias(gs.coach),
    },
  };
}

/** The two clubs on the broadcast bar, home first; the final seats him home on neutral ground. */
export function cupMatchClubs(gs: GameState, live: boolean = CUP_LIVE): { home: Club; away: Club } {
  const night = cupNight(gs, live);
  const me = club(gs);
  if (!night) return { home: me, away: me };
  const them = cupClub(gs, night.oppId);
  return night.host === false ? { home: them, away: me } : { home: me, away: them };
}

/** His tie this round, for the screens. */
export function cupMyTie(gs: GameState): CupTie | null {
  return gs.cup ? cupMyTieOf(gs.cup, gs.clubId) ?? null : null;
}

/** Who stands where in his cup shootout: his takers, his keeper, and the other side's names off the same squad that played the leg. */
export function cupPensSides(gs: GameState): { opp: Club | undefined; takers: Player[]; keeper: Player | undefined; theirNames: string[] } {
  const tie = cupMyTie(gs);
  const opp = tie ? cupClub(gs, tie.a === gs.clubId ? tie.b : tie.a) : undefined;
  const banned = cupBanned(gs);
  const eleven = lineup(gs).filter(p => !isUnavailable(gs, p.id) && !banned.has(p.id));
  const keeper = eleven.find(p => p.position === 'GK') ?? mySquad(gs).starters.find(p => p.position === 'GK');
  const takers = eleven.filter(p => p.position !== 'GK').sort((a, b) => overall(b) - overall(a));
  const oppSquad = tie && gs.cup ? cupOpponentSquad(gs, opp!.id, gs.cup.round) : null;
  const theirNames = oppSquad ? [...oppSquad.starters, ...oppSquad.bench].filter(p => p.position !== 'GK').map(p => p.name) : [];
  return { opp, takers, keeper, theirNames };
}

/** The words on the entrance and the broadcast bar: a domestic ground, never a foreign one. */
export function cupEntranceLines(gs: GameState, live: boolean = CUP_LIVE): { round: string; leg: string; homePlace: string; awayPlace: string; venue: string } | null {
  const night = cupNight(gs, live);
  if (!night) return null;
  const them = cupClub(gs, night.oppId);
  const myPlace = `${club(gs).city}, ישראל`;
  const theirPlace = `${them.city}, ישראל`;
  const venue = night.host === null ? 'מגרש ניטרלי' : night.host ? `בבית, ${myPlace}` : `בחוץ, אצל ${them.name}, ${theirPlace}`;
  const iAmHome = night.host !== false;
  return {
    round: ROUND_NAMES[night.round],
    leg: night.host === null ? 'הגמר, מגרש ניטרלי' : 'משחק אחד, קובע',
    homePlace: iAmHome ? myPlace : theirPlace,
    awayPlace: iAmHome ? theirPlace : myPlace,
    venue,
  };
}

/** The draw was made in the summer (or, for a staged entrant, the quarter's pairing was made after the pre-bracket); the ceremony is owed once. */
export function cupDrawDue(gs: GameState, live: boolean = CUP_LIVE): boolean {
  return live && !!gs.cup && !gs.cup.seen && gs.cup.status === 'on';
}
export function openCupDraw(gs: GameState, live: boolean = CUP_LIVE): GameState {
  if (gs.phase !== 'hub' || !cupDrawDue(gs, live)) return gs;
  return { ...gs, phase: 'cup-draw' };
}
/** Watched or skipped, either way it is not owed again — until the next time he is freshly paired in. */
export function finishCupDraw(gs: GameState): GameState {
  if (!gs.cup) return { ...gs, phase: 'hub' };
  return { ...gs, cup: { ...gs.cup, seen: true }, phase: 'hub' };
}
/** The cup as it stands, from the hub's room; shut with the door. */
export function openCupBracket(gs: GameState, live: boolean = CUP_LIVE): GameState {
  if (gs.phase !== 'hub' || !live || !gs.cup) return gs;
  return { ...gs, phase: 'cup-bracket' };
}

/** From the hub to the cup night (or its shootout), only when one is due. */
export function startCupNight(gs: GameState, live: boolean = CUP_LIVE): GameState {
  if (gs.phase !== 'hub') return gs;
  if (cupPensDue(gs, live)) return { ...gs, phase: 'cup-pens' };
  if (!cupNight(gs, live)) return gs;
  return { ...gs, phase: 'cup-match' };
}

/** Who the night hurt, for this week's league match: seeded on the round, one roll a man. */
function cupInjuries(gs: GameState, night: CupNight, played: string[]): string[] {
  const rng = createRng(drawSeed(gs, 172_000 + night.round));
  return played.filter(() => rng() < CUP_INJURY_RISK);
}

/** His tie is settled: the round's other ties are played, the round moves on, the next round's prize is paid. */
function cupAfterTie(gs: GameState, cup: CupState, money: number): { cup: CupState; money: number; line: string } {
  const me = gs.clubId;
  const mine = cupMyTieOf(cup, me);
  if (!mine?.winner) return { cup, money, line: '' };
  let e = cupPlayAiRound(cup, me, drawSeed(gs, 175_000 + cup.round));
  e = cupAdvanceRound(e, me, drawSeed(gs, 178_000 + cup.round));
  let line = '';
  if (e.status === 'won') {
    money += cupPrizeFor(4);
    line = 'גביע המדינה שלכם. הפרס על הזכייה נכנס לקופה.';
  } else if (e.status === 'on') {
    money += cupPrizeFor(e.round);
    line = `עליתם ל${ROUND_NAMES[e.round]} בגביע. הפרס על ההעפלה נכנס לקופה.`;
  } else {
    e = cupPlayOutWithoutMe(e, me, drawSeed(gs, 176_000));
    line = 'הדרך בגביע המדינה נגמרה העונה.';
  }
  return { cup: e, money, line };
}

/**
 * The cup night is over. Mirrors commitEuroLeg's contract: nothing of the
 * league is touched beyond what carries into its match this week (fitness,
 * injury, a red as a cup-only ban), and the money goes straight to the purse.
 * Two differences from Europe: a single leg, so the winner (or the need for
 * penalties) is already known the moment the goals are written, and security
 * at home is the club's own real cost for its tier (SECURITY_HOME) rather
 * than a flat cup number — a domestic night, priced like one.
 */
export function commitCupLeg(gs: GameState, r: MatchResult, onPitchIds: string[], live: boolean = CUP_LIVE): GameState {
  const night = cupNight(gs, live);
  if (!night || !gs.cup) return gs;
  const me = gs.clubId;
  const goals = myGoals(gs, r);
  let cup = cupServeBans(gs.cup).next;
  for (const e of r.events ?? []) if (e.type === 'red' && e.teamId === me && e.playerId) cup = cupBanFor(cup, e.playerId);
  cup = cupRecordMyLeg(cup, me, goals);
  const starters = cupMatchInput(gs, live).playerStarters.map(p => p.id);
  const played = [...new Set([...starters, ...onPitchIds])];
  const fitness = { ...(gs.matchMods.fitness ?? {}) };
  for (const id of played) fitness[id] = (fitness[id] ?? 0) + CUP_TIRED;
  const sitOut = { ...gs.sitOut };
  const hurt = cupInjuries(gs, night, played);
  for (const id of hurt) sitOut[id] = 'פצוע';
  let money = gs.meters.money;
  const myTier = club(gs).tier;
  if (night.host === true) money += Math.round(gateIncome(homeAttendance(gs, false), myTier) * CUP_GATE_SHARE) - SECURITY_HOME[myTier];
  else if (night.host === false) money -= CUP_TRAVEL;
  const pensDue = cupNeedsPens(cup, me);
  const after = pensDue ? { cup, money, line: '' } : cupAfterTie(gs, cup, money);
  const notice = cupNightNotice(gs, night, goals, cupMyTieOf(cup, me), after.line, hurt);
  return markPlayed({
    ...gs,
    cup: after.cup,
    meters: { ...gs.meters, money: after.money },
    matchMods: { ...gs.matchMods, fitness },
    sitOut,
    notices: pensDue ? gs.notices : [...gs.notices, notice],
    phase: pensDue ? 'cup-pens' : 'hub',
  });
}

/** The shootout he took is in: the tie has its winner and the round moves on. */
export function finishCupPens(gs: GameState, score: [number, number]): GameState {
  if (!gs.cup || !cupNeedsPens(gs.cup, gs.clubId)) return { ...gs, phase: 'hub' };
  const cup = cupSettleMyPens(gs.cup, gs.clubId, score);
  const after = cupAfterTie(gs, cup, gs.meters.money);
  const tie = cupMyTieOf(cup, gs.clubId)!;
  const opp = cupClub(gs, tie.a === gs.clubId ? tie.b : tie.a);
  const won = tie.winner === gs.clubId;
  const title = won ? 'עברתם בפנדלים בגביע' : 'הודחתם בפנדלים מהגביע';
  const body = `${score[0]}:${score[1]} בפנדלים מול ${opp.name}. ${after.line}`.trim();
  return {
    ...gs,
    cup: after.cup,
    meters: { ...gs.meters, money: after.money },
    notices: [...gs.notices, { kind: 'story', title, body }],
    phase: 'hub',
  };
}

/**
 * A cup round whose week has arrived while the manager has no tie of his own
 * in it: the staged entrant's pre-bracket (before the quarter pairs him in), or
 * any round after he has already been knocked out. Played by the AI alone
 * and told on the Hub, exactly as the product spec asks (ב.4); nothing of his
 * own money, fitness or squad is touched. Called once a week, from startWeek,
 * before anything blocks on a night of his own.
 */
function advanceCupAiWeek(gs: GameState, live: boolean = CUP_LIVE): GameState {
  if (!live || !gs.cup) return gs;
  const c = gs.cup;
  if (c.status === 'on' || c.status === 'won') return gs;
  const weeks = cupWeeks(gs.league.rounds);
  if (!weeks || weeks[c.round] !== gs.week || cupRoundDone(c)) return gs;
  const after = cupStepAiRound(c, gs.clubId, drawSeed(gs, 179_000 + c.round));
  if (c.status === 'waiting' && after.status === 'on') {
    const tie = cupMyTieOf(after, gs.clubId);
    const opp = tie ? cupClub(gs, tie.a === gs.clubId ? tie.b : tie.a) : null;
    const notice: SquadNotice = {
      kind: 'story',
      title: 'הגביע: אתם מצטרפים לרבע הגמר',
      body: opp ? `השמינית הוכרעה, ואתם נכנסים ישר לרבע הגמר מול ${opp.name}. ההגרלה מחכה בלובי.` : 'השמינית הוכרעה, ואתם נכנסים ישר לרבע הגמר.',
    };
    return { ...gs, cup: after, notices: [...gs.notices, notice] };
  }
  const upsets = after.ties[c.round].filter(t => t.winner && isUpset(after, t));
  const notice: SquadNotice = {
    kind: 'story',
    title: `תוצאות הגביע: ${ROUND_NAMES[c.round]}`,
    body: upsets.length
      ? `הסיבוב הוכרע. הפתעה: ${upsets.map(t => cupClub(gs, t.winner!).short).join(', ')} עברו קבוצה מדרג גבוה יותר.`
      : 'הסיבוב הוכרע, בלי הפתעות.',
  };
  return { ...gs, cup: after, notices: [...gs.notices, notice] };
}

/**
 * A career saved while the staged champion's cup was still waiting, after the week the pre-bracket is played in
 * (24.10: the hub held the round button for it, so startWeek in that week never ran). Playing that round is
 * advanceCupAiWeek's own work, with its own seed, so it is called as if the week were the pre-bracket's own and
 * the real week is put back. Before that week startWeek still does it, and after the cup is on nothing is owed.
 */
export function repairStuckCup(gs: GameState, live: boolean = CUP_LIVE): GameState {
  if (!live || !gs.cup || gs.cup.status !== 'waiting') return gs;
  const weeks = cupWeeks(gs.league.rounds);
  if (!weeks || gs.week <= weeks[gs.cup.round]) return gs;
  const caught = advanceCupAiWeek({ ...gs, week: weeks[gs.cup.round] }, live);
  return caught.cup === gs.cup ? gs : { ...caught, week: gs.week };
}

/**
 * The season is over: the cup is closed if it is not already, and the way it
 * went is written in the chronicle once. No money moves here — every round
 * already paid its own prize on the night it was reached.
 */
export function settleCupSeason(gs: GameState): GameState {
  if (!gs.cup || gs.cup.season !== gs.season) return gs;
  const cup = closeCupSeason(gs.cup, gs.clubId, drawSeed(gs, 177_000));
  const v = cupVerdict(cup, gs.clubId);
  const id = `cup-s${gs.season}`;
  // the cup belongs to tier 4 and 5 and to nothing below: closed quietly for anyone else, never written down
  if (!v || club(gs).tier < CUP_MIN_TIER || gs.chronicle.some(c => c.id === id)) return { ...gs, cup };
  const legs = v.played === 1 ? 'משחק אחד' : `${v.played} משחקים`;
  const paid = v.prize > 0 ? ` הפרסים שנכנסו לקופה: ${formatShekels(v.prize)}.` : '';
  const entry: ChronicleEntry = v.outcome === 'won'
    ? { id, kind: 'season_end', week: gs.week, icon: 'trophy', tint: 'gold',
        title: 'גביע המדינה אצלנו', body: `${legs}, ובסוף הגביע.${paid}` }
    : v.outcome === 'cut'
      ? { id, kind: 'season_end', week: gs.week, icon: 'flag', tint: 'draw',
          title: `גביע המדינה: העונה נגמרה ${ROUND_IN[v.round]}`, body: `הסיבוב לא הוכרע בזמן ונחשב הפסד.${paid}` }
      : { id, kind: 'season_end', week: gs.week, icon: 'flag', tint: 'draw',
          title: `גביע המדינה: הדרך נגמרה ${ROUND_IN[v.round]}`, body: `${legs} בגביע.${paid}` };
  return { ...gs, cup, chronicle: [...gs.chronicle, entry] };
}

/** How the manager's season in the cup went, for the season-end screen. Null when there was none, or outside tier 4/5. */
export function cupSeasonVerdict(gs: GameState): ReturnType<typeof cupVerdict> {
  return club(gs).tier >= CUP_MIN_TIER ? cupVerdict(gs.cup, gs.clubId) : null;
}

/** What this career reports about the cup: nothing below tier 4, and nothing while there is no cup. */
export function cupMarksFor(gs: GameState): ReturnType<typeof cupMarks> {
  return club(gs).tier >= CUP_MIN_TIER ? cupMarks(gs.cup, gs.clubId) : [];
}

/** Is the door open for players? */
export const cupDoorOpen = (): boolean => CUP_LIVE;

/** The word on the hub after the cup night: the score, where it leaves the tie, and who is hurt. */
function cupNightNotice(gs: GameState, night: CupNight, goals: [number, number], tie: CupTie | undefined, line: string, hurt: string[]): SquadNotice {
  const opp = cupClub(gs, night.oppId);
  const where = night.host === null ? 'במגרש ניטרלי' : night.host ? `בבית, ב${club(gs).city}` : `בחוץ, אצל ${opp.name} ב${opp.city}`;
  const title = `גביע המדינה, ${ROUND_NAMES[night.round]}: ${goals[0]}:${goals[1]} מול ${opp.name}`;
  const parts: string[] = [`${where}.`];
  if (tie && !tie.winner) parts.push('הפנדלים יכריעו.');
  if (line) parts.push(line);
  const names = hurt.map(id => [...mySquad(gs).starters, ...mySquad(gs).bench].find(p => p.id === id)?.name).filter(Boolean);
  if (names.length === 1) parts.push(`${names[0]} נפצע ויחמיץ את משחק הליגה השבוע.`);
  else if (names.length > 1) parts.push(`${names.join(', ')} נפצעו ויחמיצו את משחק הליגה השבוע.`);
  parts.push('מי ששיחק הערב יגיע עייף למחזור.');
  return { kind: 'story', title, body: parts.join(' ') };
}

export function startWeek(gs: GameState): GameState {
  // the sheet has to be in order first: nobody banned in the eleven, sixteen names
  if (weekBlockedReason(gs)) return gs;
  // a cup round the manager has no part in this week (a staged entrant still waiting, or a round after he was
  // knocked out) plays itself out quietly here, before anything checks whether his own night is due
  gs = advanceCupAiWeek(gs);
  // and a European night that is due is played first: the league waits for it, in the engine as well as on the Hub button
  if (euroNight(gs)) return gs;
  // the cup night waits for nobody either; there is never a week with both (cupWeeks never overlaps euroWeeks)
  if (cupNight(gs)) return gs;
  // a shirt promised on the phone last week lands on this week's sheet
  if (gs.mate.promiseNext) {
    gs = {
      ...gs,
      matchMods: { ...gs.matchMods, promised: gs.mate.promiseNext },
      mate: { ...gs.mate, promiseNext: undefined },
    };
  }
  const fx = playerFixture(gs);
  const rivalId = fx ? (fx.homeId === gs.clubId ? fx.awayId : fx.homeId) : gs.clubId;
  const rival = gs.league.clubs.find(c => c.id === rivalId)!;
  const myClub = club(gs);
  const star = topPlayerName(mySquad(gs));
  const rng = createRng(drawSeed(gs, 50_000));

  // only templates that fit the live save, then a long cooldown so a season
  // of rounds keeps surfacing something you have not seen yet
  const ctx = dilemmaCtx(gs, star, rival.short, rivalId);
  const recent = new Set(gs.dilemmaHistory.slice(-8));
  const asked = new Set(gs.seasonDilemmas);
  const pick = (kind: 'now' | 'inbox'): RolledDilemma | null => {
    const fits = eligible(ctx, kind).filter(t => !t.oncePerSeason || !asked.has(t.id));
    if (!fits.length) return null;
    const fresh = fits.filter(t => !recent.has(t.id));
    const source = fresh.length ? fresh : fits;
    return rollDilemma(source[Math.floor(rng() * source.length)], ctx, rng);
  };

  // the blocking one is about the match you are walking into. A talk booked
  // by an earlier answer comes first, and only that once
  const booked = ctx.queued ? TEMPLATES.find(t => t.id === ctx.queued) : undefined;
  // the owner's request to lose a match, once in a league at the most, in place of the question of the week
  const fixAsk = booked ? null : fixOfferDue(gs);
  if (fixAsk) gs = fixAsk.gs;
  const urgent = booked
    ? rollDilemma(booked, ctx, rng)
    : fixAsk ? rollDilemma(TEMPLATES.find(t => t.id === fixAsk.id)!, ctx, rng)
    : (pick('now') ?? (() => {
      // nothing urgent fits: take any of the league's questions, but still only one whose condition holds, so a fallback
      // never tells a club with ₪119M that the till is empty (20.10); the whole league only if nothing at all fits
      const all = templatesForTier(ctx.tier);
      const fits = all.filter(t => !t.when || t.when(ctx));
      const pool = fits.length ? fits : all;
      return rollDilemma(pool[Math.floor(rng() * pool.length)], ctx, rng);
    })());
  if (booked) gs = { ...gs, queued: null };

  // and something that can wait lands in the inbox, capped so it never piles up
  const inbox = [...gs.inbox];
  if (inbox.length < INBOX_CAP && rng() < 0.6) {
    const waiting = pick('inbox');
    if (waiting && !inbox.some(m => m.id === waiting.id)) inbox.push(waiting);
  }

  // remember the pre match line the hub just showed, so it will not come round
  // again for a while
  const fanHistory = [...gs.fanHistory, fanNote(gs, 'pre').id].slice(-FAN_HISTORY);

  return { ...gs, phase: 'dilemma', dilemma: urgent, inbox, fanHistory };
}

/**
 * A promise made in a dilemma is kept in the save. Choosing to release the man
 * who asked really removes him, and the outcome says who left and how many are
 * left, so the manager can check his own decision against the squad screen.
 * Never below eleven plus a bench, whatever the fiction wants.
 */
function keepThePromise(gs: GameState, rolled: RolledDilemma, opt: RolledDilemma['options'][number]): { gs: GameState; note: string } {
  let note = '';
  if (opt.release && rolled.subjectName && squadSize(gs) > 14) {
    const him = subjectOf(gs, rolled.subjectName);
    if (him) {
      gs = removePlayer(gs, him.id);
      note = ` ${him.name} עזב, ונשארתם עם ${squadSize(gs)} שחקנים.`;
    }
  }
  const acted = applyActs(gs, rolled, opt.act ?? []);
  return { gs: acted.gs, note: note + acted.note };
}

/* ----------------------------------------------------- answers that act */

/** The dilemma names a man by surname; find him in the squad. */
function subjectOf(gs: GameState, surnameOrName: string): Player | undefined {
  const sq = mySquad(gs);
  const all = [...sq.starters, ...sq.bench];
  return all.find(x => x.name === surnameOrName) ?? all.find(x => surname(x.name) === surnameOrName);
}

/** Resolve who an act is about against the live squad. */
function whoIs(gs: GameState, rolled: RolledDilemma, who: Who): Player | undefined {
  const sq = mySquad(gs);
  const all = [...sq.starters, ...sq.bench];
  switch (who) {
    case 'subject': return rolled.subjectName ? subjectOf(gs, rolled.subjectName) : undefined;
    case 'star': return [...all].sort((a, b) => overall(b) - overall(a))[0];
    case 'gk': return sq.starters.find(p => p.position === 'GK') ?? all.find(p => p.position === 'GK');
    case 'captain': return captain(gs) ?? undefined;
    case 'striker': return [...sq.starters].filter(p => FORWARD.has(p.position)).sort((a, b) => overall(b) - overall(a))[0]
      ?? [...all].filter(p => FORWARD.has(p.position)).sort((a, b) => overall(b) - overall(a))[0];
    case 'dry': case 'benched': return rolled.subjectName ? subjectOf(gs, rolled.subjectName) : undefined;
    case 'academy': return undefined;
  }
}

/** Take a man out of the eleven for a bench man of the same kind, if he is in it. */
function benchHim(gs: GameState, id: string): GameState {
  const sq = mySquad(gs);
  const si = sq.starters.findIndex(p => p.id === id);
  if (si < 0) return gs;
  const him = sq.starters[si];
  const isGk = him.position === 'GK';
  const sub = sq.bench.find(p => (p.position === 'GK') === isGk && !isUnavailable(gs, p.id) && !(gs.sitOut[p.id]));
  if (!sub) return gs;
  return swapPlayers(gs, him.id, sub.id);
}

/** Put a man into the eleven, for the weakest of his line, if he is not in it. */
function startHim(gs: GameState, id: string): GameState {
  const sq = mySquad(gs);
  if (sq.starters.some(p => p.id === id)) return gs;
  const him = sq.bench.find(p => p.id === id);
  if (!him) return gs;
  const isGk = him.position === 'GK';
  const line = LINE[him.position] ?? 'MID';
  const out = [...sq.starters]
    .filter(p => (p.position === 'GK') === isGk && (isGk || (LINE[p.position] ?? 'MID') === line))
    .sort((a, b) => overall(a) - overall(b))[0]
    ?? [...sq.starters].filter(p => (p.position === 'GK') === isGk).sort((a, b) => overall(a) - overall(b))[0];
  if (!out) return gs;
  return swapPlayers(gs, out.id, him.id);
}

/** A signing the agent or the owner brings, built to the pitch that sold him. */
function agentSigning(gs: GameState, profile: 'dropped' | 'brazilian' | 'veteran' | 'striker'): Player {
  const tier = club(gs).tier;
  const rng = createRng(drawSeed(gs, 60_000));
  const used = new Set([...mySquad(gs).starters, ...mySquad(gs).bench].map(p => p.name));
  const ceiling = leagueCeiling(tier);
  const p = profile === 'striker' ? makePlayer('ST', ceiling + 3, rng, undefined, used)
    : profile === 'dropped' ? makePlayer(['CM', 'CB', 'RW'][Math.floor(rng() * 3)] as Position, ceiling + 4, rng, undefined, used)
    : profile === 'brazilian' ? makePlayer(['CAM', 'LW'][Math.floor(rng() * 2)] as Position, ceiling + 1, rng, undefined, used)
    : makePlayer(['CB', 'CM'][Math.floor(rng() * 2)] as Position, ceiling + 2, rng, undefined, used);
  if (profile === 'dropped') p.age = 31;
  if (profile === 'veteran') p.age = 34;
  if (profile === 'brazilian') {
    p.attrs.dribbling = Math.min(99, p.attrs.dribbling + 8); p.attrs.passing = Math.min(99, p.attrs.passing + 4);
    // a Brazilian is called like one, with his country's names, and the squad screen says where he is from
    used.delete(p.name);
    p.nation = 'brazil';
    p.name = makeForeignName(createRng(drawSeed(gs, 60_001)), 'brazil', used);
  }
  return p;
}

/**
 * Do what the answer said. Each act touches the save in the smallest honest
 * way, and the note that comes back is appended to the outcome so the
 * manager can check the squad screen against what he was just told.
 */
function applyActs(gs: GameState, rolled: RolledDilemma, acts: Act[]): { gs: GameState; note: string } {
  let note = '';
  for (const a of acts) {
    switch (a.kind) {
      case 'sit': {
        const him = whoIs(gs, rolled, a.who);
        if (!him) break;
        gs = benchHim({ ...gs, sitOut: { ...gs.sitOut, [him.id]: a.label } }, him.id);
        break;
      }
      case 'play': {
        const him = whoIs(gs, rolled, a.who);
        if (!him) break;
        gs = startHim(gs, him.id);
        break;
      }
      case 'fitnessSome': {
        // a few of the likely eleven, drawn by the week's seed so a reload names
        // the same tired men, each carrying the mark the match screen shows
        const rng = createRng(drawSeed(gs, 110_000));
        const pool = [...lineup(gs)];
        const fit: Record<string, number> = { ...(gs.matchMods.fitness ?? {}) };
        for (let k = 0; k < a.count && pool.length; k++) {
          const i = Math.floor(rng() * pool.length);
          const man = pool.splice(i, 1)[0];
          fit[man.id] = (fit[man.id] ?? 0) + a.delta;
        }
        gs = { ...gs, matchMods: { ...gs.matchMods, fitness: fit } };
        break;
      }
      case 'loanOut': {
        // Itzik, 3.10: the text promises a return next season; in fact he leaves
        // the squad for good, and a squad on the floor pulls a boy up so the
        // sixteen never becomes fifteen
        const him = whoIs(gs, rolled, a.who);
        if (!him) break;
        let next = removePlayer(gs, him.id);
        next = { ...next, preResolved: [...next.preResolved, `renew-${him.id}`] };
        if (squadSize(next) < MIN_SQUAD) {
          const rng = createRng(drawSeed(gs, 120_000));
          const filled = fillWithYouth(mySquad(next), rng, club(next).tier, MIN_SQUAD);
          next = writeSquad(next, filled.squad);
          const contracts = { ...next.contracts };
          for (const p of [...filled.squad.starters, ...filled.squad.bench]) if (!(p.id in contracts)) contracts[p.id] = 3;
          next = { ...next, contracts };
          note += ' נער מהאקדמיה צורף לסגל במקומו.';
        }
        gs = next;
        break;
      }
      case 'winBonus': gs = { ...gs, matchMods: { ...gs.matchMods, winBonus: a.amount } }; break;
      case 'friendly': {
        // the works team that turns seventy gets a name now, so a reload names the same one
        const rng = createRng(drawSeed(gs, 130_000));
        const factory = FACTORIES[Math.floor(rng() * FACTORIES.length)];
        gs = { ...gs, matchMods: { ...gs.matchMods, friendly: { factory, fee: a.fee } } };
        break;
      }
      case 'fitnessAll': {
        const sq = mySquad(gs);
        const fitness = { ...(gs.matchMods.fitness ?? {}) };
        for (const p of [...sq.starters, ...sq.bench]) fitness[p.id] = (fitness[p.id] ?? 0) + a.delta;
        gs = { ...gs, matchMods: { ...gs.matchMods, fitness } };
        break;
      }
      case 'chatAfter': gs = { ...gs, matchMods: { ...gs.matchMods, chatAfter: { trigger: a.trigger, onlyIfWon: a.onlyIfWon } } }; break;
      case 'queue': gs = { ...gs, queued: { id: a.id, week: gs.week + a.weeks } }; break;
      case 'promiseStart': {
        // nothing moves on the sheet: the squad screen shows the promise, and
        // the round settles whether it was kept
        const him = whoIs(gs, rolled, a.who);
        if (!him) break;
        gs = { ...gs, matchMods: { ...gs.matchMods, promised: { id: him.id, name: him.name } } };
        break;
      }
      case 'fitness': {
        const him = whoIs(gs, rolled, a.who);
        if (!him) break;
        const fitness = { ...(gs.matchMods.fitness ?? {}), [him.id]: (gs.matchMods.fitness?.[him.id] ?? 0) + a.delta };
        gs = { ...gs, matchMods: { ...gs.matchMods, fitness } };
        break;
      }
      case 'injury': {
        const him = whoIs(gs, rolled, a.who);
        if (!him) break;
        gs = { ...gs, matchMods: { ...gs.matchMods, injury: { ...(gs.matchMods.injury ?? {}), [him.id]: a.risk } } };
        break;
      }
      case 'mud': gs = { ...gs, matchMods: { ...gs.matchMods, mud: true } }; break;
      case 'formation': gs = { ...gs, tactic: { ...gs.tactic, formation: a.id } }; break;
      case 'gate': gs = { ...gs, matchMods: { ...gs.matchMods, gate: (gs.matchMods.gate ?? 1) * a.mult } }; break;
      case 'promiseWin': gs = { ...gs, matchMods: { ...gs.matchMods, promiseWin: true } }; break;
      case 'guest': {
        const rng = createRng(drawSeed(gs, 70_000));
        const used = new Set([...mySquad(gs).starters, ...mySquad(gs).bench].map(p => p.name));
        const boy = makePlayer('CM', leagueCeiling(club(gs).tier) - 14, rng, undefined, used);
        boy.age = 19;
        gs = { ...gs, matchMods: { ...gs.matchMods, guest: boy } };
        break;
      }
      case 'sign': {
        if (squadSize(gs) >= MAX_SQUAD) { note += ' הסגל מלא, הוא לא נכנס.'; break; }
        const p = agentSigning(gs, a.profile);
        const sq = mySquad(gs);
        gs = { ...writeSquad(gs, { starters: sq.starters, bench: [...sq.bench, p] }), contracts: { ...gs.contracts, [p.id]: 1 }, arrivals: [...gs.arrivals, p.id] };
        note += ` ${p.name} (${p.position}, ${overall(p)}) הצטרף לסגל.`;
        break;
      }
      case 'promote': {
        const kid = [...gs.youth.players].sort((a, b) => overall(b) - overall(a))[0];
        if (!kid) break;
        // a message can sit in the inbox while the squad fills up, and the answer must
        // not claim what did not happen: the promise is replaced, not corrected after
        if (squadSize(gs) >= MAX_SQUAD) { note += '|noRoom'; break; }
        const sq = mySquad(gs);
        gs = {
          ...writeSquad(gs, { starters: sq.starters, bench: [...sq.bench, kid] }),
          youth: { ...gs.youth, players: gs.youth.players.filter(p => p.id !== kid.id), ready: gs.youth.ready.filter(n => n !== kid.name) },
          contracts: { ...gs.contracts, [kid.id]: 3 },
        };
        break;
      }
      case 'sell': {
        const him = whoIs(gs, rolled, a.who);
        if (!him || squadSize(gs) <= MIN_SQUAD) { note += ' הסגל על המינימום, המכירה נדחתה.'; break; }
        const moved = moveToLeagueClub(removePlayer(gs, him.id), him);
        const buyer = gs.league.clubs.find(c => c.id === moved.clubId)?.short ?? 'קבוצה אחרת';
        gs = { ...moved.gs, preResolved: [...moved.gs.preResolved, `renew-${him.id}`] };
        note += `|buyerClub=${buyer}`;
        break;
      }
      case 'summerExit': {
        const him = whoIs(gs, rolled, a.who);
        if (him && !gs.summerExits.includes(him.id)) gs = { ...gs, summerExits: [...gs.summerExits, him.id] };
        break;
      }
      case 'follow': gs = { ...gs, followUps: [...gs.followUps, { season: gs.season, week: gs.week + a.weeks, title: a.title, body: a.body }] }; break;
      case 'fixDeal': {
        const sit = FIX_SITUATIONS.find(s => s.id === rolled.id);
        if (!sit) break;
        const tier = club(gs).tier;
        // the verdict is drawn the moment he says yes, so quitting and coming back changes nothing
        const caught = createRng(drawSeed(gs, 174_000))() < FIX_CAUGHT;
        gs = {
          ...gs,
          fix: { id: sit.id, tier, season: gs.season, week: gs.week, payout: fixPayout(tier, sit.weight), caught, stage: 'agreed' },
          fixLog: { ...gs.fixLog, done: true },
        };
        break;
      }
      case 'fixRefuse': break;
      case 'youthLeaves': {
        const name = rolled.subjectName;
        const gone = name ? [...gs.youth.players, ...[...mySquad(gs).starters, ...mySquad(gs).bench].filter(p => (gs.youthUp ?? []).includes(p.id))].find(p => surname(p.name) === name) : undefined;
        if (!gone) break;
        const inSquad = [...mySquad(gs).starters, ...mySquad(gs).bench].some(p => p.id === gone.id);
        const base = inSquad ? removePlayer(gs, gone.id) : gs;
        gs = { ...base, youth: { ...base.youth, players: base.youth.players.filter(p => p.id !== gone.id), ready: base.youth.ready.filter(n => n !== gone.name) }, youthUp: (base.youthUp ?? []).filter(id => id !== gone.id) };
        break;
      }
      case 'youthBoost': gs = { ...gs, youthBoost: [...new Set([...gs.youthBoost, ...gs.youth.players.slice(0, 3).map(p => p.name)])] }; break;
      case 'youthLeaveRisk': {
        const kid = [...gs.youth.players].sort((a, b) => overall(b) - overall(a))[0];
        if (kid) gs = { ...gs, youthLeaveRisk: { name: kid.name, p: a.p } };
        break;
      }
    }
  }
  return { gs, note };
}

/** The outcome text, with anything only the acts could know filled in. */
/** DRAFT WORDING, Itzik's to correct: what the answer says when the squad filled up before it was given. */
const NO_ROOM_OUTCOME = 'הסגל התמלא בינתיים, אז הוא נשאר בנוער עד שיתפנה מקום.';

function finishOutcome(outcome: string, note: string): string {
  if (note.includes('|noRoom')) return NO_ROOM_OUTCOME;
  const m = note.match(/\|buyerClub=([^|]+)$/);
  const clean = note.replace(/\|buyerClub=[^|]+$/, '');
  return outcome.replace('{buyerClub}', m?.[1] ?? 'קבוצה אחרת') + clean;
}

export function chooseDilemma(gs: GameState, optionIndex: number): GameState {
  const rolled = gs.dilemma;
  if (!rolled) return gs;
  const opt = rolled.options[optionIndex];
  const e: DilemmaEffect = opt.effect;
  const kept = keepThePromise(gs, rolled, opt);
  gs = kept.gs;
  return {
    ...gs,
    meters: {
      money: cash(gs.meters.money + (e.money ?? 0)),
      morale: moraleShift(gs.meters.morale, (e.morale ?? 0)),
      prestige: meter(gs.meters.prestige + (e.prestige ?? 0)),
      // an answer the terrace heard about moves the terrace
      fans: meter(gs.meters.fans + (e.fans ?? 0)),
    },
    pendingOutcome: finishOutcome(opt.outcome, kept.note),
    style: scoreStyle(gs.style, e),
    dilemmaHistory: [...gs.dilemmaHistory, rolled.id],
    seasonDilemmas: [...gs.seasonDilemmas, rolled.id],
  };
}

export function toTactic(gs: GameState): GameState {
  return { ...gs, phase: 'tactic', dilemma: null, pendingOutcome: null };
}

/* ------------------------------------------------ the factory friendly */

/** "ירידה קלה" in Itzik's draft: a few points of condition, for the men who played. */
const FRIENDLY_TIRED = -6;

/** The works team is rated this far under the eleven who face it: a friendly, not a final. */
const FRIENDLY_WORKS_BELOW = 5;

/**
 * The eleven who play the friendly: everyone the sheet left out, best first,
 * and when that is short of eleven the weakest of the sheet fill the rest, so
 * the stars rest. A keeper always goes in. Null when the squad cannot field
 * eleven available men, and then there is simply no friendly.
 */
function friendlyEleven(gs: GameState): Player[] | null {
  const sheet = lineup(gs);
  const onSheet = new Set(sheet.map(p => p.id));
  const sq = mySquad(gs);
  const all = [...sq.starters, ...sq.bench].filter(p => !isUnavailable(gs, p.id));
  const best = (a: Player, b: Player) => overall(b) - overall(a);
  const eleven = all.filter(p => !onSheet.has(p.id)).sort(best).slice(0, 11);
  for (const p of all.filter(x => onSheet.has(x.id)).sort((a, b) => overall(a) - overall(b))) {
    if (eleven.length >= 11) break;
    eleven.push(p);
  }
  if (eleven.length < 11) return null;
  if (!eleven.some(p => p.position === 'GK')) {
    const gk = all.filter(p => p.position === 'GK').sort(best)[0];
    if (!gk) return null;
    const weakest = [...eleven].sort((a, b) => overall(a) - overall(b))[0];
    eleven[eleven.indexOf(weakest)] = gk;
  }
  return eleven;
}

/** Play the works team in an instant, seeded by the week, and tell it. */
function playFriendly(gs: GameState, f: { factory: string; fee: number }): FriendlyReport | null {
  const mine = friendlyEleven(gs);
  if (!mine) return null;
  const avg = mine.reduce((s, p) => s + overall(p), 0) / mine.length;
  const works = makeSquad(Math.round(avg) - FRIENDLY_WORKS_BELOW, createRng(drawSeed(gs, 130_001)));
  const tactic: TeamInput['tactic'] = { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' };
  const shape = formation(DEFAULT_FORMATION);
  const res = simulateMatch(
    { id: 'friendly-works', name: f.factory, players: fillFormation(works.starters, shape), tactic, chemistry: 0.6, isHome: true },
    { id: gs.clubId, name: club(gs).short, players: fillFormation(mine, shape), tactic, chemistry: 0.6, isHome: false },
    drawSeed(gs, 130_002));
  const score: [number, number] = [res.score[1], res.score[0]];

  const events: FriendlyEvent[] = [];
  for (const e of res.events) {
    if (e.type === 'goal' || e.type === 'penalty_goal' || e.type === 'own_goal' || e.type === 'red') {
      events.push({ minute: e.minute, type: e.type, mine: e.teamId === gs.clubId, who: surnameOf(e.playerName) });
    }
  }
  const top = [...mine].sort((a, b) => (res.ratings[b.id] ?? 0) - (res.ratings[a.id] ?? 0))[0];
  const star = top && (res.ratings[top.id] ?? 0) >= 7 ? surnameOf(top.name) : undefined;
  const lines = describeFriendly(
    { factory: f.factory, club: club(gs).short, score, events, star }, createRng(drawSeed(gs, 130_003)));
  return { factory: f.factory, club: club(gs).short, score, fee: f.fee, played: mine.map(p => p.id), lines };
}

/**
 * The sheet goes in. When the works team's friendly was agreed this week it is
 * played now, in an instant, and the popup tells it before the league match.
 */
export function sendTeamsheet(gs: GameState): GameState {
  const f = gs.matchMods.friendly;
  if (!f) return { ...gs, phase: 'match' };
  if (f.report) return { ...gs, phase: 'friendly' };
  const report = playFriendly(gs, f);
  if (!report) {
    const { friendly: _gone, ...rest } = gs.matchMods;
    return { ...gs, matchMods: rest, phase: 'match' };
  }
  return { ...gs, matchMods: { ...gs.matchMods, friendly: { ...f, report } }, phase: 'friendly' };
}

/**
 * The popup is read and closed: the fee lands once, the men who played carry
 * the tiredness into the league match and a minute on their sheet, and the
 * round goes on. Closing it twice does nothing, the friendly is gone.
 */
export function finishFriendly(gs: GameState): GameState {
  const f = gs.matchMods.friendly;
  const report = f?.report;
  if (!f || !report) return { ...gs, phase: 'match' };
  const roster = new Map([...mySquad(gs).starters, ...mySquad(gs).bench].map(p => [p.id, p] as const));
  const fitness = { ...(gs.matchMods.fitness ?? {}) };
  const seasonStats = { ...gs.seasonStats };
  for (const id of report.played) {
    const p = roster.get(id);
    if (!p) continue;
    fitness[id] = (fitness[id] ?? 0) + FRIENDLY_TIRED;
    const rec = seasonStats[id] ?? blankSeason(p.name, gs.clubId);
    seasonStats[id] = { ...rec, friendlyApps: (rec.friendlyApps ?? 0) + 1 };
  }
  const { friendly: _paid, ...rest } = gs.matchMods;
  return {
    ...gs, phase: 'match', seasonStats,
    meters: { ...gs.meters, money: cash(gs.meters.money + f.fee) },
    matchMods: { ...rest, fitness },
  };
}

/* ------------------------------------------------------------- the inbox */

export const INBOX_CAP = 3;

export function openInbox(gs: GameState): GameState {
  return { ...gs, phase: 'inbox', pendingOutcome: null };
}
export function closeInbox(gs: GameState): GameState {
  return { ...gs, phase: 'hub', pendingOutcome: null };
}

/** Answer a message that was waiting. Same weight as a matchday dilemma. */
export function answerInbox(gs: GameState, itemIndex: number, optionIndex: number): GameState {
  const item = gs.inbox[itemIndex];
  if (!item) return gs;
  const opt = item.options[optionIndex];
  if (!opt) return gs;
  const e: DilemmaEffect = opt.effect;
  const kept = keepThePromise(gs, item, opt);
  gs = kept.gs;
  return {
    ...gs,
    meters: {
      money: cash(gs.meters.money + (e.money ?? 0)),
      morale: moraleShift(gs.meters.morale, (e.morale ?? 0)),
      prestige: meter(gs.meters.prestige + (e.prestige ?? 0)),
      // an answer the terrace heard about moves the terrace
      fans: meter(gs.meters.fans + (e.fans ?? 0)),
    },
    pendingOutcome: finishOutcome(opt.outcome, kept.note),
    style: scoreStyle(gs.style, e),
    dilemmaHistory: [...gs.dilemmaHistory, item.id],
    inbox: gs.inbox.filter((_, i) => i !== itemIndex),
  };
}

/** Dismiss the outcome bubble and go back to the list. */
export function clearInboxOutcome(gs: GameState): GameState {
  return { ...gs, pendingOutcome: null };
}
export function setTactic(gs: GameState, tactic: Tactic): GameState {
  // a new shape is a new team sheet: the men are seated by fit and he starts
  // arranging from there
  const reseat = tactic.formation !== gs.tactic.formation;
  return { ...gs, tactic, seats: reseat ? null : gs.seats };
}

/* --------------------------------------------------------------- the match */

function teamInput(gs: GameState, clubId: string, isHome: boolean, tactic?: Tactic): TeamInput {
  const sq = gs.league.squads[clubId];
  const c = gs.league.clubs.find(x => x.id === clubId)!;
  const t = tactic ?? { approach: 'balanced' as Approach, press: 'mid' as Press, formation: DEFAULT_FORMATION };
  const mine = clubId === gs.clubId;
  // the manager's side plays in the shirts he handed out
  const players: Player[] = (mine ? lineup(gs) : sq.starters).map(p => ({ ...p }));
  if (mine) {
    const bias = (gs.meters.morale - 65) / 100;
    players.forEach(p => { p.morale = clamp(p.morale + bias * 20, 0, 100); });
  }
  return {
    id: clubId, name: c.name, players,
    // your shape is the one you picked, every other club keeps its own
    tactic: { formation: mine ? (t.formation ?? DEFAULT_FORMATION) : formationForClub(clubId), approach: t.approach, press: t.press },
    // your side plays to the manager on the touchline, the AI keeps the
    // neutral baseline the engine was calibrated against
    chemistry: mine ? coachChemistry(gs.coach) : 0.7,
    coach: mine ? { att: coachAttBias(gs.coach), def: coachDefBias(gs.coach) } : undefined,
    isHome,
    seated: mine,
  };
}

export function simulatePlayerMatch(gs: GameState, momentPick: number | null): MatchResult {
  const fx = playerFixture(gs)!;
  const seedBase = drawSeed(gs, (momentPick ?? 0) * 3);
  const home = fx.homeId === gs.clubId ? teamInput(gs, fx.homeId, true, gs.tactic) : teamInput(gs, fx.homeId, true);
  const away = fx.awayId === gs.clubId ? teamInput(gs, fx.awayId, false, gs.tactic) : teamInput(gs, fx.awayId, false);
  return simulateMatch(home, away, seedBase);
}

/** Everything the live match engine needs to start from the current state. */
export function liveMatchInput(gs: GameState) {
  const fx = playerFixture(gs)!;
  const iAmHome = fx.homeId === gs.clubId;
  const oppId = iAmHome ? fx.awayId : fx.homeId;
  // a banned man or the registered youth is on the sheet, never on the grass.
  // The hub will not start a round with a banned man in the eleven, but if
  // anything ever gets past that, the shape is refilled from the bench here
  const sq = mySquad(gs);
  const ok = (p: Player) => !isUnavailable(gs, p.id);
  // in slot order, the manager's own placing
  let starters = lineup(gs).filter(ok);
  let bench = sq.bench.filter(ok);
  if (starters.length < 11) {
    starters = fillFormation([...starters, ...bench], formation(gs.tactic.formation)).slice(0, 11);
    bench = bench.filter(p => !starters.includes(p));
  }
  // what this week's answers did to the match: a man playing hurt or fired up,
  // a pitch that is mud for both sides, the owner's boy waiting on the bench
  const mods = gs.matchMods;
  const tuned = (p: Player, mine: boolean): Player => {
    let q = p;
    const d = mine ? mods.fitness?.[p.id] : undefined;
    if (d) q = { ...q, fitness: Math.max(20, Math.min(100, q.fitness + d)) };
    if (mods.mud) q = { ...q, attrs: { ...q.attrs, passing: Math.max(20, q.attrs.passing - 8), pace: Math.max(20, q.attrs.pace - 8) } };
    return q;
  };
  const mine = {
    starters: starters.map(p => tuned(p, true)),
    bench: [...bench.map(p => tuned(p, true)), ...(mods.guest ? [mods.guest] : [])],
  };
  const oppSq = gs.league.squads[oppId];
  const opp = { starters: oppSq.starters.map(p => tuned(p, false)), bench: oppSq.bench.map(p => tuned(p, false)) };
  const homeClub = gs.league.clubs.find(c => c.id === fx.homeId)!;
  const awayClub = gs.league.clubs.find(c => c.id === fx.awayId)!;
  return {
    seed: drawSeed(gs, 0),
    homeId: fx.homeId, homeName: homeClub.name,
    awayId: fx.awayId, awayName: awayClub.name,
    iAmHome,
    playerStarters: mine.starters, playerBench: mine.bench, playerTactic: gs.tactic, seated: true,
    oppStarters: opp.starters, oppBench: opp.bench,
    guestId: mods.guest?.id ?? null,
    moraleBias: (gs.meters.morale - 65) / 100,
    friends: gs.friends, tier: club(gs).tier,
    captainId: currentCaptainId(gs),
    coach: {
      chemistry: coachChemistry(gs.coach),
      att: coachAttBias(gs.coach),
      def: coachDefBias(gs.coach),
      cards: coachCardBias(gs.coach),
    },
  };
}

export function commitRound(gs: GameState, playerResult: MatchResult): GameState {
  const fx = playerFixture(gs)!;
  const table = cloneTable(gs.league.table);
  const roundResults: RoundResult[] = [];

  applyResult(table, fx.homeId, fx.awayId, playerResult.score[0], playerResult.score[1]);
  roundResults.push({ homeId: fx.homeId, awayId: fx.awayId, hg: playerResult.score[0], ag: playerResult.score[1] });

  // the whole division's season record, so the scoring charts are a real race
  const seasonStats: Record<string, PlayerSeason> = {};
  for (const k of Object.keys(gs.seasonStats)) seasonStats[k] = { ...gs.seasonStats[k] };

  const rec = (id: string, name: string, clubId: string): PlayerSeason => {
    const r = seasonStats[id] ?? blankSeason(name, clubId);
    if (!r.name) r.name = name;
    if (!r.clubId) r.clubId = clubId;
    seasonStats[id] = r;
    return r;
  };
  /** everyone who started gets an appearance, goals and assists come off events */
  const logMatch = (homeId: string, awayId: string, events: { type: string; teamId: string; playerId?: string; playerName?: string; assistId?: string; assistName?: string }[]) => {
    for (const cid of [homeId, awayId]) {
      for (const p of gs.league.squads[cid]?.starters ?? []) rec(p.id, p.name, cid).apps += 1;
    }
    for (const e of events) {
      if (e.type !== 'goal' && e.type !== 'penalty_goal') continue;
      if (e.playerId) {
        const r = rec(e.playerId, e.playerName ?? '', e.teamId);
        r.goals += 1;
        r.lastGoalWeek = gs.week;
      }
      if (e.assistId) rec(e.assistId, e.assistName ?? '', e.teamId).assists += 1;
    }
  };

  logMatch(fx.homeId, fx.awayId, playerResult.events);

  const others = gs.league.fixtures.filter(f =>
    f.round === gs.week && f.homeId !== gs.clubId && f.awayId !== gs.clubId);
  for (const f of others) {
    const r = simulateMatch(
      teamInput(gs, f.homeId, true), teamInput(gs, f.awayId, false),
      drawSeed(gs, 200_000 + hashPair(f.homeId, f.awayId)),
    );
    applyResult(table, f.homeId, f.awayId, r.score[0], r.score[1]);
    roundResults.push({ homeId: f.homeId, awayId: f.awayId, hg: r.score[0], ag: r.score[1] });
    logMatch(f.homeId, f.awayId, r.events);
  }

  const iAmHome = fx.homeId === gs.clubId;
  const myGoals = iAmHome ? playerResult.score[0] : playerResult.score[1];
  const oppGoals = iAmHome ? playerResult.score[1] : playerResult.score[0];
  const won = myGoals > oppGoals, draw = myGoals === oppGoals;
  const prize = matchPrize(club(gs).tier, won ? 'W' : draw ? 'D' : 'L');
  // a promise made in the week is settled by the team sheet: the man he gave
  // his word to either started or watched, and the whole room knows which
  const promised = gs.matchMods.promised;
  const broken = !!promised && !lineup(gs).some(p => p.id === promised.id);
  // a motivator lifts the room after any result, a cold coach lets it sag
  const moraleDelta = (won ? +4 : draw ? -1 : -6) + coachMoraleBias(gs.coach) + (broken ? BROKEN_PROMISE_MORALE : 0);

  const derby = isDerby(fx.homeId, fx.awayId);
  // the terrace: what it felt before tonight fades a point, then the table has its say
  const fansTonight = meter(gs.meters.fans + fansDrift(gs.meters.fans) + fansAfterResult(myGoals - oppGoals, derby));
  // the week also costs money to run, so a result is a real financial event
  const costs = roundCosts({
    squad: mySquad(gs), tier: club(gs).tier, isHome: iAmHome,
    isDerby: derby, rounds: gs.league.rounds,
  });
  // a home crowd pays at the gate, the reward for a bigger ground
  const gate = iAmHome ? Math.round(gateIncome(homeAttendance(gs, derby), club(gs).tier) * (gs.matchMods.gate ?? 1)) : 0;
  // the shirt pays every week, and the crowd deal pays on who actually turns up
  const shirt = sponsorRound(gs.sponsor, club(gs).tier, homeAttendance(gs, derby));
  // and the boards around the pitch are bought for the ground, crowd or no crowd
  const boards = gs.sponsor ? signageRound(club(gs).tier, gs.stadium.capacity) : 0;
  // any build in progress moves a round closer to opening
  const built = advanceStadium(gs);
  // and a share of the season's guaranteed purse arrives with every round, so the books do not run dry for the
  // months before the summer pays it
  const instalment = purseInstalment(club(gs).tier, gs.league.rounds);

  const nextBase: GameState = {
    ...gs,
    phase: 'result',
    lastLedger: { prize, gate, sponsor: shirt, signage: boards, purse: instalment, ...costs, net: prize + gate + shirt + boards + instalment - costs.total },
    purseEarlier: gs.purseEarlier + instalment,
    meters: {
      // a bonus promised before kick off is paid the moment it is earned
      money: cash(gs.meters.money + prize + gate + shirt + boards + instalment - costs.total - (won ? (gs.matchMods.winBonus ?? 0) : 0)),
      morale: moraleShift(gs.meters.morale, moraleDelta),
      prestige: meter(gs.meters.prestige + (won ? 2 : draw ? 0 : -1)),
      fans: fansTonight,
    },
    league: { ...gs.league, table },
    stadium: built.stadium,
    stadiumReveal: built.reveal,
    lastPlayerMatch: playerResult,
    lastRound: roundResults,
    seasonStats,
    suspensions: bookSuspensions(gs, playerResult),
    // a man who played hurt may pay for it next round; a promise to the terrace
    // that was not kept comes back to the hub next week
    sitOutNext: settleInjuries(gs),
    followUps: [
      ...gs.followUps,
      ...(gs.matchMods.promiseWin && !won
        ? [{ season: gs.season, week: gs.week + 1, title: 'היציע זוכר', body: 'הבטחת להם שלא תפסידו בדרבי. הם באו, הם שרו, והם זוכרים. מנהיג היציע: "בפעם הבאה אל תבטיח. תעשה."' }]
        : []),
      ...(broken
        ? [{ season: gs.season, week: gs.week + 1, title: 'לא עמדת במילה', body: `הבטחת ל${gs.matchMods.promised!.name} מקום בהרכב, והוא ישב. כל הסגל ראה.` }]
        : []),
    ],
    form: [...gs.form, won ? 'W' : draw ? 'D' : 'L'].slice(-6) as ('W'|'D'|'L')[],
    seasonOver: gs.week + 1 > gs.league.rounds,
  };

  const newEntries = chronicleAfterRound(gs, nextBase, playerResult);
  const extra = built.done ? [built.done, ...newEntries] : newEntries;
  const withChron = extra.length ? { ...nextBase, chronicle: [...nextBase.chronicle, ...extra] } : nextBase;
  // The crisis lands after the books are read for this round, so the week the
  // money disappears is never also the week you are sacked. The warning has to
  // come first, always.
  // his phone remembers whether he played, before anything else reads the week
  const mateNow = (() => {
    const him = texterOf(withChron.friends);
    if (!him) return withChron.mate;
    return mateAfterRound(withChron.mate, withChron.seasonStats[him.id]?.apps ?? 0);
  })();
  return markPlayed(maybeCrisis(checkTheBooks(settleLoans({ ...withChron, mate: mateNow }, 'round'), !won && !draw)));
}

/**
 * The owner reads the ledger the moment the round is settled. Past the line
 * there is no appeal and no waiting for the season to end: the result screen
 * still shows, and the letter is waiting behind it.
 */
function checkTheBooks(gs: GameState, lost: boolean): GameState {
  if (gs.sacking) return gs;
  const d = debt(gs);
  // An owner does not sack a manager on a Tuesday because of a spreadsheet. He
  // waits for a defeat and uses it. Past the line and still winning, you keep
  // your job another week, which is the difference between a rule and a story.
  if (d.level !== 'sacked' || !lost) return gs;
  const c = club(gs);
  const table = sortedTable(gs.league);
  const sacking: Sacking = {
    reason: 'debt', debt: d.debt, limit: d.limit,
    week: gs.week, season: gs.season,
    league: LEAGUE_NAMES[c.tier],
    clubId: c.id, club: c.name, short: c.short, city: c.city, tier: c.tier,
    position: Math.max(1, table.findIndex(x => x.clubId === gs.clubId) + 1),
    teams: table.length,
  };
  return {
    ...gs,
    sacking,
    chronicle: [...gs.chronicle, {
      id: `sacked-s${gs.season}`,
      kind: 'sacked' as const,
      week: gs.week,
      title: 'פוטרת',
      body: `${debtLine(d)} מקום ${sacking.position} מתוך ${sacking.teams} ב${sacking.league}, ושם זה נגמר.`,
      icon: 'alert' as const,
      tint: 'loss' as const,
    }],
  };
}

/**
 * How far back the reporter and the phone remember. A season is about
 * fourteen rounds, two questions a round, so twelve questions is roughly the
 * last six weeks, and eight chats is more than a season of buzzes: neither
 * repeats itself inside a run the manager would still remember.
 */
const PRESS_MEMORY = 12;
const CHAT_MEMORY = 8;

/** From the result screen, the reporter is waiting outside. */
/** Defeats in a row at the end of the form, tonight's included. */
function lossRun(form: GameState['form']): number {
  let n = 0;
  for (let i = form.length - 1; i >= 0 && form[i] === 'L'; i--) n++;
  return n;
}

export function continueFromResult(gs: GameState): GameState {
  gs = { ...gs, stadiumReveal: null };   // the unveil has had its moment
  // no press room, no next week: the owner is waiting
  if (gs.sacking) return { ...gs, phase: 'sacked', press: null, chat: null };
  // a match that was sold: the whistle has gone and the verdict is next
  if (gs.fix && gs.fix.stage === 'agreed') return { ...gs, phase: 'fix-verdict', fix: { ...gs.fix, stage: 'played' }, press: null, chat: null };
  // the warning he gets before it, delivered once, in person
  const lvl = debt(gs).level;
  if ((lvl === 'final' || lvl === 'sacked') && gs.ultimatumSeason !== gs.season) {
    return { ...gs, phase: 'ultimatum', ultimatumSeason: gs.season, press: null, chat: null };
  }
  const r = gs.lastPlayerMatch;
  const fx = playerFixture(gs);
  if (!r || !fx) return advancePastPress(gs);
  const ctx = pressContext(gs)!;
  const rng = createRng(drawSeed(gs, 80_000));
  // what the reporter actually watched, so his first question is about the
  // match and not about the scoreline in the abstract
  const facts = matchFacts(r, gs.clubId, mySquad(gs), new Set(gs.exits.map(e => e.id)));
  const { outlet, qs } = pickPressQuestions(ctx, rng, facts, gs.pressHistory);
  return {
    ...gs, phase: 'press', press: { outlet, q: qs[0], queue: qs.slice(1) },
    pressHistory: [...gs.pressHistory, ...qs.map(q => q.id)].slice(-PRESS_MEMORY),
  };
}

/** The night as the reporter saw it, read off the result, the table and the ground. */
export function pressContext(gs: GameState): PressContext | null {
  const r = gs.lastPlayerMatch;
  const fx = playerFixture(gs);
  if (!r || !fx) return null;

  const iAmHome = fx.homeId === gs.clubId;
  const myGoals = iAmHome ? r.score[0] : r.score[1];
  const oppGoals = iAmHome ? r.score[1] : r.score[0];
  const margin = myGoals - oppGoals;
  const result: PressContext['result'] =
    margin >= 3 ? 'big_win' : margin > 0 ? 'win' : margin === 0 ? 'draw' : margin <= -3 ? 'thrashing' : 'loss';

  const table = sortedTable(gs.league);
  const tablePos = table.findIndex(s => s.clubId === gs.clubId) + 1;
  const oppId = iAmHome ? fx.awayId : fx.homeId;
  const rival = gs.league.clubs.find(c => c.id === oppId)!;

  return {
    result,
    isDerby: isDerby(fx.homeId, fx.awayId),
    lowMorale: gs.meters.morale < 40,
    highPrestige: gs.meters.prestige > 60,
    tablePos, totalTeams: gs.league.clubs.length,
    star: topPlayerName(mySquad(gs)),
    rival: rival.short,
    city: club(gs).city,
    // what the terrace saw. The form already has tonight in it, so a run of
    // defeats counts this one; the gate is the crowd against the seats, so a
    // ground built past the town's appetite reads as half empty, as it is
    isHome: iAmHome,
    fans: gs.meters.fans,
    lossRun: lossRun(gs.form),
    gate: homeAttendance(gs, isDerby(fx.homeId, fx.awayId)) / Math.max(1, gs.stadium.capacity),
    justUp: gs.week <= 3 && gs.chronicle.some(e => e.id === `season-${gs.season - 1}-promoted` || e.id === `season-${gs.season - 1}-champion`),
    week: gs.week,
    season: gs.season,
    rounds: gs.league.rounds,
    tier: club(gs).tier,
    firstSeasonAtTier: gs.chronicle.some(e => e.id === `season-${gs.season - 1}-promoted` || e.id === `season-${gs.season - 1}-champion`),
    lead: tablePos === 1 && table.length > 1 ? table[0].pts - table[1].pts : 0,
    margin, gf: myGoals, ga: oppGoals,
    oppPos: table.findIndex(s => s.clubId === oppId) + 1,
    nextIsDerby: gs.league.fixtures.some(f => f.round === gs.week + 1
      && (f.homeId === gs.clubId || f.awayId === gs.clubId) && isDerby(f.homeId, f.awayId)),
    // the form already carries tonight, so the runs walking IN drop the last entry
    unbeatenBefore: (() => { const before = gs.form.slice(0, -1); let n = 0;
      for (let i = before.length - 1; i >= 0 && before[i] !== 'L'; i--) n++; return n; })(),
    winRun: (() => { let n = 0; for (let i = gs.form.length - 1; i >= 0 && gs.form[i] === 'W'; i--) n++; return n; })(),
    scoutHired: gs.scout.hiredSeason === gs.season,
    scoutManPlayed: (gs.scout.signedIds ?? []).some(id => (r.ratings?.[id] ?? 0) > 0),
    ...(() => {
      const squad = mySquad(gs);
      const all = [...squad.starters, ...squad.bench];
      const kids = all.filter(p => p.age <= 18);
      const rated = all.filter(p => (r.ratings?.[p.id] ?? 0) > 0);
      const best = [...rated].sort((a, b) => (r.ratings![b.id]) - (r.ratings![a.id]))[0];
      return {
        youthInSquad: kids.length > 0,
        youthDebut: kids.some(p => (r.ratings?.[p.id] ?? 0) > 0 && (gs.seasonStats[p.id]?.apps ?? 0) === 1),
        youthStar: !!best && best.age <= 18,
      };
    })(),
    injuryTonight: (r.events ?? []).some(e => e.type === 'injury' && e.teamId === gs.clubId),
    allGoalsFirstHalf: (() => {
      const goals = (r.events ?? []).filter(e => e.type === 'goal' || e.type === 'penalty_goal' || e.type === 'own_goal');
      return goals.length > 0 && goals.every(e => e.minute <= 45);
    })(),
  };
}

/** Apply the manager's answer to the reporter, then move on. */
/**
 * The answer is given, and it lands: the meters move now, while he is still in
 * the room, and the room can say what it did. The answer is remembered on the
 * question so a refresh mid reveal shows the same verdict and does not let it
 * land twice. Nothing else moves until he walks on.
 */
export function pickPressAnswer(gs: GameState, index: number): GameState {
  const p = gs.press;
  const ans = p?.q.answers[index];
  if (!p || !ans || p.answered != null) return gs;
  const meters = {
    money: cash(gs.meters.money + (ans.effect.money ?? 0)),
    morale: moraleShift(gs.meters.morale, (ans.effect.morale ?? 0)),
    prestige: meter(gs.meters.prestige + (ans.effect.prestige ?? 0)),
    fans: meter(gs.meters.fans + (ans.effect.fans ?? 0)),
  };
  return {
    ...gs, meters, style: scoreStyle(gs.style, ans.effect),
    press: { ...p, answered: index, before: { morale: gs.meters.morale, prestige: gs.meters.prestige, fans: gs.meters.fans } },
  };
}

/** What the answer on screen did, as the meters actually moved, caps included. */
export function pressVerdict(gs: GameState): { morale: number; prestige: number; fans: number } | null {
  const p = gs.press;
  if (!p || p.answered == null || !p.before) return null;
  return {
    morale: gs.meters.morale - p.before.morale,
    prestige: gs.meters.prestige - p.before.prestige,
    // a room answered before the terrace was a meter has nothing to say about it
    fans: gs.meters.fans - (p.before.fans ?? gs.meters.fans),
  };
}

/** On to the next question, or out of the room. */
export function continuePress(gs: GameState): GameState {
  // he has another one. A press conference is not one question and out.
  const rest = gs.press?.queue ?? [];
  if (rest.length) {
    return { ...gs, press: { outlet: gs.press!.outlet, q: rest[0], queue: rest.slice(1) } };
  }
  return advancePastPress(gs);
}

/** Answer and walk on in one step, the way the checks drive a season. */
export function answerPress(gs: GameState, index: number): GameState {
  return continuePress(pickPressAnswer(gs, index));
}

/** How many questions are left, including the one on screen. */
export function pressRemaining(gs: GameState): number {
  return gs.press ? 1 + (gs.press.queue?.length ?? 0) : 0;
}

/** Where the week actually ends, once the phone has had its say. */
function endOfWeek(gs: GameState): GameState {
  // the registered youth goes back down and the reds are served, before the
  // manager is told anything about either
  gs = serveSuspensions(returnYouthUp(returnEmergencyYouth(gs)));
  // this week's answers have done their work: the men who sat are free, the
  // ones who got hurt sit next, and the match mods are spent
  gs = { ...gs, sitOut: gs.sitOutNext, sitOutNext: {}, matchMods: {} };
  // remember the post match line shown on the result screen before moving on
  const fanHistory = gs.lastPlayerMatch
    ? [...gs.fanHistory, fanNote(gs, 'post').id].slice(-FAN_HISTORY)
    : gs.fanHistory;
  if (gs.seasonOver) {
    const finale = chronicleAtSeasonEnd(gs);
    // the league's line first, then Europe's, then the domestic cup's: each competition is closed and written down before the summer draws the next
    const settled = settleLoans(settleCupSeason(settleEuroSeason(finale ? { ...gs, chronicle: [...gs.chronicle, finale] } : gs)), 'season');
    return { ...settled, phase: 'season-end', press: null, chat: null, fanHistory };
  }
  // the winter window opens with a word, not silently behind a green dot
  const next = gs.week + 1;
  const wintry = windowState(next, gs.league.rounds);
  const wasOpen = windowState(gs.week, gs.league.rounds).open;
  let notices = wintry.open && !wasOpen
    ? [...gs.notices, { kind: 'window' as const, weeks: wintry.weeksLeft }]
    : gs.notices;
  // and the words that were owed for this week come back
  const due = gs.followUps.filter(f => f.season === gs.season && f.week <= next);
  const followUps = gs.followUps.filter(f => !due.includes(f));
  notices = [...notices, ...due.map(f => ({ kind: 'story' as const, title: f.title, body: f.body }))];
  // the scout has been away his three rounds, and the news comes before the hub
  const back = scoutBack(gs, next);
  if (back && back.found !== gs.scout.found) notices = [...notices, { kind: 'scout' as const }];
  // and what he found arrives with the window, and is gone when it shuts
  let scout = back ?? gs.scout;
  if (wintry.open && !wasOpen) scout = scoutArrives(gs, scout);
  else if (!wintry.open && wasOpen) scout = { ...scout, offer: null };
  return { ...gs, phase: 'hub', week: next, press: null, chat: null, fanHistory, notices, followUps, market: winterMarket(gs, next), scout };
}

/* -------------------------------------------------------------- the scout */

/** Is there a scout to hire at this level of the game at all. */
export function scoutAvailable(gs: GameState): boolean {
  return club(gs).tier >= SCOUT_TIER;
}

/**
 * Why this scout cannot be hired now, or null when he can.
 *
 * The order is the order a manager would run into them: a club that is too
 * small has no scout at all, a season that already had one is done, the
 * window is when the market is his to work, and a job that would not be over
 * before the last round is not a job.
 */
export function scoutBlockedReason(gs: GameState, _style: ScoutStyle): string | null {
  if (!scoutAvailable(gs)) return SCOUT_TEXT.tooLow;
  if (gs.scout.hiredSeason === gs.season) return SCOUT_TEXT.hiredThisSeason;
  if (transferWindow(gs).open) return SCOUT_TEXT.windowOpen;
  if (gs.week + SCOUT_ROUNDS > gs.league.rounds) return SCOUT_TEXT.tooLate;
  if (gs.meters.money < SCOUT_FEE) return SCOUT_TEXT.tooPoor;
  return null;
}

/** Sign him. The fee goes now, the report comes SCOUT_ROUNDS rounds from this week. */
export function hireScout(gs: GameState, style: ScoutStyle, position?: Position): GameState {
  if (scoutBlockedReason(gs, style)) return gs;
  return {
    ...gs,
    meters: { ...gs.meters, money: cash(gs.meters.money - SCOUT_FEE) },
    scout: { ...gs.scout, hiredSeason: gs.season, job: { style, startWeek: gs.week, season: gs.season, ...(position ? { position } : {}) } },
    pendingOutcome: SCOUT_TEXT.signed,
  };
}

/**
 * The scout's state once the week turns to `next`, or null when nothing about
 * him changes. He is back when three rounds have been played since he was
 * sent; a job left over from another season is dropped rather than reported.
 */
function scoutBack(gs: GameState, next: number): ScoutState | null {
  const job = gs.scout.job;
  if (!job) return null;
  if (job.season !== gs.season) return { ...gs.scout, job: null };
  if (next < job.startWeek + SCOUT_ROUNDS) return null;
  return { ...gs.scout, job: null, found: scoutFound(gs, job.style, job.season, next, job.position) };
}

/**
 * Who the scout brings back, drawn off the season's seed and the week he
 * reported, so the same career always meets the same man however many times
 * the round is played. Null for a style that cannot find anybody yet.
 */
function scoutFound(gs: GameState, style: ScoutStyle, season: number, week: number, position?: Position): NonNullable<ScoutState['found']> {
  const at = position ? { position } : {};
  const anchor = position ? starterAt([...mySquad(gs).starters, ...mySquad(gs).bench], position) : null;
  if (style === 'keen') {
    const sq = mySquad(gs);
    const taken = new Set<string>([...sq.starters, ...sq.bench, ...gs.youth.players, ...gs.market.map(f => f.player)].map(p => p.name));
    return { style, season, player: findKeen(club(gs).tier, createRng(gs.seasonSeed * 971 + gs.season * 37 + week), taken, position), ...at };
  }
  if (style === 'safe') {
    const pick = pickSafeFor(gs, position, anchor);
    return { style, season, player: pick?.player ?? null, fromClubId: pick?.clubId, ...at };
  }
  return { style, season, player: findOld(club(gs).tier, createRng(gs.seasonSeed * 977 + gs.season * 41 + week), takenNames(gs), position, anchor), ...at };
}

/**
 * The safe one's man: from the clubs he looks in first, and when nobody there is right for the place (or is not even the
 * weakest of the eleven there) from the whole division.
 */
function pickSafeFor(gs: GameState, position?: Position, anchor?: number | null): RivalKid | null {
  const near = pickSafe(rivalKids(gs, scoutRivals(gs)), position, anchor);
  const good = (k: RivalKid | null) => !!k && (!position || k.player.position === position) && (anchor == null || overall(k.player) >= anchor - 1);
  if (good(near)) return near;
  const all = pickSafe(rivalKids(gs, allRivals(gs)), position, anchor);
  if (good(all)) return all;
  return near ?? all;
}

/** Every name already in the club, the academy or the market. */
function takenNames(gs: GameState): Set<string> {
  const sq = mySquad(gs);
  return new Set<string>([...sq.starters, ...sq.bench, ...gs.youth.players, ...gs.market.map(f => f.player)].map(p => p.name));
}

/** Every other club in the division that has a squad. */
function allRivals(gs: GameState): string[] {
  return gs.league.clubs.filter(c => c.id !== gs.clubId && !!gs.league.squads[c.id]).map(c => c.id);
}

/**
 * The clubs the safe one looks in: my derby, when the division has one, and the
 * three closest to me in the table either side, which are the ones I am
 * actually fighting for a place with. Ties go to the club higher up.
 */
function scoutRivals(gs: GameState): string[] {
  const table = sortedTable(gs.league);
  const mine = table.findIndex(s => s.clubId === gs.clubId);
  const near = table
    .map((s, i) => ({ id: s.clubId, d: Math.abs(i - mine) }))
    .filter(x => x.id !== gs.clubId && !!gs.league.squads[x.id])
    .sort((a, b) => a.d - b.d)
    .slice(0, SAFE_NEAREST)
    .map(x => x.id);
  const derby = derbyRivalId(gs);
  return derby && !near.includes(derby) ? [derby, ...near] : near;
}

/** The men of those clubs he could take. A squad at the floor is left alone. */
function rivalKids(gs: GameState, ids: string[]): RivalKid[] {
  const out: RivalKid[] = [];
  for (const id of ids) {
    const sq = gs.league.squads[id];
    if (!sq || sq.starters.length + sq.bench.length <= MIN_SQUAD) continue;
    for (const player of [...sq.starters, ...sq.bench]) out.push({ clubId: id, player });
  }
  return out;
}

/** One man out of a rival's squad; if he started, the best man on his line steps up. */
function dropFromSquad(sq: Squad, id: string): Squad {
  const gone = [...sq.starters, ...sq.bench].find(x => x.id === id);
  if (!gone) return sq;
  const starters = sq.starters.filter(x => x.id !== id);
  let bench = sq.bench.filter(x => x.id !== id);
  if (starters.length < sq.starters.length && bench.length) {
    const keeper = gone.position === 'GK';
    const same = bench.filter(x => (x.position === 'GK') === keeper);
    const line = same.filter(x => (LINE[x.position] ?? 'MID') === (LINE[gone.position] ?? 'MID'));
    const from = line.length ? line : same.length ? same : bench;
    const up = from.reduce((a, b) => (overall(b) > overall(a) ? b : a));
    starters.push(up);
    bench = bench.filter(x => x !== up);
  }
  return { starters, bench };
}

/** The find walks in with the window: a year older, and priced as he now is. */
function scoutArrives(gs: GameState, scout: ScoutState): ScoutState {
  const f = scout.found;
  if (!f?.player) return scout;
  if (f.style === 'safe') {
    // he is a real man in a real squad, so he is looked up as he is now: a
    // summer may have moved him on, in which case the scout finds the next best
    const sq = f.fromClubId ? gs.league.squads[f.fromClubId] : undefined;
    const now = sq ? [...sq.starters, ...sq.bench].find(x => x.id === f.player!.id) : undefined;
    const anchor = f.position ? starterAt([...mySquad(gs).starters, ...mySquad(gs).bench], f.position) : null;
    const pick: RivalKid | null = now && f.fromClubId
      ? { clubId: f.fromClubId, player: now }
      : pickSafeFor(gs, f.position, anchor);
    if (!pick) return { ...scout, found: null };
    return {
      ...scout, found: null,
      offer: {
        player: pick.player, fee: safeFee(pick.player, club(gs).tier), style: 'safe', fromClubId: pick.clubId,
        ...(f.position ? { position: f.position, prospect: anchor != null && overall(pick.player) < anchor } : {}),
      },
    };
  }
  if (f.style === 'old') {
    // a man of twenty four does not change in the months he was away
    return { ...scout, found: null, offer: { player: f.player, fee: oldFee(f.player, club(gs).tier), style: 'old', ...(f.position ? { position: f.position } : {}) } };
  }
  const player = arrivedKeen(f.player, coachYouthGrowth(gs.coach));
  return { ...scout, found: null, offer: { player, fee: transferFee(player, club(gs).tier), style: f.style, ...(f.position ? { position: f.position, prospect: true } : {}) } };
}

/** Why the offer on the table cannot be signed right now, or null when it can. */
export function scoutSignBlockedReason(gs: GameState): string | null {
  const o = gs.scout.offer;
  if (!o) return SCOUT_TEXT.gone;
  if (o.fromClubId) {
    const sq = gs.league.squads[o.fromClubId];
    if (!sq || ![...sq.starters, ...sq.bench].some(x => x.id === o.player.id)) return SCOUT_TEXT.gone;
  }
  return signBlockedReason(gs, { player: o.player, fee: o.fee, note: '' });
}

/** Sign the scout's find into the senior squad, through the same door as any signing. */
export function signScoutOffer(gs: GameState): GameState {
  const o = gs.scout.offer;
  if (!o || scoutSignBlockedReason(gs)) return gs;
  const next = signPlayer({ ...gs, market: [...gs.market, { player: o.player, fee: o.fee, note: '' }] }, o.player.id);
  // and the club he came from is a man short: that is the whole point of him
  const from = o.fromClubId;
  const league = from && next.league.squads[from]
    ? { ...next.league, squads: { ...next.league.squads, [from]: dropFromSquad(next.league.squads[from], o.player.id) } }
    : next.league;
  return { ...next, league, scout: { ...next.scout, offer: null, signedIds: [...(next.scout.signedIds ?? []), o.player.id] } };
}

/**
 * The range on the card that asks the manager to hire. The keen one is drawn
 * fresh, so his is drawn from the finder; the safe one is somebody who already
 * exists, so his is the fees of the men he could take right now, everybody in
 * the division the search could reach, and the man he brings is one of them.
 */
export function scoutBudgetFor(gs: GameState, style: ScoutStyle, position?: Position): [number, number] | null {
  if (style === 'keen') return scoutBudget(style, club(gs).tier, position);
  if (style === 'old') return scoutBudget(style, club(gs).tier, position, position ? starterAt([...mySquad(gs).starters, ...mySquad(gs).bench], position) : null);
  const all = rivalKids(gs, allRivals(gs)).filter(k => k.player.age >= 19 && k.player.age <= 20 && k.player.position !== 'GK');
  const there = position ? all.filter(k => k.player.position === position) : all;
  const kids = there.length ? there : all;
  const band = kids.filter(k => { const p = potentialOf(k.player); return p >= SAFE_POTENTIAL[0] && p <= SAFE_POTENTIAL[1]; });
  return feeRange((band.length ? band : kids).map(k => safeFee(k.player, club(gs).tier)));
}

/** Rounds left before the scout in the field reports, or null when nobody is out. */
export function scoutRoundsLeft(gs: GameState): number | null {
  const job = gs.scout.job;
  if (!job || job.season !== gs.season) return null;
  return Math.max(0, job.startWeek + SCOUT_ROUNDS - gs.week);
}

/**
 * The red dot on the hub. It is on from the moment a window shuts, for as long
 * as a scout could still be hired and the club can pay him, until the manager
 * opens the door once. A dot that promises what the purse cannot buy is worse
 * than none: the owner's crisis empties the account in the first ליגה א׳ season.
 * Answered against the stretch of the season he last looked in, so the next
 * window to shut turns it back on with no bookkeeping.
 */
export function scoutDot(gs: GameState): boolean {
  if (!scoutAvailable(gs) || gs.scout.hiredSeason === gs.season) return false;
  if (gs.week + SCOUT_ROUNDS > gs.league.rounds) return false;
  if (gs.meters.money < SCOUT_FEE) return false;
  const key = scoutWindowKey(gs.season, gs.week);
  return key !== '' && gs.scout.seenKey !== key;
}

export function openScout(gs: GameState): GameState {
  return {
    ...gs, phase: 'scout', pendingOutcome: null,
    scout: { ...gs.scout, seenKey: scoutWindowKey(gs.season, gs.week) },
  };
}

/**
 * The market as the week turns.
 *
 * It used to be frozen from the last summer round to the end of the season:
 * the winter window opened onto the summer's leftovers, three of them still
 * stamped "last round, after this he is gone" every week for the whole window,
 * and none of them ever went. Now the window opens on a fresh twelve, moves
 * the way the summer moves for as long as it stays open, and when it shuts
 * the list settles: whoever is left is simply around, nobody is on notice.
 */
function winterMarket(gs: GameState, next: number): FreeAgent[] {
  const wasOpen = windowState(gs.week, gs.league.rounds).open;
  const isOpen = windowState(next, gs.league.rounds).open;
  if (!wasOpen && !isOpen) return gs.market;
  const sq = mySquad(gs);
  const taken = new Set([...sq.starters, ...sq.bench].map(p => p.name));
  const rng = createRng(gs.seasonSeed + 6100 + next * 37);
  if (isOpen && !wasOpen) return makeMarket(club(gs).tier, rng, 12, taken);
  if (isOpen) return refreshMarket(gs.market, club(gs).tier, rng, taken);
  return settleMarket(gs.market);
}

/**
 * After the press room the phone buzzes, but only for a week worth talking
 * about: a hammering either way, a derby, or a run of three. Anything else and
 * we go straight home, which is what keeps the buzz meaningful.
 */
/** Carry on into the press room and the rest of the week. */
export function advancePastPress(gs: GameState): GameState {
  const r = gs.lastPlayerMatch;
  const fx = playerFixture(gs);
  if (!r || !fx) return endOfWeek(gs);

  const iAmHome = fx.homeId === gs.clubId;
  const margin = (iAmHome ? r.score[0] : r.score[1]) - (iAmHome ? r.score[1] : r.score[0]);
  // the friend goes first. Once every three rounds at most, and only when
  // something has actually happened to him, which is the whole difference
  // between this thread and the twenty six that are about the scoreline
  const mine = mateChatNow(gs, r);
  if (mine) return mine;

  // what he said in the week comes before what the scoreline says, when it applies
  const promised = gs.matchMods.chatAfter;
  const picked = promised && (!promised.onlyIfWon || margin > 0)
    ? { trigger: promised.trigger }
    : pickTrigger({
      margin, isDerby: isDerby(fx.homeId, fx.awayId), form: gs.form,
      facts: matchFacts(r, gs.clubId, mySquad(gs), new Set(gs.exits.map(e => e.id))),
      seasonEvent: seasonChatEvent(gs) ?? undefined,
      keeper: (() => { const k = mySquad(gs).starters.find(p => p.position === 'GK'); return k ? surnameOf(k.name) : undefined; })(),
      youthGoal: (() => {
        const sq = mySquad(gs);
        const all = [...sq.starters, ...sq.bench];
        for (const e of r.events) {
          if ((e.type !== 'goal' && e.type !== 'penalty_goal') || e.teamId !== gs.clubId) continue;
          const p = all.find(x => x.id === e.playerId);
          if (p && p.age <= 18 && (gs.seasonStats[p.id]?.apps ?? 0) === 1) return surnameOf(p.name);
        }
        return undefined;
      })(),
    });
  if (!picked) return endOfWeek(gs);

  const oppId = iAmHome ? fx.awayId : fx.homeId;
  const rival = gs.league.clubs.find(c => c.id === oppId);
  const my = iAmHome ? r.score[0] : r.score[1];
  const opp = iAmHome ? r.score[1] : r.score[0];
  const rng = createRng(drawSeed(gs, 90_000));
  const chat = rollChat(picked.trigger, {
    tier: club(gs).tier,
    club: club(gs).short,
    rival: rival?.short ?? 'היריבה',
    score: `${my} - ${opp}`,
    star: topPlayerName(mySquad(gs)),
    mgr: gs.profile.nickname || gs.profile.name || 'מאמן',
    who: picked.who,
  }, rng, gs.chatHistory.slice(-CHAT_MEMORY));
  if (!chat) return endOfWeek(gs);

  const SEASON_RINGS = ['title_won', 'promotion_clinched', 'relegation_sealed', 'season_over_good'];
  const seasonChatEvents = SEASON_RINGS.includes(picked.trigger)
    ? [...gs.seasonChatEvents, picked.trigger] : gs.seasonChatEvents;
  return { ...gs, phase: 'chat', press: null, chat, seasonChatEvents, chatHistory: [...gs.chatHistory, chat.id].slice(-CHAT_MEMORY) };
}

/**
 * The season night tonight certified, if any, each rung once a season: the
 * title or the promotion locked with the rounds left unable to change it, the
 * drop sealed the same way, or a season that ended in the top half without a
 * trophy to ring about. Three points a round is the most the table can move.
 */
function seasonChatEvent(gs: GameState): 'title_won' | 'promotion_clinched' | 'relegation_sealed' | 'season_over_good' | null {
  const table = sortedTable(gs.league);
  const i = table.findIndex(s => s.clubId === gs.clubId);
  if (i < 0) return null;
  const pos = i + 1, teams = table.length, me = table[i];
  const left = Math.max(0, gs.league.rounds - me.played);
  const tier = club(gs).tier;
  const heard = new Set(gs.seasonChatEvents);
  const locked = (ahead: number) => ahead > 3 * left;

  if (!heard.has('title_won') && pos === 1 && (left === 0 || locked(me.pts - (table[1]?.pts ?? 0)))) return 'title_won';
  if (!heard.has('promotion_clinched') && !heard.has('title_won') && tier < TOP_TIER && pos <= 2
    && (left === 0 || locked(me.pts - (table[2]?.pts ?? 0)))) return 'promotion_clinched';
  if (!heard.has('relegation_sealed') && tier > 1 && pos === teams
    && (left === 0 || locked((table[teams - 2]?.pts ?? 0) - me.pts))) return 'relegation_sealed';
  if (!heard.has('season_over_good') && left === 0 && pos > 2 && pos <= teams / 2) return 'season_over_good';
  return null;
}

/**
 * Is the phone his this week?
 *
 * Everything the picker needs is read off the save as it stands, except the
 * two things that cannot be: whether he was sent off in the round just played,
 * which is in the match, and whether the other one has gone, which is on the
 * friends list.
 */
function mateChatNow(gs: GameState, r: MatchResult): GameState | null {
  const f = texterOf(gs.friends);
  if (!f) return null;
  const sq = mySquad(gs);
  const him = [...sq.starters, ...sq.bench].find(p => p.id === f.id);
  if (!him) return null;

  const others = [...sq.starters, ...sq.bench].filter(p => p.id !== him.id);
  const squadAvg = others.length
    ? others.reduce((s, p) => s + overall(p), 0) / others.length : 99;
  const stat = gs.seasonStats[him.id];
  const trigger = pickMateTrigger(gs.mate, gs.week, {
    him,
    apps: stat?.apps ?? 0,
    goals: stat?.goals ?? 0,
    squadAvg,
    injured: gs.sitOutNext[him.id] === 'פצוע',
    sentOff: r.events.some(e => e.type === 'red' && e.playerId === him.id),
    aloneNow: gs.friends.some(x => x.sold),
    seasonOver: gs.week >= gs.league.rounds,
    rounds: gs.league.rounds,
    justUp: gs.chronicle.some(e => e.id === `season-${gs.season - 1}-promoted` || (club(gs).tier < TOP_TIER && e.id === `season-${gs.season - 1}-champion`)),
  });
  if (!trigger || !inTier(MATE_TIERS, trigger, club(gs).tier)) return null;

  const t = mateThread(trigger);
  if (!t) return null;
  const league = LEAGUE_NAMES[club(gs).tier] ?? '';
  // ליגת העל has its own wording for what the friend writes (topFlightText.ts); what an answer does stays
  const own = club(gs).tier >= TOP_TIER ? TOP_MATE[t.id] : undefined;
  const mateLines = own ? own.lines : t.lines;
  const mateAnswers = own ? own.answers.map((a, i) => ({ ...(t.answers[i] ?? { effect: {} }), label: a.label, reply: a.reply })) : t.answers;
  return {
    ...gs,
    phase: 'chat',
    press: null,
    chat: {
      id: t.id,
      contact: him.name.split(' ')[0],
      subtitle: 'מקוון',
      group: false,
      accent: '#2FA96B',
      lines: mateLines.map(text => ({ from: him.name.split(' ')[0], text: fillMate(text, { league }) })),
    },
    chatAnswers: { answers: mateAnswers as typeof t.answers, mateId: him.id, trigger },
    mate: { ...gs.mate, seen: [...gs.mate.seen, trigger], lastWeek: gs.week },
  };
}

/**
 * What the manager wrote back, and what it costs him.
 *
 * The reply lands in the thread first, because the screen is a phone and a
 * phone shows you what you sent. Everything else happens behind it.
 */
export function answerMateChat(gs: GameState, index: number): GameState {
  const pack = gs.chatAnswers;
  if (!gs.chat || !pack) return gs;
  const a = pack.answers[index];
  if (!a) return gs;
  const e = a.effect;

  const sq = mySquad(gs);
  const him = [...sq.starters, ...sq.bench].find(p => p.id === pack.mateId);
  const name = him?.name ?? '';

  // his own morale and condition, on the player rather than on the club
  let squads = gs.league.squads;
  if (him && (e.morale || e.fitness)) {
    const tune = (p: Player): Player => p.id !== him.id ? p : {
      ...p,
      morale: Math.max(0, Math.min(100, p.morale + (e.morale ?? 0))),
      fitness: Math.max(20, Math.min(100, p.fitness + (e.fitness ?? 0))),
    };
    squads = { ...squads, [gs.clubId]: { starters: sq.starters.map(tune), bench: sq.bench.map(tune) } };
  }

  let out: GameState = {
    ...gs,
    league: { ...gs.league, squads },
    meters: {
      ...gs.meters,
      morale: moraleShift(gs.meters.morale, e.squadMorale ?? 0),
      prestige: meter(gs.meters.prestige + (e.prestige ?? 0)),
      money: cash(gs.meters.money + (e.money ?? 0)),
    },
    chat: { ...gs.chat, lines: [...gs.chat.lines, { from: '', text: a.label }, { from: gs.chat.contact, text: a.reply }] },
    chatAnswers: null,
  };

  switch (e.act) {
    case 'promiseStart':
      // not on this week's sheet, which is already played and about to be
      // wiped, but on next week's, which is the week he was promised
      if (him) out = { ...out, mate: { ...out.mate, promiseNext: { id: him.id, name } } };
      break;
    case 'mayLeave':
      out = { ...out, mate: { ...out.mate, mayLeave: true } };
      break;
    case 'leaves':
      if (him) out = { ...out, summerExits: [...out.summerExits, him.id] };
      break;
    case 'neverSell':
      out = { ...out, mate: { ...out.mate, neverSell: true } };
      break;
  }
  return out;
}

/** The player closed the phone, now the week can end. */
export function closeChat(gs: GameState): GameState {
  return endOfWeek({ ...gs, chatAnswers: null });
}

/** TEMP dev preview: a career with a few rounds played, for the /?league route. */
export function demoSeason(rounds = 8): GameState {
  let gs = newGame(4242);
  gs = setProfile(gs, { name: 'איציק', nickname: 'איציק', age: 38, type: 'mental' });
  gs = pickClub(gs, gs.league.clubs[0].id);
  gs = afterSigning(gs, {});
  gs = enterSeason(gs);
  for (let w = 1; w <= Math.min(rounds, gs.league.rounds); w++) {
    const inp = liveMatchInput(gs);
    const res = simulateMatch(
      { id: inp.homeId, name: inp.homeName, players: inp.iAmHome ? inp.playerStarters : inp.oppStarters,
        tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: true },
      { id: inp.awayId, name: inp.awayName, players: inp.iAmHome ? inp.oppStarters : inp.playerStarters,
        tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: false },
      inp.seed);
    gs = commitRound(gs, res);
    gs = continueFromResult(gs);
    while (gs.phase === 'press') gs = answerPress(gs, 0);
    if (gs.phase === 'chat') gs = closeChat(gs);
    if (gs.phase === 'season-end') break;
  }
  return { ...gs, phase: 'table' };
}

/** TEMP dev preview of one chat, used by the /?chat= route. Remove with it. */
export function demoChat(trigger: Parameters<typeof rollChat>[0]): GameState | null {
  const chat = rollChat(trigger, {
    club: 'עין סלע', rival: 'נחל עוז', score: '3 - 0', star: 'כהן', mgr: 'איציק', who: 'כהן',
  }, createRng(7), []);
  return chat ? { ...newGame(), phase: 'chat', week: 6, chat } : null;
}

/* ------------------------------------------------------------ the charts */

export interface ChartRow {
  id: string;
  name: string;
  clubId: string;
  apps: number;
  goals: number;
  assists: number;
  mine: boolean;
}

/** The division's scoring charts. Ties break on fewer appearances, then name. */
export function leagueChart(gs: GameState, by: 'goals' | 'assists'): ChartRow[] {
  return Object.entries(gs.seasonStats)
    .map(([id, s]): ChartRow => ({
      id, name: s.name, clubId: s.clubId, apps: s.apps,
      goals: s.goals, assists: s.assists, mine: s.clubId === gs.clubId,
    }))
    .filter(r => r[by] > 0 && r.name)
    .sort((a, b) => b[by] - a[by] || a.apps - b.apps || a.name.localeCompare(b.name, 'he'))
    .slice(0, 20);
}

/** A player's record this season, zeroed rather than missing so cards are simple. */
export function seasonOf(gs: GameState, playerId: string): PlayerSeason {
  return gs.seasonStats[playerId] ?? blankSeason();
}

/** Everything a player has done in the seasons already filed away. */
export function careerOf(gs: GameState, playerId: string): CareerSeason[] {
  return gs.careerStats[playerId] ?? [];
}

export function careerTotals(hist: CareerSeason[]) {
  return hist.reduce((t, s) => ({
    apps: t.apps + s.apps, goals: t.goals + s.goals, assists: t.assists + s.assists,
  }), { apps: 0, goals: 0, assists: 0 });
}

export function openTable(gs: GameState): GameState { return { ...gs, phase: 'table' }; }
export function closeTable(gs: GameState): GameState { return { ...gs, phase: 'hub' }; }

/* --------------------------------------------------------------- chronicle */

export function openChronicle(gs: GameState): GameState {
  return { ...gs, phase: 'chronicle', chronicleSeen: gs.chronicle.length };
}
export function closeChronicle(gs: GameState): GameState {
  return { ...gs, phase: 'hub' };
}

/* ------------------------------------------------------- the loyalty gift */

/**
 * Itzik's gift of 11.10 to the managers who stayed. Past ten seasons a career
 * is told, once, that this is worth something, and handed a striker ten above
 * his league on loan for five league rounds. His rules: the five count from
 * the moment the man is received, whether he plays or not; he walks into the
 * squad without anyone having to leave and without counting against the cap;
 * no wage; the gift goes to everyone already past the mark, not only to the
 * next to cross it; and only league rounds count, a European night does not.
 */
export const LOYAL_SEASONS = 10;
export const LOAN_MATCHES = 5;
export const LOYAL_LIFT = 10;
const LOAN_POSITIONS: Position[] = ['ST', 'LW', 'RW'];

/* ------------------------------------------------------------- the daily gift */

/** what the daily gift screen shows: the clock is the player's own, handed in so a check can set it */
export function dailyViewOf(gs: GameState, now: number = Date.now(), live: boolean = DAILY_LIVE) {
  return dailyView(gs.daily, club(gs).tier, now, live);
}

/**
 * A round was played: today counts. While the door is shut this does nothing at all, so no existing career and
 * no existing check sees a different state. The day is the game's (never earlier than the latest it has seen).
 */
export function markPlayed(gs: GameState, now: number = Date.now(), live: boolean = DAILY_LIVE): GameState {
  if (!live) return gs;
  const day = dailyDay(gs.daily, now);
  if (gs.daily.played === day && gs.daily.maxDay === day) return gs;
  return { ...gs, daily: { ...gs.daily, played: day, maxDay: day } };
}

/** the squad's names and the thinnest line, which is where a reward should land */
function dailyTaken(gs: GameState): Set<string> {
  const sq = mySquad(gs);
  return new Set([...sq.starters, ...sq.bench].map(p => p.name));
}

/** the seventh gift: a pack of the club's own division, free, a boost up to ליגה א׳ and a star from the Leumit up (16.10), aimed at the weakest place like every pack */
export function rollFreeBoost(gs: GameState): PackPull {
  const rng = createRng(drawSeed(gs, 161_000 + gs.daily.streak));
  const spot = weakSpot(gs, rng);
  return openPack(packById(dailyPackFor(club(gs).tier)), club(gs).tier, rng, { position: spot.position, slotOvr: spot.slotOvr, taken: dailyTaken(gs) });
}

/**
 * The thirtieth day of an unbroken run: a player five above the league he plays in, exactly, on the thinnest line,
 * the way the loyalty gift finds its man. He is a real card with a contract, to sign or to sell.
 */
export function rollGoldPull(gs: GameState): PackPull {
  const rng = createRng(drawSeed(gs, 162_000 + gs.daily.gold));
  const pos = thinnestPosition(gs, rng);
  const taken = dailyTaken(gs);
  const target = leagueAvgOvr(gs) + GOLD_LIFT;
  let best: Player | null = null;
  let bias = 0;
  for (let attempt = 0; attempt < 24; attempt++) {
    const p = makePlayer(pos, target + bias, rng, NEUTRAL_TRAITS, taken);
    const o = overall(p);
    if (!best || Math.abs(o - target) < Math.abs(overall(best) - target)) best = p;
    if (o === target) break;
    bias += target - o;
  }
  return pullOf(best!, club(gs).tier);
}

/**
 * Take today's gift. Only today's: the view says whether the door is open, a round was played and it is still
 * there, and nothing else is a gift. The money goes to the purse, the gems to the pocket; the seventh day also
 * holds a pack, and the thirtieth day of a run a gold player, which wait in the reveal to be signed or sold.
 * If a card is already waiting in the reveal the gift waits too, so two cards never fight for the one slot.
 */
export function claimDaily(gs: GameState, now: number = Date.now(), live: boolean = DAILY_LIVE): GameState {
  const v = dailyViewOf(gs, now, live);
  if (!v.canClaim || gs.pull) return gs;
  const streak = v.nextStreak;
  const gold = streak % GOLD_EVERY === 0;
  const next: GameState = {
    ...gs,
    meters: { ...gs.meters, money: cash(gs.meters.money + v.reward.money) },
    gems: gs.gems + v.reward.gems,
    daily: { ...gs.daily, streak, lastClaim: v.day, maxDay: v.day, gold: gs.daily.gold + (gold ? 1 : 0) },
  };
  // the gold player takes the slot when both fall on one day, which is every 210 days: his is the bigger gift
  if (gold) return { ...next, pull: rollGoldPull(next) };
  if (v.reward.pack) return { ...next, pull: rollFreeBoost(next) };
  return next;
}

/**
 * The gift is a limited offer (Itzik, 11.10): whoever stands past ten seasons on a hub before
 * Thursday 15.10.2026 at 20:00, Israel time (UTC+3 on that date), is told and gets it. After that
 * the door is shut for good, and a career that gets there later is owed nothing.
 */
export const LOYAL_DEADLINE = Date.parse('2026-10-15T20:00:00+03:00');

/** In the tenth season or later (Itzik, 11.10: "עונה 10 ומעלה"), never told yet, standing on the hub with nothing in the way. */
function loyalGiftReady(gs: GameState): boolean {
  return gs.phase === 'hub' && gs.season >= LOYAL_SEASONS && gs.loyalGift === null && !gs.pull && !gs.sacking;
}

/** Ready, and the offer has not run out. The clock is the player's own, handed in so a check can set it. */
export function loyalGiftDue(gs: GameState, now: number = Date.now()): boolean {
  return now < LOYAL_DEADLINE && loyalGiftReady(gs);
}

/** The league's level: the average of every club's eleven in this division. */
export function leagueAvgOvr(gs: GameState): number {
  const xs = Object.values(gs.league.ovr);
  return xs.length ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : squadAvgOvr(mySquad(gs));
}

/**
 * The card: an attacker, whichever of the three the squad is shortest of,
 * rated the league's average plus ten, to the point. Seeded on the career and
 * the season so a reload shows the same man. He cannot be sold, so his cash
 * value is nothing.
 */
export function rollLoyalPull(gs: GameState): PackPull {
  const sq = mySquad(gs);
  const all = [...sq.starters, ...sq.bench];
  const taken = new Set(all.map(p => p.name));
  const rng = createRng(drawSeed(gs, 160_000));
  const counts = LOAN_POSITIONS.map(pos => all.filter(p => p.position === pos).length);
  const fewest = Math.min(...counts);
  const choices = LOAN_POSITIONS.filter((_, i) => counts[i] === fewest);
  const pos = choices[Math.floor(rng() * choices.length)];
  const target = leagueAvgOvr(gs) + LOYAL_LIFT;
  let best: Player | null = null;
  let bias = 0;
  for (let attempt = 0; attempt < 24; attempt++) {
    const p = makePlayer(pos, target + bias, rng, NEUTRAL_TRAITS, taken);
    const o = overall(p);
    if (!best || Math.abs(o - target) < Math.abs(overall(best) - target)) best = p;
    if (o === target) break;
    bias += target - o;
  }
  const player = best!;
  return { player, rarity: rarityForOvr(overall(player)), cashValue: 0, upside: 0 };
}

/** The popup was read and the pack tapped: the card is rolled and held for the reveal. */
export function openLoyalGift(gs: GameState): GameState {
  // no clock here: a man who was shown the popup in time and taps a minute late still gets it
  if (!loyalGiftReady(gs)) return gs;
  return { ...gs, pull: rollLoyalPull(gs), loyalGift: { season: gs.season, playerId: null } };
}

/**
 * The man walks in. Onto the bench, past the cap, on no contract and no
 * wage, with five league rounds on his clock. The reveal's sell button is not
 * offered for him, and signing is the only way out of the reveal.
 */
export function signLoyalGift(gs: GameState): GameState {
  const pull = gs.pull;
  if (!pull || !gs.loyalGift || gs.loyalGift.playerId) return gs;
  const sq = mySquad(gs);
  const next = writeSquad(gs, { starters: sq.starters, bench: [...sq.bench, pull.player] });
  return {
    ...next,
    pull: null,
    loyalGift: { ...gs.loyalGift, playerId: pull.player.id },
    loans: { ...gs.loans, [pull.player.id]: LOAN_MATCHES },
    arrivals: [...gs.arrivals, pull.player.id],
  };
}

/** On loan, and the league rounds he has left. */
export function loanLeft(gs: GameState, playerId: string): number {
  return gs.loans[playerId] ?? 0;
}
export const isOnLoan = (gs: GameState, playerId: string): boolean => loanLeft(gs, playerId) > 0;

/**
 * A league round was played: every loan is one round shorter, and a loan at
 * nought is over, the man goes back where he came from and the hub says so.
 * The season's end closes every loan the same way, since the summer is not
 * his to spend here.
 */
export function settleLoans(gs: GameState, reason: 'round' | 'season'): GameState {
  const ids = Object.keys(gs.loans);
  if (!ids.length) return gs;
  const loans: Record<string, number> = {};
  let next = gs;
  const notices: SquadNotice[] = [];
  for (const id of ids) {
    const left = reason === 'round' ? gs.loans[id] - 1 : 0;
    if (left > 0) { loans[id] = left; continue; }
    const him = [...mySquad(next).starters, ...mySquad(next).bench].find(p => p.id === id);
    if (him) {
      next = removePlayer(next, id);
      notices.push({ kind: 'story', title: `${him.name} חזר מההשאלה`, icon: 'handshake',
        body: reason === 'round' ? `חמשת המשחקים נגמרו. ${surnameOf(him.name)} חוזר למועדון שלו, ותודה על הכול.` : `העונה נגמרה וההשאלה איתה. ${surnameOf(him.name)} חוזר למועדון שלו.` });
    }
  }
  return { ...next, loans, notices: [...next.notices, ...notices] };
}

/* ------------------------------------------------------------ the new season */

/**
 * Roll the career forward one year. The club climbs or drops, the squad comes
 * with you a year older, and the new division is built around you. This is what
 * replaced "new career" at the end of a season, so a save is a real climb from
 * ליגה ג' rather than a fourteen round loop.
 */
/**
 * Every club eligible for the cup draw: tier 4 and 5's own city rosters
 * (cities.ts's TIER_ROSTER, after א.3's expansion). A few town names list in
 * both tiers (clubFromCity's id is the town's name hash alone, independent of
 * tier) — deduped by id, tier 5's own listing winning the rare clash, since a
 * giant city is a giant city whichever list wrote it down first.
 */
function cupPool(): Array<{ id: string; tier: number }> {
  const byId = new Map<string, number>();
  for (const c of cityClubsForTier(CUP_MIN_TIER)) byId.set(c.id, CUP_MIN_TIER);
  for (const c of cityClubsForTier(CUP_MIN_TIER + 1)) byId.set(c.id, CUP_MIN_TIER + 1);
  return Array.from(byId, ([id, tier]) => ({ id, tier }));
}

export function startNextSeason(gs: GameState): GameState {
  // the starts of the season open the potential of the boys of the new academy, before anything reads the squad
  gs = foldYouthMinutes(gs);
  const table = sortedTable(gs.league);
  const position = Math.max(1, table.findIndex(s => s.clubId === gs.clubId) + 1);
  const teams = gs.league.clubs.length;
  const myClub = club(gs);

  const next = buildNextSeason({
    seasonSeed: gs.seasonSeed,
    season: gs.season,
    tier: myClub.tier,
    myClub,
    myClubId: gs.clubId,
    squads: gs.league.squads,
    // who was actually in the division, in finishing order, so it is not rebuilt
    standings: table.map(row => gs.league.clubs.find(c => c.id === row.clubId)!).filter(Boolean),
    homeCity: myClub.city,
    // so a manager is never handed himself as a player
    managerName: gs.profile.name,
    position, teams,
    minSquad: MIN_SQUAD,
    stadiumOk: gs.stadium.capacity >= requiredCapacity(myClub.tier + 1),
    youthGrowth: coachYouthGrowth(gs.coach),
    fitnessBonus: coachFitnessBonus(gs.coach),
  });

  // their minutes, before anything else reads the squad
  next.squads[gs.clubId] = friendsSummer(
    gs, gs.league.squads[gs.clubId], next.squads[gs.clubId], gs.league.rounds);

  // the whole division carries forward, aged, rather than being regenerated
  // The day you climb back into his division, he is in it, and he is your derby.
  // Being sacked is not an ending here, it is the opening of an account, and
  // this is where it gets settled.
  // Read the tier the club actually landed on rather than working it out from
  // the result: a champion whose promotion was blocked by a small ground does
  // not go up, and duplicating that rule here had the nemesis appearing in a
  // division the manager had not reached.
  const myNewTier = next.clubs.find(c => c.id === gs.clubId)?.tier ?? myClub.tier;
  const back = returnOfTheNemesis(gs, next.clubs, next.squads, myNewTier);
  // AFTER the man who sacked you is put back, because his is already a rivalry
  // and localRival will find it rather than making a second one beside it
  const local = withLocalRival(back.clubs, back.squads, gs.clubId, myNewTier);

  const league: LeagueState = {
    clubs: local.clubs,
    squads: local.squads,
    ovr: Object.fromEntries(
      Object.entries(local.squads).map(([id, sq]) => [
        id, Math.round(sq.starters.reduce((s, p) => s + overall(p), 0) / sq.starters.length),
      ]),
    ),
    fixtures: buildFixtures(local.clubs.map(c => c.id)),
    table: emptyTable(local.clubs),
    rounds: (local.clubs.length - 1) * 2,
  };
  registerLocalRivalry(league.clubs, gs.clubId);

  const r = next.report;
  const mine = next.squads[gs.clubId];
  const rng = createRng(next.seed + 991);
  const takenNames = new Set([...mine.starters, ...mine.bench].map(p => p.name));
  const academy = summerAcademy(gs, r.newTier, next.seed, takenNames);

  // what came in round by round is not paid twice. Never a claw back: the base is the least any finish pays
  const earlier = Math.max(0, Math.min(gs.purseEarlier, r.purse));
  const report: SeasonReport = { ...r, season: gs.season, purse: r.purse - earlier, purseEarlier: earlier };
  const prestigeDelta = r.result === 'champion' ? +9 : r.result === 'promoted' ? +6 : r.result === 'relegated' ? -8 : 0;

  // file the season away on each player's record before the slate is wiped.
  // only men still in the division are kept, and only fifteen years each, so a
  // forty season career does not quietly fill up localStorage.
  const stillHere = new Map<string, string>();
  for (const [cid, sq] of Object.entries(league.squads)) {
    const short = league.clubs.find(c => c.id === cid)?.short ?? '';
    for (const p of [...sq.starters, ...sq.bench]) stillHere.set(p.id, short);
  }
  const careerStats: Record<string, CareerSeason[]> = {};
  for (const [id, hist] of Object.entries(gs.careerStats)) {
    if (stillHere.has(id)) careerStats[id] = [...hist];
  }
  for (const [id, s] of Object.entries(gs.seasonStats)) {
    const short = stillHere.get(id);
    if (!short || s.apps === 0) continue;
    const entry: CareerSeason = {
      season: gs.season, tier: club(gs).tier, clubShort: short,
      apps: s.apps, goals: s.goals, assists: s.assists,
    };
    careerStats[id] = [...(careerStats[id] ?? []), entry].slice(-15);
  }

  // Wages are paid weekly during the season now, so the summer is the prize
  // money only. Arriving at the break already broke still costs you the room.
  // the results deal pays its lump the summer you actually go up
  const wentUp = r.result === 'champion' || r.result === 'promoted';
  const shirtBonus = wentUp ? (gs.sponsor?.promotionBonus ?? 0) : 0;
  const rawMoney = gs.meters.money + report.purse + shirtBonus;
  // the sponsor's lump is a moment, not a line lost in the summer's sums
  const bonusNotice = shirtBonus > 0 && gs.sponsor
    ? [{ kind: 'story' as const, title: `${sponsorName(gs.sponsor)} משלמים את המענק`, body: `עליתם ליגה, וחוזה ההישגים מכבד את המילה: ${formatShekels(shirtBonus)} נכנסו לקופה. ${brandById(gs.sponsor.brand).name} ירצו לדבר על העונה הבאה.` }]
    : [];
  const brokeIt = gs.meters.money <= 0;
  const moraleDelta = (r.result === 'relegated' ? -12 : +6) + (brokeIt ? -10 : 0);

  // the door to the cup opens on landing in tier 4 or 5, every season, whatever the road that got there. A club also
  // drawn into Europe this season is seeded in at the quarter, per ב.1.2's rule for the reigning champion; read off
  // the same entry rule as the euro field just below, so the two can never disagree about who is seeded
  const seededForCup = euroEntry(EURO_LIVE, report, TOP_TIER) && euroWeeks(league.rounds) !== null;
  const nextCup = cupEntry(CUP_LIVE, r.newTier) && cupWeeks(league.rounds) !== null
    ? drawCup(drawSeed({ seasonSeed: gs.seasonSeed, season: gs.season + 1, week: 0 }, 170_000), gs.clubId, gs.season + 1, r.newTier, seededForCup, cupPool())
    : null;

  const summer: GameState = {
    ...gs,
    // the summer sits between the seasons, where the report of who aged, who
    // retired and who came up from the youth actually belongs
    phase: 'preseason',
    season: gs.season + 1,
    lastReport: report,
    // the door to Europe opens on a ליגת העל title and on nothing else. The five
    // clubs rested last season come first in the new draw
    euro: euroEntry(EURO_LIVE, report, TOP_TIER) && euroWeeks(league.rounds) !== null
      ? drawEuro(drawSeed({ seasonSeed: gs.seasonSeed, season: gs.season + 1, week: 0 }, 140_000), gs.clubId, gs.season + 1, 0, gs.euro?.rested ?? [])
      : null,
    cup: nextCup,
    purseEarlier: 0,
    week: 1,
    league,
    market: makeMarket(r.newTier, rng, 12, takenNames),
    meters: {
      // prize money in, a full season of wages out. Not floored: a debt that
      // vanished every summer was the same bug as the one the round ledger had,
      // and it would have quietly forgiven anything the owner was about to sack
      // you for.
      money: cash(rawMoney),
      morale: moraleShift(gs.meters.morale, moraleDelta),
      prestige: meter(gs.meters.prestige + prestigeDelta - (brokeIt ? 4 : 0)),
      fans: meter(gs.meters.fans + fansAfterSeason(r.result)),
    },
    seasonStats: {},
    careerStats,
    form: [],
    seasonOver: false,
    lastPlayerMatch: null,
    lastRound: [],
    dilemma: null,
    pendingOutcome: null,
    press: null,
    chronicle: [...gs.chronicle, ...seasonChronicle(gs, report, myClub.short),
      ...(back.met && gs.nemesis ? [{
        id: `nemesis-s${gs.season}`,
        kind: 'sacked' as const,
        week: 0,
        title: `חזרת לליגה של ${gs.nemesis.short}`,
        body: `הם פיטרו אותך בעונה ${gs.nemesis.season}, ומאז לא זזו משם. עכשיו אתם באותה ליגה, ויש דרבי.`,
        icon: 'flame' as const,
        tint: 'gold' as const,
      }] : [])],
    // the account is settled the moment you are back in his league
    nemesis: back.met ? null : gs.nemesis,
    // climbing a division is the milestone the premium currency is pinned to,
    // and the ad allowance refills with the new season
    gems: gs.gems + (r.result === 'champion' || r.result === 'promoted' ? GEMS_ON_PROMOTION : 0) + adFreeGems(),
    adsWatched: 0,
    pull: null,
    // his CV, which is what his standing is read off. A division won counts as
    // a title as well as a climb, because winning one is not the same as
    // scraping up through the play off places
    coach: {
      ...gs.coach,
      seasons: gs.coach.seasons + 1,
      bestTier: Math.max(gs.coach.bestTier ?? 1, next.report.newTier),
      promotions: (gs.coach.promotions ?? 0) + (r.result === 'champion' || r.result === 'promoted' ? 1 : 0),
      titles: (gs.coach.titles ?? 0) + (r.result === 'champion' ? 1 : 0),
    },
    // the academy has its summer too: one kid breaks out, the eighteen year olds
    // come up for a decision, and a new intake arrives
    youth: academy.youth,
    youthBoost: [],
    youthLeaveRisk: null,
    notices: [...(academy.left
      ? [...gs.notices, { kind: 'story' as const, title: ` עזב את הנוער`, body: 'מאמן הנוער הזהיר שאם לא יעלה, הוא ילך. הוא הלך. קבוצה אחרת חתמה אותו בקיץ.' }]
      : gs.notices), ...bonusNotice],
  };
  // the man who was told "until the end of the season" goes now, to a club
  // in the league he is about to play in
  const settled = settleSummerExits(summer);
  // the kids who turned eighteen come first: the summer starts with them
  return youthGraduates(settled).length ? { ...settled, phase: 'youth-decision' } : settled;
}

/**
 * Put the club that sacked you back in front of you, the season you reach the
 * division they never left. The weakest side in the new league steps aside and
 * hands over its squad, so the table size and the fixture list are untouched,
 * and the two of them are written into each other's rivalId, which is what the
 * derby chip on the match card reads.
 */
function returnOfTheNemesis(
  gs: GameState, clubs: Club[], squads: Record<string, Squad>, myTier: number,
): { clubs: Club[]; squads: Record<string, Squad>; met: boolean } {
  const n = gs.nemesis;
  if (!n || myTier !== n.tier) return { clubs, squads, met: false };
  if (clubs.some(c => c.id === n.clubId)) return { clubs, squads, met: false };

  const mine = clubs.find(c => c.id === gs.clubId);
  // the side that makes way is the weakest one that is not yours
  const others = clubs.filter(c => c.id !== gs.clubId);
  if (!others.length || !mine) return { clubs, squads, met: false };
  const ovrOf = (c: Club) => {
    const sq = squads[c.id];
    if (!sq?.starters?.length) return 0;
    return sq.starters.reduce((t, p) => t + overall(p), 0) / sq.starters.length;
  };
  const out = others.reduce((a, b) => (ovrOf(b) < ovrOf(a) ? b : a));
  const him = { ...siblingClub(n.city, n.tier, gs.clubId), id: n.clubId, name: n.name, short: n.short, city: n.city, tier: n.tier, rivalId: gs.clubId };

  const nextClubs = clubs.map(c => (c.id === out.id ? him : c.id === gs.clubId ? { ...c, rivalId: n.clubId } : c));
  const nextSquads: Record<string, Squad> = { ...squads };
  nextSquads[n.clubId] = squads[out.id];
  delete nextSquads[out.id];
  return { clubs: nextClubs, squads: nextSquads, met: true };
}

/** The promotion or relegation itself is a chapter worth keeping. */
function seasonChronicle(gs: GameState, r: SeasonReport, clubShort: string): ChronicleEntry[] {
  const id = `season-${r.season}-${r.result}`;
  if (gs.chronicle.some(e => e.id === id)) return [];
  const league = LEAGUE_NAMES[r.newTier] ?? '';
  // a title that climbs says so; a title in ליגת העל (or one the ground held back) is a title and nothing more (16.10)
  if (r.result === 'champion' && r.newTier === r.tier) {
    return [{
      id, kind: 'season_end', week: r.season, icon: 'trophy', tint: 'gold',
      title: r.tier >= TOP_TIER ? 'אלופי המדינה' : 'אלופים',
      body: r.tier >= TOP_TIER
        ? `${clubShort} סיימה ראשונה. אין למעלה מזה, ועונה הבאה כולם באים לקחת לך את זה.`
        : `${clubShort} סיימה ראשונה, אבל האצטדיון קטן מדי ל${LEAGUE_NAMES[r.tier + 1] ?? ''}. נשארים, ובונים.`,
    }];
  }
  if (r.result === 'champion' || r.result === 'promoted') {
    return [{
      id, kind: 'season_end', week: r.season, icon: 'trophy', tint: 'gold',
      title: r.result === 'champion' ? `אלופים, ועולים ל${league}` : `עולים ל${league}`,
      body: `${clubShort} סיימה במקום ${r.position} וטיפסה דרגה. עונה הבאה כבר משחקים מול קבוצות אחרות לגמרי.`,
    }];
  }
  if (r.result === 'relegated') {
    return [{
      id, kind: 'season_end', week: r.season, icon: 'alert', tint: 'loss',
      title: `יורדים ל${league}`,
      body: `מקום ${r.position} בטבלה, וזה נגמר בירידה. עכשיו בונים מחדש ומטפסים שוב.`,
    }];
  }
  return [];
}

/** did the club climb a division last summer: the chapter of a promotion, or of a title that climbed (its title says עולים; a title without a climb does not) */
export function wentUpLastSeason(gs: GameState): boolean {
  const s = gs.season - 1;
  return gs.chronicle.some(e => e.id === `season-${s}-promoted` || (e.id === `season-${s}-champion` && e.title.includes('עולים ל')));
}

/** The owner ended it over debt. Read by the App for the money counting, numbers only. */
export function sackedOverDebt(gs: GameState): boolean {
  return gs.sacking?.reason === 'debt';
}

/** The season is over and this club finished first. */
export function wonTheLeague(gs: GameState): boolean {
  if (gs.phase !== 'season-end') return false;
  return sortedTable(gs.league)[0]?.clubId === gs.clubId;
}

/** Is the club already at the top of the Israeli ladder. */
export function atTopTier(gs: GameState): boolean {
  return club(gs).tier >= TOP_TIER;
}

export function openCoach(gs: GameState): GameState { return { ...gs, phase: 'coach' }; }
export function openCaptain(gs: GameState): GameState { return { ...gs, phase: 'captain' }; }
export function openAssistant(gs: GameState): GameState { return { ...gs, phase: 'assistant' }; }
export function unreadChronicle(gs: GameState): number {
  return Math.max(0, gs.chronicle.length - gs.chronicleSeen);
}

/* --------------------------------------------------------------- utilities */

/** Which instinct did this choice express. Pure counting, no extra data needed. */
function scoreStyle(style: ManagerStyle, e: { money?: number; morale?: number; prestige?: number }): ManagerStyle {
  const money = e.money ?? 0, morale = e.morale ?? 0, prestige = e.prestige ?? 0;
  const next = { ...style };
  if (morale > 0 && (money < 0 || prestige < 0)) next.players += 1;
  else if (prestige > 0 && morale <= 0) next.media += 1;
  else if (money > 0 && morale < 0) next.money += 1;
  else if (morale > 0) next.players += 1;
  else if (prestige > 0) next.media += 1;
  else if (money > 0) next.money += 1;
  return next;
}

function cloneTable(t: LeagueState['table']): LeagueState['table'] {
  const out: LeagueState['table'] = {};
  for (const k of Object.keys(t)) out[k] = { ...t[k] };
  return out;
}

function hashPair(a: string, b: string): number {
  let h = 0;
  const s = a + '|' + b;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 9973;
}

export { sortedTable };

/** Roll the injury risks the manager took before the match: who sits the round after. */
function settleInjuries(gs: GameState): Record<string, string> {
  const out = { ...gs.sitOutNext };
  const risks = gs.matchMods.injury ?? {};
  const rng = createRng(drawSeed(gs, 100_000));
  for (const [id, p] of Object.entries(risks)) if (rng() < p) out[id] = 'פצוע';
  return out;
}

/**
 * The academy's summer, with what the manager decided during the season: the
 * kids he let train with the seniors grow more, and the one he would not
 * promote may have walked, as the youth coach warned he might.
 */
function summerAcademy(gs: GameState, newTier: number, seed: number, used: Set<string>): { youth: Youth; left: string | null } {
  const intakeRng = createRng(seed + 6604);
  const youthNow = YOUTH_V2 ? { ...gs.youth, players: gs.youth.players.map(toNewRules) } : gs.youth;
  let youth = advanceYouth(youthNow, newTier, createRng(seed + 6602), used, coachYouthGrowth(gs.coach), new Set(gs.youthBoost),
    YOUTH_V2 ? {
      target: OWN_INTAKE,
      makeIntake: room => Array.from({ length: room }, () => makeYouthKid(newTier, intakeRng, used, gs.season + 1, FREE_POT_CAP[newTier] ?? 80)),
    } : undefined);
  const risk = gs.youthLeaveRisk;
  let left: string | null = null;
  if (risk && youth.players.some(p => p.name === risk.name) && createRng(seed + 6603)() < risk.p) {
    youth = { ...youth, players: youth.players.filter(p => p.name !== risk.name), ready: youth.ready.filter(n => n !== risk.name) };
    left = risk.name;
  }
  return { youth, left };
}

/**
 * Roll one named dilemma against the live save, the way the week would.
 * For the checks, which need a particular question in front of the manager
 * rather than whichever the seed happens to draw.
 */
export function rollNamedDilemma(gs: GameState, id: string, seed = 1, force = false): RolledDilemma | null {
  const tpl = TEMPLATES.find(t => t.id === id);
  if (!tpl) return null;
  const fx = playerFixture(gs);
  const rivalId = fx ? (fx.homeId === gs.clubId ? fx.awayId : fx.homeId) : gs.clubId;
  const rival = gs.league.clubs.find(c => c.id === rivalId)!;
  const ctx = dilemmaCtx(gs, topPlayerName(mySquad(gs)), rival.short, rivalId);
  if (!force && tpl.when && !tpl.when(ctx)) return null;
  return rollDilemma(tpl, ctx, createRng(seed));
}

/**
 * "Stay until the end of the season and then we will talk" was a promise
 * too. In the summer the man goes, to a club in the division you are about
 * to play in, with the story attached like any other sale, and a word about
 * it waits at the first hub of the new season. The fee is what the window
 * would have paid, since it was agreed and not forced.
 */
function settleSummerExits(gs: GameState): GameState {
  if (!gs.summerExits.length) return { ...gs, summerExits: [] };
  const sq = mySquad(gs);
  let out = gs;
  for (const id of gs.summerExits) {
    const p = [...sq.starters, ...sq.bench].find(x => x.id === id);
    if (!p) continue;
    // he goes even from a squad of sixteen: the academy tops the squad back up,
    // the way it does after any summer sale
    let gone = removePlayer(out, id);
    if (squadSize(gone) < MIN_SQUAD) {
      const filled = fillWithYouth(mySquad(gone), createRng(gone.seasonSeed + 8801), club(gone).tier, MIN_SQUAD);
      gone = writeSquad(gone, filled.squad);
    }
    const moved = moveToLeagueClub(gone, p);
    const buyer = out.league.clubs.find(c => c.id === moved.clubId)?.short ?? 'קבוצה אחרת';
    const fee = sellPrice(p, club(out).tier);
    out = {
      ...moved.gs,
      // he has left, friend or not, and a friend who has left is not one of
      // the two who are still here
      friends: markFriendGone(moved.gs.friends, id),
      meters: { ...moved.gs.meters, money: cash(moved.gs.meters.money + fee) },
      notices: [...moved.gs.notices, { kind: 'story', title: `${p.name} עבר ל${buyer}`, body: `כמו שסיכמתם בחורף: עד סוף העונה, ואז הוא הולך. הלך. ${formatShekels(fee)} נכנסו לקופה, ובפעם הבאה שתפגשו הוא בצד השני.` }],
    };
  }
  return { ...out, summerExits: [] };
}

/* ------------------------------------------------------ the academy, v2 */

/** Half seasons, so the list is drawn again when the winter window opens and when the summer does. */
const youthStampOf = (gs: GameState): number => gs.season * 2 + (gs.week >= 8 ? 1 : 0);

/**
 * The boys on offer, drawn for this half of the season and kept until the next. In ליגה א׳ the list is empty until the
 * scout has been sent. Deterministic: the draw is a function of the career, the season and the half.
 */
export function refreshYouthPool(g0: GameState): GameState {
  if (!YOUTH_V2) return g0;
  // the boys of the old academy join the new rules the first time the door is opened
  const gs = g0.youth.players.some(p => p.lock0 === undefined && p.age < 18)
    ? { ...g0, youth: { ...g0.youth, players: g0.youth.players.map(toNewRules) } } : g0;
  const tier = club(gs).tier;
  const route = routeOf(tier);
  if (route === 'trip') {
    // what the scout found stays for the season it was found in
    return gs.youthTripSeason < gs.season && gs.youthPool.length ? { ...gs, youthPool: [] } : gs;
  }
  const stamp = youthStampOf(gs);
  if (gs.youthStamp === stamp) return gs;
  const sq = mySquad(gs);
  const used = new Set([...sq.starters, ...sq.bench, ...gs.youth.players].map(p => p.name));
  const rng = createRng(drawSeed(gs, 170_000 + stamp));
  return { ...gs, youthPool: drawPool(tier, rng, used, gs.season, route === 'paid' ? 'paid' : 'free'), youthStamp: stamp };
}

/** Why the scout cannot go to look for a boy yet, or null. */
export function youthTripBlockedReason(gs: GameState): string | null {
  if (!YOUTH_V2) return 'הדלת עוד סגורה';
  if (routeOf(club(gs).tier) !== 'trip') return 'סקאוט לנוער רק בליגה א׳';
  if (gs.youthTripSeason === gs.season) return 'הסקאוט כבר יצא העונה';
  if (!transferWindow(gs).open) return 'חלון העברות סגור. בחלון הבא תוכל לשלוח את הסקאוט.';
  if (gs.meters.money < TRIP_FEE) return 'אין מספיק כסף בקופה לנסיעה';
  return null;
}

/** Send the scout: it costs the fee, and he comes back with two boys, once a season. */
export function youthScoutTrip(gs: GameState): GameState {
  if (youthTripBlockedReason(gs)) return gs;
  const sq = mySquad(gs);
  const used = new Set([...sq.starters, ...sq.bench, ...gs.youth.players].map(p => p.name));
  const rng = createRng(drawSeed(gs, 171_000 + gs.season));
  return {
    ...gs,
    meters: { ...gs.meters, money: cash(gs.meters.money - TRIP_FEE) },
    youthPool: drawPool(club(gs).tier, rng, used, gs.season, 'scout'),
    youthTripSeason: gs.season,
  };
}

/** Why this boy cannot be signed, or null. */
export function signYouthBlockedReason(gs: GameState, id: string): string | null {
  if (!YOUTH_V2) return 'הדלת עוד סגורה';
  const offer = gs.youthPool.find(o => o.player.id === id);
  if (!offer) return 'הוא כבר לא ברשימה';
  if (!transferWindow(gs).open) return 'חלון העברות סגור. בחלון הבא תוכל להחתים שחקן נוער.';
  if (gs.youth.players.length >= ACADEMY_MAX) return 'המחלקה מלאה. תעלה מישהו לבוגרים או תשחרר, ואז יהיה מקום.';
  if (gs.meters.money < offer.fee) return 'אין מספיק כסף בקופה';
  return null;
}

/** Bring him in: the fee leaves the purse and he joins the academy, not the squad. */
export function signYouthKid(gs: GameState, id: string): GameState {
  if (signYouthBlockedReason(gs, id)) return gs;
  const offer = gs.youthPool.find(o => o.player.id === id)!;
  return {
    ...gs,
    meters: { ...gs.meters, money: cash(gs.meters.money - offer.fee) },
    youth: { ...gs.youth, players: [...gs.youth.players, offer.player] },
    // the scout brought two names for one place: a signing closes the trip
    youthPool: offer.via === 'scout' ? [] : gs.youthPool.filter(o => o.player.id !== id),
    pendingOutcome: `${offer.player.name} הצטרף למחלקת הנוער.`,
  };
}

/** Why this boy cannot be registered to the match day squad, or null. */
export function callUpBlockedReason(gs: GameState, id: string): string | null {
  if (!YOUTH_V2) return 'הדלת עוד סגורה';
  const kid = gs.youth.players.find(p => p.id === id);
  if (!kid) return 'הוא לא במחלקה';
  if (kid.age >= 18) return 'בן 18, מחליטים עליו בקיץ';
  if (gs.youthUp.length >= CALL_UPS_PER_ROUND) return `כבר צירפת ${CALL_UPS_PER_ROUND} שחקני נוער למחזור`;
  return null;
}

/** Register a boy for the round: he sits on the bench, the manager can start him, and he is not counted in the squad. */
export function callUpYouth(gs: GameState, id: string): GameState {
  if (callUpBlockedReason(gs, id)) return gs;
  const kid = gs.youth.players.find(p => p.id === id)!;
  const sq = mySquad(gs);
  const next = writeSquad(gs, { starters: sq.starters, bench: [...sq.bench, kid] });
  return {
    ...next,
    youth: { ...gs.youth, players: gs.youth.players.filter(p => p.id !== id) },
    youthUp: [...gs.youthUp, id],
    pendingOutcome: `${kid.name} נוסף לסגל המחזור. תכניס אותו להרכב אם אתה רוצה שהוא ישחק.`,
  };
}

/** Take a boy off the round's sheet again, before it is played. */
export function undoCallUp(gs: GameState, id: string): GameState {
  if (!gs.youthUp.includes(id)) return gs;
  const sq = mySquad(gs);
  const kid = [...sq.starters, ...sq.bench].find(p => p.id === id);
  if (!kid) return { ...gs, youthUp: gs.youthUp.filter(x => x !== id) };
  const next = removePlayer(gs, id);
  return { ...next, youthUp: gs.youthUp.filter(x => x !== id), youth: { ...next.youth, players: [...next.youth.players, kid] } };
}

/** After the round: the boys registered from the academy go back down, with a word each. */
function returnYouthUp(gs: GameState): GameState {
  let g = gs;
  for (const id of gs.youthUp ?? []) {
    const sq = mySquad(g);
    const kid = [...sq.starters, ...sq.bench].find(p => p.id === id);
    if (!kid) continue;
    const next = removePlayer(g, id);
    g = { ...next, youth: { ...next.youth, players: [...next.youth.players, kid] }, notices: [...next.notices, { kind: 'youth_back', name: kid.name }] };
  }
  return gs.youthUp?.length ? { ...g, youthUp: [] } : g;
}

/** The summer: every start of the season is folded into the potential the boy carries, in the squad and at the academy. */
function foldYouthMinutes(gs: GameState): GameState {
  if (!YOUTH_V2) return gs;
  const apps = (p: Player) => gs.seasonStats[p.id]?.apps ?? 0;
  const sq = mySquad(gs);
  const starters = sq.starters.map(p => foldMinutes(p, apps(p)));
  const bench = sq.bench.map(p => foldMinutes(p, apps(p)));
  const youth = { ...gs.youth, players: gs.youth.players.map(p => foldMinutes(p, apps(p))) };
  return { ...writeSquad(gs, { starters, bench }), youth };
}

/* ------------------------------------------------- the academy, what it says */

/** The boys the manager can still shape: the academy under 18 and the ones registered for this round. */
function youthBoys(gs: GameState): Player[] {
  const sq = mySquad(gs);
  const up = [...sq.starters, ...sq.bench].filter(p => (gs.youthUp ?? []).includes(p.id));
  return [...gs.youth.players.filter(p => p.age < 18), ...up];
}

/** For the dilemmas about a boy: who, how much he has played, and whether he could be a real talent. Nothing with the door shut. */
function youthCtx(gs: GameState): { boy?: string; boyApps?: number; boyGem?: boolean; boyAge?: number; boys?: number } {
  if (!YOUTH_V2) return {};
  const boys = youthBoys(gs);
  if (!boys.length) return { boys: 0 };
  const apps = (p: Player) => gs.seasonStats[p.id]?.apps ?? 0;
  const him = [...boys].sort((a, b) => apps(a) - apps(b) || overall(b) - overall(a))[0];
  const gem = [...boys].sort((a, b) => rangeOf(b, apps(b)).hi - rangeOf(a, apps(a)).hi)[0];
  const top = rangeOf(gem, apps(gem)).hi - leagueCeiling(club(gs).tier) >= 7;
  // the one who has played least is the boy for the stories of waiting, the best of them for the stories of leaving
  return { boy: top ? surname(gem.name) : surname(him.name), boyApps: top ? apps(gem) : apps(him), boyGem: top, boyAge: top ? gem.age : him.age, boys: boys.length };
}

/**
 * The youth coach's word for the academy screen: the first thing that is true of the boys right now. Never a number the
 * game does not hold, and nothing at all with the door shut or with no boys.
 */
export function academyCoachNote(gs: GameState): CoachNote | null {
  if (!YOUTH_V2) return null;
  const boys = youthBoys(gs);
  if (!boys.length) return null;
  const tier = club(gs).tier;
  const apps = (p: Player) => gs.seasonStats[p.id]?.apps ?? 0;
  const late = gs.week >= gs.league.rounds - 4;
  const note = (id: string, p: Player): CoachNote => ({ id, lines: COACH[id].map(l => l.replace('{boy}', surname(p.name))) });
  const seventeen = boys.find(p => p.age === 17 && apps(p) >= 1 && gs.week >= 10);
  if (seventeen) return note('yc_asks_seniors', seventeen);
  const turning = late ? boys.find(p => p.age === 17) : undefined;
  if (turning) return note('yc_turning_18', turning);
  const jumped = boys.find(p => reachNow(p, apps(p)) - potentialOf(p) >= 3);
  if (jumped) return note('yc_potential_jump', jumped);
  const talent = boys.find(p => rangeOf(p, apps(p)).hi - leagueCeiling(tier) >= 7 && apps(p) >= 4);
  if (talent) return note(tier >= 4 ? 'yc_sniffing_pro' : 'yc_sniffing_low', talent);
  const stuck = boys.find(p => apps(p) === 0 && p.joined !== undefined && p.joined < gs.season || (apps(p) === 0 && gs.week >= 8));
  if (stuck) return note('yc_bench_stuck', stuck);
  const stalled = boys.find(p => apps(p) >= 4 && rangeOf(p, apps(p)).hi - overall(p) <= 1);
  if (stalled) return note('yc_stagnant', stalled);
  const first = boys.find(p => apps(p) >= 1 && apps(p) <= 2);
  if (first) return note('yc_first_minutes', first);
  const fresh = boys.find(p => p.joined === gs.season);
  if (fresh) return note('yc_new_arrival', fresh);
  return null;
}

/* ------------------------------------------ the owner asks to sell a match (fixing.ts) */

/**
 * The owner's request, if it is due now: ליגה ג׳ to א׳ only, never after a yes, never more than twice in a league (the first
 * season in it, and again the season after if he was refused), one of ten situations he has not been shown. The week it
 * comes is drawn once a season from the season's own seed, and it is counted the moment it is shown, so quitting and
 * coming back does not give a second ask.
 */
export function fixOfferDue(gs: GameState): { id: string; gs: GameState } | null {
  if (!FIX_LIVE || gs.fix) return null;
  const tier = club(gs).tier;
  if (tier > FIX_TOP_TIER) return null;
  const log = gs.fixLog;
  if (log.done) return null;
  const n = log.offered[tier] ?? 0;
  if (n >= FIX_ASKS_PER_LEAGUE) return null;
  if (n >= 1 && gs.season <= log.lastOfferSeason) return null;
  const rounds = gs.league.rounds;
  const span = Math.max(1, rounds - FIX_FIRST_WEEK - FIX_LAST_MARGIN);
  const when = FIX_FIRST_WEEK + Math.floor(createRng(gs.seasonSeed + 172_001 + tier)() * span);
  if (gs.week < when || gs.week > rounds - 1 || !playerFixture(gs)) return null;
  const unseen = FIX_SITUATIONS.filter(s => !log.seen.includes(s.id));
  if (!unseen.length) return null;
  const pick = unseen[Math.floor(createRng(drawSeed(gs, 173_000))() * unseen.length)];
  return {
    id: pick.id,
    gs: { ...gs, fixLog: { ...log, offered: { ...log.offered, [tier]: n + 1 }, lastOfferSeason: gs.season, seen: [...log.seen, pick.id] } },
  };
}

/**
 * The match he sold, played for him: the same teams and the same squad, with the draw moved on until the club loses.
 * A club that cannot lose in three hundred tries still loses, with the score written and no events.
 */
export function fixedMatchResult(gs: GameState): MatchResult {
  const fx = playerFixture(gs)!;
  const iAmHome = fx.homeId === gs.clubId;
  const base = drawSeed(gs, 175_000);
  let first: MatchResult | null = null;
  for (let k = 0; k < 300; k++) {
    const r = simulateMatch(teamInput(gs, fx.homeId, true), teamInput(gs, fx.awayId, false), base + k);
    first = first ?? r;
    const mine = iAmHome ? r.score[0] : r.score[1];
    const theirs = iAmHome ? r.score[1] : r.score[0];
    if (mine < theirs) return r;
  }
  return { ...first!, score: iAmHome ? [0, 1] : [1, 0], events: [] };
}

/**
 * The verdict, after the whistle and the result screen. Caught: the federation closes the club, he is out, and the way
 * back is the bottom division. Not caught: the sum lands in the club and the week goes on as any week.
 */
export function resolveFix(gs: GameState): GameState {
  const f = gs.fix;
  if (!f || f.stage !== 'played') return gs;
  const c = club(gs);
  if (f.caught) {
    const table = sortedTable(gs.league);
    const sacking: Sacking = {
      reason: 'fixing', debt: 0, limit: 0, week: gs.week, season: gs.season, league: LEAGUE_NAMES[c.tier],
      clubId: c.id, club: c.name, short: c.short, city: c.city, tier: c.tier,
      position: Math.max(1, table.findIndex(x => x.clubId === gs.clubId) + 1), teams: table.length,
    };
    return {
      ...gs, fix: null, sacking, phase: 'sacked', press: null, chat: null,
      chronicle: [...gs.chronicle, {
        id: `fixed-s${gs.season}`, kind: 'sacked' as const, week: gs.week, title: 'המועדון נסגר',
        body: `משחק שנמכר מול הבעלים, ועדת משמעת, וסוף. ${c.name} נסגר, והמאמן מתחיל מחדש בליגה ג׳.`,
        icon: 'alert' as const, tint: 'loss' as const,
      }],
    };
  }
  return continueFromResult({
    ...gs, fix: null,
    meters: { ...gs.meters, money: cash(gs.meters.money + f.payout) },
    chronicle: [...gs.chronicle, {
      id: `fixclear-s${gs.season}`, kind: 'sold' as const, week: gs.week, title: 'מכרת משחק',
      body: `אף אחד לא דפק בדלת. ${FIX_CLEAR_TEXT.body.replace('{sum}', 'הכסף')}`.split('\n')[0],
      icon: 'coins' as const, tint: 'draw' as const,
    }],
  });
}
