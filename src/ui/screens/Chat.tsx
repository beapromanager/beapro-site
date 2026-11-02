import { useEffect, useRef, useState } from 'react';
import * as G from '../../game/state.ts';
import { Icon } from '../components/Icon.tsx';

/**
 * The phone, after the whistle. This screen deliberately breaks the game's own
 * design language and imitates a real messaging app instead: the doodle
 * wallpaper, the tucked bubble tails, the typing dots before each message, the
 * timestamps and read ticks. The point is the double take, for one second it
 * should not look like a game at all, it should look like your phone went off.
 */

export const WALLPAPER =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260' viewBox='0 0 260 260'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='.04' stroke-width='2'%3E%3Ccircle cx='40' cy='36' r='11'/%3E%3Cpath d='M96 28h20v16H96z'/%3E%3Cpath d='M150 40l10-16 10 16z'/%3E%3Cpath d='M206 26v20M196 36h20'/%3E%3Cpath d='M28 96c8-8 20-8 28 0'/%3E%3Ccircle cx='120' cy='104' r='9'/%3E%3Cpath d='M172 94h22v18h-22z'/%3E%3Cpath d='M222 112l-9-16-9 16z'/%3E%3Cpath d='M44 168v20M34 178h20'/%3E%3Ccircle cx='104' cy='176' r='10'/%3E%3Cpath d='M156 166h20v18h-20z'/%3E%3Cpath d='M214 184c8-8 20-8 28 0'/%3E%3Ccircle cx='56' cy='232' r='8'/%3E%3Cpath d='M110 222l10 16 10-16z'/%3E%3Cpath d='M178 224v18M168 233h20'/%3E%3C/g%3E%3C/svg%3E\")";

const SENDER_TINT = ['#7fb2e8', '#e8a86c', '#8ce8b4', '#e8879a', '#c9a3e8'];

/** Kick off at a Friday teatime and let each message tick a minute or two on. */
export function clockFrom(week: number) {
  let m = 17 * 60 + 12 + (week * 7) % 40;
  return () => {
    const s = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    m += 1 + (m % 2);
    return s;
  };
}

export function ChatScreen({ gs, onDone, onAnswer }: {
  gs: G.GameState; onDone: () => void; onAnswer?: (index: number) => void;
}) {
  const chat = gs.chat;
  const [shown, setShown] = useState(0);      // how many lines have landed
  const [typing, setTyping] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const total = chat?.lines.length ?? 0;
  // his three answers, while they are still unanswered. Once one is sent the
  // pack is cleared and the two new bubbles are simply part of the thread
  const pack = gs.chatAnswers;

  // messages arrive one at a time, with the other side "typing" in between
  useEffect(() => {
    if (!chat || shown >= total) { setTyping(false); return; }
    const t1 = window.setTimeout(() => setTyping(true), 60);
    const wait = 420 + Math.min(900, chat.lines[shown].text.length * 22);
    const t2 = window.setTimeout(() => {
      setTyping(false);
      setShown(n => n + 1);
    }, wait);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [shown, chat, total]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [shown, typing]);

  if (!chat) return null;
  const time = clockFrom(gs.week);
  const times = chat.lines.map(() => time());
  const senders = [...new Set(chat.lines.map(l => l.from).filter(Boolean))];
  const done = shown >= total && !typing;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 4, display: 'flex', flexDirection: 'column',
      background: '#0b141a', animation: 'riseIn var(--t-mid) var(--ease-out)',
    }}>
      {/* app bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 11, flex: 'none',
        padding: 'calc(env(safe-area-inset-top, 0px) + 11px) 13px 11px',
        background: '#202c33', borderBottom: '1px solid rgba(255,255,255,.06)',
      }}>
        <Icon name="chevron" size={20} color="#e9edef" style={{ transform: 'scaleX(-1)' }} />
        <span style={{
          width: 38, height: 38, borderRadius: '50%', flex: 'none',
          background: chat.accent, display: 'grid', placeItems: 'center',
          color: '#0b141a', fontWeight: 900, fontSize: 15,
        }}>{chat.contact.trim().charAt(0)}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display: 'block', color: '#e9edef', fontWeight: 700, fontSize: 15.5,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{chat.contact}</span>
          <span style={{ display: 'block', color: '#8696a0', fontSize: 11.5, marginTop: 1 }}>
            {typing ? 'מקליד...' : chat.subtitle}
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

        {chat.lines.slice(0, shown).map((l, i) => (
          <Bubble key={i} name={l.from} text={l.text} time={times[i]}
            group={chat.group} senders={senders}
            first={i === 0 || chat.lines[i - 1].from !== l.from} />
        ))}

        {typing && shown < total && <TypingBubble />}
        <div ref={endRef} />
      </div>

      {/* the way out, styled like the app's own composer row */}
      <div style={{
        flex: 'none', padding: '9px 11px calc(env(safe-area-inset-bottom, 0px) + 11px)',
        background: '#0b141a',
      }}>
        {pack && done ? (
          <div className="stack" style={{ gap: 7 }}>
            {pack.answers.map((a, i) => (
              <button key={i} onClick={() => onAnswer?.(i)}
                style={{
                  width: '100%', minHeight: 46, borderRadius: 20, textAlign: 'start',
                  border: '1px solid rgba(0,168,132,.5)', background: '#111b21', color: '#e9edef',
                  padding: '10px 14px', fontSize: 14.5, lineHeight: 1.4, fontWeight: 600,
                  animation: `riseIn .22s var(--ease-out) ${i * 0.05}s both`,
                }}>
                {a.label}
              </button>
            ))}
          </div>
        ) : (
        <button onClick={onDone} disabled={!done}
          style={{
            width: '100%', minHeight: 48, borderRadius: 24, border: 'none',
            background: done ? '#00a884' : '#1f2c34',
            color: done ? '#04180c' : '#54656f',
            fontWeight: 800, fontSize: 15, cursor: done ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background var(--t-fast), color var(--t-fast)',
          }}>
          {done ? 'סגור ותמשיך' : 'ממתין להודעות...'}
        </button>
        )}
      </div>
    </div>
  );
}

