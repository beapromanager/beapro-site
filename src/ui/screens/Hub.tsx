import { useEffect, useRef, useState } from 'react';
import * as G from '../../game/state.ts';
import { ROUND_NAMES, EURO_LIVE } from '../../game/euro.ts';
import type { EuroNight } from '../../game/euro.ts';
import { CUP_LIVE } from '../../game/cup.ts';
import type { CupNight } from '../../game/cup.ts';
import { asset } from '../asset.ts';
import { useAssetsReady } from '../assetReady.ts';
import { euroClub, asClub } from '../../data/europeClubs.ts';
import { LEAGUE_NAMES, isDerby } from '../../data/clubs.ts';
import type { Club } from '../../data/clubs.ts';
import { Meters } from '../components/bits.tsx';
import { Crest } from '../components/Crest.tsx';
import { Kit } from '../components/Kit.tsx';
import { homeKit } from '../../data/kits.ts';
import { Icon } from '../components/Icon.tsx';
import type { IconName } from '../components/Icon.tsx';
import { MiniTable } from './Table.tsx';
import { FanNote } from '../components/FanNote.tsx';
import { Feed } from '../components/Feed.tsx';
import { Gem } from '../components/Gem.tsx';
import { PACKS } from '../../game/packs.ts';
import { DAILY_LIVE } from '../../game/daily.ts';
import { DailyHubCard } from './DailyGift.tsx';
import { AcademyHubCard } from './Academy.tsx';
import { YOUTH_V2 } from '../../game/academy.ts';
import { SCOUT_LIVE, SCOUT_TEXT } from '../../game/scout.ts';
import { TransferBanner } from '../components/TransferUi.tsx';

/**
 * The home screen.
 *
 * It used to be nine full width tiles stacked down two and a half phone
 * screens, every one of them an icon, a bold title, a grey sentence explaining
 * itself, and a chevron. Everything weighed the same, so nothing read as
 * important, the explaining sentences were the "too much text" you felt, and
 * the one button that starts the round sat at the very bottom, past everything.
 *
 * Now it answers three questions in order, and only those:
 *
 *   what am I playing for   the goal strip, a ladder and one sentence
 *   who is next             the match hero, with the button to go inside it
 *   what else is there      one grid of eight, a word each, a dot when it needs you
 *
 * Everything a room used to say about itself in a sentence is now either a
 * badge or gone. The story (the fans, the timeline, the table) sits underneath
 * for whoever wants it, and the button follows you down the page so the next
 * round is never more than one tap away.
 */

