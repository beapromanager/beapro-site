import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { SHOTS } from './shots.ts';
import type { ShotId } from './shots.ts';

/**
 * One slot, full bleed: the still behind whatever caption/buttons the beat
 * needs on top, layered over the shot's night/dawn gradient so a slow
 * network never shows an empty black frame. A shot with a `video` plays it
 * once, muted and inline, over its own poster still (the still is also the
 * reduced-motion and autoplay-blocked fallback: the poster just stays).
 */
export function ShotFrame({ shot, shake, flash, playVideo = true, className, children }: {
  shot: ShotId;
  /** the goal5 beat: a brief shake on the frame itself */
  shake?: boolean;
  /** the goal5 beat: a white flash layered over the shade */
  flash?: boolean;
  /** false holds a video shot on its poster still (e.g. while the phone is still ringing) */
  playVideo?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const s = SHOTS[shot];
  const late = useLateImage(s.image);
  const grad = s.night ? 'var(--ob-night-grad)' : 'var(--ob-dawn-grad)';
  const style: CSSProperties = s.image
    ? { backgroundImage: `url('${s.image}'), ${grad}` }
    : { background: grad };
  return (
    <div className={`ob-frame${className ? ` ${className}` : ''}`} data-shake={shake ? '1' : '0'} style={style}>
      {s.video && playVideo && (
        <video
          key={s.video}
          className="ob-video"
          src={s.video}
          poster={s.image}
          muted
          playsInline
          autoPlay
          preload="auto"
          aria-hidden="true"
          disablePictureInPicture
        />
      )}
      <div className="ob-shade" aria-hidden="true" />
      {late && <ObLoading inline />}
      {flash && <div className="ob-flash" aria-hidden="true" />}
      {children}
    </div>
  );
}

/**
 * True only when the still has been asked for and is still not there after a
 * beat (300ms): a cached or fast frame never flashes a spinner, a slow line
 * gets a visible "it is coming" instead of an empty gradient.
 */
function useLateImage(src: string | undefined): boolean {
  const [late, setLate] = useState(false);
  useEffect(() => {
    setLate(false);
    if (!src || typeof Image === 'undefined') return;
    const img = new Image();
    img.src = src;
    if (img.complete) return;
    let landed = false;
    const t = window.setTimeout(() => { if (!landed) setLate(true); }, 300);
    img.onload = img.onerror = () => { landed = true; window.clearTimeout(t); setLate(false); };
    return () => { window.clearTimeout(t); img.onload = img.onerror = null; };
  }, [src]);
  return late;
}

/**
 * The onboarding's one loading mark: a small gold ring. Full-frame (the
 * Suspense fallback while the prologue's own code arrives) or inline over a
 * ShotFrame whose still is late. Decorative to a screen reader, which gets
 * the status line instead.
 */
export function ObLoading({ inline }: { inline?: boolean }) {
  const ring = (
    <div className="ob-loading" role="status" aria-live="polite">
      <span className="ob-spin" aria-hidden="true" />
      <span className="ob-srOnly">טוען...</span>
    </div>
  );
  if (inline) return ring;
  return <div className="ob-frame ob-full" style={{ background: 'var(--ob-night-grad)' }}>{ring}</div>;
}
