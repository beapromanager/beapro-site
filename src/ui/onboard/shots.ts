/**
 * ONBOARD_V2, plan T4/T6 (section 6): one slot per shot id, exactly the
 * thirteen the shot list names. Nothing here is media yet — that is T8,
 * after Itzik produces it in Higgsfield and T5 builds the real player. Until
 * then every slot renders its own fallback (ShotFrame.tsx): an existing
 * still from the game's own art where one genuinely fits the beat (checked
 * by eye against section 5's iron rules: no real crest, no real face, no
 * text baked into the image), or a plain night/dawn gradient otherwise.
 *
 * `night` picks which half of section 5's two palettes a plain gradient
 * falls back to: steel-blue/charcoal for the לאומית's last night (shots
 * 1-8), dawn-gold/sand/grass for the ליגה ג׳ morning after (shots 9-13).
 */
import { asset } from '../asset.ts';

export type ShotId =
  | 's01-stadium' | 's02-bench' | 's03-goal5' | 's04-down'
  | 's05a-sit' | 's05b-bottle' | 's06-red' | 's07-tunnel'
  | 's08-phone' | 's09-morning' | 's10-pitch-gimel' | 's11-city'
  | 's12-loyal' | 's13-kickoff';

export interface Shot {
  id: ShotId;
  night: boolean;
  /** an existing still that already fits the beat; absent means "gradient only" until T8 */
  image?: string;
}

export const SHOTS: Readonly<Record<ShotId, Shot>> = {
  // the night of the 5-0: a real aerial stadium-at-night still (public/stadium/tier4.webp,
  // used nowhere else in the app), a night match-moment still for the goal (public/moments/shot/night-b.webp)
  's01-stadium': { id: 's01-stadium', night: true, image: asset('/stadium/tier4.webp') },
  's02-bench': { id: 's02-bench', night: true },
  's03-goal5': { id: 's03-goal5', night: true, image: asset('/moments/shot/night-b.webp') },
  's04-down': { id: 's04-down', night: true },
  's05a-sit': { id: 's05a-sit', night: true },
  's05b-bottle': { id: 's05b-bottle', night: true },
  // no still fits a red card without a referee's face in frame (the one candidate,
  // moments/def-tackle/slide-red.webp, shows the referee's face close up, which the
  // plan's iron rule 2 forbids) — gradient and the code's own caption carry this beat
  's06-red': { id: 's06-red', night: true },
  // the tunnel: title/tunnel.webp is the game's own "coach seen from behind, walking
  // into the light" image already, exactly this beat's own description
  's07-tunnel': { id: 's07-tunnel', night: true, image: asset('/title/tunnel.webp') },
  's08-phone': { id: 's08-phone', night: true },
  's09-morning': { id: 's09-morning', night: false },
  // the new ground: public/weekend/entrance.webp, a small lit pitch behind a fence with
  // apartment blocks behind it, fans seen from behind — already this beat's own picture
  's10-pitch-gimel': { id: 's10-pitch-gimel', night: false, image: asset('/weekend/entrance.webp') },
  's11-city': { id: 's11-city', night: false },
  // the two arriving: public/youth/dusk-poster.webp, an empty small pitch under
  // floodlights with balls and cones and no people in frame at all
  's12-loyal': { id: 's12-loyal', night: false, image: asset('/youth/dusk-poster.webp') },
  's13-kickoff': { id: 's13-kickoff', night: false },
};

export const SHOT_IDS = Object.keys(SHOTS) as ShotId[];