export function Hub({ gs, onStart, onSquad, onTransfers, onChronicle, onCaptain, onAssistant, onInbox, onStadium, onPacks, onCoach, onTable, onYouth, onScout, onEuro, onEuroDraw, onEuroBracket, onCup, onCupDraw, onCupBracket, onDaily }: {
  gs: G.GameState; onStart: () => void; onSquad: () => void; onTransfers: () => void; onEuro: () => void;
  onEuroDraw: () => void; onEuroBracket: () => void; onDaily?: () => void;
  onCup: () => void; onCupDraw: () => void; onCupBracket: () => void;
  onChronicle: () => void; onCaptain: () => void; onAssistant: () => void; onInbox: () => void;
  onStadium: () => void; onPacks: () => void; onCoach: () => void; onTable: () => void; onYouth: () => void; onScout: () => void;
}) {
  const c = G.club(gs);
  const fx = G.playerFixture(gs);
  const rivalId = fx ? (fx.homeId === gs.clubId ? fx.awayId : fx.homeId) : null;
  const rival = gs.league.clubs.find(x => x.id === rivalId);
  const iAmHome = fx?.homeId === gs.clubId;
  const derby = fx ? isDerby(fx.homeId, fx.awayId) : false;
  const goal = G.seasonGoal(gs);
  const win = G.transferWindow(gs);
  const gate = G.stadiumGate(gs);
  const cheapest = Math.min(...PACKS.map(p => p.cost));
  const books = G.debt(gs);
  const hero = useRef<HTMLDivElement>(null);
  const night = G.euroNight(gs);
  const pensDue = G.euroPensDue(gs);
  const drawDue = G.euroDrawDue(gs);
  const cupNight = G.cupNight(gs);
  const cupPensDue = G.cupPensDue(gs);
  const cupDrawDue = G.cupDrawDue(gs);
  const cupWaiting = !cupNight && G.cupWaiting(gs);
  // a cup night this week or its pens block the league round exactly like Europe's own. The staged entrant's wait does
  // NOT: nothing is owed in those weeks, the pre-bracket is played for him inside startWeek, and a button that waits for
  // the round which waits for the button is a dead end (24.10, weeks 1 to 4 of the champion in Europe)
  const cupBlocking = !!cupNight || cupPensDue;

  return (
    <>
      <Meters {...gs.meters} gems={gs.gems} />
      {/* the cup day banner: unmissable at the top of the home page, so a cup day never reads as a normal round (ב.8) */}
      {(cupNight || cupPensDue || cupDrawDue) && <CupDayBanner />}
      <div className="screen pad stack hub-pad" style={{ gap: 14 }}>
        {/* who you are, one line, no biography */}
        <div className="row" style={{ marginTop: 2, gap: 11 }}>
          <Crest club={c} size={44} />
          {/* crest and shirt together, which is how a club is recognised */}
          <Kit kit={homeKit(c)} size={30} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, lineHeight: 1.15 }}>{c.name}</div>
            <div style={{ fontSize: 14, color: 'var(--ink-faint)', fontWeight: 600, marginTop: 3 }}>
              {LEAGUE_NAMES[c.tier]} · מחזור <span className="num">{gs.week}/{gs.league.rounds}</span>
            </div>
          </div>
          <Form form={gs.form} />
        </div>

        <GoalStrip gs={gs} goal={goal} onPress={onTable} />

        {/* the move to beapro.co.il, on the old address only, and never on a night that has to be played first */}
        {!night && !pensDue && !cupBlocking && <TransferBanner where="hub" />}

        <div ref={hero}>
          {drawDue && <EuroDrawCard onGo={onEuroDraw} />}
          {night && <EuroHero night={night} onGo={onEuro} />}
          {!night && pensDue && <EuroPensCard gs={gs} onGo={onEuro} />}
          {cupDrawDue && <CupDrawCard onGo={onCupDraw} />}
          {cupNight && <CupHero gs={gs} night={cupNight} onGo={onCup} />}
          {!cupNight && cupPensDue && <CupPensCard gs={gs} onGo={onCup} />}
          {!cupNight && !cupPensDue && cupWaiting && <CupWaitingCard />}
          <MatchHero club={c} rival={rival} iAmHome={!!iAmHome} derby={derby} gs={gs} onStart={onStart} waiting={!!night || pensDue || cupBlocking} waitingLabel={night || pensDue ? 'קודם הערב האירופי' : 'קודם ערב הגביע'} />
        </div>

        {DAILY_LIVE && onDaily && <DailyHubCard gs={gs} onOpen={onDaily} />}

        {books.level !== 'clear' && <DebtStrip d={books} outlook={G.purseOutlook(gs)} onClick={onTransfers} />}

        {gs.inbox.length > 0 && <InboxStrip count={gs.inbox.length} onClick={onInbox} />}

        {YOUTH_V2 && <AcademyHubCard gs={gs} onOpen={onYouth} />}

        {/* every room in the club, a word each */}
        <div className="hub-grid stagger">
          <Cell i={0} icon="shirt" label="הסגל" onClick={onSquad} count={`${G.squadSize(gs)} · ${gs.tactic.formation}`} />
          <Cell i={1} icon="handshake" label="העברות" onClick={onTransfers}
            dot={win.open ? 'var(--win)' : undefined} />
          <Cell i={2} label="חבילות" onClick={onPacks} glyph={<Gem size={21} />}
            dot={gs.gems >= cheapest || G.adsLeft(gs) > 0 ? 'var(--gold)' : undefined} />
          <Cell i={3} icon="flag" label="אצטדיון" onClick={onStadium}
            dot={gate && !gate.meets && !gs.stadium.project ? 'var(--loss)' : gs.stadium.project ? 'var(--gold)' : undefined} />
          <Cell i={4} icon="clipboard" label="המאמן" onClick={onCoach}
            dot={G.courseRequired(gs) ? 'var(--loss)' : undefined} />
          <Cell i={5} icon="star" label="קפטן" onClick={onCaptain}
            dot={G.captain(gs) ? undefined : 'var(--gold)'} />
          <Cell i={6} icon="mic" label="עוזר" onClick={onAssistant}
            dot={G.assistantActive(gs) ? undefined : 'var(--gold)'} />
          <Cell i={7} icon="trophy" label="כרוניקה" onClick={onChronicle}
            badge={G.unreadChronicle(gs) || undefined} />
          {!YOUTH_V2 && <Cell i={8} icon="star" label="נוער" onClick={onYouth}
            dot={gs.youth.players.some(p => p.age >= 18) ? 'var(--gold)' : undefined} />}
          {SCOUT_LIVE && G.scoutAvailable(gs) && (
            <Cell i={9} icon="target" label={SCOUT_TEXT.door} onClick={onScout}
              dot={G.scoutDot(gs) ? 'var(--loss)' : gs.scout.offer ? 'var(--win)' : undefined} blink={G.scoutDot(gs)} />
          )}
          {EURO_LIVE && gs.euro && (
            <Cell i={10} icon="trophy" label="אירופה" onClick={onEuroBracket} dot={gs.euro.status === 'on' ? 'var(--euro, #6FA8FF)' : undefined} />
          )}
          {CUP_LIVE && gs.cup && (
            <Cell i={11} icon="trophy" label="גביע המדינה" onClick={onCupBracket} dot={(gs.cup.status === 'on' || gs.cup.status === 'waiting') ? 'var(--cup, #D98A3D)' : undefined} />
          )}
        </div>

        <FanNote msg={G.fanNote(gs, 'pre')} />

        <Feed posts={G.clubFeed(gs)} />

        {/* the table opens the full one, so it does not need a row of its own */}
        <button className="hub-table" onClick={onTable} aria-label="הליגה המלאה">
          <div className="row" style={{ justifyContent: 'space-between', padding: '0 2px 8px' }}>
            <span className="label-cap">הטבלה</span>
            <span className="row" style={{ gap: 4, fontSize: 12.5, color: 'var(--ink-faint)', fontWeight: 700 }}>
              הליגה המלאה <Icon name="chevron" size={14} />
            </span>
          </div>
          <MiniTable gs={gs} highlight={gs.clubId} rows={5} />
        </button>
      </div>

      {!G.weekBlockedReason(gs) && !night && !pensDue && !cupBlocking && <StickyStart hero={hero} onStart={onStart} rival={rival?.short} />}
    </>
  );
}

