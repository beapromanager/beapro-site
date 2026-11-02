import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../components/Icon.tsx';
import { ShotFrame } from '../../onboard/ShotFrame.tsx';
import { preloadShots } from '../../onboard/shots.ts';
import { WALLPAPER, Bubble, TypingBubble, clockFrom } from '../Chat.tsx';

/**
 * ONBOARD_V2 (Itzik, 2.11): the phone after match 1 of a quick-started
 * career. יוסי (the midfielder, the one who texts) and דוד (the striker)
 * stayed in the לאומית; now they want to follow him down. Same phone as
 * Chat.tsx (its wallpaper, bubbles and typing dots), the manager's answers
 * are buttons. Yes ends on the dressing room still (s13-friends-join) and
 * then onDone(true); no ends on their goodbye and onDone(false).
 *
 * The words are Itzik's own, fixed. Nothing typed here, nothing sent
 * anywhere: the only thing that leaves the screen is the yes/no.
 */

export const YOSSI = 'יוסי';
export const DAVID = 'דוד';

export interface ObLine { from: string; text: string }

/** Every word of the scene, in order. `from: ''` is the manager. */
export const FRIENDS_SCRIPT = {
  open: (mgr: string): ObLine[] => [
    { from: YOSSI, text: `מה קורה ${mgr}?` },
    { from: YOSSI, text: 'אני חייב להגיד לך, מאז שאתה לא בקבוצה החברים מבואסים.' },
    { from: YOSSI, text: 'אני ודוד החלטנו שאנחנו אחריך.' },
  ],
  firstAnswers: ['איזה גברים, מה אתם רוצים לעשות?', 'אתם חסרים לי בחדר ההלבשה, הלוואי הייתם יכולים להצטרף.'],
  offer: [
    { from: DAVID, text: 'תקשיב, אני עוזב עכשיו את הליגה הלאומית ומצטרף אליך לקבוצה בליגה ג׳.' },
    { from: YOSSI, text: 'וואלה גם אני.' },
    { from: DAVID, text: 'מוותר על המשכורת שלי.' },
    { from: YOSSI, text: 'גם אני. יאללה בוא נעלה אותם ליגה.' },
  ] as ObLine[],
  yes: 'שמעו, ריגשתם. יאללה, תחתמו.',
  no: 'לא נראה לי שזה אפשרי בשלב הזה.',
  goodbye: [
    { from: YOSSI, text: 'מה שתגיד, שיהיה בהצלחה, אנחנו ממשיכים בלאומית.' },
    { from: DAVID, text: 'באסה, שיהיה לך בהצלחה.' },
  ] as ObLine[],
  joinCaption: 'יוסי ודוד חתמו. מהשבוע הם בחדר שלך.',
};

type Stage = 'open' | 'ask1' | 'offer' | 'ask2' | 'yes' | 'no' | 'still';

