/**
 * ONBOARD_V2, plan T4: the minimal city picker. No media, no sponsor, no
 * kit choice here — the real OnboardClub screen (Onboard.tsx) stays the old
 * flow's own; this is the quick path straight into quickStart (onboardV2.ts).
 */
import { useMemo, useState } from 'react';
import { CITIES } from '../../data/cities.ts';
import { Icon } from '../components/Icon.tsx';

/** The prologue: one line, one button, into the city picker. */
export function ObPrologueScreen({ onNext }: { onNext: () => void }) {
  return (
    <div className="screen pad stack pad-b" style={{ gap: 16 }}>
      <div style={{ marginTop: 'clamp(4px,2vh,20px)' }}>
        <span className="eyebrow">BE A PRO</span>
        <h1 className="h1" style={{ marginTop: 12 }}>מוכן לנהל?</h1>
        <p className="sub">עיר אחת, קבוצה אחת, ואתה בפנים.</p>
      </div>
      <div className="spacer" />
      <button className="btn" onClick={onNext}>
        בוחרים עיר
        <Icon name="chevron" size={17} />
      </button>
    </div>
  );
}

/**
 * Pick a city from the full list (same CITIES the rest of the game reads,
 * so this check and the UI never disagree about what is on screen), type an
 * optional name, and go straight to quickStart.
 */
export function ObCityScreen({ onDone }: { onDone: (city: string, name: string) => void }) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');

  const list = useMemo(() => {
    const s = q.trim();
    return s ? CITIES.filter(c => c.name.includes(s)) : CITIES;
  }, [q]);

  function confirm() {
    if (!selected) return;
    onDone(selected, name);
  }

  return (
    <div className="screen pad stack pad-b" style={{ gap: 14 }}>
      <div style={{ marginTop: 6 }}>
        <span className="eyebrow">BE A PRO</span>
        <h1 className="h1" style={{ marginTop: 12 }}>מאיזו עיר אתה?</h1>
        <p className="sub">הקבוצה של העיר שלך היא הקבוצה שתיקח.</p>
      </div>

      <input
        className="field" value={q} onChange={e => setQ(e.target.value)}
        placeholder="חפש עיר" autoComplete="off" autoCorrect="off" spellCheck={false}
      />

      <div className="stack" style={{ gap: 7, maxHeight: '44vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
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

      <div className="spacer" />
      <button className="btn" disabled={!selected} onClick={confirm}>
        {selected ? `קח אותי ל${selected}` : 'בחר עיר כדי להמשיך'}
        {selected && <Icon name="chevron" size={17} />}
      </button>
    </div>
  );
}
