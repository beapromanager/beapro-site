import { useEffect, useRef, useState } from 'react';
import { Portal } from './Portal.tsx';
import {
  TARGET_ORIGIN, CODE_SOFT_LIMIT, READY_TIMEOUT_MS, REASON_TEXT, currentRole, buildPayload, encodeCode, fileNameFor, fileText,
  parseImportText, applyTransfer, currentCareer,
  type Question, type ReceiverState, type SenderState, type Reason,
} from '../../game/transfer.ts';
import type { SaveSummary } from '../../game/save.ts';
import { savedSummary } from '../../game/save.ts';
import {
  BOOT_NONCE, transferStore, receiverReady, sendNow, senderNow, onSender, countOffer, isPutOff, putOffNow, onPutOff, sentStatus,
  startReceiver, isStandalone,
} from '../transferWire.ts';
import '../transfer.css';

const CAREER_URL = TARGET_ORIGIN + '/';
const when = (t: number) => { try { return new Date(t).toLocaleDateString('he-IL'); } catch { return ''; } };

/* ------------------------------------------------------------------ a career in a few words */

function CareerLine({ label, s }: { label: string; s: SaveSummary }) {
  return (
    <div className="xf-career">
      <div className="xf-career-k">{label}</div>
      <b>{s.clubName}</b>
      <span>{s.managerName} · מחזור <span className="num">{s.week}/{s.rounds}</span> · נשמרה ב־{when(s.savedAt)}</span>
    </div>
  );
}

