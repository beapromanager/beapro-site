/**
 * Moving a career from the original address to its own domain (Itzik, 25.10: "למה שלא נבנה עכשיו את המנגנון הזה").
 *
 * A career lives in localStorage, and localStorage belongs to ONE origin. The day a custom domain is attached to the
 * original site, that site only redirects, and no code on it can run to hand the save over. So the way across has to
 * exist, and be used, while both addresses still serve the same build:
 *
 *   beapromanager.github.io   the OLD origin: offers, and sends. It never deletes or changes its own career.
 *   beapro.co.il              the NEW origin: receives, asks before it overwrites anything, and can undo.
 *
 * The role is read from location.origin at runtime, so one build is served at both and does the right thing at each.
 * Everything here is plain functions over an injected store, so a check can drive the whole thing in node; the screens
 * (src/ui/components/Transfer*.tsx) only show what these decide.
 *
 * The save is moved byte for byte (the raw strings exactly as stored), so the new origin's own loadCareer() and its
 * migrations run on it as they would on a save it wrote itself.
 */
import { parseEnvelope, summaryOf, type SaveSummary } from './save.ts';

/* ------------------------------------------------------------------ the two addresses */

import { OLD_ORIGIN, STATUS_KEY, movedAway, weekendFrozen } from './transferLock.ts';
export { OLD_ORIGIN, STATUS_KEY };
export const NEW_ORIGINS: readonly string[] = ['https://beapro.co.il', 'https://www.beapro.co.il'];
/** where the transfer opens: the apex, and www redirects to it */
export const TARGET_ORIGIN = 'https://beapro.co.il';
/** the new address says "I can receive" by serving this file (public/xfer.json) */
export const RECEIVER_URL = `${TARGET_ORIGIN}/xfer.json`;
/** the kill switch: false and the old address never offers anything */
export const TRANSFER_OFFER = false;   // Itzik, 3.11: the move between the addresses is cancelled; the code stays, switched off
/** how long the old address waits for the new one to answer before it offers the file and the code */
export const READY_TIMEOUT_MS = 20_000;
/** how long the probe of the new address may take */
export const PROBE_TIMEOUT_MS = 5_000;
/** localStorage is about 5MB per origin, counted in UTF-16 units: this leaves the rest of the site its room */
export const MAX_CHARS = 4_000_000;
/** a code longer than this is better sent as a file */
export const CODE_SOFT_LIMIT = 200_000;

export type Role = 'old' | 'new' | 'other';
/** exact strings only, never a suffix or a pattern: "https://beapro.co.il.evil.com" is nobody */
export function roleOf(origin: string): Role {
  if (origin === OLD_ORIGIN) return 'old';
  if (NEW_ORIGINS.includes(origin)) return 'new';
  return 'other';
}
export function currentRole(): Role {
  try { return typeof location === 'undefined' ? 'other' : roleOf(location.origin); } catch { return 'other'; }
}

/* ------------------------------------------------------------------ what moves, what stays */

export const CAREER_KEY = 'beapro.career.v1';
// STATUS_KEY ('beapro.xfer.v1', old origin: what it offered and sent) lives in transferLock.ts
export const IN_KEY = 'beapro.xfer.in';           // new origin: what arrived
export const BACKUP_KEY = 'beapro.xfer.backup';   // new origin: what was there before, one slot

/**
 * Moved. The career holds everything the player has (settings, onboarding, gems, achievements, invite claims, sponsor).
 * The device id must move with it, or the invite code changes and the weekend league's identity and signed prizes stop
 * matching. The anonymous counting id moves so one person is not counted twice. A key that is absent is skipped.
 */
export const TRANSFER_KEYS: readonly string[] = [
  'beapro.career.v1', 'beapro.device', 'beapro.aid', 'beapro.weekend.v1', 'beapro.weekend.intro',
];
/**
 * Stays. The counting queue belongs to the origin that will flush it (moving it could send it twice), and the three
 * keys of the transfer itself describe THIS origin's side of it.
 */
