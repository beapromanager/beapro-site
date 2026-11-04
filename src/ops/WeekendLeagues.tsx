import { useState } from 'react';
import type { StatsRaw } from './model.ts';
import { STATUS_LABEL, KIND_LABEL, whenText } from './weekend.ts';
import { buildLeagues, scoreText } from './weekendLeagues.ts';
import { num } from './format.ts';

/** ליגות, טבלאות ותוצאות: one card per league, opened on a tap. Shown only when ext.weekendLeagues arrives. */
export default function WeekendLeagues({ raw }: { raw: StatsRaw }) {
  const v = buildLeagues(raw);
  const [kind, setKind] = useState<'all' | 'friend' | 'open'>('all');
  if (v.state === 'not-yet') {
    return (
      <section className="sec wide" aria-label="ליגות, טבלאות ותוצאות">
        <h2 className="sec-h">ליגות, טבלאות ותוצאות</h2>
        <div className="sec-b">
          <p className="empty">שמות הליגות, הטבלאות והתוצאות עוד לא מגיעים מהשרת. זה דורש עדכון של שני השרתים, רק באישור שלך.</p>
        </div>
      </section>
    );
  }
  const shown = v.leagues.filter(l => kind === 'all' || l.kind === kind);
  return (
    <section className="sec wide" aria-label="ליגות, טבלאות ותוצאות">
      <h2 className="sec-h">ליגות, טבלאות ותוצאות</h2>
      <div className="sec-b">
        <div className="seg" role="radiogroup" aria-label="סוג ליגה">
          {(['all', 'friend', 'open'] as const).map(k => (
            <button key={k} role="radio" aria-checked={kind === k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
              {k === 'all' ? `הכול (${v.leagues.length})` : `${KIND_LABEL[k]} (${v.leagues.filter(l => l.kind === k).length})`}
            </button>
          ))}
        </div>
        {v.total > v.leagues.length && <p className="msg warn">מוצגות {num(v.leagues.length)} מתוך {num(v.total)} ליגות (חלק לא ענו בזמן).</p>}
        {shown.length === 0 ? <p className="empty">אין עדיין ליגות בסבב הזה.</p> : shown.map((l, i) => (
          <details key={i} className="lg">
            <summary>
              <b>{l.label}</b>{l.code && <> · קוד <bdi className="num">{l.code}</bdi></>} · {KIND_LABEL[l.kind]} · {STATUS_LABEL[l.status]}
              {' · '}<bdi className="num">{num(l.members)}/{num(l.capacity)}</bdi>
              {l.rounds.length > 0 && <> · מחזור <bdi className="num">{num(l.roundsDone)}/{num(l.rounds.length)}</bdi></>}
            </summary>
            {l.table.length === 0 ? <p className="empty">אין עדיין משתתפים.</p> : (
              <div className="tw">
                <table>
                  <thead><tr><th>#</th><th>קבוצה</th><th>מש׳</th><th>נ</th><th>ה</th><th>שערים</th><th>נק׳</th></tr></thead>
                  <tbody>{l.table.map((r, j) => (
                    <tr key={j}><td className="num">{j + 1}</td><td className="nw"><bdi>{r.club}</bdi></td><td className="num">{num(r.played)}</td><td className="num">{num(r.wins)}</td><td className="num">{num(r.losses)}</td><td className="num"><bdi>{r.gf}:{r.ga}</bdi></td><td className="num"><b>{num(r.points)}</b></td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
            {l.rounds.length === 0 ? <p className="what">המחזורים ייקבעו בנעילה (חמישי 17:00).</p> : l.rounds.map(r => (
              <div key={r.index} className="rd">
                <h3>מחזור {r.index + 1} · <bdi className="num">{whenText(r.at)}</bdi>{r === l.current ? ' · עכשיו' : ''}</h3>
                <ul>{r.matches.map((m, k) => (
                  <li key={k}><bdi>{m.home}</bdi> <span className="num sc" dir="rtl" aria-label={scoreText(m)}>{m.result ? <><bdi>{m.result.score[0]}</bdi>:<bdi>{m.result.score[1]}</bdi>{scoreText(m).slice(String(m.result.score[0]).length + 1 + String(m.result.score[1]).length)}</> : scoreText(m)}</span> <bdi>{m.away}</bdi>{m.result && (m.result.homeAssistant || m.result.awayAssistant) ? <span className="badge">עוזר</span> : null}</li>
                ))}{r.bye && <li className="what">חופשי: <bdi>{r.bye}</bdi></li>}</ul>
              </div>
            ))}
          </details>
        ))}
      </div>
    </section>
  );
}
