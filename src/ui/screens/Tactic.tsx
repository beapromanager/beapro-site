import * as G from '../../game/state.ts';
import type { Approach, Press } from '../../engine/matchEngine.ts';
import { Meters } from '../components/bits.tsx';
import { Crest } from '../components/Crest.tsx';
import { Icon } from '../components/Icon.tsx';
import { AssistantNote } from '../components/AssistantNote.tsx';
import { FORMATIONS, formation } from '../../data/formations.ts';
import { ShapeMap } from '../components/ShapeMap.tsx';

const APPROACH: { id: Approach; label: string; desc: string }[] = [
  { id: 'defensive', label: 'בונקר ומתפרצות', desc: 'סוגרים מאחור ומחכים לרגע הנכון' },
  { id: 'balanced', label: 'משחק מאוזן', desc: 'לא מתאבדים ולא נרדמים' },
  { id: 'attacking', label: 'לוחצים קדימה', desc: 'הולכים עליהם, אבל נפתחים מאחור' },
];
const PRESS: { id: Press; label: string }[] = [
  { id: 'low', label: 'נמוך' },
  { id: 'mid', label: 'בינוני' },
  { id: 'high', label: 'גבוה' },
];

export function TacticScreen({ gs, onSet, onGo }: {
  gs: G.GameState; onSet: (t: G.Tactic) => void; onGo: () => void;
}) {
  const t = gs.tactic;
  const c = G.club(gs);
  const fx = G.playerFixture(gs);
  const rivalId = fx ? (fx.homeId === gs.clubId ? fx.awayId : fx.homeId) : null;
  const rival = gs.league.clubs.find(x => x.id === rivalId);
  const scout = G.matchupScout(gs);

  return (
    <>
      <Meters {...gs.meters} gems={gs.gems} />
      <div className="screen pad stack" style={{ gap: 16 }}>
        <div className="row" style={{ marginTop: 2, gap: 10 }}>
          <Icon name="clipboard" size={22} color="var(--gold)" />
          <div style={{ flex: 1 }}>
            <div className="h2">איך משחקים היום?</div>
            {rival && <div className="sub" style={{ fontSize: 14 }}>מול {rival.short}</div>}
          </div>
          <Crest club={c} size={38} />
        </div>

        {scout && <ScoutTile scout={scout} />}

        <div>
          <div className="label-cap" style={{ marginBottom: 9 }}>מערך</div>
          <div className="form-row">
            {FORMATIONS.map(f => (
              <button key={f.id} className="form-pick" data-on={t.formation === f.id ? '1' : '0'}
                onClick={() => onSet({ ...t, formation: f.id })}
                aria-pressed={t.formation === f.id}>
                <ShapeMap f={f} on={t.formation === f.id} />
                <span className="form-num">{f.label}</span>
                <span className="form-name">{f.name}</span>
              </button>
            ))}
          </div>
          <p className="hint">{formation(t.formation).desc}</p>
        </div>

        <div>
          <div className="label-cap" style={{ marginBottom: 9 }}>סגנון משחק</div>
          <div className="stack stagger" style={{ gap: 9 }}>
            {APPROACH.map((a, i) => (
              <button key={a.id} className="tile select" data-on={t.approach === a.id ? '1' : '0'}
                style={{ ...({ '--i': i } as React.CSSProperties), textAlign: 'start' }}
                onClick={() => onSet({ ...t, approach: a.id })}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, fontSize: 16 }}>{a.label}</span>
                  {t.approach === a.id && <Icon name="target" size={17} color="var(--gold)" />}
                </div>
                <div className="sub" style={{ fontSize: 13.5, marginTop: 3 }}>{a.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="label-cap" style={{ marginBottom: 9 }}>גובה הלחץ</div>
          <div className="seg">
            {PRESS.map(p => (
              <button key={p.id} data-on={t.press === p.id ? '1' : '0'} onClick={() => onSet({ ...t, press: p.id })}>
                {p.label}
              </button>
            ))}
          </div>
          <p className="hint">לחץ גבוה חוטף כדורים למעלה, אבל שורף כושר מהר יותר.</p>
        </div>

        <AssistantNote gs={gs} options={APPROACH.map(a => a.label)} salt={1} />

        <div className="spacer" />
        {/* 2.11 (Itzik): the kickoff rides the bottom of the screen, so it is there without scrolling
            on a small phone; it still sits last in the flow, so nothing ends up hidden under it */}
        <div className="cta-dock">
          <button className="btn" onClick={onGo}>
            <Icon name="whistle" size={18} /> שריקת פתיחה
          </button>
        </div>
      </div>
    </>
  );
}


/**
 * The shape itself, drawn from the same slots the live pitch uses, so what you
 * pick here is literally what you will watch out there.
 */
function ScoutTile({ scout }: { scout: G.Scout }) {
  const tone = scout.verdict === 'favourite' ? 'var(--win)' : scout.verdict === 'underdog' ? 'var(--loss)' : 'var(--gold)';
  const label = scout.verdict === 'favourite' ? 'אתם הפייבוריטים' : scout.verdict === 'underdog' ? 'אתם האאוטסיידרים' : 'מאבק שקול';
  return (
    <div className="tile-hero" style={{ padding: 14, borderColor: `${tone}55` }}>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <span className="label-cap">דוח סקאוטינג</span>
        <span className="chip" style={{ background: `${tone}22`, color: tone, border: `1px solid ${tone}55` }}>
          {label}
        </span>
      </div>
      <div className="row" style={{ justifyContent: 'space-between', gap: 12 }}>
        <RatingCol label="הסגל שלך" value={scout.mine} accent="var(--gold-hi)" />
        <div className="stack" style={{ alignItems: 'center', gap: 2 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--ink-faint)' }}>
            {scout.iAmHome ? 'בית' : 'חוץ'}
          </span>
        </div>
        <RatingCol label={scout.oppShort} value={scout.opp} accent={tone} />
      </div>
      <div className="sub" style={{ fontSize: 14.5, marginTop: 11, lineHeight: 1.5 }}>{scout.line}</div>
    </div>
  );
}

function RatingCol({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="stack" style={{ alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
      <div className="score-face" style={{ fontSize: 30, color: accent }}>{value}</div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-dim)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{label}</div>
    </div>
  );
}