// beapro.obv2 is a tester's switch for the new onboarding (onboardV2.ts), not part of a career: it stays too
export const SKIP_KEYS: readonly string[] = ['beapro.tq', 'beapro.obv2', STATUS_KEY, IN_KEY, BACKUP_KEY];

/* ------------------------------------------------------------------ the store */

/** what localStorage offers, so a check can hand in a Map */
export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}
export function browserStore(): KV {
  return {
    getItem: k => { try { return localStorage.getItem(k); } catch { return null; } },
    setItem: (k, v) => localStorage.setItem(k, v),
    removeItem: k => { try { localStorage.removeItem(k); } catch { /* nothing to remove */ } },
  };
}

/* ------------------------------------------------------------------ sha-256, synchronous, no dependency */

const K256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

/**
 * Hex SHA-256 of the UTF-8 bytes of a string. Written out because the check has to run it in node and the page in a
 * browser without a secure-context API in between, and because a hash that is asked for synchronously keeps
 * validatePayload a plain function. scripts/transfer-check.mts compares it with node's own on a spread of inputs.
 */
export function sha256Hex(text: string): string {
  const msg = new TextEncoder().encode(text);
  const bitLen = msg.length * 8;
  const padded = new Uint8Array(((msg.length + 9 + 63) >> 6) << 6);
  padded.set(msg);
  padded[msg.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000));
  view.setUint32(padded.length - 4, bitLen >>> 0);
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K256[i] + w[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
  }
  return Array.from(h, x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}

/** the same items always serialise the same way, whatever order they were put in */
export function canonicalItems(items: Record<string, string>): string {
  return JSON.stringify(Object.keys(items).sort().map(k => [k, items[k]]));
}
export const shaOf = (items: Record<string, string>): string => sha256Hex(canonicalItems(items));

/* ------------------------------------------------------------------ the payload */

export interface Payload {
  kind: 'beapro-transfer';
  v: 1;
  from: string;
  createdAt: number;
  build: string;
  items: Record<string, string>;
  sha: string;
}

export type Reason = 'format' | 'version' | 'sha' | 'nocareer' | 'size' | 'quota' | 'declined' | 'invalid' | 'nothing';

/** what the player is told, in Hebrew, for each reason a transfer did not happen */
export const REASON_TEXT: Record<Reason, string> = {
  format: 'זה לא נראה כמו קריירה של BE A PRO. בדוק שהעתקת את כל הקוד, או בחר את הקובץ שנשמר.',
  version: 'הקריירה נשמרה בגרסה שהמשחק הזה לא מכיר.',
  sha: 'הקוד או הקובץ נפגמו בדרך ואי אפשר לסמוך עליהם. שמור או העתק מחדש.',
  nocareer: 'לא נמצאה כאן קריירה שאפשר לפתוח.',
  size: 'הקריירה גדולה מדי להעברה בדפדפן הזה.',
  quota: 'אין בדפדפן מקום לשמור את הקריירה. שום דבר לא השתנה.',
  declined: 'ההעברה בוטלה. שום דבר לא השתנה.',
  invalid: 'ההעברה נכשלה. שום דבר לא השתנה.',
  nothing: 'אין גיבוי לשחזר.',
};

/** the payload of THIS origin's store: whatever of the moved keys exists, as raw strings, untouched */
export function buildPayload(store: KV, now: number, build: string, from: string = OLD_ORIGIN): Payload {
  const items: Record<string, string> = {};
  for (const k of TRANSFER_KEYS) {
    const v = store.getItem(k);
    if (typeof v === 'string') items[k] = v;
  }
  return { kind: 'beapro-transfer', v: 1, from, createdAt: now, build, items, sha: shaOf(items) };
}

export type Validated = { ok: true; payload: Payload; career: SaveSummary } | { ok: false; reason: Reason };

/**
 * A payload that came from anywhere (a window, a file, a pasted code) is judged here and nowhere else. Unknown keys are
 * dropped, not refused: a newer build may send more than this one knows to keep.
 */
