/**
 * ONBOARD_V2, plan T4: the city picker, now the real screen rather than the
 * T1 placeholder. No sponsor, no kit choice here — the real OnboardClub
 * screen (Onboard.tsx) stays the old flow's own; this is the quick path
 * from the prologue's own 'city' hand-off straight into quickStart
 * (onboardV2.ts). Confirming a city goes straight to the first match's
 * build-up: the arrival beat that used to sit here (ObArrive, shot
 * s12-loyal, two players at the gate) was cut 2.11 at Itzik's word, the two
 * friends now appear only after match 1 (ObFriends).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { CITIES } from '../../data/cities.ts';
import { Icon } from '../components/Icon.tsx';
import { SHOTS } from '../onboard/shots.ts';
import { obMark } from '../../game/telemetry.ts';

/**
 * Pick a city from the full list (same CITIES the rest of the game reads,
 * so this check and the UI never disagree about what is on screen), type an
 * optional name, confirm, and go straight to quickStart.
 */
export function ObCityScreen({ onDone }: { onDone: (city: string, name: string) => void }) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // 2.11 flow audit: the search is where he starts, so a mouse/keyboard player lands in it.
  // Never on a touch phone: iOS would throw the keyboard up over the list before he has read the screen.
  useEffect(() => {
    if (window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) searchRef.current?.focus({ preventScroll: true });
  }, []);

  const list = useMemo(() => {
    const s = q.trim();
    return s ? CITIES.filter(c => c.name.includes(s)) : CITIES;
  }, [q]);

  function confirm() {
    if (!selected) return;
    obMark('ob_city');
    if (name.trim()) obMark('ob_named_self');
    onDone(selected, name);
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
        <div className="ob-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.6-4.6" />
          </svg>
          <input
            ref={searchRef} type="text" inputMode="search" enterKeyHint="search" aria-label="חפש את העיר שלך"
            className="field" value={q} onChange={e => setQ(e.target.value)}
            // Enter takes the top match, so typing the city and hitting Enter is enough
            onKeyDown={e => { if (e.key === 'Enter' && list.length) { setSelected(list[0].name); e.currentTarget.blur(); } }}
            placeholder="חפש עיר, או בחר מהרשימה" autoComplete="off" autoCorrect="off" spellCheck={false}
          />
        </div>

        <div className="stack ob-cityList" style={{ gap: 7, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
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