/** "there is already a career here": both, side by side, and the safe answer is the first button */
function AskSheet({ q, onAnswer }: { q: Question; onAnswer: (yes: boolean) => void }) {
  return (
    <Portal>
      <div className="sheet-scrim xf-top">
        <div className="sheet" role="alertdialog" aria-label="אישור" onClick={e => e.stopPropagation()}>
          <div className="sheet-grip" />
          {q.kind === 'replace' ? (
            <div className="stack" style={{ gap: 10 }}>
              <div className="h2" style={{ fontSize: 20 }}>כבר יש כאן קריירה. להחליף אותה בקריירה מהאתר הישן?</div>
              <CareerLine label="הקריירה שיש כאן עכשיו" s={q.current} />
              <CareerLine label="הקריירה מהאתר הישן" s={q.incoming} />
              <p className="hint" style={{ margin: 0 }}>הקריירה שיש כאן עכשיו תישמר בגיבוי, לשחזור אם תתחרט.</p>
              <button className="btn dark" autoFocus onClick={() => onAnswer(false)}>לא, להשאיר את מה שיש כאן</button>
              <button className="btn" onClick={() => onAnswer(true)}>כן, להחליף</button>
            </div>
          ) : (
            <div className="stack" style={{ gap: 10 }}>
              <div className="h2" style={{ fontSize: 20 }}>לא הצלחנו לשמור גיבוי למה שיש כאן</div>
              <p className="hint" style={{ margin: 0 }}>להמשיך בלי גיבוי?</p>
              <button className="btn dark" autoFocus onClick={() => onAnswer(false)}>לא, לעצור</button>
              <button className="btn" onClick={() => onAnswer(true)}>כן, להמשיך</button>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}

/** a confirm() that is a screen: the question is shown, and the promise waits for the tap */
function useAsk() {
  const [q, setQ] = useState<{ q: Question; done: (yes: boolean) => void } | null>(null);
  const ask = (question: Question) => new Promise<boolean>(res => setQ({ q: question, done: yes => { setQ(null); res(yes); } }));
  const sheet = q ? <AskSheet q={q.q} onAnswer={q.done} /> : null;
  return { ask, sheet };
}

/* ------------------------------------------------------------------ the old address: by hand */

export function ExportSheet({ onClose, note }: { onClose: () => void; note?: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<'yes' | 'no' | null>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  const payload = () => buildPayload(transferStore, Date.now(), typeof __BUILD__ === 'string' ? __BUILD__ : 'dev');

  function saveFile() {
    const blob = new Blob([fileText(payload())], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileNameFor(new Date());
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }
  async function copyCode() {
    const c = await encodeCode(payload());
    setCode(c);
    try { await navigator.clipboard.writeText(c); setCopied('yes'); }
    catch { setCopied('no'); setTimeout(() => { box.current?.focus(); box.current?.select(); }, 50); }
  }

  const kb = code ? Math.max(1, Math.round(code.length / 1024)) : 0;
  return (
    <Portal>
      <div className="sheet-scrim xf-top" onClick={onClose}>
        <div className="sheet" role="dialog" aria-label="העברת הקריירה" onClick={e => e.stopPropagation()}>
          <div className="sheet-grip" />
          <div className="stack" style={{ gap: 10 }}>
            <div className="h2" style={{ fontSize: 20 }}>להעביר את הקריירה עם קובץ או קוד</div>
            {note && <p className="hint" style={{ margin: 0 }}>{note}</p>}
            <p className="hint" style={{ margin: 0 }}>
              הקריירה שלך נשארת כאן כמו שהיא. שמור קובץ או העתק קוד, ואז פתח את <bdi dir="ltr">beapro.co.il</bdi> ולחץ על "ייבוא קריירה" במסך הראשי.
            </p>
            <button className="btn" onClick={saveFile}>שמירה לקובץ</button>
            <button className="btn dark" onClick={copyCode}>העתקת קוד</button>
            {code && (
              <>
                <p className="hint" style={{ margin: 0 }}>
                  {copied === 'yes' ? 'הקוד הועתק. ' : 'לא הצלחנו להעתיק לבד, סמן והעתק את הקוד כאן. '}
                  גודל הקוד: <span className="num">{kb}</span> KB.
                  {code.length > CODE_SOFT_LIMIT && ' הקוד ארוך, עדיף להעביר עם קובץ.'}
                </p>
                <textarea ref={box} className="xf-code" readOnly dir="ltr" value={code} onFocus={e => e.currentTarget.select()} aria-label="קוד ההעברה" />
              </>
            )}
            <button className="btn ghost" onClick={onClose}>סגור</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

/* ------------------------------------------------------------------ the new address: by hand */

export function ImportSheet({ onClose, note }: { onClose: () => void; note?: string }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<Reason | null>(null);
  const [done, setDone] = useState(false);
  const { ask, sheet } = useAsk();

  async function run(source: string) {
    setErr(null); setBusy(true);
    try {
      const v = await parseImportText(source);
      if (!v.ok) { setErr(v.reason); return; }
      const r = await applyTransfer(transferStore, v.payload, ask, Date.now(), 'code');
      if (!r.ok) { setErr(r.reason); return; }
      setDone(true);
      setTimeout(() => location.reload(), 600);
    } finally { setBusy(false); }
  }
  async function onFile(f: File | undefined) {
    if (!f) return;
    if (f.size > 8_000_000) { setErr('size'); return; }
    setText(''); await run(await f.text());
  }

  // a question in the middle of the import is the only thing on the screen until it is answered
  if (sheet) return sheet;
  return (
    <Portal>
      <div className="sheet-scrim xf-top" onClick={onClose}>
        <div className="sheet" role="dialog" aria-label="ייבוא קריירה" onClick={e => e.stopPropagation()}>
          <div className="sheet-grip" />
          <div className="stack" style={{ gap: 10 }}>
            <div className="h2" style={{ fontSize: 20 }}>ייבוא קריירה</div>
            {note && <p className="hint" style={{ margin: 0 }}>{note}</p>}
            <p className="hint" style={{ margin: 0 }}>הדבק את הקוד, או בחר את הקובץ ששמרת מהאתר הישן.</p>
            <textarea className="xf-code" dir="ltr" value={text} placeholder="BEAPRO1...." aria-label="קוד ההעברה"
              onChange={e => { setText(e.target.value); setErr(null); }} />
            <button className="btn" disabled={busy || done || !text.trim()} onClick={() => run(text)}>{done ? 'הקריירה נטענה...' : busy ? 'רגע...' : 'ייבוא מהקוד'}</button>
            <label className="btn dark xf-file">
              בחירת קובץ
              <input type="file" accept=".beapro,.json,.txt" onChange={e => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            {err && <p className="xf-err" role="alert">{REASON_TEXT[err]}</p>}
            <button className="btn ghost" onClick={onClose}>סגור</button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

/* ------------------------------------------------------------------ the new address: a page opened by the old one */

/**
 * The page was opened as /?xfer=<nonce> by the old address. It says it is ready, receives the career, asks before it
 * replaces one, and then walks into it. No window to talk to, or silence for twenty seconds, and it is the import screen.
 */
function ReceiverPage({ nonce }: { nonce: string }) {
  const [state, setState] = useState<ReceiverState>({ phase: 'idle' });
  const [manual, setManual] = useState(false);
  const [closed, setClosed] = useState(false);
  const { ask, sheet } = useAsk();
  const askRef = useRef(ask);
  askRef.current = ask;

  useEffect(() => {
    const off = startReceiver(nonce, q => askRef.current(q), s => setState(s));
    return off;
  }, [nonce]);
  useEffect(() => {
    if (state.phase === 'manual') setManual(true);
    if (state.phase === 'waiting') {
      const t = setTimeout(() => setManual(true), READY_TIMEOUT_MS);
      return () => clearTimeout(t);
    }
    if (state.phase === 'done') { const t = setTimeout(() => location.reload(), 900); return () => clearTimeout(t); }
  }, [state]);

  if (closed) return null;
  if (manual && state.phase !== 'working' && state.phase !== 'done') {
    return <ImportSheet onClose={() => setClosed(true)} note={state.phase === 'manual'
      ? 'הדף נפתח בלי קשר לחלון הישן, אז ההעברה האוטומטית לא יכולה לעבוד. אפשר להעביר עם קוד או קובץ.'
      : 'הקריירה לא הגיעה מהחלון הישן. אפשר להעביר עם קוד או קובץ.'} />;
  }
  // the question about overwriting replaces the waiting card until it is answered
  if (sheet) return sheet;
  return (
    <Portal>
      <div className="sheet-scrim xf-top">
        <div className="sheet" role="status" aria-live="polite">
          <div className="sheet-grip" />
          <div className="stack" style={{ gap: 10, textAlign: 'center' }}>
            {state.phase === 'done' ? (
              <>
                <div className="h2" style={{ fontSize: 22 }}>הקריירה הגיעה</div>
                <p className="hint" style={{ margin: 0 }}>נכנסים למשחק...</p>
              </>
            ) : state.phase === 'failed' ? (
              <>
                <div className="h2" style={{ fontSize: 20 }}>הקריירה לא הועברה</div>
                <p className="hint" style={{ margin: 0 }}>{REASON_TEXT[state.reason]}</p>
                <button className="btn" onClick={() => setClosed(true)}>למשחק</button>
                <button className="btn ghost" onClick={() => setManual(true)}>להעביר עם קוד או קובץ</button>
              </>
            ) : (
              <>
                <div className="h2" style={{ fontSize: 20 }}>מחכים לקריירה מהאתר הישן</div>
                <p className="hint" style={{ margin: 0 }}>החלון הישן שולח אותה עכשיו. אל תסגור את הדף.</p>
                <button className="btn ghost" onClick={() => setManual(true)}>להעביר עם קוד או קובץ</button>
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}

/** mounted once at the top of the app: does something only on the new address, when it was opened with a nonce */
export function TransferGate() {
  if (!BOOT_NONCE) return null;
  return <ReceiverPage nonce={BOOT_NONCE} />;
}

/* ------------------------------------------------------------------ the offer, on the title screen and in the hub */

function useSenderState(): SenderState {
  const [s, setS] = useState<SenderState>(senderNow);
  useEffect(() => onSender(setS), []);
  return s;
}
function usePutOff(where: Where): boolean {
  const [p, setP] = useState(() => isPutOff(where));
  useEffect(() => onPutOff(() => setP(isPutOff(where))), [where]);
  return p;
}

type Where = 'title' | 'hub';

/**
 * The old address: the offer to move, what is happening while it does, and afterwards one line saying it was done.
 * On the title screen the offer is a sheet from the bottom, because the title is a full picture with no room for a card
 * (the wordmark would leave the top of a small phone); in the hub it is a slim card, because the hub scrolls.
 * The new address: one quiet link, "ייבוא קריירה". Anywhere else: nothing at all.
 */
export function TransferBanner({ where }: { where: Where }) {
  const role = currentRole();
  const [ready, setReady] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [doneSeen, setDoneSeen] = useState(false);
  const s = useSenderState();
  const off = usePutOff(where);
  const have = role === 'old' && savedSummary() !== null;
  const sent = !!sentStatus().sentAt || s.phase === 'done';
  // the move was made from this very page a moment ago: say so once, with the way to the new address
  const fresh = s.phase === 'done' && !doneSeen;

  useEffect(() => {
    if (!have) return;
    let alive = true;
    void receiverReady().then(ok => { if (alive) setReady(ok); });
    return () => { alive = false; };
  }, [have]);
  const showOffer = have && !sent && ready && !off;
  useEffect(() => { if (showOffer && s.phase === 'idle') countOffer(); }, [showOffer, s.phase]);

  if (role === 'new') {
    if (where !== 'title') return null;
    return (
      <>
        <button className="xf-link" onClick={() => setImportOpen(true)}>ייבוא קריירה</button>
        {importOpen && <ImportSheet onClose={() => setImportOpen(false)} />}
      </>
    );
  }
  if (role !== 'old' || !have) return null;

  if (sent && !fresh) {
    return (
      <div className={`xf-card xf-done ${where}`} role="status">
        <span>הקריירה הועברה ל-<bdi dir="ltr">beapro.co.il</bdi> · </span>
        <a href={CAREER_URL} target="_blank" rel="noopener">לשחק שם</a>
      </div>
    );
  }
  if (!fresh && (off || (!showOffer && s.phase === 'idle'))) return null;

  const go = () => { if (isStandalone()) setExportOpen(true); else sendNow(); };
  const close = () => putOffNow(where);
  const body = (
    <>
      {fresh && (
        <>
          <p className="xf-text" role="status">הקריירה הועברה ל-<bdi dir="ltr">beapro.co.il</bdi>. היא נשארה גם כאן, אפשר להמשיך לשחק בכל אחד משני האתרים.</p>
          <div className="xf-btns">
            <a className="btn" href={CAREER_URL} target="_blank" rel="noopener">לשחק שם</a>
            <button className="btn dark" onClick={() => setDoneSeen(true)}>סגור</button>
          </div>
        </>
      )}
      {!fresh && s.phase === 'idle' && (
        <>
          <p className="xf-text">הגרסה החדשה שלנו נמצאת ב-<bdi dir="ltr">beapro.co.il</bdi>, להעביר את הקריירה?</p>
          {isStandalone() && <p className="hint" style={{ margin: '0 0 8px' }}>במסך הבית של הטלפון ההעברה נעשית עם קובץ או קוד.</p>}
          <div className="xf-btns">
            <button className="btn" onClick={go}>להעביר עכשיו</button>
            <button className="btn dark" onClick={close}>אחר כך</button>
          </div>
          <button className="xf-link" onClick={() => setExportOpen(true)}>להעביר עם קוד או קובץ</button>
        </>
      )}
      {!fresh && (s.phase === 'waiting' || s.phase === 'sent') && (
        <>
          <p className="xf-text" role="status">מעבירים את הקריירה... הסתכל בחלון שנפתח ואשר שם.</p>
          <button className="xf-link" onClick={close}>סגור</button>
        </>
      )}
      {!fresh && s.phase === 'fallback' && (
        <>
          <p className="xf-text">{s.why === 'blocked' ? 'הדפדפן חסם את פתיחת האתר החדש.' : s.why === 'timeout' ? 'האתר החדש לא ענה בזמן.' : 'לא נמצאה קריירה לשלוח.'} אפשר להעביר עם קובץ או קוד.</p>
          <button className="btn" onClick={() => setExportOpen(true)}>קובץ או קוד</button>
          <button className="xf-link" onClick={close}>סגור</button>
        </>
      )}
      {!fresh && s.phase === 'failed' && (
        <>
          <p className="xf-text">{REASON_TEXT[s.reason]}</p>
          <button className="btn" onClick={() => setExportOpen(true)}>להעביר עם קובץ או קוד</button>
          <button className="xf-link" onClick={close}>סגור</button>
        </>
      )}
    </>
  );

  const sheet = exportOpen ? <ExportSheet onClose={() => setExportOpen(false)} /> : null;
  if (where === 'title') {
    return (
      <>
        <Portal>
          <div className="sheet-scrim xf-top">
            <div className="sheet" role="dialog" aria-label="העברת הקריירה לאתר החדש">
              <div className="sheet-grip" />
              <div className="stack" style={{ gap: 10 }}>{body}</div>
            </div>
          </div>
        </Portal>
        {sheet}
      </>
    );
  }
  return (
    <div className="xf-card hub" role="group" aria-label="העברת הקריירה לאתר החדש">
      {body}
      {sheet}
    </div>
  );
}