/* ---------------------------------------------------------------- the goal */

/**
 * What the season is for, as a ladder. The promotion places are gold, the drop
 * is red, and your rung is the one that is lit. Reading a position out of a
 * table takes a beat; seeing where you stand on a ladder takes none.
 */
/**
 * The strip is a door to the table, and it used to look like a label: nobody
 * pressed it. Now it shows the three rows that matter (the club above, you,
 * the club below, with points) and says where it leads, so it reads as a thing
 * with more inside rather than a sentence.
 */
function GoalStrip({ gs, goal, onPress }: { gs: G.GameState; goal: G.SeasonGoal; onPress: () => void }) {
  const tone = goal.zone === 'promo' ? 'var(--gold)' : goal.zone === 'drop' ? 'var(--loss)' : 'var(--ink-dim)';
  const table = G.sortedTable(gs.league);
  const i = Math.max(0, table.findIndex(s => s.clubId === gs.clubId));
  const rows = [table[i - 1], table[i], table[i + 1]].filter(Boolean).map(s => ({
    pos: table.indexOf(s) + 1,
    name: gs.league.clubs.find(c => c.id === s.clubId)?.short ?? '',
    pts: s.pts,
    me: s.clubId === gs.clubId,
  }));
  return (
    <button className="goal" onClick={onPress} style={{ '--tone': tone } as React.CSSProperties} aria-label="המטרה, לחץ לטבלה המלאה">
      <div className="row" style={{ justifyContent: 'space-between', gap: 10 }}>
        <span className="label-cap">המטרה · {goal.target}</span>
        <span className="goal-pos">
          {/* the fraction is isolated LTR, otherwise bidi reorders it to 8/1 */}
          מקום <span className="num goal-frac"><b>{goal.pos}</b>/{goal.teams}</span>
        </span>
      </div>
      <div className="goal-ladder" aria-hidden="true">
        {Array.from({ length: goal.teams }, (_, i) => {
          const p = i + 1;
          // the bottom division has nowhere to fall to, so nothing is painted red
          const kind = goal.up && p <= 2 ? 'up' : goal.down && p === goal.teams ? 'down' : 'mid';
          return <span key={p} data-k={kind} data-me={p === goal.pos ? '1' : '0'} />;
        })}
      </div>
      <div className="goal-line">{goal.line}</div>
      {goal.played > 0 && (
        <div className="goal-rows">
          {rows.map(r => (
            <div key={r.pos} className="goal-row" data-me={r.me ? '1' : '0'}>
              <span className="num goal-row-pos">{r.pos}</span>
              <span className="goal-row-name">{r.name}</span>
              <span className="num goal-row-pts">{r.pts} נק׳</span>
            </div>
          ))}
        </div>
      )}
      <div className="goal-more">
        <span>הטבלה המלאה, הפורם והשערים</span>
        <Icon name="chevron" size={15} />
      </div>
    </button>
  );
}

