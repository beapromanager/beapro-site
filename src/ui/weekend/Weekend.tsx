/**
 * The weekend league's screens (Itzik, 17.10, WEEKEND.md): the ticket on the
 * title screen, the three doors (open a league, come in with a code, the open
 * league), the league itself, and the prize going home to the career. The
 * match is in WeekendMatch.tsx.
 *
 * Everything here talks to the server through game/weekend.ts and keeps only
 * a nick and a league id on the phone. The look is the ticket world in
 * weekend.css; the career's own styles never apply inside .wk.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { SaveSummary } from '../../game/save.ts';
import { WeekendApi, ApiError, local, setLocal, serverNow, pendingInvite, dropInvite, slotLabel, dateLabel, rootDecision, POSITION_WORDS, type LeagueView, type LiveView, type PrizeToken } from '../../game/weekend.ts';
import { cycleOf, cyclePhase, SLOT_GRID, DAY_NAME, slotsNeeded, slotsProblem, ilDayDate, ilTime, READY_MS, MIN_MEMBERS, MAX_MEMBERS, PACK_EVERY, type SlotDay } from '../../game/weekendCore.ts';
import { introSeen, firstStrip, CANCEL_TEXT } from '../../game/weekendGuide.ts';
import { prizePreview, weekendMoney, weekendDate, monthDots, leaguesIn, WEEKEND_TRIPLE_GEMS, WEEKEND_TRIPLE_AT, type CareerPrizeView } from '../../game/weekendPrize.ts';
import { LEAGUE_NAMES } from '../../data/clubs.ts';
import { HelpButton, IntroCards, FaqSheet, AdminGuide, FillingCard, WhenLine, ShareButton } from './WeekendGuide.tsx';
import { leagueInviteText, championBrag } from '../../game/weekendInvite.ts';
import { fillFormation, formation, FORMATIONS, type FormationId } from '../../data/formations.ts';
import { overall } from '../../engine/matchEngine.ts';
import type { Player } from '../../engine/matchEngine.ts';
import { asset } from '../asset.ts';
import { Icon } from '../components/Icon.tsx';
import { LegalSheet, LegalLinks, ConsentBox, AgeBox, type LegalKind } from '../components/LegalSheet.tsx';
import { LEGAL_VERSION } from '../../game/legal.ts';
import { WeekendMatch } from './WeekendMatch.tsx';
import './weekend.css';

/* ------------------------------------------------------------------ the clock */

/**
 * A countdown that reads right in Hebrew: the days as words, the clock as an
 * isolated left-to-right run, so "2 ימים ו-04:59" never comes out scrambled.
 */
export function Count({ to, now, className, style }: { to: number; now: number; className?: string; style?: React.CSSProperties }) {
  const s = Math.max(0, Math.floor((to - now) / 1000));
  const d = Math.floor(s / 86_400), h = Math.floor((s % 86_400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  return (
    <span className={className} style={style}>
      {d > 0 && <span style={{ fontSize: '.62em', marginInlineEnd: '.35em' }}>{d === 1 ? 'יום' : `${d} ימים`} ו־</span>}
      <bdi dir="ltr" style={{ fontVariantNumeric: 'tabular-nums' }}>{d > 0 ? `${two(h)}:${two(m)}` : `${two(h)}:${two(m)}:${two(sec)}`}</bdi>
    </span>
  );
}

/* ------------------------------------------------------------ the ticket at the door */

/** the card on the title screen, all week: what is open now, and a countdown to what is next */
export function WeekendEntry({ onOpen, hasCareer }: { onOpen: () => void; hasCareer: boolean }) {
  const invite = pendingInvite();
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(n => n + 1), 1000); return () => clearInterval(t); }, []);
  const now = serverNow();
  const c = cycleOf(now);
  const phase = cyclePhase(c, now);
  const mem = local();
  const mine = mem.leagueId;
  // Sunday 20:00 opens the next weekend, but a device whose league ends now is in its final for the next hour (25.10)
  const finalNow = !!mine && !!mem.final && now >= mem.final && now < mem.final + 3_600_000;
  const line = finalNow ? { k: 'הגמר עכשיו', to: mem.final! + READY_MS, m: now < mem.final! + READY_MS ? 'המשחק האחרון יוצא לדרך' : 'המשחק האחרון שלך רץ' }
    : phase === 'open' ? { k: 'ההרשמה פתוחה', to: c.locks, m: `עד ${ilDayDate(c.locks)} ${ilTime(c.locks)}` }
    : phase === 'locked' ? { k: 'הרשימות נסגרו', to: c.kickoff, m: `${ilDayDate(c.kickoff)} ${ilTime(c.kickoff)}, המחזור הראשון` }
    : { k: 'משחקים עכשיו', to: c.final, m: `עד הגמר, ${ilDayDate(c.final)} ${ilTime(c.final)}` };
  return (
    <button className="wk-entry" onClick={onOpen} aria-label="ליגת השכונה">
      <div className="stub"><span>סופשבוע · {dateLabel(c.kickoff)}</span></div>
      <div className="stamp">{finalNow ? 'הגמר' : mine ? 'נכנס' : 'סופשבוע'}</div>
      <div className="k">{line.k}</div>
      <div className="h">ליגת השכונה</div>
      <div className="wk-row" style={{ gap: 10, alignItems: 'baseline' }}>
        {now < line.to && <Count className="c" to={line.to} now={now} />}
        <span className="m">{line.m}</span>
      </div>
      {invite && !mine && <div className="m" style={{ marginTop: 4 }}>הוזמנת לליגה, הקוד <bdi dir="ltr">{invite}</bdi> מחכה לך</div>}
      {!hasCareer && <div className="m" style={{ marginTop: 4 }}>קודם קריירה, אחר כך הליגה</div>}
    </button>
  );
}

/* ----------------------------------------------------------------- the root */

type Page = 'home' | 'create' | 'join' | 'open' | 'lobby' | 'match';

/** the prize into the career: null when there is no career, else the words and whether the phone keeps the token */
type OnPrize = (token: PrizeToken & { tierSeen?: number }) => { message: string; keep: boolean } | null;