export function validatePayload(raw: unknown): Validated {
  const o = raw as Partial<Payload> | null;
  if (!o || typeof o !== 'object' || o.kind !== 'beapro-transfer') return { ok: false, reason: 'format' };
  if (o.v !== 1) return { ok: false, reason: 'version' };
  const items = o.items;
  if (!items || typeof items !== 'object' || Array.isArray(items)) return { ok: false, reason: 'format' };
  for (const v of Object.values(items)) if (typeof v !== 'string') return { ok: false, reason: 'format' };
  if (typeof o.sha !== 'string' || shaOf(items as Record<string, string>) !== o.sha) return { ok: false, reason: 'sha' };
  const kept: Record<string, string> = {};
  let size = 0;
  for (const k of TRANSFER_KEYS) {
    const v = (items as Record<string, string>)[k];
    if (typeof v === 'string') { kept[k] = v; size += k.length + v.length; }
  }
  if (size > MAX_CHARS) return { ok: false, reason: 'size' };
  const env = parseEnvelope(kept[CAREER_KEY]);
  const career = summaryOf(env);
  if (!env || !career) return { ok: false, reason: 'nocareer' };
  return {
    ok: true,
    career,
    payload: {
      kind: 'beapro-transfer', v: 1,
      from: typeof o.from === 'string' ? o.from : '',
      createdAt: typeof o.createdAt === 'number' ? o.createdAt : 0,
      build: typeof o.build === 'string' ? o.build : '',
      items: kept, sha: shaOf(kept),
    },
  };
}

/* ------------------------------------------------------------------ writing it, all or nothing */

export type Question =
  | { kind: 'replace'; current: SaveSummary; incoming: SaveSummary }
  | { kind: 'restore'; current: SaveSummary | null; backup: SaveSummary }
  | { kind: 'nobackup' };
export type Confirm = (q: Question) => boolean | Promise<boolean>;
export type Applied = { ok: true; sha: string; replaced: boolean } | { ok: false; reason: Reason };

/** the career already on this origin, if there is one a build can open */
export function currentCareer(store: KV): SaveSummary | null {
  return summaryOf(parseEnvelope(store.getItem(CAREER_KEY)));
}

/**
 * Put the payload into the store.
 *   - a career already here is never overwritten without a yes, and the default (no answer, or no) leaves the store
 *     byte for byte as it was
 *   - what is about to be replaced is first copied to BACKUP_KEY (one slot, the next transfer overwrites it); if the
 *     backup cannot be written the player is asked again before going on without one
 *   - every key is written or none is: a write that throws puts every key back as it was
 */
export async function applyTransfer(store: KV, payload: Payload, confirm: Confirm, now: number = Date.now(), via: 'auto' | 'code' = 'auto'): Promise<Applied> {
  const v = validatePayload(payload);
  if (!v.ok) return { ok: false, reason: v.reason };
  const items = v.payload.items;
  const current = currentCareer(store);
  if (current) {
    const yes = await confirm({ kind: 'replace', current, incoming: v.career });
    if (yes !== true) return { ok: false, reason: 'declined' };
  }
  const keys = Object.keys(items);
  const before: Record<string, string | null> = {};
  for (const k of keys) before[k] = store.getItem(k);
  const backupBefore = store.getItem(BACKUP_KEY);
  const hadSomething = keys.some(k => before[k] !== null);
  if (hadSomething) {
    try {
      store.setItem(BACKUP_KEY, JSON.stringify({ at: now, items: before }));
    } catch {
      const go = await confirm({ kind: 'nobackup' });
      if (go !== true) return { ok: false, reason: 'declined' };
    }
  }
  const restore = () => {
    for (const k of keys) {
      try { if (before[k] === null) store.removeItem(k); else store.setItem(k, before[k] as string); } catch { /* it was there before */ }
    }
    try { if (backupBefore === null) store.removeItem(BACKUP_KEY); else store.setItem(BACKUP_KEY, backupBefore); } catch { /* same */ }
  };
  try {
    for (const k of keys) store.setItem(k, items[k]);
  } catch {
    restore();
    return { ok: false, reason: 'quota' };
  }
  try { store.setItem(IN_KEY, JSON.stringify({ at: now, from: v.payload.from, sha: v.payload.sha, via, told: false, entered: false })); } catch { /* a note, not the career */ }
  return { ok: true, sha: v.payload.sha, replaced: !!current };
}