export function ObFriendsScreen({ mgr, week, onDone }: {
  /** the manager's name as the friends would say it */
  mgr: string; week: number; onDone: (join: boolean) => void;
}) {
  const [lines, setLines] = useState<ObLine[]>(() => FRIENDS_SCRIPT.open(mgr));
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(true);
  const [stage, setStage] = useState<Stage>('open');
  const endRef = useRef<HTMLDivElement>(null);
  const total = lines.length;

  // the yes branch ends on a still: warm it while they are still typing
  useEffect(() => { preloadShots(['s13-friends-join']); }, []);

  // one message at a time, the other side typing in between (Chat.tsx's own pace);
  // the manager's own bubble lands at once, he has just pressed send
  useEffect(() => {
    if (shown >= total) { setTyping(false); return; }
    const next = lines[shown];
    if (next.from === '') { setTyping(false); const t = window.setTimeout(() => setShown(n => n + 1), 120); return () => window.clearTimeout(t); }
    const t1 = window.setTimeout(() => setTyping(true), 60);
    const wait = 420 + Math.min(900, next.text.length * 22);
    const t2 = window.setTimeout(() => { setTyping(false); setShown(n => n + 1); }, wait);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [shown, total, lines]);

  // when the thread catches up, the scene moves to its next beat
  const caughtUp = shown >= total && !typing;
  useEffect(() => {
    if (!caughtUp) return;
    if (stage === 'open') setStage('ask1');
    else if (stage === 'offer') setStage('ask2');
    else if (stage === 'yes') {
      const t = window.setTimeout(() => setStage('still'), 900);
      return () => window.clearTimeout(t);
    }
  }, [caughtUp, stage]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [shown, typing]);

  function answer1(i: number) {
    if (stage !== 'ask1') return;
    setLines(l => [...l, { from: '', text: FRIENDS_SCRIPT.firstAnswers[i] }, ...FRIENDS_SCRIPT.offer]);
    setStage('offer');
  }
  function answer2(join: boolean) {
    if (stage !== 'ask2') return;
    setLines(l => [...l, { from: '', text: join ? FRIENDS_SCRIPT.yes : FRIENDS_SCRIPT.no }, ...(join ? [] : FRIENDS_SCRIPT.goodbye)]);
    setStage(join ? 'yes' : 'no');
  }

  if (stage === 'still') {
    return (
      <ShotFrame shot="s13-friends-join" className="ob-full">
        <button className="ob-tap" aria-label="הקש להמשך" data-testid="ob-friends-still" onClick={() => onDone(true)} />
        <div className="ob-cap">{FRIENDS_SCRIPT.joinCaption}</div>
        <div className="ob-tapHint">הקש להמשך</div>
      </ShotFrame>
    );
  }

  const time = clockFrom(week);
  const times = lines.map(() => time());
  const senders = [YOSSI, DAVID];
  const who = typing && shown < total ? lines[shown].from : '';
  const choices = stage === 'ask1' && caughtUp ? FRIENDS_SCRIPT.firstAnswers
    : stage === 'ask2' && caughtUp ? [FRIENDS_SCRIPT.yes, FRIENDS_SCRIPT.no] : null;

  return (
    <div data-testid="ob-friends" style={{
      position: 'absolute', inset: 0, zIndex: 4, display: 'flex', flexDirection: 'column',
      background: '#0b141a', animation: 'riseIn var(--t-mid) var(--ease-out)',
    }}>
      {/* app bar: the two of them, one thread */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 11, flex: 'none',
        padding: 'calc(env(safe-area-inset-top, 0px) + 11px) 13px 11px',
        background: '#202c33', borderBottom: '1px solid rgba(255,255,255,.06)',
      }}>
        <Icon name="chevron" size={20} color="#e9edef" style={{ transform: 'scaleX(-1)' }} />
        <span style={{
          width: 38, height: 38, borderRadius: '50%', flex: 'none',
          background: '#2FA96B', display: 'grid', placeItems: 'center',
          color: '#0b141a', fontWeight: 900, fontSize: 15,
        }}>י</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display: 'block', color: '#e9edef', fontWeight: 700, fontSize: 15.5,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>יוסי ודוד</span>
          <span style={{ display: 'block', color: '#8696a0', fontSize: 11.5, marginTop: 1 }}>
            {who ? `${who} מקליד...` : 'יוסי, דוד, אתה'}
          </span>
        </span>
      </div>

      {/* the conversation */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '14px 11px 6px',
        backgroundColor: '#0b141a', backgroundImage: WALLPAPER,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <span style={{
            background: '#182229', color: '#8696a0', fontSize: 11.5, fontWeight: 600,
            padding: '5px 11px', borderRadius: 8,
          }}>היום</span>
        </div>
        {lines.slice(0, shown).map((l, i) => (
          <Bubble key={i} name={l.from} text={l.text} time={times[i]}
            group senders={senders}
            first={i === 0 || lines[i - 1].from !== l.from} />
        ))}
        {typing && shown < total && <TypingBubble />}
        <div ref={endRef} />
      </div>

      {/* his answers, styled like Chat.tsx's own */}
      <div style={{
        flex: 'none', padding: '9px 11px calc(env(safe-area-inset-bottom, 0px) + 11px)',
        background: '#0b141a',
      }}>
        {choices ? (
          <div className="stack" style={{ gap: 7 }}>
            {choices.map((label, i) => (
              <button key={`${stage}-${i}`} data-testid={`ob-friends-${stage}-${i}`}
                onClick={() => (stage === 'ask1' ? answer1(i) : answer2(i === 0))}
                style={{
                  width: '100%', minHeight: 46, borderRadius: 20, textAlign: 'start',
                  border: '1px solid rgba(0,168,132,.5)', background: '#111b21', color: '#e9edef',
                  padding: '10px 14px', fontSize: 14.5, lineHeight: 1.4, fontWeight: 600,
                  animation: `riseIn .22s var(--ease-out) ${i * 0.05}s both`,
                }}>
                {label}
              </button>
            ))}
          </div>
        ) : (
          <button data-testid="ob-friends-close" onClick={() => onDone(false)} disabled={!(stage === 'no' && caughtUp)}
            style={{
              width: '100%', minHeight: 48, borderRadius: 24, border: 'none',
              background: stage === 'no' && caughtUp ? '#00a884' : '#1f2c34',
              color: stage === 'no' && caughtUp ? '#04180c' : '#54656f',
              fontWeight: 800, fontSize: 15, cursor: stage === 'no' && caughtUp ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background var(--t-fast), color var(--t-fast)',
            }}>
            {stage === 'no' && caughtUp ? 'סגור ותמשיך' : 'ממתין להודעות...'}
          </button>
        )}
      </div>
    </div>
  );
}