/** The last five, newest on the outside edge. Five dots, no legend needed. */
function Form({ form }: { form: ('W' | 'D' | 'L')[] }) {
  if (!form.length) return null;
  const last = form.slice(-5);
  return (
    <div className="form-dots" aria-label={`חמשת המשחקים האחרונים: ${last.join(' ')}`}>
      {last.map((r, i) => <span key={i} data-r={r} />)}
    </div>
  );
}

/* --------------------------------------------------------------- the match */

/**
 * The one thing the manager came here to do. It gets the space, the crests and
 * the button, and nothing above it competes for the eye.
 */
function MatchHero({ club, rival, iAmHome, derby, gs, onStart, waiting, waitingLabel }: {
  club: Club; rival: Club | undefined; iAmHome: boolean; derby: boolean;
  gs: G.GameState; onStart: () => void;
  /** the European night is still to be played: the league waits for it */
  waiting?: boolean;
  /** what the held button says: the European night or the cup night that comes first (21.10: a cup week said the European one) */
  waitingLabel?: string;
}) {
  if (!rival) {
    return (
      <div className="tile" style={{ textAlign: 'center', padding: 22 }}>
        <div className="sub">אין משחק השבוע</div>
      </div>
    );
  }
  const table = G.sortedTable(gs.league);
  const posOf = (id: string) => table.findIndex(s => s.clubId === id) + 1;
  // the man on loan: how many league rounds he has left, said before every round
  const sqd = G.mySquad(gs);
  const loaned = [...sqd.starters, ...sqd.bench].filter(p => G.isOnLoan(gs, p.id));
  // a banned man in the eleven, or a sheet short of sixteen names, and the
  // round does not start. The reason sits where the button was
  const blocked = G.weekBlockedReason(gs);
  return (
    <div className="match-hero">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="label-cap">המשחק הבא</span>
        {derby
          ? <span className="chip chip-derby">דרבי</span>
          : <span className="chip chip-quiet">{iAmHome ? 'בית' : 'חוץ'}</span>}
      </div>

      <div className="row" style={{ justifyContent: 'space-between', gap: 8 }}>
        <Side club={club} pos={posOf(club.id)} />
        <span className="match-vs">VS</span>
        <Side club={rival} pos={posOf(rival.id)} />
      </div>

      {loaned.map(p => (
        <div key={p.id} className="loan-strip">
          <span><b>{p.name}</b> מושאל אצלך</span>
          <span className="loan-left">נשארו <span className="num">{G.loanLeft(gs, p.id)}</span> משחקי ליגה</span>
        </div>
      ))}

      {blocked ? (
        <div style={{ marginTop: 14 }}>
          <div className="chip" style={{ background: 'rgba(226,72,77,.16)', color: 'var(--loss)', display: 'inline-flex', marginBottom: 8 }}>הסגל לא בסדר</div>
          <p className="hint" style={{ margin: 0, color: 'var(--ink)' }}>{blocked}</p>
          <button className="btn dark" style={{ marginTop: 10, opacity: .6 }} disabled>
            <Icon name="whistle" size={18} /> יוצאים למחזור
          </button>
        </div>
      ) : waiting ? (
        <button className="btn dark" style={{ marginTop: 16, opacity: .6 }} disabled>
          <Icon name="whistle" size={18} /> {waitingLabel ?? 'קודם הערב האירופי'}
        </button>
      ) : (
        <button className="btn" style={{ marginTop: 16 }} onClick={onStart}>
          <Icon name="whistle" size={18} /> יוצאים למחזור
        </button>
      )}
    </div>
  );
}

