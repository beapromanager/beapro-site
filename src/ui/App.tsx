import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as G from '../game/state.ts';
import { saveCareer, loadCareer, savedSummary, clearCareer } from '../game/save.ts';
import type { SaveSummary } from '../game/save.ts';
import { TitleScreen } from './screens/Title.tsx';
import { WeekendEntry, WeekendRoot } from './weekend/Weekend.tsx';
import { weekendOn, serverNow, LAUNCH_AT, local as weekendLocal, setLocal as setWeekendLocal } from '../game/weekend.ts';
import type { PrizeToken } from '../game/weekend.ts';
import type { CareerPrizeView } from '../game/weekendPrize.ts';
import { LEAGUE_NAMES } from '../data/clubs.ts';
import { IntroCinematic } from './screens/Intro.tsx';
import { Tutorial } from './components/Tutorial.tsx';
import { OnboardManager, OnboardClub } from './screens/Onboard.tsx';
import { ObCityScreen } from './screens/ObCity.tsx';
import { ArchetypeScreen } from './screens/Archetype.tsx';
// ONBOARD_V2 plan section 7: the prologue is its own chunk, fetched only when a new career actually enters it
const Prologue = lazy(() => import('./screens/onboard/Prologue.tsx').then(m => ({ default: m.Prologue })));
import { SquadScreen } from './screens/Squad.tsx';
import { SigningScreen } from './screens/Signing.tsx';
import { FriendsScreen } from './screens/Friends.tsx';
import { PreSeasonMarket } from './screens/PreSeason.tsx';
import { TransfersScreen } from './screens/Transfers.tsx';
import { Hub } from './screens/Hub.tsx';
import { DilemmaChat } from './screens/Dilemma.tsx';
import { FixOfferScreen, FixedMatchScreen, FixVerdictScreen } from './screens/Fixing.tsx';
import { TacticScreen } from './screens/Tactic.tsx';
import { TeamsheetScreen } from './screens/Teamsheet.tsx';
import { MatchBroadcast } from './screens/Match.tsx';
import { ResultScreen } from './screens/Result.tsx';
import { PressScreen } from './screens/Press.tsx';
import { SeasonEnd, PreSeasonScreen } from './screens/SeasonEnd.tsx';
import { SackedScreen } from './screens/Sacked.tsx';
import { SponsorScreen } from './screens/Sponsor.tsx';
import { KitReveal } from './screens/KitReveal.tsx';
import { FriendlyScreen } from './screens/Friendly.tsx';
import { ShootoutScreen } from './screens/Shootout.tsx';
import { EuroDrawScreen } from './screens/EuroDraw.tsx';
import { EuroBracketScreen } from './screens/EuroBracket.tsx';
import { CupDrawScreen } from './screens/CupDraw.tsx';
import { CupBracketScreen } from './screens/CupBracket.tsx';
import { YouthScreen } from './screens/Youth.tsx';
import { AcademyScreen } from './screens/Academy.tsx';
import { YOUTH_V2 } from '../game/academy.ts';
import { obV2Enabled, newGameV2, toObCity, quickStart } from '../game/onboardV2.ts';
import { ScoutScreen } from './screens/Scout.tsx';
import { YouthDecisionScreen } from './screens/YouthDecision.tsx';
import { NoticeScreen } from './screens/Notice.tsx';
import { UltimatumScreen } from './screens/Ultimatum.tsx';
import { RescueScreen } from './screens/Rescue.tsx';
import { ChronicleScreen } from './screens/Chronicle.tsx';
import { InboxScreen } from './screens/Inbox.tsx';
import { ChatScreen } from './screens/Chat.tsx';
import { StandingsScreen } from './screens/Standings.tsx';
import { CaptainScreen } from './screens/Captain.tsx';
import { AssistantScreen } from './screens/Assistant.tsx';
import { StadiumScreen } from './screens/Stadium.tsx';
import { PacksScreen, PackReveal } from './screens/Packs.tsx';
import { LoyalGift } from './screens/LoyalGift.tsx';
import { DailyGiftSheet, DailyClaim } from './screens/DailyGift.tsx';
import { DAILY_LIVE, GOLD_EVERY } from '../game/daily.ts';
import type { DailyReward } from '../game/daily.ts';
import { CoachScreen } from './screens/Coach.tsx';
import { InviteScreen } from './screens/Invite.tsx';
import { setInviteHandler, setInstallHandler, setReportHandler } from './components/bits.tsx';
import { InstallSheet } from './components/InstallSheet.tsx';
import { refFromUrl } from '../game/invite.ts';
import { scrollToTop } from './scroll.ts';
import { track, stepFor, flush, flushOnLeaving, reached, wonLeague, moneyMark, euroMark, cupMark, giftMark, dailyMark, obMark, STEP_ORDER } from '../game/telemetry.ts';
import { AdminScreen } from './screens/Admin.tsx';
import type { Stats as AdminStats } from './screens/Admin.tsx';
import { TELEMETRY_URL } from '../data/telemetry.ts';
import { armBack, setBackHandler, leaveGame } from './back.ts';
import { ExitSheet } from './components/ExitSheet.tsx';
import { ReportSheet } from './components/ReportSheet.tsx';
import { AdPlayer } from './components/AdPlayer.tsx';
import { pickAd } from '../game/adWatch.ts';
import type { Ad } from '../data/ads.ts';

