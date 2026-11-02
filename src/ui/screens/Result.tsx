import { useState } from 'react';
import * as G from '../../game/state.ts';
import { Meters, Badge, ScorePair } from '../components/bits.tsx';
import { MiniTable } from './Table.tsx';
import { FanNote } from '../components/FanNote.tsx';
import { CoachCelebrate } from '../components/CoachGuide.tsx';
import { StadiumRevealOverlay } from './Stadium.tsx';
import { fansAfterResult } from '../../game/fans.ts';
import { isDerby } from '../../data/clubs.ts';
import { Icon } from '../components/Icon.tsx';

export function ResultScreen({ gs, onContinue }: { gs: G.GameState; onContinue: () => void }) {
  // a build that opened this round unveils itself over the result, once
  const [reveal, setReveal] = useState(gs.stadiumReveal);
  const r = gs.lastPlayerMatch!;
  const fx = G.playerFixture(gs)!;
  const iAmHome = fx.homeId === gs.clubId;
  const myGoals = iAmHome ? r.score[0] : r.score[1];
  const oppGoals = iAmHome ? r.score[1] : r.score[0];
  const won = myGoals > oppGoals, draw = myGoals === oppGoals;
  const homeClub = gs.league.clubs.find(c => c.id === fx.homeId)!;
  const awayClub = gs.league.clubs.find(c => c.id === fx.awayId)!;

  const headline = won
    ? `${myGoals}:${oppGoals} ${iAmHome ? 'בבית' : 'בחוץ'}. היציע יצא מרוצה.`
    : draw
      ? `${myGoals}:${oppGoals}. נקודה ביד, אפשר היה יותר.`
      : `הפסד ${oppGoals}:${myGoals}. קורה, מתקנים בשבוע הבא.`;

  const color = won ? 'var(--win)' : draw ? 'var(--draw)' : 'var(--loss)';
  // what the scoreline did to the terrace, the same sum the round applied
  const fansMove = fansAfterResult(myGoals - oppGoals, isDerby(fx.homeId, fx.awayId));

  return (
    <>
      <Meters {...gs.meters} gems={gs.gems} />
      <div className="screen pad stack" style={{ gap: 14 }}>
        {won && (
          <div className="win-hero">
            <div className="win-hero-glow" aria-hidden="true" />
            <CoachCelebrate />
            <div className="win-hero-word">ניצחון</div>
            <div className="win-hero-score num">{myGoals} : {oppGoals}</div>
          </div>
        )}

        <div className="tile" style={{ textAlign: 'center', borderColor: color }}>
          <div className="row" style={{ justifyContent: 'center', gap: 14 }}>
            <Badge club={homeClub} size={40} />
            <ScorePair h={r.score[0]} a={r.score[1]} size={40} color={color} />
            <Badge club={awayClub} size={40} />
          </div>
          <div style={{ marginTop: 8, fontWeight: 700 }}>{headline}</div>
          {fansMove !== 0 && (
            <div className="row" style={{ justifyContent: 'center', gap: 6, marginTop: 8, fontSize: 14, color: fansMove > 0 ? 'var(--win)' : 'var(--loss)' }}>
              <Icon name="flag" size={14} />
              <span>היציע</span>
              <b className="num">{fansMove > 0 ? `+${fansMove}` : fansMove}</b>
            </div>
          )}
        </div>

        {gs.lastLedger && <Ledger l={gs.lastLedger} outlook={G.purseOutlook(gs)} />}

        <div className="tile">
          <div className="sub" style={{ marginBottom: 8 }}>רגעים מהמשחק</div>
          <div className="stack" style={{ gap: 6 }}>
            {r.events.filter(e => e.type.includes('goal') || e.type === 'red').slice(0, 5).map((e, i) => (
              <div key={i} className="row"><span className="num" style={{ color: 'var(--gold-hi)', width: 34, fontWeight: 800 }}>{e.minute}'</span><span style={{ fontSize: 16 }}>{e.text}</span></div>
            ))}
            {r.events.filter(e => e.type.includes('goal')).length === 0 && <div className="sub">משחק סגור בלי שערים.</div>}
          </div>
        </div>

        <div>
          <div className="sub" style={{ margin: '2px 0 8px' }}>שאר המחזור</div>
          <div className="tile" style={{ padding: 10 }}>
            <div className="stack" style={{ gap: 6 }}>
              {gs.lastRound.filter(m => m.homeId !== gs.clubId && m.awayId !== gs.clubId).map((m, i) => {
                const h = gs.league.clubs.find(c => c.id === m.homeId)!;
                const a = gs.league.clubs.find(c => c.id === m.awayId)!;
                return <div key={i} className="row" style={{ justifyContent: 'space-between', fontSize: 14 }}>
                  <span>{h.short}</span><ScorePair h={m.hg} a={m.ag} size={14} /><span>{a.short}</span>
                </div>;
              })}
            </div>
          </div>
        </div>

        <FanNote msg={G.fanNote(gs, 'post')} />

        <MiniTable gs={gs} highlight={gs.clubId} rows={5} />

        {/* 2.11 (Itzik): docked at the bottom like the kickoff, the way on is visible without scrolling */}
        <div className="cta-dock">
          <button className="btn" onClick={onContinue}>לחדר העיתונאים ‹</button>
        </div>
      </div>

      {reveal && <StadiumRevealOverlay reveal={reveal} onDone={() => setReveal(null)} />}
    </>
  );
}