export function WeekendRoot({ saved, career, onBack, onPrize, onCabinet }: {
  saved: SaveSummary | null;
  /** the career's division and weekend record, for the prize's numbers and whether it is already in */
  career: CareerPrizeView | null;
  onBack: () => void;
  onPrize: OnPrize;
  /** open the career on the coach's screen, where the cabinet is */
  onCabinet?: () => void;
}) {
  const [page, setPage] = useState<Page>('home');
  const [leagueId, setLeagueId] = useState<string | null>(local().leagueId);
  /** the league shown is last cycle's: its final, its table and its prize, while the next weekend is already open */
  const [lastMode, setLastMode] = useState(false);
  const [league, setLeague] = useState<LeagueView | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  // the explanation: the four cards the first time, the questions on request
  const [sheet, setSheet] = useState<null | 'intro' | 'faq'>(() => (introSeen() ? null : 'intro'));

  // where this device stands: this cycle's league, else last cycle's (its final is still there), else a remembered
  // id is asked of the league itself before it is dropped (25.10: Sunday 20:00 used to drop it mid-final)
  useEffect(() => {
    let on = true;
    const drop = () => { setLeagueId(null); setLocal({ leagueId: null, final: null }); };
    WeekendApi.mine().then(async m => {
      if (!on) return;
      const d = rootDecision(m, local().leagueId);
      if (d.kind === 'lobby') { setLeagueId(d.id); setLastMode(d.last); setLocal({ leagueId: d.id }); setPage('lobby'); return; }
      if (d.kind === 'probe') {
        try { await WeekendApi.view(d.id); if (on) { setLeagueId(d.id); setLastMode(true); setPage('lobby'); } }
        catch (e) { if (on && e instanceof ApiError && (e.status === 403 || e.status === 404 || e.status === 410)) drop(); }
        return;
      }
      drop();
      // a code that came in on a link: straight to "נכנסים עם קוד", the code already in the box (3.11)
      if (on && pendingInvite() && saved && cyclePhase(cycleOf(serverNow()), serverNow()) === 'open') setPage('join');
    }).catch(e => { if (on) setErr(e instanceof ApiError ? e.message : 'השרת לא עונה'); }).finally(() => { if (on) setBooting(false); });
    return () => { on = false; };
  }, []);

  const enter = (id: string) => { dropInvite(); setLeagueId(id); setLastMode(false); setLocal({ leagueId: id, final: cycleOf(serverNow()).final }); setPage('lobby'); };
  const now = serverNow();
  const sheets = (
    <>
      {sheet === 'intro' && <IntroCards now={now} onClose={() => setSheet(null)} onFaq={() => setSheet('faq')} />}
      {sheet === 'faq' && <FaqSheet now={now} onClose={() => setSheet(null)} onIntro={() => setSheet('intro')} />}
    </>
  );

  if (page === 'match' && league?.mine?.matchId) {
    return <WeekendMatch leagueId={league.id} matchId={league.mine.matchId} side={league.mine.side} opponent={league.mine.opponent} me={league.me?.nick ?? ''} onDone={() => setPage('lobby')} />;
  }
  if (page === 'lobby' && leagueId) {
    return (
      <>
        <Lobby id={leagueId} league={league} setLeague={setLeague} last={lastMode} onMatch={() => setPage('match')} onLeave={onBack} onHome={() => { setLeague(null); setPage('home'); }} onHelp={() => setSheet('intro')} onPrize={onPrize} hasCareer={!!saved} career={career} onCabinet={onCabinet} />
        {sheets}
      </>
    );
  }
  return (
    <div className="wk">
      <div className="wk-paper wk-stack">
        <div className="wk-row" style={{ justifyContent: 'space-between' }}>
          <button className="wk-back" onClick={page === 'home' ? onBack : () => setPage('home')}><Icon name="chevron" size={16} />{page === 'home' ? 'לכניסה' : 'חזרה'}</button>
          {page === 'home' ? <HelpButton onClick={() => setSheet('intro')} /> : <span className="wk-pill">סופשבוע</span>}
        </div>
        {page === 'home' && <Home saved={saved} booting={booting} err={err} go={setPage} onFaq={() => setSheet('faq')} />}
        {page === 'create' && <CreateLeague onMade={enter} />}
        {page === 'join' && <JoinLeague onJoined={enter} initialCode={pendingInvite() ?? ''} />}
        {page === 'open' && <OpenJoin onJoined={enter} />}
      </div>
      {sheets}
    </div>
  );
}

function Home({ saved, booting, err, go, onFaq }: { saved: SaveSummary | null; booting: boolean; err: string | null; go: (p: Page) => void; onFaq: () => void }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick(n => n + 1), 1000); return () => clearInterval(t); }, []);
  const now = serverNow();
  const c = cycleOf(now);
  const phase = cyclePhase(c, now);
  const open = phase === 'open';
  const first = firstStrip(now);
  const invite = pendingInvite(now);
  return (
    <>
      <div className="wk-frame"><img src={asset('/weekend/entrance.webp')} alt="" /></div>
      <div style={{ height: 230 }} />
      {first && <div className="wk-first wk-in">{first}</div>}
      <div className="wk-kick">חמישי 20:00 עד ראשון 20:00</div>
      <h1>ליגת השכונה</h1>
      <p className="wk-muted">סגל חדש, שווה לכולם. משחק אחד מול כל חבר, בשעות שקבעתם. אין תיקו. המנצח לוקח הביתה לקריירה.</p>
      <WhenLine league={null} now={now} />
      <div className="wk-card soft wk-row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="wk-muted">{open ? 'ההרשמה נסגרת בעוד' : phase === 'locked' ? 'המחזור הראשון בעוד' : 'הגמר בעוד'}</div>
          <Count className="wk-count" style={{ fontSize: 34, display: 'block' }} to={open ? c.locks : phase === 'locked' ? c.kickoff : c.final} now={now} />
        </div>
        <span className="wk-pill red">{dateLabel(c.kickoff)}</span>
      </div>
      {err && <p className="wk-err">{err}</p>}
      {!saved ? (
        <div className="wk-card"><b>קודם קריירה.</b> <span className="wk-muted">הליגה מחכה למי שיש לו קבוצה בבית. תפתח קריירה, ותחזור.{invite ? <> הקוד <bdi dir="ltr">{invite}</bdi> שמור לך כאן, ואפשר גם פשוט ללחוץ שוב על הלינק.</> : null}</span></div>
      ) : !open ? (
        <div className="wk-card"><b>ההרשמה סגורה.</b> <span className="wk-muted">ליגות נפתחות מראשון 20:00 עד חמישי 17:00. אם אתה כבר בליגה, היא תיפתח כאן לבד.</span></div>
      ) : (
        <div className="wk-stack">
          <button className="wk-btn red" disabled={booting} onClick={() => go('create')}>פותחים ליגה עם החבר׳ה</button>
          <button className="wk-btn" disabled={booting} onClick={() => go('join')}>נכנסים עם קוד</button>
          <button className="wk-btn ghost" disabled={booting} onClick={() => go('open')}>הליגה הפתוחה, למי שבא לבד</button>
        </div>
      )}
      <p className="wk-muted" style={{ fontSize: 12 }}>בליגה נשמרים בשרת הכינוי שבחרת, שם הליגה, הסגל שהמשחק הגריל לך, הבחירות שלך והתוצאות, ונמחקים מהשרת שבוע אחרי הגמר. בשרת נשאר מספר האליפויות של המכשיר, בלי כינוי, ונמחק 12 חודשים אחרי האליפות האחרונה. אצלך במכשיר הכינוי ושם הליגה נשארים בקריירה. לא טלפון, לא מיקום, לא מייל.</p>
      <button className="wk-link" onClick={onFaq}>שאלות נפוצות: מתי משחקים, מה הפרס, מה עושה מי שפותח</button>
      <WkFooter />
    </>
  );
}

