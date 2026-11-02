import { useState, type ReactNode } from 'react';
import type { Stage, View } from './model.ts';
import { TIER_LABEL, labelOf } from './labels.ts';
import { ERR_NAME, delta, num, pctText, shortDay } from './format.ts';

const NEEDS = 'דורש עדכון Worker';

function Needs({ what }: { what: string }) {
  return <p className="empty">{what}: {NEEDS} (הקובץ dashboard_worker.patch). עד אז השרת לא מחזיר את המספרים האלה.</p>;
}

function Road({ stages, worstTo, label }: { stages: Stage[]; worstTo?: string; label: string }) {
  const top = stages[0]?.n ?? 0;
  return (
    <ol className="fun" aria-label={label}>
      {stages.map((s, i) => {
        const w = top > 0 && s.n !== null ? Math.max(1, Math.round((s.n / top) * 100)) : 0;
        const worst = s.key === worstTo;
        return (
          <li key={s.key} className={worst ? 'worst' : ''}>
            <div className="row1">
              <span>{i + 1}. {s.label}{worst && <span className="badge">הנפילה הגדולה</span>}</span>
              <b className="num">{s.n === null ? '-' : num(s.n)}</b>
            </div>
            <div className="bar" aria-hidden="true"><i style={{ width: `${s.n === null ? 0 : Math.min(100, w)}%` }} /></div>
            <div className="row2">
              {s.n === null ? NEEDS : i === 0 ? '100%' : <>
                {pctText(s.ofTop)} מההתחלה
                {s.lost !== null && s.lost > 0 && <> · נשרו כאן <bdi className="num">{num(s.lost)}</bdi> ({pctText(s.lostPct)})</>}
                {s.lost !== null && s.lost < 0 && <> · יותר מהשלב הקודם</>}
              </>}
              {s.note && <> · <span className="low">{s.note}</span></>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

type Metric = 'people' | 'sittings' | 'fresh' | 'career_new' | 'ob_prologue' | 'round_1';
const METRICS: { key: Metric; label: string; full: boolean }[] = [
  { key: 'people', label: 'אנשים', full: false },
  { key: 'sittings', label: 'כניסות', full: false },
  { key: 'fresh', label: 'חדשים', full: true },
  { key: 'career_new', label: 'קריירות', full: true },
  { key: 'ob_prologue', label: 'פרולוג', full: true },
  { key: 'round_1', label: 'מחזור 1', full: true },
];

function Trend({ v }: { v: View }) {
  const [m, setM] = useState<Metric>('people');
  const val = (d: View['trend'][number]): number =>
    m === 'people' ? d.people : m === 'sittings' ? d.sittings : m === 'fresh' ? d.fresh ?? 0 : d.steps?.[m] ?? 0;
  const vals = v.trend.map(val);
  const max = Math.max(1, ...vals);
  const sum = vals.reduce((a, b) => a + b, 0);
  const avg = Math.round((sum / Math.max(1, vals.length)) * 10) / 10;
  const usable = METRICS.filter(x => !x.full || v.mode === 'full');
  return (
    <>
      <div className="seg" role="radiogroup" aria-label="מה לראות במגמה">
        {usable.map(x => <button key={x.key} role="radio" aria-checked={m === x.key} onClick={() => setM(x.key)}>{x.label}</button>)}
      </div>
      <div className="days" role="img" aria-label={`מגמה של ${v.trend.length} ימים: סך הכול ${sum}, ממוצע ליום ${avg}`}>
        {v.trend.map((d, i) => (
          <div className="day" key={d.day} title={`${shortDay(d.day)}: ${vals[i]}`}>
            <i className="n" style={{ height: `${Math.round((vals[i] / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="axis"><span>{shortDay(v.trend[0].day)}</span><span>{shortDay(v.trend[v.trend.length - 1].day)}</span></div>
      <p className="what">סך הכול <bdi className="num">{num(sum)}</bdi> · ממוצע ליום <bdi className="num">{num(avg)}</bdi> · השיא <bdi className="num">{num(max === 1 && sum === 0 ? 0 : max)}</bdi> · לפי ימים בשעון {v.dayZone}</p>
      {v.mode === 'basic' && <p className="what">חדשים, קריירות, פרולוג ומחזור 1 לפי יום: {NEEDS}.</p>}
    </>
  );
}

function Sec({ title, wide, children }: { title: string; wide?: boolean; children: ReactNode }) {
  return (
    <section className={`sec${wide ? ' wide' : ''}`} aria-label={title}>
      <h2 className="sec-h">{title}</h2>
      <div className="sec-b">{children}</div>
    </section>
  );
}

export function Dashboard({ v }: { v: View }) {
  const depth = v.depth, share = v.share, dailyGift = v.dailyGift;
  return (
    <>
      {v.mode === 'basic' && (
        <p className="msg warn" role="note">מצב בסיסי: השרת שרץ היום מחזיר רק את המספרים הישנים. אירועי הפתיחה החדשה, הגביע וההשוואות לפי אירוע יופיעו אחרי עדכון ה-Worker.</p>
      )}
      {v.worst && (
        <p className="truth">הכי הרבה נושרים בין <b>{labelOf(v.worst.from)}</b> לבין <b>{labelOf(v.worst.to)}</b>: <bdi className="num">{num(v.worst.lost)}</bdi> אנשים ({pctText(v.worst.lostPct)}).</p>
      )}

      <h2 className="sr">היום מול אתמול</h2>
      <dl className="cards">
        {v.cards.map(c => {
          const d = delta(c.today, c.yesterday);
          return (
            <div className="card" key={c.key}>
              <dt>{c.label} היום</dt>
              <dd className="big num">{c.today === null ? '-' : num(c.today)}</dd>
              <dd className={`dl ${d.dir}`} aria-label={d.spoken}>
                {c.today === null ? NEEDS : <>{d.text} · אתמול{c.partial ? ' (עד אותה שעה)' : ''}: <bdi className="num">{num(c.yesterday)}</bdi></>}
              </dd>
            </div>
          );
        })}
      </dl>
      <p className="prior">
        סך הכול מאז ההתחלה: <bdi className="num">{num(v.totals.people)}</bdi> אנשים, <bdi className="num">{num(v.totals.sittings)}</bdi> כניסות,
        {' '}<bdi className="num">{num(v.totals.returned)}</bdi> חזרו ביום אחר ({pctText(v.totals.returnedPct)}). "היום" לפי שעון {v.dayZone}.
      </p>

      <div className="sections">
        <Sec title={`מגמה, ${v.trend.length} ימים`} wide><Trend v={v} /></Sec>

        <Sec title="המשפך של הפתיחה החדשה">
          <p className="what">{v.newRoadWindow ? `מי שהגיע לכל שלב בפעם הראשונה בתוך ${v.trend.length} הימים האחרונים.` : 'מאז ההתחלה. שלבי הפרולוג והעיר חסרים עד עדכון ה-Worker.'}</p>
          <Road stages={v.newRoad} label="משפך הפתיחה החדשה" />
        </Sec>

        <Sec title="אירועי הפתיחה (ob_)">
          {v.mode === 'basic' && <Needs what="ספירת אירועי הפתיחה" />}
          <div className="tw">
            <table>
              <thead><tr><th>מה קרה</th><th>מאז ההתחלה</th><th>היום</th><th>אתמול</th></tr></thead>
              <tbody>
                {v.ob.map(r => (
                  <tr key={r.key}>
                    <td>{r.side ? '↳ ' : ''}{r.label} <span className="opt" dir="ltr">{r.key}</span>{!r.sent && <span className="badge warnb">עוד לא נשלח מהמשחק</span>}</td>
                    <td className="num">{num(r.n)}</td><td className="num">{num(r.today)}</td><td className="num">{num(r.yesterday)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sec>

        <Sec title="המשפך המלא (כל השלבים)">
          <p className="what">מאז ההתחלה. שחקני הפתיחה החדשה מדלגים על שלבים 4 עד 10, ולכן אצלם יש כאן "נפילה" שאינה עזיבה.</p>
          <Road stages={v.oldRoad} worstTo={v.worst?.to} label="המשפך המלא" />
        </Sec>

        <Sec title="גביע המדינה">
          {v.cup.some(c => c.n === null) ? <Needs what="ספירת הגביע" /> : (
            <div className="pair">{v.cup.map(c => <div className="mini" key={c.key}><div className="t">{c.label}</div><div className="v num">{num(c.n)}</div></div>)}</div>
          )}
        </Sec>

        <Sec title="ליגת אירופה">
          <div className="pair">{v.europe.map(c => <div className={`mini${c.key === 'eu_final' || c.key === 'eu_won' ? ' hl' : ''}`} key={c.key}><div className="t">{c.label}</div><div className="v num">{num(c.n)}</div><div className="s" dir="ltr">{c.key}</div></div>)}</div>
        </Sec>

        <Sec title="המתנה היומית">
          <div className="pair">{dailyGift.map(c => <div className="mini" key={c.key}><div className="t">{c.label}</div><div className="v num">{num(c.n)}</div></div>)}</div>
        </Sec>

        <Sec title="שיתופים ומתנות">
          <div className="pair">
            <div className="mini"><div className="t">שיתוף לחבר (לחצו "שתף")</div><div className="v num">{num(share.tap)}</div></div>
            <div className="mini"><div className="t">המתנה למי שנשאר 10 עונות</div><div className="v num">{num(depth.gift10)}</div></div>
          </div>
        </Sec>

        <Sec title="כסף">
          {v.money.some(c => c.n === null) ? <Needs what="ספירת הקופה והפיטורים" /> : (
            <div className="pair">{v.money.map(c => <div className="mini" key={c.key}><div className="t">{c.label}</div><div className="v num">{num(c.n)}</div></div>)}</div>
          )}
        </Sec>

        <Sec title="ליגת סוף השבוע">
          {v.weekend ? (
            <div className="pair">
              <div className="mini"><div className="t">שלב</div><div className="v">{v.weekend.phase === 'open' ? 'הרשמה פתוחה' : v.weekend.phase === 'locked' ? 'ההרשמה נסגרה' : v.weekend.phase === 'playing' ? 'משחקים' : v.weekend.phase}</div></div>
              <div className="mini"><div className="t">מאמנים רשומים בסבב</div><div className="v num">{num(v.weekend.managers)}</div></div>
              <div className="mini"><div className="t">ליגות חברים</div><div className="v num">{num(v.weekend.friendLeagues)}</div></div>
              <div className="mini"><div className="t">ליגות פתוחות</div><div className="v num">{num(v.weekend.openLeagues)}</div><div className="s">{num(v.weekend.openMembers)} משתתפים</div></div>
              <div className="mini"><div className="t">אלופים (12 חודשים)</div><div className="v num">{num(v.weekend.champions)}</div></div>
            </div>
          ) : (
            <p className="empty">ליגת סוף השבוע רצה על שרת נפרד (beapro-weekend) שאין לו ספירה לדשבורד, והמשחק לא שולח עליה אירועים. כדי לראות כאן מספרים: {NEEDS} (dashboard_weekend.patch, שלב ב׳, לא חובה).</p>
          )}
        </Sec>

        <Sec title="לאן מגיעים" wide>
          <div className="tw">
            <table>
              <thead><tr><th>ליגה</th><th>היו בה אי פעם</th><th>הכי גבוה שהגיעו</th><th>זכו בה</th></tr></thead>
              <tbody>{v.reach.map(r => <tr key={r.tier}><td>{TIER_LABEL[r.tier]}</td><td className="num">{num(r.ever)}</td><td className="num">{num(r.best)}</td><td className="num">{num(r.won)}</td></tr>)}</tbody>
            </table>
          </div>
        </Sec>

        <Sec title="קריסות" wide>
          {v.crashes.length === 0 ? <p className="empty">אין קריסות רשומות.</p> : (
            <div className="tw">
              <table>
                <thead><tr><th>איפה</th><th>סוג</th><th>פעמים</th><th>מכשירים</th></tr></thead>
                <tbody>{v.crashes.map((c, i) => <tr key={i}><td>{c.where}</td><td>{ERR_NAME[c.err] ?? c.err}</td><td className="num">{num(c.n)}</td><td className="num">{num(c.people)}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </Sec>
      </div>
    </>
  );
}
