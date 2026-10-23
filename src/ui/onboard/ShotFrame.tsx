import type { CSSProperties, ReactNode } from 'react';
import { SHOTS } from './shots.ts';
import type { ShotId } from './shots.ts';

/**
 * One slot, full bleed: the still behind whatever caption/buttons the beat
 * needs on top, or a night/dawn gradient when the shot has no still yet
 * (plan T4's own acceptance: the prologue works with nothing in
 * public/onboard/ at all). T5 is where this grows an <img>/<video> branch
 * for real media; today every shot renders only its fallback.
 */
export function ShotFrame({ shot, shake, flash, className, children }: {
  shot: ShotId;
  /** the goal5 beat: a brief shake on the frame itself */
  shake?: boolean;
  /** the goal5 beat: a white flash layered over the shade */
  flash?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const s = SHOTS[shot];
  const style: CSSProperties = s.image
    ? { backgroundImage: `url('${s.image}')` }
    : { background: s.night ? 'var(--ob-night-grad)' : 'var(--ob-dawn-grad)' };
  return (
    <div className={`ob-frame${className ? ` ${className}` : ''}`} data-shake={shake ? '1' : '0'} style={style}>
      <div className="ob-shade" aria-hidden="true" />
      {flash && <div className="ob-flash" aria-hidden="true" />}
      {children}
    </div>
  );
}