/* ------------------------------------------------------------- the three doors */

/** the documents and the address to write to, at the foot of the league's home and lobby (Itzik, 27.10) */
export function WkFooter() {
  const [legal, setLegal] = useState<LegalKind | null>(null);
  return (
    <p className="wk-muted wk-foot" style={{ fontSize: 12, textAlign: 'center' }}>
      <LegalLinks open={setLegal} />
      {legal && <LegalSheet kind={legal} onClose={() => setLegal(null)} />}
    </p>
  );
}

function useSubmit<T>(fn: () => Promise<T>, after: (r: T) => void) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async () => {
    setBusy(true); setErr(null);
    try { after(await fn()); } catch (e) { setErr(e instanceof ApiError ? e.message : 'השרת לא עונה. נסה שוב'); } finally { setBusy(false); }
  };
  return { busy, err, run };
}

function CreateLeague({ onMade }: { onMade: (id: string) => void }) {
  const [name, setName] = useState('');
  const [nick, setNick] = useState(local().nick);
  const [size, setSize] = useState(8);
  const [slots, setSlots] = useState<string[]>([]);
  const [ok, setOk] = useState(false);
  const [age16, setAge16] = useState(false);
  const [legal, setLegal] = useState<LegalKind | null>(null);
  const need = slotsNeeded(size);
  const problem = slotsProblem(size, slots);
  const toggle = (k: string) => setSlots(s => s.includes(k) ? s.filter(x => x !== k) : [...s, k]);
  const { busy, err, run } = useSubmit(
    () => WeekendApi.create({ nick, name, slots, size, consent: LEGAL_VERSION }),
    r => { setLocal({ nick }); onMade(r.id); },
  );
  const days: SlotDay[] = ['fri', 'sat', 'sun'];
  return (
    <div className="wk-stack wk-in">
      <div className="wk-kick">ליגת החבר׳ה</div>
      <h1>פותחים ליגה</h1>
      <AdminGuide size={size} />
      <div>
        <label className="wk-label" htmlFor="wk-name">שם הליגה</label>
        <input id="wk-name" className="wk-input" value={name} onChange={e => setName(e.target.value)} maxLength={24} placeholder="ליגת בניין 7" />
      </div>
      <div>
        <label className="wk-label" htmlFor="wk-nick">הכינוי שלך בליגה</label>
        <input id="wk-nick" className="wk-input" value={nick} onChange={e => setNick(e.target.value)} maxLength={12} placeholder="איציק" />
      </div>
      <div>
        <label className="wk-label">כמה חברים יהיו בליגה (כולל אותך)</label>
        <div className="wk-row" style={{ flexWrap: 'wrap', gap: 6 }}>
          {Array.from({ length: MAX_MEMBERS - MIN_MEMBERS + 1 }, (_, i) => MIN_MEMBERS + i).map(n => (
            <button key={n} className={`wk-btn sm ${size === n ? '' : 'ghost'}`} style={{ minWidth: 44 }} onClick={() => setSize(n)} aria-pressed={size === n}><span className="num">{n}</span></button>
          ))}
        </div>
        <p className="wk-muted" style={{ marginTop: 6 }}>חמישי 20:00 וראשון 20:00 קבועים לכולם. עם <span className="num">{size}</span> חברים בוחרים עוד <span className="num">{need}</span> משבצות. כל משבצת היא מחזור שכולם משחקים באותה שעה.</p>
      </div>
      {days.map(day => (
        <div key={day}>
          <div className="wk-sep">{DAY_NAME[day]}</div>
          <div className="wk-list">
            {SLOT_GRID.filter(s => s.day === day).map(s => (
              <button key={s.key} className="wk-slot pick" aria-pressed={slots.includes(s.key)} onClick={() => toggle(s.key)}>
                <span className="d">{DAY_NAME[s.day]}</span><span className="t num">{String(s.hh).padStart(2, '0')}:00</span>
                <span className="s">{slots.includes(s.key) ? 'נבחר' : ''}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="wk-card soft">
        <b>{problem ?? 'הלוח מלא. אפשר לפתוח.'}</b>
        <div className="wk-muted">אם יגיעו פחות ממה שתכננת, הלוח מתכווץ לבד מהסוף. פחות משישה בחמישי 17:00, הליגה לא יוצאת לדרך.</div>
      </div>
      <AgeBox checked={age16} onChange={setAge16} />
      <ConsentBox checked={ok} onChange={setOk} open={setLegal} />
      {err && <p className="wk-err">{err}</p>}
      <button className="wk-btn red" disabled={busy || !ok || !age16 || !!problem || name.trim().length < 2 || nick.trim().length < 2} onClick={run}>{busy ? 'פותח…' : 'לפתוח את הליגה'}</button>
      {legal && <LegalSheet kind={legal} onClose={() => setLegal(null)} />}
    </div>
  );
}

function JoinLeague({ onJoined, initialCode = '' }: { onJoined: (id: string) => void; initialCode?: string }) {
  const [code, setCode] = useState(initialCode);
  const [nick, setNick] = useState(local().nick);
  const [ok, setOk] = useState(false);
  const [age16, setAge16] = useState(false);
  const [legal, setLegal] = useState<LegalKind | null>(null);
  const { busy, err, run } = useSubmit(
    () => WeekendApi.join({ nick, code: code.trim().toUpperCase(), consent: LEGAL_VERSION }),
    r => { setLocal({ nick }); onJoined(r.id); },
  );
  return (
    <div className="wk-stack wk-in">
      <div className="wk-kick">קיבלת קוד בוואטסאפ</div>
      <h1>נכנסים לליגה</h1>
      <div>
        <label className="wk-label" htmlFor="wk-code">הקוד</label>
        <input id="wk-code" className="wk-input code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} autoCapitalize="characters" autoComplete="off" placeholder="KX7R2M" />
      </div>
      <div>
        <label className="wk-label" htmlFor="wk-nick2">הכינוי שלך בליגה</label>
        <input id="wk-nick2" className="wk-input" value={nick} onChange={e => setNick(e.target.value)} maxLength={12} placeholder="דודו" />
      </div>
      <AgeBox checked={age16} onChange={setAge16} />
      <ConsentBox checked={ok} onChange={setOk} open={setLegal} />
      {err && <p className="wk-err">{err}</p>}
      <button className="wk-btn red" disabled={busy || !ok || !age16 || code.trim().length !== 6 || nick.trim().length < 2} onClick={run}>{busy ? 'נכנס…' : 'להיכנס'}</button>
      {legal && <LegalSheet kind={legal} onClose={() => setLegal(null)} />}
    </div>
  );
}

function OpenJoin({ onJoined }: { onJoined: (id: string) => void }) {
  const [nick, setNick] = useState(local().nick);
  const [ok, setOk] = useState(false);
  const [age16, setAge16] = useState(false);
  const [legal, setLegal] = useState<LegalKind | null>(null);
  const { busy, err, run } = useSubmit(
    () => WeekendApi.open({ nick, consent: LEGAL_VERSION }),
    r => { setLocal({ nick }); onJoined(r.id); },
  );
  return (
    <div className="wk-stack wk-in">
      <div className="wk-kick">הליגה הפתוחה</div>
      <h1>באים לבד</h1>
      <p className="wk-muted">שישה שלא מכירים, המשחק מנהל. הלוח קבוע: חמישי 20:00, שישי 12:00 ו-14:00, שבת 20:00, והגמר ראשון 20:00. כשנכנסים שישה, הליגה נסגרת.</p>
      <div>
        <label className="wk-label" htmlFor="wk-nick3">הכינוי שלך בליגה</label>
        <input id="wk-nick3" className="wk-input" value={nick} onChange={e => setNick(e.target.value)} maxLength={12} placeholder="הכינוי" />
      </div>
      <AgeBox checked={age16} onChange={setAge16} />
      <ConsentBox checked={ok} onChange={setOk} open={setLegal} />
      {err && <p className="wk-err">{err}</p>}
      <button className="wk-btn red" disabled={busy || !ok || !age16 || nick.trim().length < 2} onClick={run}>{busy ? 'נכנס…' : 'לליגה הפתוחה'}</button>
      {legal && <LegalSheet kind={legal} onClose={() => setLegal(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ the league */

function Lobby({ id, league, setLeague, last, onMatch, onLeave, onHome, onHelp, onPrize, hasCareer, career, onCabinet }: {
  id: string; league: LeagueView | null; setLeague: (l: LeagueView | null) => void;
  /** last cycle's league: the next weekend is already open for registration */
  last: boolean;
  onMatch: () => void; onLeave: () => void; onHome: () => void; onHelp: () => void; onPrize: OnPrize; hasCareer: boolean;
  career: CareerPrizeView | null; onCabinet?: () => void;
}) {
  const [err, setErr] = useState<string | null>(null);
  const [live, setLive] = useState<LiveView | null>(null);
  const [, tick] = useState(0);
  const [tab, setTab] = useState<'league' | 'squad' | 'table'>('league');
  const [prizeWords, setPrizeWords] = useState<string | null>(null);
  /** the server said 409: a claim from before the token was kept, so it cannot be fetched again */
  const [gone, setGone] = useState(false);
  const [packMan, setPackMan] = useState<Player | null>(null);

  const refresh = async () => {
    try { const v = await WeekendApi.view(id); setLeague(v); setLocal({ final: v.cycle.final }); setErr(null); }
    catch (e) { if (e instanceof ApiError && (e.status === 403 || e.status === 404 || e.status === 410)) { setLocal({ leagueId: null, final: null }); onLeave(); } else setErr(e instanceof ApiError ? e.message : 'השרת לא עונה'); }
  };
  useEffect(() => { void refresh(); const t = setInterval(refresh, 6_000); const k = setInterval(() => tick(n => n + 1), 1000); return () => { clearInterval(t); clearInterval(k); }; }, [id]);
  // the division the prize is counted in is fixed the first time this phone sees it: a promotion in between does not raise it
  const prizeSeen = league?.status === 'done' && !!league.prize;
  useEffect(() => {
    if (!prizeSeen || !career) return;
    const had = local().prizeTier ?? {};
    if (had[id] === undefined) setLocal({ prizeTier: { ...had, [id]: career.tier } });
  }, [prizeSeen, id, career?.tier]);
  const inRound = !!league?.current && serverNow() >= league.current.at;
  useEffect(() => {
    if (!inRound) { setLive(null); return; }
    const go = () => WeekendApi.live(id).then(setLive).catch(() => {});
    go(); const t = setInterval(go, 2_500); return () => clearInterval(t);
  }, [id, inRound]);

  if (!league) return <div className="wk"><div className="wk-paper"><p className="wk-muted">{err ?? 'טוען את הליגה…'}</p></div></div>;
  const now = serverNow();
  const L = league;
  const next = L.status === 'open' ? { label: 'הרשימות נסגרות בעוד', at: L.cycle.locks }
    : L.status === 'locked' ? { label: 'המחזור הראשון בעוד', at: L.cycle.kickoff }
    : L.current ? (now < L.current.at ? { label: `${slotLabel(L.current.key).day} ${slotLabel(L.current.key).time}, בעוד`, at: L.current.at } : now < L.current.startsAt ? { label: 'המשחקים יוצאים בעוד', at: L.current.startsAt } : null)
    : null;
  const myDone = L.mine?.result;
  const canPlay = L.mine?.matchId && !myDone && L.current && now >= L.current.startsAt - 60_000;
  const takePrize = async () => {
    try {
      const { token } = await WeekendApi.prize(id);
      // the phone keeps the token first, with the division it was first seen in, so nothing is lost on the way
      const seen = local().prizeTier?.[token.league] ?? career?.tier;
      const kept = seen ? { ...token, tierSeen: seen } : token;
      setLocal({ pendingPrize: kept });
      const r = onPrize(kept);
      if (r && !r.keep) { setPrizeWords(r.message); setLocal({ pendingPrize: null }); }
      else setPrizeWords('הפרס שמור. הוא ייכנס לקריירה ברגע שתפתח אותה.');
      void refresh();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) { setGone(true); return; }
      setErr(e instanceof ApiError ? e.message : 'השרת לא עונה');
    }
  };
  // the prize is taken only if it is in the career (or waiting on this phone for it), not because the server once
  // handed it out: an answer lost on the way leaves the button, and the server hands back the same token (25.10)
  const pend = local().pendingPrize;
  const prizeTaken = gone || leaguesIn(career?.weekend ?? undefined).includes(id) || pend?.league === id;

  // the invite (Itzik, 3.11): the game's name, what it is, the league, the code, the rounds once, a link that fills the code in
  const shareText = L.code || L.kind === 'open' ? leagueInviteText({ kind: L.kind, name: L.name, code: L.code, rounds: L.roundKeys.map(r => r.key), locks: L.cycle.locks }) : null;
  return (
    <div className="wk">
      <div className="wk-paper wk-stack">
        <div className="wk-row" style={{ justifyContent: 'space-between' }}>
          <button className="wk-back" onClick={onLeave}><Icon name="chevron" size={16} />לכניסה</button>
          <span className="wk-row" style={{ gap: 6 }}>
            <span className="wk-pill">{L.kind === 'open' ? 'הליגה הפתוחה' : 'ליגת החבר׳ה'} · {dateLabel(L.cycle.kickoff)}</span>
            <button className="wk-help sm" onClick={onHelp} aria-label="איך זה עובד">?</button>
          </span>
        </div>

        {/* last cycle's league: the next weekend is already open, this one is here for its final, its table and its prize */}
        {last && now >= L.cycle.final && (
          <div className="wk-card soft wk-row wk-in" style={{ justifyContent: 'space-between' }}>
            <b>הסופ״ש הבא כבר פתוח להרשמה</b>
            <button className="wk-btn sm" onClick={onHome}>לסופ״ש הבא</button>
          </div>
        )}

        {/* the ticket */}
        <div className={`wk-ticket ${L.code ? 'has-stub' : ''} wk-in`}>
          {L.code && <div className="wk-stub"><span>{L.name} · {L.code}</span></div>}
          <div className="wk-stamp">{L.status === 'done' ? 'נגמר' : L.status === 'cancelled' ? 'בוטל' : L.status === 'open' ? 'נרשם' : 'נכנס'}</div>
          <div className="wk-kick">{L.status === 'open' ? `${L.members.length} מתוך ${L.capacity}` : L.status === 'playing' ? `מחזור ${(L.current?.index ?? L.rounds.length - 1) + 1} מתוך ${L.rounds.length}` : L.status === 'locked' ? 'הסגלים הוגרלו' : L.status === 'done' ? 'הסופשבוע נגמר' : 'לא יצאה לדרך'}</div>
          <h1 style={{ marginTop: 4 }}>{L.name}</h1>
          {next && <div style={{ marginTop: 8 }}><div className="wk-muted">{next.label}</div><Count className="wk-count" style={{ display: 'block' }} to={next.at} now={now} /></div>}
          {L.code && L.status === 'open' && <div className="wk-muted" style={{ marginTop: 8 }}>הקוד לחבר׳ה: <b className="num" style={{ fontFamily: 'var(--font-wk)', fontSize: 22, letterSpacing: '.12em' }}>{L.code}</b></div>}
          <div className="wk-barcode" />
        </div>

        <WhenLine league={L} now={now} />
        {err && <p className="wk-err">{err}</p>}

        {/* the one button that matters now */}
        {canPlay && (
          <button className="wk-btn red wk-in" style={{ minHeight: 64, fontSize: 19 }} onClick={onMatch}>למגרש, מול {L.mine!.opponent}</button>
        )}
        {L.current && !canPlay && !myDone && now >= L.current.at && now < L.current.startsAt && L.mine && (
          <button className="wk-btn wk-in" onClick={() => WeekendApi.ready(id).then(refresh).catch(() => {})}>מוכן? מול {L.mine.opponent} בעוד <Count to={L.current.startsAt} now={now} /></button>
        )}
        {L.status === 'cancelled' && <div className="wk-card"><b>{CANCEL_TEXT.lead}</b> <span className="wk-muted">{CANCEL_TEXT.rest}</span></div>}
        {L.status === 'open' && <FillingCard n={L.members.length} isOpener={L.opener} kind={L.kind === 'open' ? 'open' : 'friends'} shareText={shareText} />}

        {/* the prize */}
        {L.status === 'done' && L.prize && (
          <ChampionCard L={L} onTake={takePrize} words={prizeWords} hasCareer={hasCareer} career={career} taken={prizeTaken} pending={pend?.league === id && !career} onCabinet={onCabinet} />
        )}

        {/* tabs */}
        <div className="wk-row" style={{ gap: 6 }}>
          {(['league', 'squad', 'table'] as const).map(t => (
            <button key={t} className={`wk-btn sm ${tab === t ? '' : 'ghost'}`} style={{ flex: 1 }} onClick={() => setTab(t)} aria-pressed={tab === t}>{t === 'league' ? 'הליגה' : t === 'squad' ? 'הסגל' : 'הטבלה'}</button>
          ))}
        </div>

        {tab === 'league' && (
          <>
            {live && live.round && <LiveRound live={live} me={L.me?.nick ?? ''} />}
            <div className="wk-members">
              {L.members.map(m => <span key={m.nick} className={`wk-av ${m.me ? 'me' : ''} ${m.ready ? 'ready' : ''}`} title={m.opener ? 'פתח את הליגה' : ''}>{m.nick}</span>)}
              {L.status === 'open' && Array.from({ length: Math.max(0, L.capacity - L.members.length) }, (_, i) => <span key={`e${i}`} className="wk-av empty">·</span>)}
            </div>
            <div className="wk-list">
              {(L.status === 'open' ? L.roundKeys.map((r, i) => ({ key: r.key, at: r.at, i, match: null as LeagueView['rounds'][number]['matches'][number] | null, bye: null as string | null }))
                : L.rounds.map(r => ({ key: r.key, at: r.at, i: r.index, match: r.matches.find(m => m.mine) ?? null, bye: r.bye }))).map(r => {
                const lab = slotLabel(r.key);
                const done = !!r.match?.result;
                const isNext = L.current?.index === r.i;
                const res = r.match?.result;
                const mineHome = r.match && L.me && r.match.home === L.me.nick;
                const line = !r.match ? (L.status === 'open' ? '' : r.bye === L.me?.nick ? 'אתה נח' : '') : res
                  ? `${(mineHome ? res.winner === 'home' : res.winner === 'away') ? 'ניצחת' : 'הפסדת'} ${res.score[mineHome ? 0 : 1]}:${res.score[mineHome ? 1 : 0]}${res.shootout ? ` (פנדלים ${res.shootout[mineHome ? 0 : 1]}:${res.shootout[mineHome ? 1 : 0]})` : ''}${res.technical ? ' טכני' : ''} ${mineHome ? 'את' : 'אצל'} ${mineHome ? r.match.away : r.match.home}`
                  : `מול ${mineHome ? r.match.away : r.match.home}`;
                return (
                  <div key={r.key} className={`wk-slot ${done ? 'done' : ''} ${isNext ? 'next' : ''} ${r.i === L.roundKeys.length - 1 ? 'final' : ''}`}>
                    <span className="d">{lab.day}</span><span className="t num">{lab.time}</span>
                    <span className="s">{r.i === L.roundKeys.length - 1 && !line ? 'הגמר' : line}</span>
                  </div>
                );
              })}
            </div>
            {L.status === 'open' && shareText && (
              <div className="wk-card soft">
                <b>ההזמנה לחבר׳ה:</b>
                <p className="wk-muted" dir="rtl" style={{ margin: '6px 0 0', userSelect: 'all', whiteSpace: 'pre-line', unicodeBidi: 'plaintext' }}>{shareText}</p>
                <div className="wk-row" style={{ gap: 6, marginTop: 8 }}>
                  <ShareButton text={shareText} className="wk-btn sm" style={{ flex: 1 }} />
                  <a className="wk-btn sm ghost" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }} href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">בוואטסאפ</a>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'squad' && L.me && (
          <SquadPane id={id} L={L} onChanged={refresh} packMan={packMan} setPackMan={setPackMan} />
        )}

        {tab === 'table' && <Table rows={L.table} me={L.me?.nick ?? ''} />}
        <WkFooter />
      </div>
    </div>
  );
}

function LiveRound({ live, me }: { live: LiveView; me: string }) {
  const lead = live.matches.map(m => m.live?.last).filter(Boolean).sort((a, b) => (b!.minute - a!.minute))[0];
  return (
    <div className="wk-stack wk-in">
      <div className="wk-row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2>עכשיו משחקים</h2>
        <span className="wk-pill">{live.matches.filter(m => m.live && !m.live.done).length} משחקים חיים</span>
      </div>
      <div className="wk-live">
        {live.matches.map((m, i) => {
          const sc = m.result ? m.result.score : m.live?.score ?? [0, 0];
          const goal = m.live?.last?.type === 'goal' && m.live.minute - m.live.last.minute <= 2 && !m.live.done;
          const mine = m.home === me || m.away === me;
          return (
            <div key={i} className={`wk-m ${goal ? 'goal' : ''} ${mine ? 'mine' : ''}`}>
              <span className="r">{m.home}</span>
              {/* the row reads right to left, home on the right; the digits run left to right, so the away score is written first */}
              <span className="s">{sc[1]}-{sc[0]}</span>
              <span className="l">{m.away}</span>
              <span className="mm">{m.result ? (m.result.shootout ? `נגמר בפנדלים ${m.result.shootout[1]}-${m.result.shootout[0]}` : m.result.technical ? 'הפסד טכני' : 'נגמר') : m.live ? (m.live.done ? 'נגמר' : m.live.shootout ? `פנדלים ${m.live.shootout[1]}-${m.live.shootout[0]}` : `דקה ${m.live.minute}${m.live.deciding.length ? ' · מחליטים' : ''}`) : 'עוד לא התחיל'}</span>
            </div>
          );
        })}
      </div>
      {lead && <div className="wk-mega"><Icon name="mic" size={18} color="var(--wk-paper)" /><span>{lead.text}</span></div>}
    </div>
  );
}

function Table({ rows, me }: { rows: LeagueView['table']; me: string }) {
  return (
    <div className="wk-tbl wk-in">
      <div className="wk-tr"><span>#</span><span>מנהל</span><span>נ</span><span>ה</span><span>הפרש</span><span>נק׳</span></div>
      {rows.map((r, i) => (
        <div key={r.device} className={`wk-tr ${r.nick === me ? 'me' : ''}`}>
          <span className="p num">{i + 1}</span>
          <span>{r.nick}{r.assistant > 0 && <span className="ai">העוזר {r.assistant}</span>}</span>
          <span className="num">{r.wins}</span><span className="num">{r.losses}</span>
          <span className="num">{r.gd > 0 ? '+' : ''}{r.gd}</span>
          <span className="pts num">{r.points}</span>
        </div>
      ))}
    </div>
  );
}

function SquadPane({ id, L, onChanged, packMan, setPackMan }: { id: string; L: LeagueView; onChanged: () => void; packMan: Player | null; setPackMan: (p: Player | null) => void }) {
  const me = L.me!;
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!me.squad) return <div className="wk-card soft"><b>הסגל מוגרל בחמישי 17:00.</b> <span className="wk-muted">שמונה עשר שחקנים, ממוצע 85, שווה לכולם. בינתיים תביא חברים.</span></div>;
  const xi = me.squad.slice(0, 11), bench = me.squad.slice(11);
  const packsLeft = me.packs - me.opened;
  const locked = L.current && serverNow() >= L.current.at && !L.mine?.result;
  const pick = async (f: FormationId) => {
    setBusy(true); setErr(null);
    try {
      const eleven = fillFormation([...me.squad!], formation(f)).map(p => p.id);
      await WeekendApi.lineup(id, eleven, { ...me.tactic, formation: f });
      onChanged();
    } catch (e) { setErr(e instanceof ApiError ? e.message : 'השרת לא עונה'); } finally { setBusy(false); }
  };
  const openPack = async (pos: string) => {
    setBusy(true); setErr(null);
    try { const r = await WeekendApi.pack(id, pos); setPackMan(r.player); onChanged(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : 'השרת לא עונה'); } finally { setBusy(false); }
  };
  return (
    <div className="wk-stack wk-in">
      {packsLeft > 0 && (
        <div className="wk-card" style={{ borderColor: 'var(--wk-red)' }}>
          <div className="wk-kick">חבילה על {PACK_EVERY} ניצחונות</div>
          <h2 style={{ margin: '4px 0 6px' }}>שחקן 90 לעמדה שתבחר</h2>
          <p className="wk-muted">הוא נכנס במקום החלש ביותר באותה עמדה. {packsLeft > 1 ? `יש לך ${packsLeft} חבילות.` : ''}</p>
          <div className="wk-row" style={{ flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {Object.entries(POSITION_WORDS).map(([pos, w]) => <button key={pos} className="wk-btn sm ghost" disabled={busy} onClick={() => openPack(pos)}>{w}</button>)}
          </div>
        </div>
      )}
      {packMan && (
        <div className="wk-card wk-in" style={{ borderColor: 'var(--wk-red)', background: 'var(--wk-red-soft)' }}>
          <div className="wk-kick">נכנס לסגל</div>
          <h2>{packMan.name}</h2>
          <div className="wk-muted">{POSITION_WORDS[packMan.position] ?? packMan.position} · <span className="num">{overall(packMan)}</span> · בן <span className="num">{packMan.age}</span></div>
          <button className="wk-btn sm" style={{ marginTop: 8 }} onClick={() => setPackMan(null)}>סבבה</button>
        </div>
      )}
      <div>
        <div className="wk-sep">המערך {locked ? '(נעול בזמן משחק)' : ''}</div>
        <div className="wk-row" style={{ flexWrap: 'wrap', gap: 6 }}>
          {FORMATIONS.map(f => <button key={f.id} className={`wk-btn sm ${me.tactic.formation === f.id ? '' : 'ghost'}`} disabled={busy || !!locked} onClick={() => pick(f.id)} aria-pressed={me.tactic.formation === f.id}><span className="num">{f.id}</span></button>)}
        </div>
        <p className="wk-muted" style={{ marginTop: 6 }}>בחירת מערך מושיבה את האחד עשר הטובים לכל קו. ממוצע הסגל <span className="num">{(me.squad.reduce((s, p) => s + overall(p), 0) / me.squad.length).toFixed(1)}</span>.</p>
      </div>
      {err && <p className="wk-err">{err}</p>}
      <div className="wk-sep">האחד עשר</div>
      <div className="wk-squad">{xi.map(p => <PlayerRow key={p.id} p={p} pack={me.fromPacks.includes(p.id)} />)}</div>
      <div className="wk-sep">הספסל</div>
      <div className="wk-squad">{bench.map(p => <PlayerRow key={p.id} p={p} bench pack={me.fromPacks.includes(p.id)} />)}</div>
    </div>
  );
}

function PlayerRow({ p, bench, pack }: { p: Player; bench?: boolean; pack?: boolean }) {
  return (
    <div className={`wk-pl ${bench ? 'bench' : ''} ${pack ? 'pack' : ''}`}>
      <span className="pos">{p.position}</span>
      <span>{p.name}{pack && <span className="ai" style={{ color: 'var(--wk-red-dark)', fontSize: 11, marginInlineStart: 6 }}>מהחבילה</span>}</span>
      <span className="ovr num">{overall(p)}</span>
    </div>
  );
}

/** a number that runs from 0 to its value once, after a beat; still for a phone that asked for less motion */
function useCountUp(target: number, delay: number, ms: number): number {
  const still = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [v, setV] = useState(still ? target : 0);
  useEffect(() => {
    if (still) { setV(target); return; }
    let raf = 0; const t0 = performance.now() + delay;
    const step = (t: number) => {
      const k = Math.max(0, Math.min(1, (t - t0) / ms));
      setV(Math.round(target * (1 - Math.pow(1 - k, 3)) / 1000) * 1000);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

const CONFETTI = Array.from({ length: 26 }, (_, i) => ({ x: (i * 37) % 100, d: (i % 7) * 0.09, c: ['var(--wk-red)', 'var(--wk-ink)', 'var(--wk-gold-hi)'][i % 3], r: (i * 53) % 360, w: 6 + (i % 3) * 2 }));

function ChampionCard({ L, onTake, words, hasCareer, career, taken, pending, onCabinet }: {
  L: LeagueView; onTake: () => void; words: string | null; hasCareer: boolean;
  career: CareerPrizeView | null; taken: boolean; pending: boolean; onCabinet?: () => void;
}) {
  const p = L.prize!;
  const top = L.table.slice(0, 3);
  const last = L.table[L.table.length - 1];
  const champ = p.place === 1;
  const tierSeen = local().prizeTier?.[L.id];
  const pv = prizePreview(career, { nonce: '', league: L.id, place: p.place, wageRounds: p.wageRounds, finished: p.finished, nick: L.me?.nick ?? '', leagueName: L.name, final: L.cycle.final, tierSeen });
  const shown = useCountUp(pv.money, champ ? 900 : 0, champ ? 900 : 1);
  const leagueWords = LEAGUE_NAMES[pv.tier] ?? '';
  const date = weekendDate(L.cycle.final);
  const brag = championBrag(L.name, date);
  const done = taken || !!words;
  const button = !done && p.wageRounds > 0
    ? <button className="wk-btn red" onClick={onTake}>{hasCareer ? 'לקחת הביתה לקריירה' : 'לשמור את הפרס לקריירה'}</button> : null;
  const after = (
    <>
      {words && <div className="wk-card soft" style={{ textAlign: 'start' }}><b>{words}</b></div>}
      {!words && taken && <div className="wk-muted">{pending ? 'הפרס שמור, והוא ייכנס לקריירה ברגע שתפתח אותה.' : 'הפרס כבר נלקח.'}</div>}
      {done && career && p.place <= 3 && !pending && (
        <div className="wk-row" style={{ justifyContent: 'center', gap: 10, marginTop: 6 }}>
          <span className="wk-pill">בארון ✓</span>
          {onCabinet && <button className="wk-link" style={{ width: 'auto', minHeight: 36, padding: 0 }} onClick={onCabinet}>לארון הגביעים</button>}
        </div>
      )}
    </>
  );

  if (!champ) {
    const title = p.place === 2 ? 'סגן האלוף' : p.place === 3 ? 'מקום שלישי' : p.finished ? 'שיחקת את הסופשבוע' : 'הסופשבוע נגמר';
    return (
      <div className="wk-champ wk-in">
        <div className="wk-kick" style={{ justifyContent: 'center' }}>{L.name}</div>
        <h1 className="big">{title}</h1>
        <div className="date num">{date}</div>
        {p.place <= 3 && <div className={`wk-trophy num place-${p.place}`}>{p.place}</div>}
        <div className="wk-stack" style={{ gap: 6, margin: '10px 0' }}>
          {top.map((r, i) => <div key={r.device} className={`wk-pr ${i === 0 ? 'first' : ''}`}><span className="n num">{i + 1}</span><span>{r.nick}</span><span className="pts num">{r.points}</span></div>)}
        </div>
        <p className="wk-muted">
          {p.wageRounds > 0
            ? career
              ? <>לקריירה: <b className="num"><bdi dir="ltr">₪{pv.money.toLocaleString('en-US')}</bdi></b> לפי {leagueWords}{pv.fans ? <>, ואוהדים <span className="num">+{pv.fans}</span></> : null}.</>
              : <><b className="num"><bdi dir="ltr">₪{weekendMoney(1, p.wageRounds).toLocaleString('en-US')}</bdi></b> ב{LEAGUE_NAMES[1]} · יותר בליגות גבוהות.</>
            : 'העוזר שיחק במקומך ברוב המשחקים, אז הפעם בלי מעטפה.'}
        </p>
        {button}{after}
      </div>
    );
  }

  const c = pv.monthCount;
  // the numbers sit in their own left-to-right runs, so "+5" never reads "5+" in a right-to-left line
  const monthLine = pv.triple ? <>משולש החודש! <span className="num">+{WEEKEND_TRIPLE_GEMS}</span> 💎</>
    : c >= WEEKEND_TRIPLE_AT ? 'משולש החודש ✓'
    : <>החודש: <span className="num">{monthDots(c)}</span> · עוד {WEEKEND_TRIPLE_AT - c === 1 ? 'אליפות אחת' : <><span className="num">{WEEKEND_TRIPLE_AT - c}</span> אליפויות</>} ו-<span className="num">{WEEKEND_TRIPLE_GEMS}</span> 💎 בדרך</>;
  return (
    <div className="wk-champ wow wk-in">
      <div className="wk-confetti" aria-hidden="true">
        {CONFETTI.map((f, i) => <i key={i} style={{ ['--x' as string]: `${f.x}%`, ['--d' as string]: `${f.d}s`, ['--c' as string]: f.c, ['--r' as string]: `${f.r}deg`, ['--w' as string]: `${f.w}px` }} />)}
      </div>
      <div className="wk-stamp land">אלוף</div>
      {pv.triple && <div className="wk-stamp land second">משולש</div>}
      <div className="wk-kick" style={{ justifyContent: 'center' }}>ליגת השכונה</div>
      <h1 className="big">אלוף הסופשבוע</h1>
      <div className="date">{L.name} · <span className="num">{date}</span></div>
      <div className="wk-trophy num place-1">1</div>
      {career && pv.titleNo > 0 && <div className="wk-title-no">התואר ה-<span className="num">{pv.titleNo}</span> שלך בליגת השכונה</div>}
      <div className="wk-envelope">
        {career
          ? <>מעטפת הבעלים: <b className="num"><bdi dir="ltr">₪{shown.toLocaleString('en-US')}</bdi></b> לפי {leagueWords}</>
          : <>מעטפת הבעלים: <b className="num"><bdi dir="ltr">₪{shown.toLocaleString('en-US')}</bdi></b> ב{LEAGUE_NAMES[1]} · יותר בליגות גבוהות</>}
      </div>
      <div className="wk-row" style={{ justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span className="wk-pill">אוהדים <span className="num">+{pv.fans}</span></span>
        {career && <span className={`wk-pill ${pv.triple ? 'red' : ''}`}>{monthLine}</span>}
      </div>
      <div className="wk-stack" style={{ gap: 6, margin: '12px 0 8px' }}>
        {top.map((r, i) => <div key={r.device} className={`wk-pr ${i === 0 ? 'first' : ''}`}><span className="n num">{i + 1}</span><span>{r.nick}</span><span className="pts num">{r.points}</span></div>)}
      </div>
      {last && last.nick !== L.me?.nick && <p className="wk-muted">כפרה, {last.nick}.</p>}
      {button}{after}
      <ShareButton text={brag} label="לשלוח לחבר׳ה" className="wk-btn ghost sm" style={{ marginTop: 8 }} />
    </div>
  );
}
