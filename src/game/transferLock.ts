/**
 * "This address already handed its career over" (Itzik, 26.10): the one question the weekend league has to ask, kept in a
 * file with no imports so the weekend code and the game's state can ask it without pulling the transfer in (the transfer
 * reads the save, the save reads the state: a circle).
 *
 * The weekend league belongs to one address at a time. The device id moves with the career, so the server already sees
 * ONE person (one league a weekend per device, one prize per league). What it cannot see is two careers, the old one kept
 * and the new one handed over, each redeeming the same prize. So once the career has gone, the old address must not
 * register, fetch a prize or redeem one, and the weekend client asks weekendFrozen() before every door it opens.
 */

export const OLD_ORIGIN = 'https://beapromanager.github.io';
/** the old address's own note of what it offered and sent (written by transfer.ts, read here) */
export const STATUS_KEY = 'beapro.xfer.v1';

/** the old address's note says the new address acknowledged the career */
export function movedAway(store: { getItem(k: string): string | null }): boolean {
  try {
    const t = (JSON.parse(store.getItem(STATUS_KEY) ?? 'null') as { sentAt?: unknown } | null)?.sentAt;
    return typeof t === 'number' && t > 0;
  } catch { return false; }
}

/** true only on the old address, and only once it has handed the career over */
export function weekendFrozen(origin?: string, store?: { getItem(k: string): string | null }): boolean {
  try {
    const at = origin ?? (typeof location === 'undefined' ? '' : location.origin);
    if (at !== OLD_ORIGIN) return false;
    return movedAway(store ?? localStorage);
  } catch { return false; }
}
