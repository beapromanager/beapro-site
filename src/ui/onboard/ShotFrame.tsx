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
      {flash && <div className="ob-flash" aria-hidden="true" />}
      {children}
    </div>
  );
}