/**
 * A European night this week. It sits above the league card because it is
 * played first, on the Wednesday, and the league round waits for it. Blue and
 * silver, so the eye knows at once this is not the league.
 */
function EuroHero({ night, onGo }: { night: EuroNight; onGo: () => void }) {
  const opp = euroClub(night.oppId);
  if (!opp) return null;
  const legLine = night.host === null ? 'הגמר, מגרש ניטרלי'
    : night.leg === 0 ? (night.host ? 'משחק ראשון, בבית' : 'משחק ראשון, בחוץ')
    : (night.host ? 'המשחק החוזר, בבית' : 'המשחק החוזר, בחוץ');
  const [a, b] = night.tie.legs[0] ?? [];
  const firstLeg = night.leg === 1 && night.tie.legs[0]
    ? (night.tie.a === opp.id ? `${b}:${a}` : `${a}:${b}`) : null;
  return (
    <div className="match-hero" data-euro="1">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="label-cap" style={{ color: 'var(--euro, #6FA8FF)' }}>ערב אירופי</span>
        <span className="chip chip-euro">{ROUND_NAMES[night.round]}</span>
      </div>
      <div className="row" style={{ gap: 12, alignItems: 'center' }}>
        <Crest club={asClub(opp)} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 15.5, lineHeight: 1.2 }}>{opp.name}</b>
          <div className="sub" style={{ fontSize: 13 }}>{opp.city}, {opp.country} · {legLine}</div>
          {firstLeg && <div className="sub" style={{ fontSize: 13 }}>במשחק הראשון <span className="num">{firstLeg}</span></div>}
        </div>
      </div>
      <p className="hint" style={{ margin: '12px 0 0' }}>משחק הליגה של השבוע אחרי הערב הזה.</p>
      <button className="btn" style={{ marginTop: 12 }} onClick={onGo}>
        <Icon name="whistle" size={18} /> יוצאים לערב האירופי
      </button>
    </div>
  );
}

/** The draw was made in the summer; the ceremony is owed once. */
function EuroDrawCard({ onGo }: { onGo: () => void }) {
  return (
    <div className="match-hero" data-euro="1">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="label-cap" style={{ color: 'var(--euro, #6FA8FF)' }}>ליגת אירופה</span>
        <span className="chip chip-euro">ההגרלה</span>
      </div>
      <p className="hint" style={{ margin: 0 }}>האליפות פתחה את הדלת. שישה עשר כדורים בקערה, ואתם אחד מהם.</p>
      <button className="btn" style={{ marginTop: 12 }} onClick={onGo}>להגרלה</button>
    </div>
  );
}

/** The legs are in and level: the shootout waits, and the league waits for it. */
function EuroPensCard({ gs, onGo }: { gs: G.GameState; onGo: () => void }) {
  const tie = gs.euro ? G.euroMyTie(gs) : null;
  const opp = tie ? euroClub(tie.a === gs.clubId ? tie.b : tie.a) : null;
  if (!opp) return null;
  return (
    <div className="match-hero" data-euro="1">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="label-cap" style={{ color: 'var(--euro, #6FA8FF)' }}>ערב אירופי</span>
        <span className="chip chip-euro">{ROUND_NAMES[gs.euro?.round ?? 0]}</span>
      </div>
      <div className="row" style={{ gap: 12, alignItems: 'center' }}>
        <Crest club={asClub(opp)} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 15.5, lineHeight: 1.2 }}>{opp.name}</b>
          <div className="sub" style={{ fontSize: 13 }}>שוויון אחרי המשחקים. הפנדלים יכריעו.</div>
        </div>
      </div>
      <button className="btn" style={{ marginTop: 12 }} onClick={onGo}>לפנדלים</button>
    </div>
  );
}

/**
 * The unmissable word at the very top of the home page, above everything
 * else: today is a cup day. Itzik's note of 20.10 — the player has to know
 * the moment the hub opens, not discover it three taps in. Dark brown and
 * amber, same family as the frame's own cup stage, so the banner and the
 * night it is announcing never disagree.
 */
function CupDayBanner() {
  return (
    <div className="row" style={{
      gap: 10, padding: '10px 14px', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg,#312015,#1C120B)', borderBottom: '1px solid rgba(217,138,61,.32)',
    }}>
      <Icon name="trophy" size={17} color="#F6D3A1" />
      <b style={{ fontSize: 14, color: '#F6D3A1', letterSpacing: '.01em' }}>היום יום גביע</b>
      <span style={{ fontSize: 13, color: '#D8BE9E' }}>· גביע המדינה</span>
    </div>
  );
}