const shekel = (n: number) => `${n < 0 ? '-' : ''}₪${Math.abs(n).toLocaleString('en-US')}`;

/**
 * The week's books. A win barely covers the running of the club, a defeat
 * bleeds, and that is the point: it turns every result into a financial event
 * instead of a number that only ever grows.
 */
function Ledger({ l, outlook }: { l: G.RoundLedger; outlook: { expected: number } | null }) {
  const up = l.net >= 0;
  const rows: { label: string; value: number }[] = [
    { label: 'פרס מהמשחק', value: l.prize },
  ];
  if (l.gate > 0) rows.push({ label: 'הכנסות שער', value: l.gate });
  if (l.sponsor > 0) rows.push({ label: 'חסות', value: l.sponsor });
  if (l.signage > 0) rows.push({ label: 'שילוט באצטדיון', value: l.signage });
  // DRAFT WORDING, Itzik's to correct
  if ((l.purse ?? 0) > 0) rows.push({ label: 'מקדמה מפרס העונה', value: l.purse! });
  rows.push({ label: 'שכר שחקנים', value: -l.wages });
  rows.push({ label: 'תחזוקת מגרש', value: -l.pitch });
  if (l.security > 0) rows.push({ label: 'אבטחה במשחק בית', value: -l.security });

  return (
    <div className="tile" style={{ borderColor: up ? 'rgba(47,169,107,.3)' : 'rgba(226,72,77,.3)' }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 9 }}>
        <span className="sub" style={{ margin: 0 }}>המאזן השבועי</span>
        <span className="num" style={{ fontWeight: 900, fontSize: 16, color: up ? 'var(--win)' : 'var(--loss)' }}>
          {up ? '+' : ''}{shekel(l.net)}
        </span>
      </div>
      <div className="stack" style={{ gap: 5 }}>
        {rows.map((row, i) => (
          <div key={i} className="row" style={{ justifyContent: 'space-between', fontSize: 14 }}>
            <span style={{ color: 'var(--ink-dim)' }}>{row.label}</span>
            <span className="num" style={{ fontWeight: 700, color: row.value >= 0 ? 'var(--win)' : 'var(--ink)' }}>
              {row.value >= 0 ? '+' : ''}{shekel(row.value)}
            </span>
          </div>
        ))}
      </div>
      {/* DRAFT WORDING, Itzik's to correct */}
      {outlook && outlook.expected > 0 && (
        <div className="hint" style={{ margin: '9px 0 0' }}>
          בסוף העונה ייכנסו עוד {shekel(outlook.expected)}, לפי המקום שלכם היום.
        </div>
      )}
    </div>
  );
}
