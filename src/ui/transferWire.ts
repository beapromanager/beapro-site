/**
 * The part of the transfer that touches the page: the real window, the real storage, the real fetch.
 * All the rules are in game/transfer.ts; this only hands them what a browser has, once, and lets the screens listen.
 */
import {
  TRANSFER_OFFER, RECEIVER_URL, PROBE_TIMEOUT_MS, NONCE_RE, browserStore, createSender, createReceiver, currentRole,
  readArrival, patchArrival, readStatus, patchStatus, currentCareer, snoozed,
  type SenderState, type ReceiverState, type Confirm,
} from '../game/transfer.ts';
import { loadCareer } from '../game/save.ts';
import type { GameState } from '../game/state.ts';
import { xferMark } from '../game/telemetry.ts';

/** the installed app (iOS home screen, Android standalone) does not share storage with the browser it would open */
export function isStandalone(): boolean {
  try {
    return !!(navigator as { standalone?: boolean }).standalone || !!window.matchMedia?.('(display-mode: standalone)').matches;
  } catch { return false; }
}

const store = browserStore();
export const transferStore = store;

/* ------------------------------------------------------------------ the old address: is there anyone to send to? */

let probeP: Promise<boolean> | null = null;
/**
 * Whether the new address says it can receive (it serves public/xfer.json with {"receiver":1}). Asked once a sitting.
 * A new address that is not up yet, or a network that blocks it, is simply "no", and the player is offered nothing.
 */
export function receiverReady(): Promise<boolean> {
  if (!TRANSFER_OFFER || currentRole() !== 'old') return Promise.resolve(false);
  if (!probeP) {
    probeP = (async () => {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), PROBE_TIMEOUT_MS);
      try {
        const res = await fetch(RECEIVER_URL, { cache: 'no-store', signal: ctl.signal });
        if (!res.ok) return false;
        const j = await res.json() as { receiver?: unknown };
        return typeof j?.receiver === 'number' && j.receiver >= 1;
      } catch { return false; } finally { clearTimeout(timer); }
    })();
  }
  return probeP;
}

/* ------------------------------------------------------------------ the old address: one sender for the page */

type Listener<T> = (s: T) => void;
const senderListeners = new Set<Listener<SenderState>>();
let senderState: SenderState = { phase: 'idle' };
let sender: ReturnType<typeof createSender> | null = null;

function theSender() {
  if (sender) return sender;
  sender = createSender({
    store,
    now: () => Date.now(),
    uuid: () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`),
    // no 'noopener': the window we open has to be able to talk back to us
    open: url => window.open(url, 'beapro_xfer'),
    setTimer: (fn, ms) => window.setTimeout(fn, ms),
    clearTimer: h => window.clearTimeout(h as number),
    build: typeof __BUILD__ === 'string' ? __BUILD__ : 'dev',
    mark: k => xferMark(k),
  }, s => { senderState = s; senderListeners.forEach(f => f(s)); });
  window.addEventListener('message', e => sender?.handle({ origin: e.origin, source: e.source, data: e.data }));
  return sender;
}

export const sendNow = (): void => theSender().start();
export const senderNow = (): SenderState => senderState;
export function onSender(f: Listener<SenderState>): () => void {
  senderListeners.add(f);
  return () => { senderListeners.delete(f); };
}

/* the offer is shown at most once a sitting to the counting, and can be put off for the rest of the sitting */
let offerCounted = false;
export function countOffer(): void {
  if (offerCounted) return;
  offerCounted = true;
  patchStatus(store, { offeredAt: Date.now() });
  xferMark('xfer_offer');
}
/** "later": a day, on the title screen and in the hub alike, written down so a new visit keeps it (Itzik, 26.10) */
const putOffListeners = new Set<() => void>();
export const isPutOff = (): boolean => snoozed(readStatus(store), Date.now());
export function putOffNow(): void {
  patchStatus(store, { dismissedAt: Date.now() });
  putOffListeners.forEach(f => f());
}
export function onPutOff(f: () => void): () => void { putOffListeners.add(f); return () => { putOffListeners.delete(f); }; }
export const sentStatus = () => readStatus(store);

/* ------------------------------------------------------------------ the new address: a page opened with ?xfer= */

/** read when this module is first loaded, before the app tidies the address bar */
export const BOOT_NONCE: string | null = (() => {
  try {
    if (currentRole() !== 'new') return null;
    const n = new URLSearchParams(location.search).get('xfer');
    return n && NONCE_RE.test(n) ? n : null;
  } catch { return null; }
})();

export function startReceiver(nonce: string, confirm: Confirm, onChange: (s: ReceiverState) => void) {
  const r = createReceiver({
    store,
    opener: window.opener ?? null,
    nonce,
    now: () => Date.now(),
    confirm,
  }, onChange);
  const listen = (e: MessageEvent) => { void r.handle({ origin: e.origin, source: e.source, data: e.data }); };
  window.addEventListener('message', listen);
  r.begin();
  return () => window.removeEventListener('message', listen);
}

/* ------------------------------------------------------------------ the new address: arriving in the career */

/** a career that has just arrived and has not yet been walked into: the app opens on it, not on the title screen */
export function peekArrival(): GameState | null {
  if (currentRole() !== 'new') return null;
  const a = readArrival(store);
  if (!a || a.entered || !currentCareer(store)) return null;
  return loadCareer();
}
export const markEntered = (): void => patchArrival(store, { entered: true });
/** tell the counting, once, how the career got here */
export function tellArrival(): void {
  if (currentRole() !== 'new') return;
  const a = readArrival(store);
  if (!a || a.told) return;
  patchArrival(store, { told: true });
  xferMark(a.via === 'code' ? 'xfer_code' : 'xfer_in');
}
