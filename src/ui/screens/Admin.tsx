import { biggestDrop } from '../../game/telemetry.ts';
import { Icon } from '../components/Icon.tsx';

/**
 * The numbers, for Itzik and nobody else.
 *
 * Reached at ?admin=KEY, and the key is checked by the worker rather than
 * here: anything this page holds is public the moment it is served, so a check
 * in the browser would be a lock with the key taped beside it.
 *
 * It is handed its numbers already fetched, and only exists once the worker
 * has accepted the key. It used to mount first and then say "wrong password",
 * which told anyone who tried ?admin=anything that there was a password worth
 * guessing, and took the game away from them while it did.
 *
 * The funnel is the reason this exists. Every bar is how many people reached
 * that step, and the number that matters is the DROP: the step where the bar
 * falls off a cliff is where the game is losing people, and it is the only
 * honest answer to "what should I fix next".
 */
export function AdminScreen({ stats: data }: { stats: Stats }) {
  const top = data.funnel[0]?.n || 1;
  // the one number that says what to fix: the biggest fall between two steps
  const worst = biggestDrop(data.funnel);

  return (
    <div className="screen pad stack pad-b" style={{ gap: 13, paddingTop: 26 }}>
      <div className="row" style={{ gap: 9 }}>
        <Icon name="crowd" size={20} color="var(--gold)" />
        <div className="h2" style={{ fontSize: 22 }}>הנתונים</div>
      </div>

      <div className="row" style={{ gap: 9 }}>
        <Big label="אנשים" value={data.people} />
        <Big label="כניסות" value={data.sittings} />
        <Big label="חזרו שוב" value={data.returned} />
      </div>

      {worst && (
        <div className="tile" style={{ padding: '11px 13px', borderColor: 'rgba(226,72,77,.4)', background: 'rgba(226,72,77,.08)' }}>
          <div className="label-cap" style={{ marginBottom: 4 }}>איפה הכי הרבה עוזבים</div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>
            בין {LABEL[worst.from] ?? worst.from} ל{LABEL[worst.to] ?? worst.to}, ירדו{' '}
            <span className="num" style={{ color: 'var(--loss)' }}>{worst.lost}</span> אנשים
          </div>
        </div>
      )}

      <div className="label-cap">איפה כל אחד עצר</div>
      <div className="tile" style={{ padding: '11px 12px' }}>
        {data.funnel.map(f => (
          <div key={f.step} style={{ margin: '7px 0' }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{LABEL[f.step] ?? f.step}</span>
              <span className="num" style={{ fontSize: 13, fontWeight: 800 }}>
                {f.n}
                <span style={{ color: 'var(--ink-faint)', fontWeight: 700 }}> · {Math.round((f.n / top) * 100)}%</span>
              </span>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,.07)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.max(1, (f.n / top) * 100)}%`, borderRadius: 4,
                background: 'linear-gradient(90deg,var(--gold-lo),var(--gold-hi))',
              }} />
            </div>
          </div>
        ))}
      </div>

{/* The funnel says where people stop; this says whether the screen went
    black there. A bar that falls at the squad screen means one thing if
    nobody crashed on it and something else entirely if everybody did. */}
      {!!data.crashes?.length && (
        <>
          <div className="label-cap">קריסות</div>
          <div className="tile" style={{ padding: '11px 12px', borderColor: 'rgba(226,72,77,.35)' }}>
            {data.crashes.map(c => (
              <div key={c.step + c.err} className="row" style={{ justifyContent: 'space-between', padding: '5px 0', borderTop: '1px solid var(--line)' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>
                  {LABEL[c.step] ?? 'לפני שהתחיל'}
                  <span style={{ color: 'var(--ink-faint)', fontWeight: 600 }} className="num"> · {c.err}</span>
                </span>
                <span className="num" style={{ fontSize: 13, fontWeight: 800, color: 'var(--loss)' }}>
                  {c.n}
                  <span style={{ color: 'var(--ink-faint)', fontWeight: 700 }}> · {c.people} מכשירים</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* The funnel stops at a second season. This is where the careers that kept going got to, which is what says how
          much there is to build past the top: DRAFT WORDING, Itzik's to correct. */}
      {data.reach && (
        <>
          <div className="label-cap">לאן מגיעים</div>
          <div className="tile" style={{ padding: '11px 12px' }}>
            {[1, 2, 3, 4, 5].map(t => {
              const ever = data.reach!.ever.find(x => x.tier === t)?.n ?? 0;
              const best = data.reach!.best.find(x => x.tier === t)?.n ?? 0;
              const won = data.reach!.titles.find(x => x.tier === t)?.n ?? 0;
              return (
                <div key={t} className="row" style={{ justifyContent: 'space-between', padding: '5px 0', borderTop: t > 1 ? '1px solid var(--line)' : undefined }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{TIER_NAME[t]}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                    <span className="num">{ever}</span> היו שם
                    <span style={{ color: 'var(--ink-faint)' }}> · </span>
                    <span className="num">{best}</span> עצרו שם
                    <span style={{ color: 'var(--ink-faint)' }}> · </span>
                    <span className="num" style={{ color: won ? 'var(--gold-hi)' : undefined }}>{won}</span> לקחו אליפות
                  </span>
                </div>
              );
            })}
          </div>
          <div className="label-cap">באיזו עונה עצרו (המקסימום שכל אחד הגיע אליו)</div>
          <div className="tile" style={{ padding: '11px 12px' }}>
            {data.reach.seasons.length === 0
              ? <div className="sub" style={{ fontSize: 13 }}>עוד אין נתונים. הם נספרים מהרגע שהמדידה עלתה.</div>
              : <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
                {data.reach.seasons.map(s => (
                  <span key={s.season} className="chip" style={{ background: 'rgba(255,255,255,.06)', color: 'var(--ink-dim)' }}>
                    עונה <span className="num">{s.season === 20 ? '20+' : s.season}</span>: <span className="num" style={{ fontWeight: 800 }}>{s.n}</span>
                  </span>
                ))}
              </div>}
          </div>
          {data.reach.europe && data.reach.europe.length > 0 && (
            <>
              <div className="label-cap">ליגת אירופה</div>
              <div className="tile" style={{ padding: '11px 12px' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                  <span className="num">{data.reach.europe.find(x => x.step === 'eu_in')?.n ?? 0}</span> נכנסו לגביע
                  <span style={{ color: 'var(--ink-faint)' }}> · </span>
                  <span className="num">{data.reach.europe.find(x => x.step === 'eu_final')?.n ?? 0}</span> הגיעו לגמר
                  <span style={{ color: 'var(--ink-faint)' }}> · </span>
                  <span className="num" style={{ color: data.reach.europe.find(x => x.step === 'eu_won') ? 'var(--gold-hi)' : undefined }}>{data.reach.europe.find(x => x.step === 'eu_won')?.n ?? 0}</span> זכו בו
                </span>
              </div>
            </>
          )}
          {data.reach.cup && data.reach.cup.length > 0 && (
            <>
              <div className="label-cap">גביע המדינה</div>
              <div className="tile" style={{ padding: '11px 12px' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                  <span className="num">{data.reach.cup.find(x => x.step === 'cup_in')?.n ?? 0}</span> נכנסו לגביע
                  <span style={{ color: 'var(--ink-faint)' }}> · </span>
                  <span className="num">{data.reach.cup.find(x => x.step === 'cup_sf')?.n ?? 0}</span> הגיעו לחצי
                  <span style={{ color: 'var(--ink-faint)' }}> · </span>
                  <span className="num">{data.reach.cup.find(x => x.step === 'cup_final')?.n ?? 0}</span> הגיעו לגמר
                  <span style={{ color: 'var(--ink-faint)' }}> · </span>
                  <span className="num" style={{ color: data.reach.cup.find(x => x.step === 'cup_won') ? 'var(--gold-hi)' : undefined }}>{data.reach.cup.find(x => x.step === 'cup_won')?.n ?? 0}</span> זכו בו
                </span>
              </div>
            </>
          )}
          {data.reach.gift && data.reach.gift.length > 0 && (
            <>
              <div className="label-cap">המתנה למי שנשאר</div>
              <div className="tile" style={{ padding: '11px 12px' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                  <span className="num" style={{ color: 'var(--gold-hi)' }}>{data.reach.gift[0]?.n ?? 0}</span> מנג'רים מעל 10 עונות צירפו את השחקן המושאל
                </span>
              </div>
            </>
          )}
          {data.reach.share && data.reach.share.length > 0 && (
            <>
              <div className="label-cap">שיתוף לחבר</div>
              <div className="tile" style={{ padding: '11px 12px' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                  <span className="num" style={{ color: 'var(--gold-hi)' }}>{data.reach.share[0]?.n ?? 0}</span> מכשירים שלחו רגע גדול לחבר
                </span>
              </div>
            </>
          )}
          {data.reach.daily && data.reach.daily.length > 0 && (
            <>
              <div className="label-cap">המתנה היומית</div>
              <div className="tile" style={{ padding: '11px 12px' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                  <span className="num">{data.reach.daily.find(x => x.step === 'daily_1')?.n ?? 0}</span> לקחו מתנה
                  <span style={{ color: 'var(--ink-faint)' }}> · </span>
                  <span className="num">{data.reach.daily.find(x => x.step === 'daily_7')?.n ?? 0}</span> שבוע שלם
                  <span style={{ color: 'var(--ink-faint)' }}> · </span>
                  <span className="num" style={{ color: data.reach.daily.find(x => x.step === 'daily_30') ? 'var(--gold-hi)' : undefined }}>{data.reach.daily.find(x => x.step === 'daily_30')?.n ?? 0}</span> שלושים יום
                </span>
              </div>
            </>
          )}
          {data.reach.xfer && data.reach.xfer.length > 0 && (
            <>
              <div className="label-cap">העברה לדומיין</div>
              <div className="tile" style={{ padding: '11px 12px' }}>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                  <span className="num">{data.reach.xfer.find(x => x.step === 'xfer_offer')?.n ?? 0}</span> ראו הצעה
                  <span style={{ color: 'var(--ink-faint)' }}> · </span>
                  <span className="num">{data.reach.xfer.find(x => x.step === 'xfer_sent')?.n ?? 0}</span> נשלחו
                  <span style={{ color: 'var(--ink-faint)' }}> · </span>
                  <span className="num" style={{ color: 'var(--gold-hi)' }}>{data.reach.xfer.find(x => x.step === 'xfer_in')?.n ?? 0}</span> הגיעו
                  <span style={{ color: 'var(--ink-faint)' }}> · </span>
                  <span className="num">{data.reach.xfer.find(x => x.step === 'xfer_code')?.n ?? 0}</span> בקוד או בקובץ
                  <span style={{ color: 'var(--ink-faint)' }}> · </span>
                  <span className="num">{data.reach.xfer.find(x => x.step === 'site_new')?.n ?? 0}</span> ישבו באתר החדש
                </span>
              </div>
            </>
          )}
          <p className="hint">
            נספר מרגע שהמדידה עלתה, ומי שממשיך קריירה ישנה נספר בפעם הבאה שהוא פותח את המשחק.
          </p>
        </>
      )}

      <div className="label-cap">לפי יום</div>
      <div className="tile" style={{ padding: '11px 12px' }}>
        {data.daily.length === 0
          ? <div className="sub" style={{ fontSize: 13 }}>אין עדיין ימים לספור</div>
          : data.daily.slice().reverse().map(d => (
            <div key={d.day} className="row" style={{ justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid var(--line)' }}>
              <span className="num" style={{ fontSize: 12.5, color: 'var(--ink-dim)' }}>{d.day}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                <span className="num">{d.people}</span> אנשים
                <span style={{ color: 'var(--ink-faint)' }}> · </span>
                <span className="num">{d.sittings}</span> כניסות
              </span>
            </div>
          ))}
      </div>

      <p className="hint">
        אף שם, אף מועדון ואף מילה שמישהו הקליד לא מגיעים לכאן. רק מספר אקראי לכל מכשיר ומה הוא הספיק.
      </p>
    </div>
  );
}

function Big({ label, value }: { label: string; value: number }) {
  return (
    <div className="tile" style={{ flex: 1, padding: '11px 8px', textAlign: 'center' }}>
      <div className="score-face" style={{ fontSize: 27, color: 'var(--gold-hi)' }}>{value}</div>
      <div className="sub" style={{ fontSize: 12 }}>{label}</div>
    </div>
  );
}

export type Stats = {
  funnel: { step: string; n: number }[];
  people: number;
  sittings: number;
  returned: number;
  daily: { day: string; people: number; sittings: number }[];
  /** where the game broke, and on how many separate phones */
  crashes?: { step: string; err: string; n: number; people: number }[];
  /** where careers get to, absent from a worker that does not report it yet */
  reach?: {
    grid: { tier: number; season: number; n: number }[];
    ever: { tier: number; n: number }[];
    best: { tier: number; n: number }[];
    seasons: { season: number; n: number }[];
    titles: { tier: number; n: number }[];
    /** the European cup, absent from a worker that does not count it yet */
    europe?: { step: string; n: number }[];
    /** גביע המדינה, absent from a worker that does not count it yet (see HANDOFF: the worker's MILESTONE regex and REACH_SQL need cup_in/cup_sf/cup_final/cup_won added before this ever arrives) */
    cup?: { step: string; n: number }[];
    /** the loyalty gift, absent from a worker that does not count it yet */
    gift?: { n: number }[];
    /** devices that sent a big moment to a friend, absent from a worker that does not count it yet */
    share?: { n: number }[];
    /** the daily gift's three marks, absent from a worker that does not count them yet */
    daily?: { step: string; n: number }[];
    /** the move to beapro.co.il, absent from a worker that does not count it yet */
    xfer?: { step: string; n: number }[];
  };
};

const TIER_NAME: Record<number, string> = { 1: 'ליגה ג׳', 2: 'ליגה ב׳', 3: 'ליגה א׳', 4: 'הליגה הלאומית', 5: 'ליגת העל' };

/** the steps in words, so the chart reads without the code beside it */
const LABEL: Record<string, string> = {
  open: 'פתחו את המשחק',
  title: 'ראו את מסך הפתיחה',
  career_new: 'התחילו קריירה',
  manager: 'נתנו שם',
  club: 'בחרו עיר וצבעים',
  archetype: 'בחרו מי הם',
  signing: 'חתמו בחוזה',
  friends: 'שלב החברים',
  squad: 'ראו את הסגל',
  market: 'ראו את השוק',
  season: 'יצאו לליגה',
  match1_start: 'פתחו משחק ראשון',
  match1_half: 'הגיעו למחצית בו',
  round_1: 'שיחקו מחזור',
  round_3: 'שיחקו שלושה',
  round_7: 'חצי עונה',
  season_end: 'סיימו עונה',
  season_2: 'חזרו לעונה שנייה',
};