/** the cup final's own stadium shot (21.10); shown only once confirmed real, only on final day */
export const CUP_FINAL_BG = asset('/moments/cup/final.webp');

/** A cup night this week. Dark brown and amber (ב.8), so the eye knows at once this is not the league and not Europe. */
function CupHero({ gs, night, onGo }: { gs: G.GameState; night: CupNight; onGo: () => void }) {
  const opp = G.cupClub(gs, night.oppId);
  const isFinal = night.host === null;
  const venue = isFinal ? 'הגמר, מגרש ניטרלי' : night.host ? 'בבית' : `בחוץ, אצל ${opp.name}`;
  const finalBgReady = useAssetsReady(isFinal ? [CUP_FINAL_BG] : []);
  const bg = isFinal && finalBgReady[CUP_FINAL_BG] ? CUP_FINAL_BG : null;
  return (
    <div className="match-hero" data-cup="1"
      style={bg ? { backgroundImage: `linear-gradient(165deg, rgba(49,32,21,.55), rgba(20,12,7,.88)), url('${bg}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="label-cap" style={{ color: 'var(--cup, #D98A3D)' }}>ערב גביע</span>
        <span className="chip chip-cup">{ROUND_NAMES[night.round]}</span>
      </div>
      <div className="row" style={{ gap: 12, alignItems: 'center' }}>
        <Crest club={opp} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 15.5, lineHeight: 1.2 }}>{opp.name}</b>
          <div className="sub" style={{ fontSize: 13 }}>{opp.city} · {venue} · משחק יחיד, הפסד שולח הביתה</div>
        </div>
      </div>
      <p className="hint" style={{ margin: '12px 0 0' }}>משחק הליגה של השבוע אחרי הערב הזה.</p>
      <button className="btn" style={{ marginTop: 12 }} onClick={onGo}>
        <Icon name="whistle" size={18} /> יוצאים לערב הגביע
      </button>
    </div>
  );
}

/** The cup's draw was made in the summer (or, for a staged entrant, after the pre-bracket); the ceremony is owed once. */
function CupDrawCard({ onGo }: { onGo: () => void }) {
  return (
    <div className="match-hero" data-cup="1">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="label-cap" style={{ color: 'var(--cup, #D98A3D)' }}>גביע המדינה</span>
        <span className="chip chip-cup">ההגרלה</span>
      </div>
      <p className="hint" style={{ margin: 0 }}>הגעתם לדרג הגביע. ההגרלה מחכה.</p>
      <button className="btn" style={{ marginTop: 12 }} onClick={onGo}>להגרלה</button>
    </div>
  );
}

/** The legs are in and level: the cup's shootout waits, and the league waits for it. */
function CupPensCard({ gs, onGo }: { gs: G.GameState; onGo: () => void }) {
  const tie = G.cupMyTie(gs);
  const opp = tie ? G.cupClub(gs, tie.a === gs.clubId ? tie.b : tie.a) : null;
  if (!opp) return null;
  return (
    <div className="match-hero" data-cup="1">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
        <span className="label-cap" style={{ color: 'var(--cup, #D98A3D)' }}>ערב גביע</span>
        <span className="chip chip-cup">{ROUND_NAMES[gs.cup?.round ?? 0]}</span>
      </div>
      <div className="row" style={{ gap: 12, alignItems: 'center' }}>
        <Crest club={opp} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: 15.5, lineHeight: 1.2 }}>{opp.name}</b>
          <div className="sub" style={{ fontSize: 13 }}>שוויון אחרי המשחק. הפנדלים יכריעו.</div>
        </div>
      </div>
      <button className="btn" style={{ marginTop: 12 }} onClick={onGo}>לפנדלים</button>
    </div>
  );
}

/** The staged entrant (reigning champion also in Europe): nothing to play until the pre-bracket is decided elsewhere. */
function CupWaitingCard() {
  return (
    <div className="match-hero" data-cup="1">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="label-cap" style={{ color: 'var(--cup, #D98A3D)' }}>גביע המדינה</span>
        <span className="chip chip-cup">ממתינים לרבע</span>
      </div>
      <p className="hint" style={{ margin: 0 }}>אתם נכנסים ישר לרבע הגמר. השמינית משוחקת בלעדיכם, ותודיעו לכם כשהיא תוכרע.</p>
    </div>
  );
}

function Side({ club, pos }: { club: Club; pos: number }) {
  return (
    <div className="stack" style={{ alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
      <Crest club={club} size={52} />
      <b style={{ fontSize: 14.5, textAlign: 'center', lineHeight: 1.2 }}>{club.short}</b>
      <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 700 }}>מקום {pos}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- the grid */

function Cell({ i, icon, glyph, label, onClick, dot, badge, count, blink }: {
  i: number; icon?: IconName; glyph?: React.ReactNode; label: string;
  onClick: () => void; dot?: string; badge?: number; count?: number | string; blink?: boolean;
}) {
  return (
    <button className="hub-cell" style={{ ...({ '--i': i } as React.CSSProperties) }} onClick={onClick}>
      <span className="hub-cell-icon">
        {glyph ?? <Icon name={icon!} size={21} color="var(--gold)" />}
        {badge ? <span className="hub-badge">{badge}</span>
          : dot ? <span className={blink ? 'hub-dot blink' : 'hub-dot'} style={{ background: dot }} /> : null}
      </span>
      <span className="hub-cell-label">{label}</span>
      {count !== undefined && <span className="hub-cell-count num">{count}</span>}
    </button>
  );
}

/**
 * The books, when they are in the red. It sits directly under the match, above
 * everything else, and it says the number out loud, because a manager should
 * never be sacked by a figure he had not seen. Tapping it goes to the market,
 * which is the only way out.
 */
function DebtStrip({ d, outlook, onClick }: { d: G.DebtState; outlook: { expected: number } | null; onClick: () => void }) {
  const hot = d.level === 'final';
  const tone = hot ? 'var(--loss)' : d.level === 'warned' ? 'var(--gold)' : 'var(--ink-dim)';
  return (
    <button className="debt-strip" style={{ '--tone': tone } as React.CSSProperties} onClick={onClick}>
      <div className="row" style={{ justifyContent: 'space-between', gap: 10 }}>
        <span className="label-cap">הבעלים והספרים</span>
        <span className="debt-num num">−₪{Math.round(d.debt).toLocaleString('en-US')}</span>
      </div>
      <div className="debt-bar" aria-hidden="true">
        <span style={{ width: `${Math.min(100, d.ratio * 100)}%` }} />
      </div>
      <div className="debt-line">{G.debtLine(d)}</div>
      {/* DRAFT WORDING, Itzik's to correct */}
      {outlook && outlook.expected > 0 && (
        <div className="debt-line">בסוף העונה ייכנסו עוד ₪{Math.round(outlook.expected).toLocaleString('en-US')}, לפי המקום שלכם היום.</div>
      )}
    </button>
  );
}

/** The only thing that still nags with words, because it is the only one that blocks. */
function InboxStrip({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button className="inbox-strip" onClick={onClick}>
      <Icon name="mic" size={19} color="var(--loss)" />
      <span style={{ flex: 1, textAlign: 'start', fontWeight: 800, fontSize: 15 }}>
        {count === 1 ? 'הודעה מחכה לתשובה שלך' : `${count} הודעות מחכות לתשובה`}
      </span>
      <Icon name="chevron" size={16} color="var(--loss)" />
    </button>
  );
}

/* ------------------------------------------------------------ the follower */

/**
 * Once the hero scrolls away the button comes back along the bottom, so
 * whatever you wandered off to read, starting the round stays one tap away
 * instead of a scroll back to the top.
 */
function StickyStart({ hero, onStart, rival }: {
  hero: React.RefObject<HTMLDivElement | null>; onStart: () => void; rival?: string;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = hero.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    // Observe the card itself, never an empty sentinel: a zero area target is
    // unreliable across engines. If the observer never reports, show stays
    // false and the bar simply never appears, which costs nothing, since the
    // same button is already sitting inside the match card up the page.
    const io = new IntersectionObserver(([e]) => {
      setShow(!e.isIntersecting && e.boundingClientRect.top < 0);
    }, { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [hero]);

  return (
    <div className="hub-sticky" data-on={show ? '1' : '0'} aria-hidden={!show}>
      <button className="btn" onClick={onStart} tabIndex={show ? 0 : -1}>
        <Icon name="whistle" size={18} /> {rival ? `יוצאים מול ${rival}` : 'יוצאים למחזור'}
      </button>
    </div>
  );
}