/* ------------------------------------------------------------------ taking it back */

export interface Backup { at: number; items: Record<string, string | null> }

/** the one slot a transfer (or a restore) leaves, if it is whole: only the moved keys, each a string or an absent key */
export function readBackup(store: KV): Backup | null {
  try {
    const o = JSON.parse(store.getItem(BACKUP_KEY) ?? 'null') as Backup | null;
    if (!o || typeof o.at !== 'number' || !o.items || typeof o.items !== 'object' || Array.isArray(o.items)) return null;
    for (const [k, v] of Object.entries(o.items)) if (!TRANSFER_KEYS.includes(k) || (v !== null && typeof v !== 'string')) return null;
    return o;
  } catch { return null; }
}

/** the career in the backup, if it holds one a build can open: without one there is nothing to take back */
export function backupCareer(store: KV): SaveSummary | null {
  const b = readBackup(store);
  return b ? summaryOf(parseEnvelope(b.items[CAREER_KEY])) : null;
}

export type Restored = { ok: true; replaced: boolean } | { ok: false; reason: Reason };

/**
 * Take back what a transfer replaced. It is a swap, not a deletion: what is here now becomes the backup, so the same
 * button undoes it. Asked first, always; written all or nothing, exactly like the transfer itself.
 */
export async function applyRestore(store: KV, confirm: Confirm, now: number = Date.now()): Promise<Restored> {
  const b = readBackup(store);
  const backup = b ? summaryOf(parseEnvelope(b.items[CAREER_KEY])) : null;
  if (!b || !backup) return { ok: false, reason: 'nothing' };
  const current = currentCareer(store);
  const yes = await confirm({ kind: 'restore', current, backup });
  if (yes !== true) return { ok: false, reason: 'declined' };
  const keys = Object.keys(b.items);
  const before: Record<string, string | null> = {};
  for (const k of keys) before[k] = store.getItem(k);
  const backupBefore = store.getItem(BACKUP_KEY);
  try {
    store.setItem(BACKUP_KEY, JSON.stringify({ at: now, items: before }));
  } catch {
    const go = await confirm({ kind: 'nobackup' });
    if (go !== true) return { ok: false, reason: 'declined' };
  }
  const undo = () => {
    for (const k of keys) {
      try { if (before[k] === null) store.removeItem(k); else store.setItem(k, before[k] as string); } catch { /* it was there before */ }
    }
    try { if (backupBefore === null) store.removeItem(BACKUP_KEY); else store.setItem(BACKUP_KEY, backupBefore); } catch { /* same */ }
  };
  try {
    for (const k of keys) {
      const v = b.items[k];
      if (v === null) store.removeItem(k); else store.setItem(k, v);
    }
  } catch {
    undo();
    return { ok: false, reason: 'quota' };
  }
  return { ok: true, replaced: !!current };
}

/** what the last transfer into this origin left, and whether the screens and the counting have caught up with it */
export interface Arrival { at: number; from: string; sha: string; via: 'auto' | 'code'; told: boolean; entered: boolean }
export function readArrival(store: KV): Arrival | null {
  try {
    const o = JSON.parse(store.getItem(IN_KEY) ?? 'null') as Arrival | null;
    return o && typeof o.sha === 'string' ? o : null;
  } catch { return null; }
}
export function patchArrival(store: KV, patch: Partial<Arrival>): void {
  const a = readArrival(store);
  if (!a) return;
  try { store.setItem(IN_KEY, JSON.stringify({ ...a, ...patch })); } catch { /* a note */ }
}

