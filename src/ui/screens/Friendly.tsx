import { useEffect, useState } from 'react';
import * as G from '../../game/state.ts';
import { Crest } from '../components/Crest.tsx';
import type { FriendlyReport } from '../../data/friendly.ts';

/**
 * The works team's friendly, told after the sheet is sent.
 *
 * The match was played in an instant, so the screen is the evening in short:
 * the board a stadium would have, lit, then the story one line at a time, then
 * what the works team paid. Staged with timers the way the kit reveal is, and a
 * tap anywhere skips to the end, because nobody should sit through it twice.
 *
 * The board is type and CSS, not an image: amber digits behind a dot grid, so
 * it carries the real names and the real score without a picture per result.
 */
export function FriendlyScreen({ gs, onDone }: { gs: G.GameState; onDone: () => void }) {
  const report = gs.matchMods.friendly!.report!;
  const c = G.club(gs);
  const [mine, theirs] = report.score;

  // 0 the board is dark · 1 the score is lit · then a line at a time · then the way on
  const total = report.lines.length;
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [setTimeout(() => setStep(s => Math.max(s, 1)), 450)];
    for (let i = 0; i < total; i++) {
      t.push(setTimeout(() => setStep(s => Math.max(s, i + 2)), 1100 + i * 700));
    }
    return () => t.forEach(clearTimeout);
  }, [total]);
  const done = step >= total + 1;
  // Itzik, 3.11: after the friendly the league match started at once, with nothing
  // between the two. A pause card now stands between them: what happened, what next.
  const [pause, setPause] = useState(false);
  const skip = () => (done ? undefined : setStep(total + 1));
  const lit = step >= 1;
  if (pause) return <FriendlyPause gs={gs} report={report} onDone={onDone} />;

  return (
    <div className="screen pad stack pad-b friendly" onClick={skip}>
      <div style={{ marginTop: 4 }}>
        <div className="h2">משחק ידידות</div>
        <div className="sub" style={{ fontSize: 13.5 }}>
          70 שנה ל{report.factory}
        </div>
      </div>

      <div className="fr-board" data-lit={lit ? '1' : '0'} role="img"
        aria-label={`${c.short} ${mine}, ${report.factory} ${theirs}`}>
        <div className="fr-board-top">
          <span>ידידות</span>
          <span className="fr-ft">שריקת סיום</span>
        </div>
        <div className="fr-board-row">
          <div className="fr-team">
            <Crest club={c} size={38} />
            <span className="fr-name">{c.short}</span>
          </div>
          <div className="fr-digits" aria-hidden="true">
            <i>{theirs}</i>
            <b>:</b>
            <i>{mine}</i>
          </div>
          <div className="fr-team">
            <span className="fr-works" aria-hidden="true">מפעל</span>
            <span className="fr-name">{report.factory}</span>
          </div>
        </div>
        <span className="fr-bolt fr-bolt-a" aria-hidden="true" />
        <span className="fr-bolt fr-bolt-b" aria-hidden="true" />
      </div>

      <div className="tile fr-story">
        {report.lines.map((line, i) => (
          <p key={i} className="fr-line" data-in={step >= i + 2 ? '1' : '0'}>{line}</p>
        ))}
        <p className="fr-fee" data-in={done ? '1' : '0'}>
          {report.factory} שילם <span className="num">{report.fee.toLocaleString('en-US')}</span> שקל על ההופעה.
        </p>
      </div>

      <button className="btn" disabled={!done}
        style={{ opacity: done ? 1 : 0, transition: 'opacity .3s ease' }}
        onClick={e => { e.stopPropagation(); setPause(true); }}>
        המשך ←
      </button>
    </div>
  );
}

/** The pause between the friendly and the league: nothing is paid or played until המשך. */
function FriendlyPause({ gs, report, onDone }: { gs: G.GameState; report: FriendlyReport; onDone: () => void }) {
  const [mine, theirs] = report.score;
  const verdict = mine > theirs ? 'ניצחנו בידידות' : mine < theirs ? 'הפסדנו בידידות' : 'תיקו בידידות';
  const fx = G.playerFixture(gs);
  const home = fx?.homeId === gs.clubId;
  const rival = fx ? gs.league.clubs.find(c => c.id === (home ? fx.awayId : fx.homeId)) : undefined;
  const c = G.club(gs);
  // the men who played the friendly: finishFriendly adds FRIENDLY_TIRED to each of them on המשך
  const squad = G.mySquad(gs);
  const roster = new Map([...squad.starters, ...squad.bench].map(p => [p.id, p.name] as const));
  const tired = report.played.map(id => roster.get(id)).filter((n): n is string => !!n);
  return (
    <div className="screen pad stack pad-b friendly-pause">
      <div style={{ marginTop: 4 }}>
        <div className="h2">משחק הידידות נגמר</div>
        <div className="sub" style={{ fontSize: 13.5 }}>{verdict} מול {report.factory}</div>
      </div>
      <div className="tile">
        <p>{c.short} <span className="num">{mine}</span>, {report.factory} <span className="num">{theirs}</span></p>
        <p>הקופה: <bdi dir="ltr" className="num">+{report.fee.toLocaleString('en-US')}</bdi> שקל מ{report.factory}</p>
        {tired.length > 0 && <p>עייפים קצת לקראת הליגה: {tired.join(', ')}.</p>}
      </div>
      <div className="tile">
        <div className="h3">עכשיו: משחק ליגה</div>
        <p>מחזור <span className="num">{gs.week}</span>{rival ? `, ${home ? 'בבית' : 'בחוץ'} מול ${rival.short}.` : '.'}</p>
        <p>הנקודות כאן נספרות.</p>
      </div>
      <button className="btn" onClick={onDone}>המשך ←</button>
    </div>
  );
}
