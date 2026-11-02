import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { clearKey, getStats, hasKey, setKey } from './api.ts';
import { buildView, type StatsRaw } from './model.ts';
import { IDLE_MS, afterFailure, afterSuccess, idleExpired, openGate, waitLeft, type Gate } from './session.ts';
import { RANGES, clockOf } from './format.ts';
import { Dashboard } from './Dashboard.tsx';

type Note = '' | 'bad' | 'rate' | 'down' | 'expired';
const NOTE_TEXT: Record<Exclude<Note, ''>, string> = {
  bad: 'המפתח לא נכון',
  rate: 'יותר מדי ניסיונות, נסה בעוד דקה',
  down: 'אין חיבור לשרת, נסה שוב',
  expired: 'ננעל אחרי 30 דקות בלי פעילות',
};

export function App() {
  const [authed, setAuthed] = useState(false);
  const [note, setNote] = useState<Note>('');
  const [range, setRange] = useState<number>(30);
  const [data, setData] = useState<{ raw: StatsRaw; at: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [failedAt, setFailedAt] = useState<number | null>(null);   // the refresh failed; the numbers on screen are older
  const [gate, setGate] = useState<Gate>(openGate());
  const [tick, setTick] = useState(0);
  const lastActive = useRef(Date.now());
  const pass = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  const lock = useCallback((why: Note) => {
    clearKey();
    seq.current++;
    setAuthed(false); setData(null); setLoading(false); setFailedAt(null); setNote(why);
    if (pass.current) pass.current.value = '';
  }, []);

  const load = useCallback(async (r: number) => {
    const mine = ++seq.current;
    setLoading(true);
    const res = await getStats(r);
    if (mine !== seq.current) return;
    setLoading(false);
    lastActive.current = Date.now();
    if (res.kind === 'ok') { setData({ raw: res.data, at: res.at }); setFailedAt(null); }
    else if (res.kind === 'unauthorized') lock('bad');
    else if (res.kind === 'rate') { setFailedAt(Date.now()); setNote('rate'); }
    else setFailedAt(Date.now());
  }, [lock]);

  /* the wait after three wrong keys counts down on the form */
  useEffect(() => {
    if (authed || waitLeft(gate, Date.now()) <= 0) return;
    const t = setInterval(() => { setTick(n => n + 1); if (waitLeft(gate, Date.now()) <= 0) clearInterval(t); }, 500);
    return () => clearInterval(t);
  }, [authed, gate]);

  /* locked after thirty minutes of nobody touching the page */
  useEffect(() => {
    if (!authed) return;
    const touch = () => { lastActive.current = Date.now(); };
    const ev = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;
    ev.forEach(e => window.addEventListener(e, touch, { passive: true }));
    const t = setInterval(() => { if (idleExpired(lastActive.current, Date.now())) lock('expired'); }, 20_000);
    return () => { ev.forEach(e => window.removeEventListener(e, touch)); clearInterval(t); };
  }, [authed, lock]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const typed = pass.current?.value ?? '';
    if (waitLeft(gate, Date.now()) > 0 || !typed) return;
    setKey(typed);
    if (pass.current) pass.current.value = '';
    setLoading(true);
    const res = await getStats(range);
    setLoading(false);
    if (res.kind === 'ok') {
      setGate(afterSuccess()); setNote(''); setData({ raw: res.data, at: res.at }); setFailedAt(null); setAuthed(true); lastActive.current = Date.now();
    } else {
      clearKey();
      if (res.kind === 'unauthorized') { setGate(g => afterFailure(g, Date.now())); setNote('bad'); }
      else if (res.kind === 'rate') { setGate(g => afterFailure(g, Date.now())); setNote('rate'); }
      else setNote('down');
    }
  }

  const left = Math.ceil(waitLeft(gate, Date.now()) / 1000);
  void tick;

  if (!authed || !hasKey()) {
    return (
      <main className="login">
        <form className="login-card" onSubmit={submit} method="post" action="#" aria-busy={loading}>
          <h1>BE A PRO · דשבורד</h1>
          {/* the password manager fills a name and a key, so it has to be given both */}
          <input className="sr" type="text" name="username" autoComplete="username" defaultValue="admin" readOnly tabIndex={-1} aria-hidden="true" />
          <div>
            <label htmlFor="key">מפתח</label>
            <input id="key" ref={pass} className="field" type="password" name="password" autoComplete="current-password" dir="ltr" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
          </div>
          {note && <p className={`msg ${note === 'expired' ? 'warn' : 'bad'}`} role="alert">{NOTE_TEXT[note]}</p>}
          {left > 0 && <p className="msg warn" role="status">עוד {left} שניות לניסיון הבא</p>}
          <button className="btn primary" type="submit" disabled={loading || left > 0}>{loading ? 'בודק…' : 'כניסה'}</button>
        </form>
      </main>
    );
  }

  return (
    <div className="wrap">
      <header className="top">
        <div className="top-row">
          <h1>BE A PRO · דשבורד</h1>
          <button className="ghost" onClick={() => lock('')}>צא</button>
          <div className="seg" role="radiogroup" aria-label="טווח זמן">
            {RANGES.map(r => (
              <button key={r.days} role="radio" aria-checked={range === r.days} onClick={() => { setRange(r.days); setData(null); setFailedAt(null); setNote(''); void load(r.days); }}>{r.label}</button>
            ))}
          </div>
          <button className="ghost" onClick={() => void load(range)} aria-label="רענון" disabled={loading}>↻</button>
          <p className="upd" role="status">{data ? <>עודכן <bdi className="num">{clockOf(data.at)}</bdi> (שעון ישראל)</> : ''}</p>
        </div>
      </header>
      <main aria-busy={loading}>
        {failedAt !== null && (
          <div className="banner msg warn" role="alert">
            <span>{note === 'rate' ? NOTE_TEXT.rate : `הרענון נכשל${data ? `, מוצגים נתונים מ-${clockOf(data.at)}` : ''}`}</span>
            <button className="btn" onClick={() => { setNote(''); void load(range); }}>נסה שוב</button>
          </div>
        )}
        {loading && !data ? <div className="skel" aria-hidden="true"><i /><i /><i /></div> : data ? <Dashboard v={buildView(data.raw, data.at, range)} /> : null}
      </main>
    </div>
  );
}
