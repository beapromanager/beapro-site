import { asset } from '../asset.ts';

/**
 * A living presenter who walks you through the opening. Top Eleven leans on a
 * talking head to make the first minutes feel personal and premium; this is
 * ours, a character brought to life (a short looping clip animated from the
 * logo) with a line per step.
 *
 * Two faces, on purpose: the OWNER greets you while you set your name, because
 * the man who hires you should not be the coach you are about to become. Once
 * you have a name, it hands over to the COACH for the rest of the opening.
 */
type Who = 'owner' | 'coach';

const FACE: Record<Who, { video: string; poster: string; name: string }> = {
  owner: { video: '/coach/owner.mp4', poster: '/coach/owner.webp', name: 'מנהל הקבוצה' },
  coach: { video: '/coach/guide.mp4', poster: '/coach/guide.webp', name: 'המאמן' },
};

/**
 * Asks for the win clip once, while a match is being played, so a win's result
 * screen does not open on an empty box on a slow line (2.11). 74KB, the HTTP
 * cache keeps it; a failure is silent and the <video> simply fetches as before.
 */
let celebrateWarm = false;
export function warmCelebrate() {
  if (celebrateWarm || typeof fetch === 'undefined') return;
  celebrateWarm = true;
  fetch(asset('/coach/celebrate.mp4')).catch(() => {});
}

/**
 * The coach mid-celebration, the shouting fist-pump version, for a win. Same
 * character as the guide, kept for exactly this moment.
 */
export function CoachCelebrate() {
  return (
    <video
      className="coach-celebrate"
      src={asset('/coach/celebrate.mp4')}
      autoPlay muted loop playsInline preload="auto"
      aria-label="המאמן חוגג"
    />
  );
}

export function CoachGuide({ text, who = 'coach' }: { text: string; who?: Who }) {
  const face = FACE[who];
  return (
    <div className="coach-guide" style={{ animation: 'riseIn .3s var(--ease-out) both' }}>
      <video
        key={who}
        className="coach-guide-vid"
        src={asset(face.video)}
        poster={asset(face.poster)}
        autoPlay muted loop playsInline preload="auto"
        aria-label={face.name}
      />
      <div className="coach-guide-bubble">
        <div className="coach-guide-name">{face.name}</div>
        <div className="coach-guide-text">{text}</div>
      </div>
    </div>
  );
}