/* ------------------------------------------------------------------ the old origin's own note */

export interface Status { offeredAt?: number; dismissedAt?: number; sentAt?: number; to?: string; sha?: string }
export function readStatus(store: KV): Status {
  try {
    const o = JSON.parse(store.getItem(STATUS_KEY) ?? 'null') as Status | null;
    return o && typeof o === 'object' ? o : {};
  } catch { return {}; }
}
export function patchStatus(store: KV, patch: Status): void {
  try { store.setItem(STATUS_KEY, JSON.stringify({ ...readStatus(store), ...patch })); } catch { /* a note, not the career */ }
}

/** "later" hides the offer for a day: on the title screen and in the hub, and across visits, because it is written down */
export const SNOOZE_MS = 24 * 60 * 60 * 1000;
export function snoozed(s: Status, now: number): boolean {
  const d = s.dismissedAt;
  return typeof d === 'number' && Number.isFinite(d) && now - d >= 0 && now - d < SNOOZE_MS;
}

/**
 * How long the two addresses run side by side before the domain is attached to the original one (phase 2), counted from
 * the day https://beapro.co.il/xfer.json first answers: thirty days (Itzik, 26.10). The code does not end anything by
 * itself when it is over: phase 2 is a decision, and DEPLOY.md says what to look at before taking it.
 */
export const GRACE_DAYS = 30;

// movedAway() and weekendFrozen(): "this address already handed its career over", kept in transferLock.ts (see there)
export { movedAway, weekendFrozen };

/* ------------------------------------------------------------------ the messages between the two windows */

export const MSG_TAG = 'beapro-xfer';
export type Msg =
  | { t: typeof MSG_TAG; v: 1; step: 'ready'; nonce: string }
  | { t: typeof MSG_TAG; v: 1; step: 'payload'; nonce: string; payload: Payload }
  | { t: typeof MSG_TAG; v: 1; step: 'ack'; nonce: string; sha: string }
  | { t: typeof MSG_TAG; v: 1; step: 'nack'; nonce: string; reason: Reason };

export const NONCE_RE = /^[A-Za-z0-9-]{8,64}$/;

export function parseMsg(d: unknown): Msg | null {
  const m = d as Partial<Msg> & { payload?: unknown; sha?: unknown; reason?: unknown } | null;
  if (!m || typeof m !== 'object' || m.t !== MSG_TAG || m.v !== 1) return null;
  if (typeof m.nonce !== 'string' || !NONCE_RE.test(m.nonce)) return null;
  switch (m.step) {
    case 'ready': return { t: MSG_TAG, v: 1, step: 'ready', nonce: m.nonce };
    case 'payload': return m.payload && typeof m.payload === 'object' ? { t: MSG_TAG, v: 1, step: 'payload', nonce: m.nonce, payload: m.payload as Payload } : null;
    case 'ack': return typeof m.sha === 'string' ? { t: MSG_TAG, v: 1, step: 'ack', nonce: m.nonce, sha: m.sha } : null;
    case 'nack': return typeof m.reason === 'string' ? { t: MSG_TAG, v: 1, step: 'nack', nonce: m.nonce, reason: m.reason as Reason } : null;
    default: return null;
  }
}

/** who may speak, as pure questions: the origin, whether it is the very window we talk to, and the nonce */
export function acceptReady(origin: string, fromThatWindow: boolean, nonce: unknown, expected: string): boolean {
  return NEW_ORIGINS.includes(origin) && fromThatWindow && typeof nonce === 'string' && nonce === expected;
}
export const acceptAck = acceptReady;
export function acceptPayload(origin: string, fromTheOpener: boolean, nonce: unknown, expected: string): boolean {
  return origin === OLD_ORIGIN && fromTheOpener && typeof nonce === 'string' && nonce === expected;
}

