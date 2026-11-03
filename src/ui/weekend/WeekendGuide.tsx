/**
 * The explanation of the neighbourhood league, on the phone (Itzik, 25.10): four cards that come up from the bottom
 * the first time, the questions, the opener's steps, the card of a league filling up, and the one line that says
 * what happens when. The words all live in game/weekendGuide.ts; this is only how they are shown.
 */
import { useEffect, useRef, useState } from 'react';
import { introCards, faq, adminSteps, fillingCard, markIntroSeen, whenLine, COPY_WORDS, COPIED_WORDS, SHARED_WORDS, type WhenInput } from '../../game/weekendGuide.ts';
import { asset } from '../asset.ts';
import { Icon } from '../components/Icon.tsx';

/** "איך זה עובד?": the question mark last, so it sits at the end of the words in RTL */
export function HelpButton({ onClick }: { onClick: () => void }) {
  return <button className="wk-help" onClick={onClick}>איך זה עובד?</button>;
}

/* ------------------------------------------------------------------ the four cards */

export function IntroCards({ now, onClose, onFaq }: { now: number; onClose: () => void; onFaq: () => void }) {
  const cards = introCards(now);
  const [i, setI] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const last = i === cards.length - 1;
  const close = () => { markIntroSeen(); onClose(); };
  const next = () => (last ? close() : setI(n => Math.min(cards.length - 1, n + 1)));
  const prev = () => setI(n => Math.max(0, n - 1));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // a swipe the RTL way: the finger goes right (dx > 0) to turn to the next card, left to go back; only a horizontal
  // move of more than 40px counts, so a scroll of the card is never a turn
  const onDown = (e: React.PointerEvent) => { start.current = { x: e.clientX, y: e.clientY }; };
  const onUp = (e: React.PointerEvent) => {
    const s = start.current; start.current = null;
    if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx > 0) next(); else prev();
  };

  const c = cards[i];
  return (
    <div className="wk-sheet" role="dialog" aria-modal="true" aria-label="איך זה עובד">
      <div className="wk-sheet-bg" onClick={close} />
      <div className="wk-intro wk-in" onPointerDown={onDown} onPointerUp={onUp}>
        <div className="wk-row" style={{ justifyContent: 'space-between' }}>
          <span className="wk-pill"><bdi dir="ltr">{i + 1}/{cards.length}</bdi></span>
          <button className="wk-intro-skip" onClick={close}>דלג</button>
        </div>
        <div className="wk-intro-art"><img src={asset(c.art)} alt="" /></div>
        <div className="wk-kick">{c.kick}</div>
        <h2 className="wk-intro-title">{c.title}</h2>
        <ul className="wk-intro-lines">{c.lines.map((l, k) => <li key={k}>{l}</li>)}</ul>
        <div className="wk-intro-foot">{c.foot}</div>
        <div className="wk-dots" aria-hidden="true">{cards.map((_, k) => <span key={k} className={k === i ? 'on' : ''} />)}</div>
        <div className="wk-row" style={{ gap: 8 }}>
          <button className="wk-btn ghost" style={{ flex: 1 }} disabled={i === 0} onClick={prev}>הקודם</button>
          <button className="wk-btn red" style={{ flex: 2 }} onClick={next}>{last ? 'יאללה, לליגה' : 'הבא'}</button>
        </div>
        <button className="wk-link" onClick={() => { markIntroSeen(); onFaq(); }}>יש לי עוד שאלות</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ the questions */

export function FaqSheet({ now, onClose, onIntro }: { now: number; onClose: () => void; onIntro: () => void }) {
  const qs = faq(now);
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="wk-sheet" role="dialog" aria-modal="true" aria-label="שאלות נפוצות">
      <div className="wk-sheet-bg" onClick={onClose} />
      <div className="wk-faq wk-in">
        <div className="wk-row" style={{ justifyContent: 'space-between' }}>
          <h2>שאלות נפוצות</h2>
          <button className="wk-intro-skip" onClick={onClose}>סגור</button>
        </div>
        <div className="wk-faq-list">
          {qs.map((f, k) => (
            <div key={k} className={`wk-faq-q ${open === k ? 'open' : ''}`}>
              <button onClick={() => setOpen(open === k ? null : k)} aria-expanded={open === k}><span>{f.q}</span><Icon name="chevron" size={14} /></button>
              {open === k && <p>{f.a}</p>}
            </div>
          ))}
        </div>
        <button className="wk-link" onClick={onIntro}>לראות שוב את ההסבר הקצר</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ the opener's steps */

export function AdminGuide({ size }: { size: number }) {
  const g = adminSteps(size);
  const [open, setOpen] = useState(true);
  return (
    <div className="wk-guide">
      <button className="wk-guide-h" onClick={() => setOpen(o => !o)} aria-expanded={open}><span>{g.title}</span><Icon name="chevron" size={14} /></button>
      {open && (
        <>
          <ol className="wk-steps">{g.steps.map((s, k) => <li key={k}>{s}</li>)}</ol>
          <p className="wk-guide-note">{g.note}</p>
        </>
      )}
    </div>
  );
}

/**
 * Send words to friends: the phone's share sheet (WhatsApp, Telegram, SMS) where there is one, else the clipboard.
 * The link is inside the text and not passed as `url` too, or WhatsApp on Android shows it twice. Backing out of the
 * sheet is not a failure and copies nothing; a sheet that cannot open falls back to the clipboard, and a phone with no
 * clipboard API gets the old textarea copy. 'failed' leaves the words on the screen to select by hand.
 */
export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';
export async function shareOrCopy(text: string): Promise<ShareOutcome> {
  if (!text) return 'failed';
  const nav: Navigator | undefined = typeof navigator !== 'undefined' ? navigator : undefined;
  if (nav && typeof nav.share === 'function') {
    try { await nav.share({ title: 'BE A PRO', text }); return 'shared'; }
    catch (e) { if (e instanceof Error && e.name === 'AbortError') return 'cancelled'; /* no sheet here: the clipboard */ }
  }
  try { if (nav?.clipboard?.writeText) { await nav.clipboard.writeText(text); return 'copied'; } } catch { /* the older way below */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok ? 'copied' : 'failed';
  } catch { return 'failed'; }
}

/** the invite button and what it says after: "נשלח ✓" or "הועתק ✓" for a few seconds */
export function ShareButton({ text, label = COPY_WORDS, className = 'wk-btn red', style }: { text: string; label?: string; className?: string; style?: React.CSSProperties }) {
  const [said, setSaid] = useState<ShareOutcome | null>(null);
  const go = async () => {
    const r = await shareOrCopy(text);
    if (r === 'cancelled') return;
    setSaid(r); setTimeout(() => setSaid(null), 4000);
  };
  return (
    <>
      <button className={className} style={style} onClick={go}>{said === 'copied' ? COPIED_WORDS : said === 'shared' ? SHARED_WORDS : label}</button>
      {said === 'failed' && <p className="wk-muted" role="status" style={{ margin: '4px 0 0' }}>לא הצלחנו להעתיק לבד. סמן את ההודעה למטה והעתק.</p>}
    </>
  );
}

/* ------------------------------------------------------------------ a league filling up */

export function FillingCard({ n, isOpener, kind, shareText }: { n: number; isOpener: boolean; kind: 'friends' | 'open'; shareText: string | null }) {
  const c = fillingCard(n, isOpener, kind);
  return (
    <div className="wk-card wk-filling wk-in">
      <div className="wk-kick">{c.title}</div>
      <b>{c.head}</b>
      {c.lines.map((l, k) => <p key={k} className="wk-muted" style={{ margin: '4px 0 0' }}>{l}</p>)}
      {shareText && <ShareButton text={shareText} className={`wk-btn ${isOpener && kind === 'friends' ? 'red' : ''}`} style={{ marginTop: 10, width: '100%' }} />}
    </div>
  );
}

/* ------------------------------------------------------------------ when */

export function WhenLine({ league, now }: { league: WhenInput | null; now: number }) {
  const w = whenLine(league, now);
  return <div className={`wk-when ${w.hot ? 'hot' : ''}`} role="status">{w.text}</div>;
}
