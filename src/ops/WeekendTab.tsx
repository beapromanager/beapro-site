import type { ReactNode } from 'react';
import type { StatsRaw } from './model.ts';
import { buildWeekend, leftText, whenText, STATUS_LABEL, type WeekendView } from './weekend.ts';
import { num, pctText, shortDay } from './format.ts';
import WeekendLeagues from './WeekendLeagues.tsx';

/**
 * ליגת סופ״ש: its own tab, loaded only when the owner opens it (App.tsx, React.lazy). Every number here is a count that
 * beapro-weekend keeps and beapro-count passes on; where a number is not kept, the tab says so instead of drawing a zero.
 */
function Sec({ title, wide, children }: { title: string; wide?: boolean; children: ReactNode }) {
  return (
    <section className={`sec${wide ? ' wide' : ''}`} aria-label={title}>
      <h2 className="sec-h">{title}</h2>
      <div className="sec-b">{children}</div>
    </section>
  );
}
const Mini = ({ t, v, s, hl }: { t: string; v: ReactNode; s?: ReactNode; hl?: boolean }) => (
  <div className={`mini${hl ? ' hl' : ''}`}><div className="t">{t}</div><div className="v num">{v}</div>{s !== undefined && <div className="s">{s}</div>}</div>
);
const NOT_YET = 'דורש את עדכון השרתים של הליגה (dashboard_weekend2.patch)';

function Timeline({ v, now }: { v: WeekendView; now: number }) {
  return (
    <ol className="tl" aria-label="לוח הזמנים של הסבב">
      {v.timeline.map(m => (
        <li key={m.key} className={m.when}>
          <span className="dot" aria-hidden="true" />
          <span className="what">{m.label}</span>
          <bdi className="num">{whenText(m.at)}</bdi>
          <span className="sr">{m.when === 'past' ? ' (עבר)' : m.when === 'next' ? ' (הבא)' : ''}</span>
          {m.when === 'next' && <span className="badge goodb">{leftText(m.at - now)}</span>}
        </li>
      ))}
    </ol>
  );
}

