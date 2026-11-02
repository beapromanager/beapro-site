/**
 * The rules of the sitting, with no page in them so a check can run them: when the dashboard locks itself, and how the
 * wrong-key delay works. The key itself is not here (api.ts holds it, in memory only).
 */

/** locked after this long without anyone touching the page */
export const IDLE_MS = 30 * 60 * 1000;
/** this many wrong keys in a row, and the form waits */
export const FAILS_BEFORE_DELAY = 3;
export const DELAY_MS = 30_000;

export interface Gate { fails: number; until: number }
export const openGate = (): Gate => ({ fails: 0, until: 0 });

/** a wrong key: every third in a row starts a wait of thirty seconds, on this page only */
export function afterFailure(g: Gate, now: number): Gate {
  const fails = g.fails + 1;
  return { fails, until: fails % FAILS_BEFORE_DELAY === 0 ? now + DELAY_MS : g.until };
}
/** the right key clears the count */
export const afterSuccess = (): Gate => openGate();
/** milliseconds still to wait, 0 when the form is open */
export const waitLeft = (g: Gate, now: number): number => Math.max(0, g.until - now);
/** whether the sitting has been left alone long enough to lock */
export const idleExpired = (lastActive: number, now: number): boolean => now - lastActive >= IDLE_MS;