export function Bubble({ name, text, time, group, senders, first }: {
  name: string; text: string; time: string; group: boolean; senders: string[]; first: boolean;
}) {
  const mine = name === '';
  const tint = SENDER_TINT[Math.max(0, senders.indexOf(name)) % SENDER_TINT.length];
  return (
    <div style={{
      display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start',
      marginBottom: first ? 8 : 3, animation: 'riseIn .22s var(--ease-out)',
    }}>
      <div style={{
        maxWidth: '82%', position: 'relative',
        background: mine ? '#005c4b' : '#202c33',
        color: '#e9edef', padding: '7px 10px 6px', fontSize: 14.5, lineHeight: 1.45,
        borderRadius: 8,
        // the little tail, only on the first bubble of a run, like the real thing
        borderStartStartRadius: !mine && first ? 0 : 8,
        borderStartEndRadius: mine && first ? 0 : 8,
        boxShadow: '0 1px 1px rgba(0,0,0,.28)',
      }}>
        {group && !mine && first && (
          <div style={{ color: tint, fontSize: 13.5, fontWeight: 700, marginBottom: 2 }}>{name}</div>
        )}
        <span>{text}</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          float: 'inline-end', margin: '6px 0 -2px 0', marginInlineStart: 10,
          fontSize: 10.5, color: mine ? '#8fc7b8' : '#8696a0',
        }}>
          <span className="num">{time}</span>
          {mine && <Ticks />}
        </span>
      </div>
    </div>
  );
}

/** The blue double check. */
function Ticks() {
  return (
    <svg width="15" height="11" viewBox="0 0 16 11" fill="none" aria-hidden="true">
      <path d="M1 6.2L3.6 8.8 9.1 2.2M6.4 6.6L8.4 8.8 14 2.2"
        stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TypingBubble() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
      <div style={{
        background: '#202c33', borderRadius: 8, borderStartStartRadius: 0,
        padding: '11px 13px', display: 'flex', gap: 4, alignItems: 'center',
        boxShadow: '0 1px 1px rgba(0,0,0,.28)',
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#8696a0',
            animation: `typingDot 1.1s ${i * 0.16}s infinite ease-in-out`,
          }} />
        ))}
      </div>
    </div>
  );
}