function Days({ w }: { w: NonNullable<WeekendView['v2']> }) {
  const max = Math.max(1, ...w.days.map(d => d.n));
  const last = w.days[w.days.length - 1];
  const sum = w.days.reduce((a, d) => a + d.n, 0);
  return (
    <>
      <div className="days wk" role="img" aria-label={`נרשמו לפי יום: ${w.days.map(d => `${shortDay(d.day)} ${d.n}`).join(', ')}`}>
        {w.days.map(d => (
          <div className={`day${d.today ? ' today' : ''}`} key={d.day} title={`${shortDay(d.day)}: ${d.n}`}>
            <span className="cnt num">{d.n}</span>
            <i className="n" style={{ height: `${Math.round((d.n / max) * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="axis">{w.days.map(d => <span key={d.day}>{shortDay(d.day)}</span>)}</div>
      <p className="what">
        סך הכול <bdi className="num">{num(sum)}</bdi> הרשמות בסבב הזה
        {last?.prevCum !== null && last?.prevCum !== undefined
          ? <> · בסבב הקודם עד אותו יום: <bdi className="num">{num(last.prevCum)}</bdi></>
          : <> · אין עדיין סבב קודם להשוות אליו</>}
        . לפי ימים בשעון ישראל.
      </p>
      {w.days.length > 1 && (
        <div className="tw">
          <table>
            <thead><tr><th>יום</th><th>נרשמו</th><th>מצטבר</th><th>סבב קודם, מצטבר</th></tr></thead>
            <tbody>{w.days.map(d => <tr key={d.day}><td>{shortDay(d.day)}{d.today ? ' (היום)' : ''}</td><td className="num">{num(d.n)}</td><td className="num">{num(d.cum)}</td><td className="num">{d.prevCum === null ? '-' : num(d.prevCum)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function WeekendTab({ raw, now: fetched }: { raw: StatsRaw; now: number }) {
  // the league's own clock when it gave one: the numbers, "today" and the countdown are then all of the same moment
  const told = (raw.ext?.weekend as { now?: unknown } | null | undefined)?.now;
  const now = typeof told === 'number' && Number.isFinite(told) ? told : fetched;
  const v = buildWeekend(raw, now);
  if (v.state === 'no-ext' || v.state === 'unwired' || v.state === 'error') {
    return (
      <div className="sections">
        <Sec title="ליגת סופ״ש" wide>
          {v.state === 'error'
            ? <p className="msg warn" role="alert">{v.err}</p>
            : <p className="empty">{v.state === 'no-ext' ? 'השרת שסופר את המשחק עוד בגרסה הישנה (בלי ext), ולכן גם הליגה לא מוצגת.' : v.err}</p>}
          <p className="what">כדי לראות כאן את הליגה: קודם עדכון beapro-weekend, ואחריו עדכון beapro-count, עם אותו סוד בשניהם. עד אז לא מוצג שום מספר, כדי שלא יוצג אפס שאינו אמיתי.</p>
        </Sec>
      </div>
    );
  }
  const h = v.heads!;
  const w = v.v2;
  return (
    <>
      <p className="truth">
        {v.phaseLabel}{v.first ? ' · הסבב הראשון' : ''}
        {v.next && <> · {v.next.label} <bdi className="num">{leftText(v.next.at - now)}</bdi></>}
      </p>
      <dl className="cards">
        <div className="card"><dt>נרשמו לסבב</dt><dd className="big num">{num(h.managers)}</dd><dd className="dl">{w ? <>מהם בתוך ליגות: <bdi className="num">{num(w.seats)}</bdi></> : 'מכשירים'}</dd></div>
        <div className="card"><dt>ליגות חברים</dt><dd className="big num">{num(h.friendLeagues)}</dd><dd className="dl">נפתחו עם קוד</dd></div>
        <div className="card"><dt>ליגות פתוחות</dt><dd className="big num">{num(h.openLeagues)}</dd><dd className="dl"><bdi className="num">{num(h.openMembers)}</bdi> משתתפים</dd></div>
        <div className="card"><dt>חוזרים מסבב קודם</dt><dd className="big num">{w ? num(w.returning) : '-'}</dd><dd className="dl">{w ? `${pctText(w.returningPct)} מהנרשמים` : NOT_YET}</dd></div>
        <div className="card"><dt>אלופים (12 חודשים)</dt><dd className="big num">{num(h.champions)}</dd><dd className="dl">מכשירים שזכו</dd></div>
      </dl>

      <div className="sections">
        <Sec title="לוח הזמנים של הסבב" wide><Timeline v={v} now={now} /></Sec>

        {!w ? (
          <Sec title="שאר המספרים" wide>
            <p className="empty">הרשמות לפי יום, מילוי הליגות, התקדמות המחזורים, נשירה, פרסים, סירובים והיסטוריה: {NOT_YET}. השרת שרץ עכשיו מחזיר רק את חמשת המספרים שלמעלה.</p>
          </Sec>
        ) : (
          <>
            <Sec title="הרשמות לפי יום" wide><Days w={w} /></Sec>

            <Sec title="מבקרים מול נרשמים">
              {w.conv ? (
                <div className="pair">
                  <Mini t="נכנסו למשחק בימי ההרשמה" v={num(w.conv.visitors)} s={`ספירה יומית, ${w.conv.days} ימים`} />
                  <Mini t="נרשמו לליגה" v={num(w.conv.managers)} s={<>לפחות <bdi className="num">{pctText(w.conv.pct)}</bdi> מהם</>} hl />
                </div>
              ) : <p className="empty">אין ימים של המשחק בטווח שנבחר. בחר 7 ימים או יותר בלשונית "כללי".</p>}
              <p className="what">בערך בלבד: מי שנכנס ביומיים נספר פעמיים, והמזהים של המשחק ושל הליגה שונים, אז האחוז האמיתי גבוה מזה או שווה.</p>
              <p className="what">שער הגיל: <b>לא נמדד</b>. הבדיקה נעשית רק בטלפון ולא נשלחת לשום שרת, ולכן אין מספר של מי שנעצר בה.</p>
            </Sec>

            <Sec title="מילוי הליגות">
              <div className="pair">
                <Mini t="מלאות" v={num(w.fill.full)} />
                <Mini t="יש מספיק (6 ומעלה)" v={num(w.fill.enough)} />
                <Mini t="חסרים משתתפים" v={num(w.fill.short)} s="פחות מ-6, עדיין בהרשמה" hl={w.fill.short > 0} />
                <Mini t="מקומות פנויים" v={num(w.fill.seats)} />
              </div>
              <p className="what">
                {(['open', 'locked', 'playing', 'done', 'cancelled'] as const).map((k, i) => <span key={k}>{i ? ' · ' : ''}{STATUS_LABEL[k]} <bdi className="num">{num(w.status[k])}</bdi></span>)}
              </p>
            </Sec>

            <WeekendLeagues raw={raw} />

            <Sec title="הליגות (בלי שמות)" wide>
              {w.rows.length === 0 ? <p className="empty">אין עדיין ליגות בסבב הזה.</p> : (
                <div className="tw">
                  <table>
                    <thead><tr><th>ליגה</th><th>מצב</th><th>משתתפים</th><th>מחזורים</th><th>משחקים</th></tr></thead>
                    <tbody>{w.rows.map((r, i) => (
                      <tr key={i} className={r.stuck ? 'bad' : r.short ? 'warn' : ''}>
                        <td className="nw">{r.label}</td>
                        <td>{STATUS_LABEL[r.status]}{r.stuck && <span className="badge">תקוע</span>}</td>
                        <td className="num">{num(r.members)}/{num(r.capacity)}{r.short && <span className="badge warnb">חסר</span>}</td>
                        <td className="num">{r.rounds ? `${num(r.roundsDone)}/${num(r.rounds)}` : '-'}</td>
                        <td className="num">{r.matches ? `${num(r.done)}/${num(r.matches)}` : '-'}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </Sec>

            <Sec title="מחזורים ומשחקים">
              <div className="pair">
                <Mini t="מחזורים שהסתיימו" v={`${num(w.play.roundsDone)}/${num(w.play.rounds)}`} s={w.play.roundsPct === null ? undefined : pctText(w.play.roundsPct)} />
                <Mini t="משחקים שהסתיימו" v={`${num(w.play.done)}/${num(w.play.matches)}`} s={<>התחילו <bdi className="num">{num(w.play.started)}</bdi></>} />
                <Mini t="שיחק העוזר" v={num(w.play.assistant)} s={w.play.assistantPct === null ? undefined : `${pctText(w.play.assistantPct)} מהמשחקים שהסתיימו`} />
                <Mini t="פנדלים" v={num(w.play.shootouts)} />
              </div>
            </Sec>

            <Sec title="נשירה">
              <div className="pair">
                <Mini t="ליגות שבוטלו" v={num(w.drop.cancelled)} s={<><bdi className="num">{num(w.drop.cancelledMembers)}</bdi> נרשמים בהן</>} hl={w.drop.cancelled > 0} />
                <Mini t="לא סיימו משחק בעצמם" v={num(w.drop.absent)} s="שיחקו, אבל העוזר סיים" />
                <Mini t="הפסד טכני" v={num(w.drop.technical)} s="משחקים" />
              </div>
            </Sec>

            <Sec title="פרסים ויהלומים">
              <div className="pair">
                <Mini t="פרסים שחולקו" v={num(w.prizes.awarded)} />
                <Mini t="יהלומים בפרסים" v={num(w.prizes.gems)} hl />
                <Mini t="מחזורי שכר" v={num(w.prizes.wageRounds)} />
                <Mini t="נאספו" v={num(w.prizes.claimed)} s="פרסים שהשחקן לקח" />
              </div>
            </Sec>

            <Sec title="סירובי הרשמה">
              {w.refused === 0 ? <p className="empty">אין סירובים מאז שהספירה התחילה.</p> : (
                <div className="tw">
                  <table>
                    <thead><tr><th>למה</th><th>פעמים</th></tr></thead>
                    <tbody>{w.refusals.filter(r => r.n > 0).map(r => <tr key={r.key}><td className="nw">{r.label}</td><td className="num">{num(r.n)}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </Sec>

            <Sec title="תקלות">
              <div className="pair">
                <Mini t="יצירת משחק נכשלה" v={num(w.errors.matchFails)} hl={w.errors.matchFails > 0} />
                <Mini t="ליגות תקועות" v={num(w.errors.stuck)} s="מחזור בלי תוצאות שעתיים אחרי הזמן" hl={w.errors.stuck > 0} />
              </div>
            </Sec>

            <Sec title="סבבים קודמים" wide>
              {w.history.length === 0 ? <p className="empty">זה הסבב הראשון שנספר. ההשוואה תופיע מהסבב הבא.</p> : (
                <div className="tw">
                  <table>
                    <thead><tr><th>נפתח</th><th>נרשמו</th><th>חוזרים</th><th>ליגות</th><th>בוטלו</th><th>משחקים</th><th>יהלומים</th><th>סירובים</th></tr></thead>
                    <tbody>{w.history.map(x => (
                      <tr key={x.opens}><td className="nw"><bdi className="num">{whenText(x.opens).split(' ').slice(-2, -1).join('')}</bdi></td><td className="num">{num(x.managers)}</td><td className="num">{num(x.returning)}</td><td className="num">{num(x.leagues)}</td><td className="num">{num(x.cancelled)}</td><td className="num">{num(x.done_matches)}/{num(x.matches)}</td><td className="num">{num(x.gems)}</td><td className="num">{num(x.refused)}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </Sec>
          </>
        )}
      </div>
      <ul className="notes">
        {w && <li>סירובים וחוזרים נספרים מ-<bdi className="num">{whenText(w.since)}</bdi>; ההרשמות לפי יום נבנות מהליגות עצמן, ולכן מלאות גם לפני זה.</li>}
        <li>שמות ליגות, קודי ליגת חברים ושמות קבוצות מוצגים רק בחלק "ליגות, טבלאות ותוצאות". מזהי מכשיר לא מגיעים לכאן אף פעם.</li>
        <li className="w">שער הגיל לא נמדד, והמעבר ממבקר לנרשם הוא הערכה בלבד.</li>
      </ul>
    </>
  );
}