/** the window we hold, as far as messages go */
export interface Win { postMessage(m: unknown, targetOrigin: string): void }
export interface InEvent { origin: string; source: unknown; data: unknown }

/* ------------------------------------------------------------------ the old origin: offer and send */

export type SenderState =
  | { phase: 'idle' }
  | { phase: 'waiting' }
  | { phase: 'sent' }
  | { phase: 'done'; sha: string }
  | { phase: 'fallback'; why: 'blocked' | 'timeout' | 'nocareer' }
  | { phase: 'failed'; reason: Reason };

export interface SenderDeps {
  store: KV;
  now(): number;
  uuid(): string;
  open(url: string): Win | null;
  setTimer(fn: () => void, ms: number): unknown;
  clearTimer(h: unknown): void;
  build: string;
  /** the counting: 'xfer_sent' on a matching ack */
  mark?(k: 'xfer_sent'): void;
}

/**
 * The sending side. start() must be called from the click itself (the popup is only allowed there), and does nothing
 * else but open the new address with a nonce; the payload goes out only after the new address says ready, from the
 * window we opened, from an exact origin, with our nonce. The old save is read and never written.
 */
export function createSender(deps: SenderDeps, onChange: (s: SenderState) => void = () => {}) {
  let state: SenderState = { phase: 'idle' };
  let nonce = '';
  let win: Win | null = null;
  let sent: Payload | null = null;
  let timer: unknown = null;
  const set = (s: SenderState) => { state = s; onChange(s); };
  const stop = () => { if (timer !== null) { deps.clearTimer(timer); timer = null; } };

  return {
    get state() { return state; },
    start() {
      stop();
      nonce = deps.uuid();
      win = deps.open(`${TARGET_ORIGIN}/?xfer=${nonce}`);
      if (!win) { set({ phase: 'fallback', why: 'blocked' }); return; }
      set({ phase: 'waiting' });
      timer = deps.setTimer(() => { if (state.phase === 'waiting') set({ phase: 'fallback', why: 'timeout' }); }, READY_TIMEOUT_MS);
    },
    handle(ev: InEvent) {
      const m = parseMsg(ev.data);
      if (!m || !win) return;
      const same = ev.source === win;
      if (m.step === 'ready') {
        if (state.phase !== 'waiting' || !acceptReady(ev.origin, same, m.nonce, nonce)) return;
        const p = buildPayload(deps.store, deps.now(), deps.build);
        if (!validatePayload(p).ok) { stop(); set({ phase: 'fallback', why: 'nocareer' }); return; }
        sent = p;
        stop();
        win.postMessage({ t: MSG_TAG, v: 1, step: 'payload', nonce, payload: p } satisfies Msg, ev.origin);
        set({ phase: 'sent' });
      } else if (m.step === 'ack' || m.step === 'nack') {
        if (state.phase !== 'sent' || !acceptAck(ev.origin, same, m.nonce, nonce)) return;
        if (m.step === 'ack') {
          if (!sent || m.sha !== sent.sha) return;
          patchStatus(deps.store, { sentAt: deps.now(), to: ev.origin, sha: m.sha });
          deps.mark?.('xfer_sent');
          set({ phase: 'done', sha: m.sha });
        } else {
          set({ phase: 'failed', reason: m.reason });
        }
      }
    },
    cancel() { stop(); set({ phase: 'idle' }); },
  };
}

/* ------------------------------------------------------------------ the new origin: receive */

export type ReceiverState =
  | { phase: 'idle' }
  | { phase: 'manual' }                         // no window to talk to: the import screen
  | { phase: 'waiting' }
  | { phase: 'working' }
  | { phase: 'done'; sha: string; replaced: boolean }
  | { phase: 'failed'; reason: Reason };

export interface ReceiverDeps {
  store: KV;
  opener: (Win & object) | null;
  nonce: string;
  now(): number;
  confirm: Confirm;
}

/**
 * The receiving side, for a page opened as /?xfer=<nonce>. Silent to anyone who is not the window that opened it from
 * the old address with that nonce: such a message changes nothing and gets no reply.
 */
