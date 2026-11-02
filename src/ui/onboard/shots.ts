/**
 * ONBOARD_V2, plan T4/T6 (section 6): one slot per shot id, exactly the
 * ids the shot list names. Every slot the prologue actually shows now has a
 * placeholder still in public/onboard/ (generated to the plan's section 5
 * style guide: cold national-league night vs golden ליגה ג׳ morning, no real
 * crest, colours, brand or face, and no text baked in). They are stand-ins
 * until Itzik's Higgsfield media (T8) replaces them under a bumped version
 * suffix (.v2 ...), which is also what keeps any cache honest (plan section 7:
 * versioned file names, public/sw.js untouched).
 *
 * `night` picks which half of section 5's two palettes the gradient behind
 * the still uses while it loads (or if it is ever missing).
 */
import { asset } from '../asset.ts';

export type ShotId =
  | 's01-stadium' | 's02-bench' | 's03-goal5' | 's04-down'
  | 's05a-sit' | 's05b-bottle' | 's06-red' | 's07-tunnel'
  | 's08-phone' | 's09-morning' | 's10-pitch-gimel' | 's11-city'
  | 's12-loyal' | 's13-kickoff' | 's13-friends-join';

export interface Shot {
  id: ShotId;
  night: boolean;
  /** the still for this slot (also the poster when `video` is set); absent means "gradient only" */
  image?: string;
  /** a short, muted, looping-free clip that plays over the still (s08 only today) */
  video?: string;
}

const ob = (file: string) => asset(`/onboard/${file}`);

export const SHOTS: Readonly<Record<ShotId, Shot>> = {
  's01-stadium': { id: 's01-stadium', night: true, image: ob('s01-stadium.v1.webp') },
  's02-bench': { id: 's02-bench', night: true, image: ob('s02-bench.v1.webp') },
  's03-goal5': { id: 's03-goal5', night: true, image: ob('s03-goal5.v1.webp') },
  's04-down': { id: 's04-down', night: true, image: ob('s04-down.v1.webp') },
  's05a-sit': { id: 's05a-sit', night: true, image: ob('s05a-sit.v1.webp') },
  // the bottle flies over the empty running track toward the far (opponents') stand — nobody in its path
  's05b-bottle': { id: 's05b-bottle', night: true, image: ob('s05b-bottle.v1.webp') },
  // the referee's raised arm and card only, no face; the coach is a blurred figure from behind
  's06-red': { id: 's06-red', night: true, image: ob('s06-red.v1.webp') },
  // seen from behind: the coach walking INTO the dark tunnel
  's07-tunnel': { id: 's07-tunnel', night: true, image: ob('s07-tunnel.v1.webp') },
  // the old owner on the phone in a dark executive box; the words are UI, never in the clip
  's08-phone': { id: 's08-phone', night: true, image: ob('s08-phone.v1.webp'), video: ob('s08-phone.v1.mp4') },
  // the new owner in the shabby ליגה ג׳ office, warm morning light
  's09-morning': { id: 's09-morning', night: false, image: ob('s09-morning.v1.webp') },
  // the new squad: ~15 neighbourhood players on an old sand pitch, golden morning
  's10-pitch-gimel': { id: 's10-pitch-gimel', night: false, image: ob('s10-pitch-gimel.v1.webp') },
  's11-city': { id: 's11-city', night: false, image: ob('s11-city.v1.webp') },
  // two players from behind with kit bags at the sand pitch's gate. Since 2.11 the friends no longer
  // arrive here (they ask after match 1), so ObArrive's caption no longer says they followed him
  's12-loyal': { id: 's12-loyal', night: false, image: ob('s12-loyal.v1.webp') },
  // not shown by any screen today (the match itself follows ObArrive directly)
  's13-kickoff': { id: 's13-kickoff', night: false },
  // the friends scene's yes (ObFriends, after match 1): a midfielder and a striker seen from behind,
  // walking into the shabby ליגה ג׳ dressing room, warm light. Generated 2.11, no faces, kit marks or text
  's13-friends-join': { id: 's13-friends-join', night: false, image: ob('s13-friends-join.v1.webp') },
};

export const SHOT_IDS = Object.keys(SHOTS) as ShotId[];

const warmed = new Set<string>();

/**
 * Plan section 7: preload only what the NEXT beat shows (both branch shots at
 * the choice), never the whole prologue up front. Idempotent per URL; a still
 * is fetched with `new Image()`, a clip with a metadata-only <link rel=preload>
 * so mobile data is not spent on a video he may skip past.
 */
export function preloadShots(ids: readonly ShotId[]): void {
  if (typeof window === 'undefined') return;
  for (const id of ids) {
    const s = SHOTS[id];
    if (!s) continue;
    if (s.image && !warmed.has(s.image)) {
      warmed.add(s.image);
      const img = new Image();
      img.decoding = 'async';
      img.src = s.image;
    }
    if (s.video && !warmed.has(s.video) && typeof document !== 'undefined') {
      warmed.add(s.video);
      const l = document.createElement('link');
      l.rel = 'preload'; l.as = 'video'; l.type = 'video/mp4'; l.href = s.video;
      document.head.appendChild(l);
    }
  }
}
