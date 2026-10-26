import type { SaveSummary } from '../../game/save.ts';
import { asset } from '../asset.ts';
import { Icon } from '../components/Icon.tsx';
import { useEffect, useRef, useState } from 'react';
import { watchInstall, isInstalled } from '../install.ts';
import { LeagueTeaser } from '../components/LeagueTeaser.tsx';
import { TransferBanner } from '../components/TransferUi.tsx';

/**
 * Entry screen, the tunnel (Itzik's pick of five on 12.10).
 *
 * One photograph does the talking: a manager walking out of the dark tunnel
 * into a wall of floodlight and a full stand, which is the whole game in a
 * frame. The wordmark and the one line sit on the dark floor of the tunnel,
 * the button under them, and nothing else competes. The old screen explained
 * the game in two paragraphs; the funnel said a third of the people who saw
 * it never pressed the button, so the explaining is gone and the picture does
 * it. The words are Itzik's.
 *
 * The picture is alive (Itzik, 12.10): a short silent loop of the same frame, the crowd moving, flags and
 * confetti in the light, the manager walking. The still is the poster, so the first frame is on screen before
 * the loop has arrived, and it is all a phone that will not autoplay, or a person who asked for less motion, gets.
 */
export function TitleScreen({ saved, onNew, onContinue, onInstall }: {
  saved: SaveSummary | null;
  onNew: () => void;
  onContinue: () => void;
  /** open the "put it on your home screen" sheet */
  onInstall: () => void;
}) {
  // Chrome decides a site is installable a moment after load, so this screen
  // has to be told when that happens rather than reading it once
  const [, bump] = useState(0);
  useEffect(() => watchInstall(() => bump(n => n + 1)), []);
  const installed = isInstalled();
  // the photograph fades up once it has arrived, never pops in half drawn
  const [lit, setLit] = useState(false);
  const stillOnly = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // iOS Safari rubber-bands the whole page on a drag even when there is nothing to scroll, and ignores overflow on the
  // body for that. The two things it does respect: a body that is position fixed, and a touchmove that is cancelled.
  // Both only while this screen is up; the install sheet lives on the body outside this element, so it still scrolls.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('title-locked');
    const el = rootRef.current;
    const stop = (e: TouchEvent) => { if (e.touches.length === 1) e.preventDefault(); };
    el?.addEventListener('touchmove', stop, { passive: false });
    return () => { root.classList.remove('title-locked'); el?.removeEventListener('touchmove', stop); };
  }, []);
  const rootRef = useRef<HTMLDivElement>(null);

  return (
    <div className="screen title-tunnel" ref={rootRef}>
      <img src={asset('/title/tunnel.webp')} alt="" aria-hidden="true" className="title-hero" data-lit={lit ? '1' : '0'}
        onLoad={() => setLit(true)} onError={() => setLit(true)} />
      {!stillOnly && (
        <video className="title-live" aria-hidden="true" autoPlay muted loop playsInline disablePictureInPicture
          preload="auto" poster={asset('/title/tunnel.webp')}
          onPlaying={e => { e.currentTarget.dataset.on = '1'; }}>
          <source src={asset('/title/tunnel.mp4')} type="video/mp4" />
        </video>
      )}
      <div className="title-shade" aria-hidden="true" />
      <div className="title-bar" style={{ top: 0 }} aria-hidden="true" />
      <div className="title-bar" style={{ bottom: 0 }} aria-hidden="true" />

      <div className="title-kick title-rise" style={{ ['--i' as string]: 0 }}>משחק המנג׳ר הישראלי</div>

      <div className="title-block">
        <h1 className="title-wm title-rise" style={{ ['--i' as string]: 1 }}>BE A PRO</h1>

        {/* slanted broadcast tag under the mark */}
        <div className="title-rise" style={{ ['--i' as string]: 2, position: 'relative', isolation: 'isolate', padding: '6px 16px' }}>
          <span aria-hidden="true" style={{
            position: 'absolute', inset: 0, zIndex: -1,
            background: 'linear-gradient(180deg,var(--gold-hi),var(--gold) 60%,var(--gold-lo))',
            transform: 'skewX(-10deg)', borderRadius: 3,
          }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#1B1305', lineHeight: 1 }}>
            מהשכונה ועד אירופה
          </span>
        </div>

        <p className="title-line title-rise" style={{ ['--i' as string]: 3 }}>
          הקהל מחכה.<br /><b>צא למגרש עכשיו.</b>
        </p>

        <div className="stack title-rise" style={{ ['--i' as string]: 4, gap: 10, width: '100%' }}>
          {saved && (
            <button className="btn" onClick={onContinue} style={{ minHeight: 68, flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 18 }}>המשך קריירה</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11.5, fontWeight: 700, letterSpacing: 0, opacity: .8 }}>
                {saved.clubName} · מחזור <span className="num">{saved.week}/{saved.rounds}</span>
              </span>
            </button>
          )}

          <button className={saved ? 'btn dark' : 'btn'} onClick={onNew} style={{ minHeight: saved ? 54 : 68, fontSize: saved ? 16 : 21 }}>
            <Icon name="flag" size={18} color={saved ? 'var(--gold)' : undefined} />
            {saved ? 'קריירה חדשה' : 'התחל קריירה'}
          </button>

          {saved && <p className="hint" style={{ textAlign: 'center', margin: 0 }}>קריירה חדשה תמחק את הקריירה השמורה.</p>}

          {/* the neighbourhood league's date, until the day it opens; nothing to press */}
          <LeagueTeaser />

          {/* the move to beapro.co.il: the offer on the old address, "ייבוא קריירה" on the new one, nothing anywhere else */}
          <TransferBanner where="title" />

          {/* The install belongs HERE, before a career, not buried in the game.
              Shown whatever the device says: the sheet knows the right route for
              each one, so this is never a button that does nothing. */}
          {!installed && (
            <button className="title-install" onClick={onInstall}>
              <Icon name="download" size={16} color="var(--gold)" />
              <span style={{ flex: 1, textAlign: 'start', fontSize: 13.5, fontWeight: 800 }}>שים את המשחק על מסך הבית</span>
              <Icon name="chevron" size={14} color="var(--ink-faint)" />
            </button>
          )}
        </div>

        <p className="title-credit title-rise" style={{ ['--i' as string]: 5 }}>
          <span>נעשה ע״י <b dir="ltr">ITZIK UZIEL</b> · <b dir="ltr">ISRU-E</b></span>
          <span>© <span dir="ltr">ISRU-E</span> · כל הזכויות שמורות · השמות והמועדונים בדיוניים · שימוש אנונימי נספר</span>
        </p>
      </div>
    </div>
  );
}