export function createReceiver(deps: ReceiverDeps, onChange: (s: ReceiverState) => void = () => {}) {
  let state: ReceiverState = { phase: 'idle' };
  const set = (s: ReceiverState) => { state = s; onChange(s); };
  return {
    get state() { return state; },
    begin() {
      if (!deps.opener || !NONCE_RE.test(deps.nonce)) { set({ phase: 'manual' }); return; }
      deps.opener.postMessage({ t: MSG_TAG, v: 1, step: 'ready', nonce: deps.nonce } satisfies Msg, OLD_ORIGIN);
      set({ phase: 'waiting' });
    },
    async handle(ev: InEvent): Promise<void> {
      const m = parseMsg(ev.data);
      if (!m || m.step !== 'payload' || state.phase !== 'waiting') return;
      if (!acceptPayload(ev.origin, ev.source === deps.opener && deps.opener !== null, m.nonce, deps.nonce)) return;
      const reply = (msg: Msg) => { try { deps.opener?.postMessage(msg, ev.origin); } catch { /* the window was closed */ } };
      set({ phase: 'working' });
      const v = validatePayload(m.payload);
      if (!v.ok) { reply({ t: MSG_TAG, v: 1, step: 'nack', nonce: deps.nonce, reason: v.reason }); set({ phase: 'failed', reason: v.reason }); return; }
      const r = await applyTransfer(deps.store, v.payload, deps.confirm, deps.now(), 'auto');
      if (r.ok) { reply({ t: MSG_TAG, v: 1, step: 'ack', nonce: deps.nonce, sha: r.sha }); set({ phase: 'done', sha: r.sha, replaced: r.replaced }); }
      else { reply({ t: MSG_TAG, v: 1, step: 'nack', nonce: deps.nonce, reason: r.reason }); set({ phase: 'failed', reason: r.reason }); }
    },
  };
}

/* ------------------------------------------------------------------ by hand: a file and a code */

const toB64Url = (b: Uint8Array): string => {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64Url = (t: string): Uint8Array => {
  const s = atob(t.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((t.length + 3) % 4));
  return Uint8Array.from(s, c => c.charCodeAt(0));
};

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream as unknown as ReadableWritablePair<Uint8Array, Uint8Array>));
  return new Uint8Array(await out.arrayBuffer());
}

export const hasCompression = (): boolean => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

/** 'BEAPRO1.' + gzip, or 'BEAPRO0.' + the plain bytes where the browser cannot compress */
export async function encodeCode(p: Payload, compress: boolean = hasCompression()): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  if (compress && hasCompression()) return 'BEAPRO1.' + toB64Url(await pipe(bytes, new CompressionStream('gzip')));
  return 'BEAPRO0.' + toB64Url(bytes);
}

/** the payload JSON (still unvalidated) inside a code, or null if the code is not one */
export async function decodeCode(code: string): Promise<unknown | null> {
  const t = code.replace(/\s+/g, '');
  try {
    if (t.startsWith('BEAPRO1.')) {
      if (!hasCompression()) return null;
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await pipe(fromB64Url(t.slice(8)), new DecompressionStream('gzip'))));
    }
    if (t.startsWith('BEAPRO0.')) return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(fromB64Url(t.slice(8))));
  } catch { /* a code that is not one */ }
  return null;
}

/** whatever the player gave: the text of a saved file, or a pasted code */
export async function parseImportText(text: string): Promise<Validated> {
  const t = text.trim().replace(/^﻿/, '');
  let raw: unknown = null;
  if (t.startsWith('BEAPRO')) raw = await decodeCode(t);
  else if (t.startsWith('{')) { try { raw = JSON.parse(t); } catch { raw = null; } }
  return validatePayload(raw);
}

export const fileNameFor = (d: Date): string => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `beapro-career-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.beapro`;
};
export const fileText = (p: Payload): string => JSON.stringify(p);