/**
 * Screens whose way out is simply the hub.
 *
 * Everything absent from this list has no back on purpose: a match, the press
 * room, a dilemma, the season end, a sacking. Those are moments the manager has
 * to answer, and letting a stray thumb walk out of them would lose the answer.
 */
const BACK_TO_HUB = new Set<G.Phase>([
  'squad', 'youth', 'stadium', 'coach', 'packs', 'captain', 'assistant', 'scout', 'euro-bracket', 'cup-bracket',
]);

export function App() {
  // The cold open is for a stranger. A manager with a career on this phone has seen it, so he goes straight to the
  // title screen, which is alive on its own (Itzik, 12.10: the film for the first visit, the living picture for everyone).
  const [introDone, setIntroDone] = useState(() => savedSummary() !== null);
  const [booted, setBooted] = useState(false);            // still on the title screen
  // the daily gift: the table open, and the celebration of the gift just taken (the reveal of a pack waits for it)
  const [dailyOpen, setDailyOpen] = useState(false);
  const [dailyWow, setDailyWow] = useState<{ reward: DailyReward; streak: number; gold: boolean } | null>(null);
  const [gs, setGs] = useState<G.GameState>(() => G.newGame());
  const [squadFromHub, setSquadFromHub] = useState(false);
  const [saved, setSaved] = useState<SaveSummary | null>(() => savedSummary());
  // the weekend league: its own screen off the title, and the prize that comes home to the career
  const [weekendOpen, setWeekendOpen] = useState(false);
  // the clock the league's door is read by: a tick a second until the launch has passed, then it stands still
  const [wkNow, setWkNow] = useState(() => serverNow());
  useEffect(() => {
    if (wkNow >= LAUNCH_AT + 5_000) return;
    const t = setInterval(() => setWkNow(serverNow()), 1000);
    return () => clearInterval(t);
  }, [wkNow >= LAUNCH_AT + 5_000]);
  // the career as the weekend screens see it: its division and its weekend record, read again whenever the save changes
  const careerView = useMemo<CareerPrizeView | null>(() => {
    const g = saved ? loadCareer() : null;
    if (!g || !g.clubId) return null;
    const tier = G.club(g).tier;
    return { tier, leagueName: LEAGUE_NAMES[tier] ?? '', weekend: g.weekend ?? null };
  }, [saved]);
  /** the prize from the champion's card into the career; null without a saved career, else what to say and whether the phone keeps the token */
  function applyWeekendPrize(token: PrizeToken & { tierSeen?: number }): { message: string; keep: boolean } | null {
    const loaded = loadCareer();
    if (!loaded) return null;
    const r = G.applyWeekendPrize(loaded, token);
    if (r.ok) saveCareer(r.gs);
    setSaved(savedSummary());
    return { message: r.message, keep: !r.ok && r.reason !== 'duplicate' };
  }
  const [fromPreseason, setFromPreseason] = useState(false);   // market opened from the summer board
  // who sent this link, kept for the moment a career actually starts. Read once
  // on load, because the url is tidied straight afterwards
  const [installOpen, setInstallOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  // reporting a fault is a sheet too, reachable from the exit question and
  // from the manager's own page, so it never takes him off the screen it is about
  const [reportOpen, setReportOpen] = useState(false);
  // the ad on screen, an overlay like the sheets so the shop stays underneath.
  // The key remounts the player for a fresh sitting when he asks to watch again
  const [ad, setAd] = useState<{ ad: Ad; key: number } | null>(null);
  const adBack = useRef<(() => void) | null>(null);
  const [ref] = useState<string | null>(() => {
    try { return refFromUrl(location.search); } catch { return null; }
  });
  // ?admin=KEY is the only way to the numbers, and the key is judged by the
  // worker, not here: a check in the browser is a lock with the key beside it.
  // Nothing about the dashboard shows until the worker has said yes, because a
  // screen that answers "wrong password" tells a stranger there is a password
  // to get right. A wrong key is the game, exactly as an absent one is.
  const [adminKey] = useState<string | null>(() => {
    try { return new URLSearchParams(location.search).get('admin'); } catch { return null; }
  });
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  useEffect(() => {
    if (!adminKey || !TELEMETRY_URL) return;
    let alive = true;
    const base = TELEMETRY_URL.replace(/\/+$/, '');
    fetch(`${base}/stats?key=${encodeURIComponent(adminKey)}&days=30`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive && d) setAdminStats(d); })
      .catch(() => { /* no worker, no dashboard, and the game carries on */ });
    return () => { alive = false; };
  }, [adminKey]);

  // one handler for the share button that sits in the meters bar on every
  // screen. The functional update keeps it from closing over a stale state
  useEffect(() => {
    if (!booted) { setInviteHandler(null); setInstallHandler(null); setReportHandler(null); return; }
    setInviteHandler(() => setGs(prev => G.openInvite(prev)));
    // the install offer is a sheet rather than a phase, so it can be opened
    // from the middle of anything without losing where the manager was
    setInstallHandler(() => setInstallOpen(true));
    setReportHandler(() => setReportOpen(true));
    return () => { setInviteHandler(null); setInstallHandler(null); setReportHandler(null); };
  }, [booted]);

  // an invite link is read once on load; then the address bar is tidied so a
  // refresh does not look like a second invite
  useEffect(() => {
    // a key stays in the address, right or wrong: the dashboard has to survive
    // a reload, and leaving a wrong one there tells nobody anything either
    if (adminKey) return;
    try {
      if (location.search) history.replaceState(null, '', location.pathname);
    } catch { /* private mode, the link still worked */ }
  }, [ref, adminKey]);

  // persist the career whenever it changes, so closing the tab is not a loss
  useEffect(() => { if (booted) saveCareer(gs); }, [gs, booted]);

  /**
   * The phone's back button, wired to whatever "back" means on this screen.
   *
   * Recomputed every render on purpose: back out of the squad screen goes to the
   * hub, back out of the market might go to the summer board instead, and back
   * during a match must do nothing at all — you do not get to leave a cup final
   * by brushing the wrong part of the phone. Anything with no way back asks
   * before it lets go of him.
   */
  useEffect(() => {
    if (!booted) { setBackHandler(null); return; }
    armBack();
    setBackHandler(() => {
      // sheets first: they sit on top of whatever screen is behind them
      if (ad) { adBack.current?.(); return true; }
      if (reportOpen) { setReportOpen(false); return true; }
      if (exitOpen) { setExitOpen(false); return true; }
      if (installOpen) { setInstallOpen(false); return true; }
      if (gs.phase === 'invite') { setGs(g => G.closeInvite(g)); return true; }

      const back = BACK_TO_HUB.has(gs.phase);
      if (gs.phase === 'squad' && squadFromHub) { setSquadFromHub(false); setGs(g => G.backToHub(g)); return true; }
      if (gs.phase === 'transfers') {
        if (fromPreseason) { setFromPreseason(false); setGs(g => G.backToPreseason(g)); }
        else setGs(g => G.backToHub(g));
        return true;
      }
      if (gs.phase === 'inbox') { setGs(g => G.closeInbox(g)); return true; }
      if (gs.phase === 'chronicle') { setGs(g => G.closeChronicle(g)); return true; }
      if (gs.phase === 'table') { setGs(g => G.closeTable(g)); return true; }
      if (back) { setGs(g => G.backToHub(g)); return true; }

      // nowhere left to go. Ask, rather than vanishing mid career
      setExitOpen(true);
      return false;
    });
    return () => setBackHandler(null);
  }, [booted, gs.phase, squadFromHub, fromPreseason, installOpen, exitOpen, reportOpen, ad]);

  // Every new page starts at the top. The phase alone is not enough: the press
  // room asks two questions and the summer runs three market rounds without it
  // ever changing, and each of those is a new page to whoever is reading it.
  const screenKey = !introDone ? 'intro' : !booted ? 'title'
    : `${gs.phase}|${gs.press?.q.text ?? ''}|${gs.preWeek}`;
  useLayoutEffect(scrollToTop, [screenKey]);

  // The counting, all of it. How many opened the game, and how far each one
  // got before he stopped: the step is read off the state, so no screen has to
  // remember to report and none of this can drift out of date. Nothing he
  // typed is anywhere near it, see game/telemetry.ts.
  useEffect(() => {
    // A visit carrying an admin key is Itzik looking at the numbers, and he
    // will do that several times a day. Counting it would put him in his own
    // funnel and make the daily sittings mostly his.
    if (adminKey) return;
    track('open');
    void flush();
    // and again on the way out, because for most people on a phone there is
    // no later: the tab is switched away from and never comes back
    return flushOnLeaving();
  }, [adminKey]);
  // And the moment the title screen is actually up, which is a different moment
  // from the one above: "open" is reported when the app mounts, and the cold
  // open plays for four and a half seconds before anybody sees a button. The
  // two together split the largest fall in the funnel into the part that is the
  // film's fault and the part that is the title screen's.
  useEffect(() => {
    if (adminKey || !introDone || booted) return;
    track('title');
  }, [adminKey, introDone, booted]);
  useEffect(() => {
    if (!booted || adminKey) return;
    const step = stepFor(gs);
    if (step) track(step);
  }, [booted, adminKey, gs.phase, gs.season, gs.week]);

  // Where careers get to: which division, in which season, and who wins one. Counted from the moment a manager is
  // out in the league, so picking a colour is not an arrival. A career that is carried on from a save reports where
  // it stands the next time it is opened. Numbers only, see game/telemetry.ts.
  useEffect(() => {
    if (!booted || adminKey || !gs.clubId) return;
    const at = stepFor(gs);
    if (at && STEP_ORDER[at] >= STEP_ORDER.season) reached(G.club(gs).tier, gs.season);
  }, [booted, adminKey, gs.clubId, gs.phase, gs.season, gs.clubId && G.club(gs).tier]);
  useEffect(() => {
    if (!booted || adminKey || !gs.clubId) return;
    if (G.wonTheLeague(gs)) wonLeague(G.club(gs).tier);
  }, [booted, adminKey, gs.phase, gs.clubId]);
  useEffect(() => {
    if (!booted || adminKey || !gs.clubId) return;
    if (gs.meters.money < 0) moneyMark('money_red');
    if (G.sackedOverDebt(gs)) moneyMark('money_sack');
  }, [booted, adminKey, gs.clubId, gs.meters.money < 0, gs.sacking]);
  // Europe: drawn in, in the final, lifted it. Nothing while there is no cup, and nothing outside the ליגת העל
  const euroReports = G.euroMarksFor(gs).join(',');
  useEffect(() => {
    if (!booted || adminKey || !gs.clubId) return;
    for (const k of euroReports ? euroReports.split(',') as Array<'eu_in' | 'eu_final' | 'eu_won'> : []) euroMark(k);
  }, [booted, adminKey, gs.clubId, euroReports]);
  // גביע המדינה: drawn in, in the semi, in the final, lifted it. Nothing outside tier 4/5
  const cupReports = G.cupMarksFor(gs).join(',');
  useEffect(() => {
    if (!booted || adminKey || !gs.clubId) return;
    for (const k of cupReports ? cupReports.split(',') as Array<'cup_in' | 'cup_sf' | 'cup_final' | 'cup_won'> : []) cupMark(k);
  }, [booted, adminKey, gs.clubId, cupReports]);
  // the daily gift: how far the run has gone. Each name once a device; with the door shut no run ever begins
  const dailyStreak = gs.daily?.streak ?? 0;
  useEffect(() => {
    if (!booted || adminKey || !gs.clubId) return;
    if (dailyStreak >= 1) dailyMark('daily_1');
    if (dailyStreak >= 7) dailyMark('daily_7');
    if (dailyStreak >= 30) dailyMark('daily_30');
  }, [booted, adminKey, gs.clubId, dailyStreak]);
  // the loyalty gift: the man past ten seasons was signed. Once a device, like the rest
  const giftSigned = !!gs.loyalGift?.playerId;
  useEffect(() => {
    if (!booted || adminKey || !gs.clubId) return;
    if (giftSigned) giftMark('gift10');
  }, [booted, adminKey, gs.clubId, giftSigned]);
  // ONBOARD_V2 (plan section 8): the first live match of a quick-started career kicked off
  useEffect(() => {
    if (!booted || adminKey || !gs.obV2) return;
    if (gs.phase === 'match' && gs.season === 1 && gs.week === 1) obMark('ob_kickoff');
  }, [booted, adminKey, gs.obV2, gs.phase, gs.season, gs.week]);

  function startNew() {
    track('career_new');
    clearCareer();
    setSaved(null);
    const seed = Math.floor(Math.random() * 100000) + 1;
    const fresh = obV2Enabled() ? newGameV2(seed) : G.newGame(seed);
    setGs(ref ? G.acceptInvite(fresh, ref) : fresh);
    setBooted(true);
  }

  /** open the saved career, optionally straight onto a screen (the cabinet from the weekend's champion card) */
  function bootCareer(open?: (g: G.GameState) => G.GameState) {
    let loaded = loadCareer();
    // a prize fetched while the career was not open comes in now, once; it stays on the phone only if there was no
    // career to take it (25.10: it used to be dropped whatever happened)
    const pending = weekendLocal().pendingPrize;
    if (loaded && pending) {
      const r = G.resolvePending(loaded, pending);
      if (r.gs !== loaded) { loaded = r.gs; saveCareer(loaded); }
      if (!r.keep) setWeekendLocal({ pendingPrize: null });
    }
    if (loaded) setGs(open ? open(loaded) : loaded);
    setBooted(true);
  }
  function continueCareer() { bootCareer(); }

  if (adminStats) {
    return <div className="frame"><AdminScreen stats={adminStats} /></div>;
  }

  if (!introDone) {
    return (
      <div className="frame">
        <IntroCinematic onDone={() => setIntroDone(true)} />
      </div>
    );
  }

  if (!booted && weekendOpen && weekendOn(wkNow)) {
    return (
      <div className="frame">
        <WeekendRoot saved={saved} career={careerView} onBack={() => setWeekendOpen(false)} onPrize={applyWeekendPrize}
          onCabinet={careerView ? () => { setWeekendOpen(false); bootCareer(G.openCoach); } : undefined} />
      </div>
    );
  }

  if (!booted) {
    return (
      <div className="frame">
        <>
          <TitleScreen saved={saved} onNew={startNew} onContinue={continueCareer} onInstall={() => setInstallOpen(true)}
            extra={weekendOn(wkNow) ? <WeekendEntry hasCareer={!!saved} onOpen={() => setWeekendOpen(true)} /> : undefined} />
          {installOpen && <InstallSheet onClose={() => setInstallOpen(false)} />}
        </>
      </div>
    );
  }

  return (
    <div className="frame" data-stage={gs.phase === 'euro-match' || gs.phase === 'euro-pens' || gs.phase === 'euro-draw' || gs.phase === 'euro-bracket' ? 'euro' : gs.phase === 'cup-match' || gs.phase === 'cup-pens' || gs.phase === 'cup-draw' || gs.phase === 'cup-bracket' ? 'cup' : undefined}>
      {gs.phase === 'onboard-archetype' && (
        <ArchetypeScreen gs={gs} onPick={id => setGs(G.setArchetype(gs, id))} />
      )}
      {gs.phase === 'onboard-manager' && (
        <OnboardManager gs={gs} onDone={p => setGs(G.setProfile(gs, p))} />
      )}
      {gs.phase === 'onboard-club' && (
        <OnboardClub gs={gs} onPick={(city, kit, pattern) => setGs(G.pickCity(gs, city, kit, pattern))} />
      )}
      {gs.phase === 'ob-prologue' && (
        <Suspense fallback={<div className="ob-frame ob-full" style={{ background: 'var(--ob-night-grad)' }} />}>
          <Prologue onDone={choice => setGs(toObCity(gs, choice))} />
        </Suspense>
      )}
      {gs.phase === 'ob-city' && (
        <ObCityScreen onDone={(city, name) => setGs(quickStart(gs, city, name || undefined))} />
      )}
      {gs.phase === 'signing' && (
        <SigningScreen gs={gs} onDone={effect => setGs(G.afterSigning(gs, effect))} />
      )}
      {gs.phase === 'friends' && (
        <FriendsScreen gs={gs} onDone={specs => setGs(G.addFriends(gs, specs))} />
      )}
      {gs.phase === 'squad' && (
        <SquadScreen gs={gs} firstTime={!squadFromHub}
          onSwap={(a, b) => setGs(g => G.swapPlayers(g, a, b))}
          onMove={(a, b) => setGs(g => G.movePlayers(g, a, b))}
          onFormation={id => setGs(g => G.setTactic(g, { ...g.tactic, formation: id }))}
          onPart={(id, kind) => setGs(g => G.partWays(g, id, kind))}
          onSell={id => setGs(g => G.sellPlayer(g, id))}
          onDone={() => {
            if (squadFromHub) { setGs(G.backToHub(gs)); setSquadFromHub(false); }
            else setGs(G.enterPreseason(gs));
          }} />
      )}
      {gs.phase === 'preseason-market' && (
        <PreSeasonMarket gs={gs} firstCareer={gs.season === 1}
          onOpenMarket={line => { setFromPreseason(true); setGs(G.openTransfers(gs, line ?? null)); }}
          onResolveDeparture={(kind, oi) => setGs(g => G.resolveDeparture(g, kind, oi))}
          onRenew={id => setGs(g => G.renewContract(g, id))}
          onRelease={id => setGs(g => G.releasePlayer(g, id))}
          onDismissOutcome={() => setGs(G.clearPreseasonOutcome(gs))}
          onTakeCourse={how => setGs(g => G.takeCourse(g, how))}
          onAdvance={() => {
            setGs(G.advancePreseason(gs));
          }} />
      )}
      {gs.phase === 'transfers' && (
        <TransfersScreen gs={gs}
          onSign={id => setGs(g => G.signPlayer(g, id))}
          onSell={id => setGs(g => G.sellPlayer(g, id))}
          onBack={() => {
            if (fromPreseason) { setFromPreseason(false); setGs(G.backToPreseason(gs)); }
            else setGs(G.backToHub(gs));
          }} />
      )}
      {gs.phase === 'hub' && gs.notices.length > 0 && (
        <NoticeScreen gs={gs}
          onDismiss={() => setGs(g => G.dismissNotice(g))}
          onSquad={() => { setSquadFromHub(true); setGs(g => G.openSquad(G.dismissNotice(g))); }}
          onYouth={() => setGs(g => G.openYouth(G.dismissNotice(g)))}
          onTransfers={() => setGs(g => G.openTransfers(G.dismissNotice(g)))} />
      )}
      {/* the loyalty gift: told once on the hub, then the pack's own ceremony with the man on loan */}
      {gs.phase === 'hub' && gs.notices.length === 0 && G.loyalGiftDue(gs) && (
        <LoyalGift gs={gs} onOpen={() => setGs(g => G.openLoyalGift(g))} />
      )}
      {gs.phase === 'hub' && gs.pull && gs.loyalGift && gs.loyalGift.playerId === null && (
        <PackReveal pull={gs.pull} club={G.club(gs)} squadFull={false} standing={null} loan
          onSign={() => setGs(g => G.signLoyalGift(g))} onSell={() => undefined} />
      )}
      {/* the daily gift: today's gift lit and pressable, then the celebration, then the pack or the gold player if there is one */}
      {DAILY_LIVE && gs.phase === 'hub' && gs.notices.length === 0 && dailyOpen && !dailyWow && (
        <DailyGiftSheet gs={gs} onClose={() => setDailyOpen(false)}
          onClaim={() => {
            const v = G.dailyViewOf(gs);
            const next = G.claimDaily(gs);
            if (next === gs) return;
            setGs(next);
            setDailyWow({ reward: v.reward, streak: v.nextStreak, gold: v.nextStreak % GOLD_EVERY === 0 });
          }} />
      )}
      {dailyWow && (
        <DailyClaim reward={dailyWow.reward} streak={dailyWow.streak} gold={dailyWow.gold}
          onDone={() => { setDailyWow(null); if (gs.pull) setDailyOpen(false); }} />
      )}
      {gs.phase === 'hub' && gs.pull && !dailyWow && !(gs.loyalGift && gs.loyalGift.playerId === null) && (
        <PackReveal pull={gs.pull} club={G.club(gs)} squadFull={G.squadSize(gs) >= G.MAX_SQUAD} standing={null}
          onSign={() => setGs(g => G.signPull(g))} onSell={() => setGs(g => G.sellPull(g))} />
      )}
      {gs.phase === 'hub' && gs.notices.length === 0 && (
        <Hub gs={gs}
          onDaily={() => setDailyOpen(true)}
          onStart={() => setGs(G.startWeek(gs))}
          onSquad={() => { setSquadFromHub(true); setGs(G.openSquad(gs)); }}
          onTransfers={() => setGs(G.openTransfers(gs))}
          onChronicle={() => setGs(G.openChronicle(gs))}
          onCaptain={() => setGs(G.openCaptain(gs))}
          onAssistant={() => setGs(G.openAssistant(gs))}
          onInbox={() => setGs(G.openInbox(gs))}
          onStadium={() => setGs(G.openStadium(gs))}
          onPacks={() => setGs(G.openPacks(gs))}
          onCoach={() => setGs(G.openCoach(gs))}
          onYouth={() => setGs(G.openYouth(gs))}
          onScout={() => setGs(G.openScout(gs))}
          onEuro={() => setGs(G.startEuroNight(gs))}
          onEuroDraw={() => setGs(G.openEuroDraw(gs))}
          onEuroBracket={() => setGs(G.openEuroBracket(gs))}
          onCup={() => setGs(G.startCupNight(gs))}
          onCupDraw={() => setGs(G.openCupDraw(gs))}
          onCupBracket={() => setGs(G.openCupBracket(gs))}
          onTable={() => setGs(G.openTable(gs))} />
      )}
      {gs.phase === 'youth-decision' && (
        <YouthDecisionScreen gs={gs}
          onSign={id => setGs(g => G.signGraduate(g, id))}
          onRelease={id => setGs(g => G.releaseGraduate(g, id))}
          onReleaseRest={() => setGs(g => G.releaseUnrecommended(g))}
          onFinish={() => setGs(g => G.finishYouthDecision(g))} />
      )}
      {gs.phase === 'scout' && (
        <ScoutScreen gs={gs}
          onHire={(style, position) => setGs(g => G.hireScout(g, style, position))}
          onSign={() => setGs(g => G.signScoutOffer(g))}
          onBack={() => setGs(G.backToHub(gs))} />
      )}
      {gs.phase === 'youth' && YOUTH_V2 && (
        <AcademyScreen gs={gs}
          onPromote={id => setGs(g => G.promoteYouth(g, id))}
          onRelease={id => setGs(g => G.releaseYouth(g, id))}
          onCallUp={id => setGs(g => G.callUpYouth(g, id))}
          onUndoCallUp={id => setGs(g => G.undoCallUp(g, id))}
          onSign={id => setGs(g => G.signYouthKid(g, id))}
          onTrip={() => setGs(g => G.youthScoutTrip(g))}
          onBack={() => setGs(G.backToHub(gs))} />
      )}
      {gs.phase === 'youth' && !YOUTH_V2 && (
        <YouthScreen gs={gs}
          onPromote={id => setGs(g => G.promoteYouth(g, id))}
          onRelease={id => setGs(g => G.releaseYouth(g, id))}
          onRegister={id => setGs(g => G.registerYouthEmergency(g, id))}
          onBack={() => setGs(G.backToHub(gs))} />
      )}
      {gs.phase === 'stadium' && (
        <StadiumScreen gs={gs}
          onBuild={key => setGs(g => G.startStadiumProject(g, key))}
          onBack={() => setGs(G.backToHub(gs))} />
      )}
      {gs.phase === 'coach' && (
        <CoachScreen gs={gs} onBack={() => setGs(G.backToHub(gs))} onReport={() => setReportOpen(true)} />
      )}
      {gs.phase === 'packs' && (
        <PacksScreen gs={gs}
          onWatchAd={() => { if (G.adsOffered(gs) > 0) setAd({ ad: pickAd({ ...gs, sponsorAd: G.sponsorAdId(gs) }), key: Date.now() }); }}
          onBuy={id => setGs(g => G.buyPack(g, id))}
          onSign={() => setGs(g => G.signPull(g))}
          onSell={() => setGs(g => G.sellPull(g))}
          onBack={() => setGs(G.backToHub(gs))} />
      )}
      {gs.phase === 'inbox' && (
        <InboxScreen gs={gs}
          onAnswer={(item, opt) => setGs(g => G.answerInbox(g, item, opt))}
          onDismissOutcome={() => setGs(G.clearInboxOutcome(gs))}
          onBack={() => setGs(G.closeInbox(gs))} />
      )}
      {gs.phase === 'chronicle' && (
        <ChronicleScreen gs={gs} onBack={() => setGs(G.closeChronicle(gs))} />
      )}
      {gs.phase === 'captain' && (
        <CaptainScreen gs={gs} onSet={id => setGs(G.setCaptain(gs, id))} onBack={() => setGs(G.backToHub(gs))} />
      )}
      {gs.phase === 'assistant' && (
        <AssistantScreen gs={gs}
          onHire={() => setGs(G.hireAssistant(gs))}
          onFire={() => setGs(G.fireAssistant(gs))}
          onBack={() => setGs(G.backToHub(gs))} />
      )}
      {gs.phase === 'dilemma' && (gs.dilemma?.image
        ? <FixOfferScreen gs={gs} onChoose={i => setGs(G.chooseDilemma(gs, i))} onContinue={() => setGs(G.toTactic(gs))} />
        : <DilemmaChat gs={gs}
            onChoose={i => setGs(G.chooseDilemma(gs, i))}
            onContinue={() => setGs(G.toTactic(gs))} />)}
      {gs.phase === 'tactic' && (
        <TacticScreen gs={gs}
          onSet={t => setGs(G.setTactic(gs, t))}
          onGo={() => setGs({ ...gs, phase: 'teamsheet' })} />
      )}
      {gs.phase === 'teamsheet' && (
        <TeamsheetScreen gs={gs}
          onGo={() => setGs(g => G.sendTeamsheet(g))}
          onSwap={(a, b) => setGs(g => G.swapPlayers(g, a, b))}
          onMove={(a, b) => setGs(g => G.movePlayers(g, a, b))} />
      )}
      {gs.phase === 'match' && gs.fix?.stage === 'agreed' && (
        <FixedMatchScreen gs={gs} onDone={result => setGs(G.commitRound(gs, result))} />
      )}
      {gs.phase === 'match' && gs.fix?.stage !== 'agreed' && (
        <MatchBroadcast gs={gs} onDone={result => setGs(G.commitRound(gs, result))}
          onHalfTime={gs.season === 1 && gs.week === 1 && !adminKey ? () => track('match1_half') : undefined} />
      )}
      {gs.phase === 'fix-verdict' && <FixVerdictScreen gs={gs} onResolve={() => setGs(G.resolveFix(gs))} />}
      {gs.phase === 'friendly' && <FriendlyScreen gs={gs} onDone={() => setGs(g => G.finishFriendly(g))} />}
      {gs.phase === 'euro-match' && (
        <MatchBroadcast gs={gs} live={G.euroMatchInput(gs)} clubs={G.euroMatchClubs(gs)} euroLines={G.euroEntranceLines(gs)} flare={null} doneLabel="סיום הערב"
          onDone={(result, ids) => setGs(G.commitEuroLeg(gs, result, ids))} />
      )}
      {gs.phase === 'euro-pens' && <ShootoutScreen gs={gs} comp="euro" onDone={score => setGs(g => G.finishEuroPens(g, score))} />}
      {gs.phase === 'euro-draw' && <EuroDrawScreen gs={gs} onDone={() => setGs(g => G.finishEuroDraw(g))} />}
      {gs.phase === 'euro-bracket' && <EuroBracketScreen gs={gs} onBack={() => setGs(G.backToHub(gs))} />}
      {gs.phase === 'cup-match' && (
        <MatchBroadcast gs={gs} comp="cup" live={G.cupMatchInput(gs)} clubs={G.cupMatchClubs(gs)} euroLines={G.cupEntranceLines(gs)} flare={null} doneLabel="סיום הערב"
          onDone={(result, ids) => setGs(G.commitCupLeg(gs, result, ids))} />
      )}
      {gs.phase === 'cup-pens' && <ShootoutScreen gs={gs} comp="cup" onDone={score => setGs(g => G.finishCupPens(g, score))} />}
      {gs.phase === 'cup-draw' && <CupDrawScreen gs={gs} onDone={() => setGs(g => G.finishCupDraw(g))} />}
      {gs.phase === 'cup-bracket' && <CupBracketScreen gs={gs} onBack={() => setGs(G.backToHub(gs))} />}
      {gs.phase === 'result' && <ResultScreen gs={gs} onContinue={() => setGs(G.continueFromResult(gs))} />}
      {gs.phase === 'press' && <PressScreen key={gs.press?.q.text} gs={gs} onPick={i => setGs(g => G.pickPressAnswer(g, i))} onNext={() => setGs(g => G.continuePress(g))} />}
      {gs.phase === 'chat' && <ChatScreen gs={gs} onDone={() => setGs(G.closeChat(gs))} onAnswer={i => setGs(g => G.answerMateChat(g, i))} />}
      {installOpen && <InstallSheet onClose={() => setInstallOpen(false)} />}
      {exitOpen && <ExitSheet onStay={() => setExitOpen(false)} onLeave={() => { setExitOpen(false); leaveGame(); }} />}
      {reportOpen && <ReportSheet gs={gs} onClose={() => setReportOpen(false)} onFiled={next => setGs(next)} />}
      {ad && (
        <AdPlayer key={ad.key} ad={ad.ad} gems={gs.gems} left={G.adsLeft(gs)} backRef={adBack}
          onComplete={() => setGs(g => G.watchAdForGem(g))}
          onClose={() => setAd(null)}
          onRetry={() => setAd({ ad: pickAd({ ...gs, sponsorAd: G.sponsorAdId(gs) }), key: Date.now() })} />
      )}
      {gs.phase === 'invite' && (
        <InviteScreen gs={gs}
          onRedeem={code => {
            const r = G.redeemThanks(gs, code);
            if (r.ok) setGs(r.gs);
            return { ok: r.ok, message: r.message };
          }}
          onBack={() => setGs(G.closeInvite(gs))} />
      )}
      {gs.phase === 'table' && <StandingsScreen gs={gs} onBack={() => setGs(G.closeTable(gs))} />}
      {gs.phase === 'season-end' && <SeasonEnd gs={gs} onContinue={() => setGs(G.startNextSeason(gs))} />}
      {gs.phase === 'ultimatum' && <UltimatumScreen gs={gs} onGo={() => setGs(G.advancePastPress(gs))} />}
      {gs.phase === 'sacked' && <SackedScreen gs={gs} onNext={() => setGs({ ...gs, phase: 'rescue' })} />}
      {gs.phase === 'rescue' && <RescueScreen gs={gs} onTake={() => setGs(G.takeRescue(gs))} onWalkAway={startNew} />}
      {gs.phase === 'kit' && <KitReveal gs={gs} onDone={() => setGs(G.closeKitReveal(gs))} />}
      {gs.phase === 'sponsor' && <SponsorScreen gs={gs} onPick={(id, brand) => setGs(G.takeSponsor(gs, id, brand))} />}
      {gs.phase === 'preseason' && <PreSeasonScreen gs={gs} onStart={() => setGs(G.enterPreseason(gs))} />}

      {/* the first-week explainer, owed by the save rather than by a click: it
          used to hang off the step out of the summer, and the sponsor screen
          added between the two meant it never showed again */}
      {G.tutorialDue(gs) && <Tutorial onDone={() => setGs(g => G.markTutorialSeen(g))} />}
    </div>
  );
}

