/**
 * ONBOARD_V2, plan T4: the city picker, now the real screen rather than the
 * T1 placeholder. No sponsor, no kit choice here — the real OnboardClub
 * screen (Onboard.tsx) stays the old flow's own; this is the quick path
 * from the prologue's own 'city' hand-off straight into quickStart
 * (onboardV2.ts), with one short beat (ObArrive.tsx, shot s12-loyal)
 * between confirming a city and actually calling it.
 */
import { useEffect, useMemo, useState } from 'react';
import { CITIES } from '../../data/cities.ts';
import { Icon } from '../components/Icon.tsx';
import { SHOTS, preloadShots } from '../onboard/shots.ts';
import { obMark } from '../../game/telemetry.ts';
import { ObArriveScreen } from './onboard/ObArrive.tsx';

/**
 * Pick a city from the full list (same CITIES the rest of the game reads,
 * so this check and the UI never disagree about what is on screen), type an
 * optional name, confirm, one arrival beat (ObArrive), and go
 * straight to quickStart.
 */
export function ObCityScreen({ onDone }: { onDone: (city: string, name: string) => void }) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [arrived, setArrived] = useState(false);

  const list = useMemo(() => {
    const s = q.trim();
    return s ? CITIES.filter(c => c.name.includes(s)) : CITIES;
  }, [q]);

  // the next beat after the pick is ObArrive (s12-loyal): warm only that one (plan section 7)
  useEffect(() => { preloadShots(['s12-loyal']); }, []);

  function confirm() {
    if (!selected) return;
    obMark('ob_city');
    if (name.trim()) obMark('ob_named_self');
    setArrived(true);
  }

  if (arrived && selected) {
    return <ObArriveScreen onContinue={() => onDone(selected, name)} />;
  }

  const bgShot = SHOTS['s11-city'];
  const bgStyle = bgShot.image ? { backgroundImage: `url('${bgShot.image}'), var(--ob-dawn-grad)` } : { background: 'var(--ob-dawn-grad)' };

  return (
    <div className="ob-frame ob-full" style={bgStyle}>
      <div className="ob-shade" aria-hidden="true" />
      <div className="ob-cityHead">
        <span className="eyebrow">BE A PRO</span>
        <h1 className="h1" style={{ marginTop: 10 }}>באיזו עיר?</h1>
        <p className="sub">הקבוצה של העיר שלך היא הקבוצה שתיקח.</p>
      </div>

      <div className="ob-cityCard">
        <input
          className="field" value={q} onChange={e => setQ(e.target.value)}
          placeholder="חפש עיר" autoComplete="off" autoCorrect="off" spellCheck={false}
        />

        <div className="stack" style={{ gap: 7, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {list.map(c => {
            const on = selected === c.name;
            return (
              <button key={c.name} onClick={() => setSelected(c.name)} aria-pressed={on}
                style={{
                  textAlign: 'start', padding: '15px 16px', borderRadius: 'var(--plate-sm)',
                  background: on ? 'rgba(233,185,73,.14)' : 'var(--surface)',
                  border: on ? '2px solid var(--gold)' : '1px solid var(--line)',
                  fontSize: 16.5, fontWeight: 700, color: 'var(--ink)',
                }}>
                {c.name}
              </button>
            );
          })}
          {list.length === 0 && <p className="hint">לא נמצאה עיר כזאת.</p>}
        </div>

        <div>
          <label className="lbl" htmlFor="ob-name">השם שלך (לא חובה)</label>
          <input
            id="ob-name" className="field" value={name}
            onChange={e => setName(e.target.value)}
            placeholder="המאמן" maxLength={22} autoComplete="off"
          />
        </div>

        <button className="btn" disabled={!selected} onClick={confirm}>
          {selected ? `קח אותי ל${selected}` : 'בחר עיר כדי להמשיך'}
          {selected && <Icon name="chevron" size={17} />}
        </button>
      </div>
    </div>
  );
}
