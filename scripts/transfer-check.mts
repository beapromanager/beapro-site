/**
 * The career's way from beapromanager.github.io to beapro.co.il (Itzik, 25.10: "למה שלא נבנה עכשיו את המנגנון הזה").
 *   node --experimental-strip-types scripts/transfer-check.mts
 *
 * Everything here runs in node against an in-memory Storage. The two pages talking to each other are played by fake
 * windows, which is what makes the question "who may speak" answerable without a browser. The real browsers are
 * scripts/transfer-ui.mjs.
 *
 *   a. every storage key the game writes is classified: moved or left behind, and nothing else can appear
 *   b. a real long career crosses and plays on: same state, same invite code, same counting id
 *   c. everything that is not a career is refused, an unknown key is dropped
 *   d. a career already on the new address is never overwritten without a yes, and a no leaves it byte for byte
 *   e. a write that fails halfway puts every key back
 *   f. the origin guards: exact origins, our window, our nonce, and nothing else gets a reply
 *   g. the code and the file, both formats, and a damaged one
 *   h. the old address never changes its career, whatever it offers, sends or exports
 *   i. the counting names and the dashboard know the new marks, on both sides
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as G from '../src/game/state.ts';
import { simulateMatch } from '../src/engine/matchEngine.ts';
import { DEFAULT_FORMATION } from '../src/data/formations.ts';
import { saveCareer, loadCareer } from '../src/game/save.ts';
import { myCode } from '../src/game/invite.ts';
import { deviceId as countingId, MILESTONE, XFER_MARKS } from '../src/game/telemetry.ts';
import * as T from '../src/game/transfer.ts';

const fails: string[] = [];
let checked = 0;
const claim = (ok: boolean, msg: string) => { checked++; if (!ok) fails.push(msg); };

/* ------------------------------------------------------------------ a store the loaders can use */

type M = Map<string, string>;
const kv = (m: M): T.KV => ({
  getItem: k => m.get(k) ?? null,
  setItem: (k, v) => { m.set(k, v); },
  removeItem: k => { m.delete(k); },
});
/** the global the game's own modules read, pointed at one Map at a time */
function useStore(m: M) {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: kv(m) });
}
const snap = (m: M) => JSON.stringify([...m.entries()].sort(([a], [b]) => (a < b ? -1 : 1)));
/** a store that is full: any write that would take it past `limit` characters throws, like a browser's quota */
function capped(m: M, limit: number): T.KV {
  const total = () => [...m.entries()].reduce((n, [k, v]) => n + k.length + v.length, 0);
  return {
    getItem: k => m.get(k) ?? null,
    setItem: (k, v) => {
      const after = total() - (m.has(k) ? k.length + (m.get(k) as string).length : 0) + k.length + v.length;
      if (after > limit) throw new Error('QuotaExceededError');
      m.set(k, v);
    },
    removeItem: k => { m.delete(k); },
  };
}
/** a store whose Nth write throws, once */
function throwsOn(m: M, n: number): T.KV {
  let calls = 0;
  return { getItem: k => m.get(k) ?? null, setItem: (k, v) => { calls++; if (calls === n) throw new Error('boom'); m.set(k, v); }, removeItem: k => { m.delete(k); } };
}

/* ------------------------------------------------------------------ a real long career */

function longCareer(seed: number, seasons: number): { gs: G.GameState; played: number } {
  let gs = G.newGame(seed);
  gs = G.setProfile(gs, { name: 'מאמן הבדיקה', nickname: '', age: 38, type: 'mental' });
  gs = G.pickClub(gs, gs.league.clubs[0].id);
  gs = G.afterSigning(gs, {});
  let played = 0;
  for (let s = 1; s <= seasons; s++) {
    gs = G.enterSeason(gs);
    if (gs.phase === 'sponsor') gs = G.takeSponsor(gs, 'results');
    for (let w = 1; w <= gs.league.rounds; w++) {
      const inp = G.liveMatchInput(gs);
      const res = simulateMatch(
        { id: inp.homeId, name: inp.homeName, players: inp.iAmHome ? inp.playerStarters : inp.oppStarters,
          tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: true },
        { id: inp.awayId, name: inp.awayName, players: inp.iAmHome ? inp.oppStarters : inp.playerStarters,
          tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: false },
        inp.seed);
      gs = G.commitRound(gs, res);
      gs = G.continueFromResult(gs);
      while (gs.phase === 'press') gs = G.answerPress(gs, w % 3);
      if (gs.phase === 'chat') gs = G.closeChat(gs);
      if (gs.sacking || gs.phase === 'season-end') break;
    }
    played = s;
    if (gs.sacking) break;
    gs = G.startNextSeason(gs);
  }
  return { gs, played };
}

const SEASONS = 18;
let long = { gs: null as unknown as G.GameState, played: 0 };
for (const seed of [4242, 777, 31, 9091, 555, 12007]) {
  const c = longCareer(seed, SEASONS);
  if (c.played > long.played) long = c;
  if (c.played >= SEASONS) break;
}
claim(long.played >= 15, `the long career only reached ${long.played} seasons, wanted at least 15`);

/** an old address with a real career and every key a player has */
function oldAddress(): M {
  const m: M = new Map();
  useStore(m);
  saveCareer(long.gs);
  myCode(); countingId();
  m.set('beapro.weekend.v1', JSON.stringify({ leagueId: 'abc', final: false, nick: 'מאמן', pendingPrize: null, prizeTier: 0 }));
  m.set('beapro.weekend.intro', '2');
  m.set('beapro.tq', JSON.stringify([{ a: 'x', s: 'y', k: 'open', t: 1 }]));
  return m;
}

/* ------------------------------------------------------------------ a. the inventory */
{
  const walk = (d: string): string[] => readdirSync(d).flatMap(f => {
    const p = `${d}/${f}`;
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });
  const files = walk('src');
  const found = new Map<string, string[]>();
  const users = new Set<string>();
  for (const f of files) {
    const src = readFileSync(f, 'utf8');
    for (const m of src.matchAll(/['"`](beapro\.[A-Za-z0-9_.-]+)['"`]/g)) found.set(m[1], [...(found.get(m[1]) ?? []), f]);
    // code, not talk about it: a comment that says "localStorage." is not a place that writes to it
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    if (/\b(localStorage|sessionStorage|indexedDB)\s*\./.test(code)) users.add(f.replace(/^src\//, ''));
  }
  const moved = new Set(T.TRANSFER_KEYS), left = new Set(T.SKIP_KEYS);
  claim([...moved].every(k => !left.has(k)), 'a key is in both lists');
  for (const [k, where] of found) {
    claim(moved.has(k) !== left.has(k), `the storage key ${k} (${where[0]}) is not classified: it is neither moved nor left behind`);
  }
  for (const k of [...moved, ...left]) claim(/^beapro\.[a-z0-9.]+$/.test(k), `${k} is not a well formed key`);
  for (const k of ['beapro.career.v1', 'beapro.device', 'beapro.aid', 'beapro.tq']) claim(found.has(k), `the game no longer uses ${k}; the lists are stale`);
  // the places that touch the browser's storage are the ones known and read: a new one has to be looked at
  const known = new Set(['game/save.ts', 'game/invite.ts', 'game/telemetry.ts', 'game/weekend.ts', 'game/weekendGuide.ts', 'game/transfer.ts']);
  for (const u of users) claim(known.has(u), `${u} uses browser storage and is not among the files the transfer was built around`);
  claim(T.TRANSFER_KEYS.join() === 'beapro.career.v1,beapro.device,beapro.aid,beapro.weekend.v1,beapro.weekend.intro', 'the moved keys changed');
  claim(T.SKIP_KEYS.includes('beapro.tq'), 'the counting queue is not left behind');
  claim(!T.TRANSFER_KEYS.includes('beapro.tq'), 'the counting queue would be moved and sent twice');
}

/* ------------------------------------------------------------------ b. the round trip */
let measured = { careerChars: 0, codeChars: 0, codeKB: 0, fileChars: 0 };
{
  const oldM = oldAddress();
  const before = loadCareer();
  const wasCode = myCode(), wasAid = countingId();
  const careerRaw = oldM.get('beapro.career.v1') as string;
  const payload = T.buildPayload(kv(oldM), 1_700_000_000_000, 'test');
  claim(payload.from === T.OLD_ORIGIN && payload.kind === 'beapro-transfer' && payload.v === 1, 'the payload does not say where it is from');
  claim(Object.keys(payload.items).join() === T.TRANSFER_KEYS.join(), `the payload carries ${Object.keys(payload.items).join()}`);
  claim(payload.items['beapro.career.v1'] === careerRaw, 'the career in the payload is not the stored string, byte for byte');
  claim(!('beapro.tq' in payload.items), 'the queue travelled');
  const v = T.validatePayload(JSON.parse(JSON.stringify(payload)));
  claim(v.ok, 'a payload that went through JSON does not validate');

  const newM: M = new Map();
  useStore(newM);
  const r = await T.applyTransfer(kv(newM), payload, () => { throw new Error('asked about an empty store'); }, 5, 'auto');
  claim(r.ok === true && r.replaced === false, 'an empty address did not take the career');
  claim(newM.get('beapro.career.v1') === careerRaw, 'the career on the new address is not the same string');
  const after = loadCareer();
  claim(JSON.stringify(after) === JSON.stringify(before), 'the career that opens on the new address is not the career that opened on the old one');
  claim(after?.clubId === before?.clubId && after?.week === before?.week && after?.season === before?.season && after?.gems === before?.gems, 'club, week, season or gems differ after the move');
  claim(myCode() === wasCode, 'the invite code changed with the move');
  claim(countingId() === wasAid, 'the counting id changed with the move');
  claim(!newM.has('beapro.tq'), 'the queue arrived');
  claim(newM.get('beapro.weekend.v1') === oldM.get('beapro.weekend.v1') && newM.get('beapro.weekend.intro') === '2', 'the weekend league keys did not move');
  const arrival = T.readArrival(kv(newM));
  claim(!!arrival && arrival.sha === payload.sha && arrival.via === 'auto' && arrival.told === false && arrival.entered === false, 'the arrival note is wrong');
  claim(!newM.has(T.BACKUP_KEY), 'a backup was written where there was nothing to back up');

  // an absent key is simply skipped
  const thin: M = new Map([['beapro.career.v1', careerRaw]]);
  const p2 = T.buildPayload(kv(thin), 1, 't');
  claim(Object.keys(p2.items).join() === 'beapro.career.v1', 'a missing key was invented');
  const t2: M = new Map();
  claim((await T.applyTransfer(kv(t2), p2, () => true)).ok === true && [...t2.keys()].filter(k => !k.startsWith('beapro.xfer')).join() === 'beapro.career.v1', 'a career alone did not move alone');

  // the sha: the same on both sides, and the sync one is sha-256
  for (const s of ['', 'abc', 'שלום עולם', 'x'.repeat(55), 'x'.repeat(56), 'x'.repeat(64), 'y'.repeat(100_000), careerRaw]) {
    claim(T.sha256Hex(s) === createHash('sha256').update(s, 'utf8').digest('hex'), `sha256 differs from node's on a string of ${s.length} characters`);
  }

  /* what it costs */
  const code = await T.encodeCode(payload);
  const rt = await T.parseImportText(code);
  claim(rt.ok && rt.payload.sha === payload.sha, 'the long career did not survive its own code');
  measured = { careerChars: careerRaw.length, codeChars: code.length, codeKB: Math.round(code.length / 1024), fileChars: T.fileText(payload).length };
  claim(measured.careerChars < T.MAX_CHARS, `a ${long.played} season career is ${measured.careerChars} characters, over the ${T.MAX_CHARS} the transfer allows`);
  console.log(`MEASURE a ${long.played}-season career: ${measured.careerChars.toLocaleString('en-US')} chars in localStorage, file ${measured.fileChars.toLocaleString('en-US')} chars, code ${measured.codeChars.toLocaleString('en-US')} chars (${measured.codeKB} KB), limit ${T.MAX_CHARS.toLocaleString('en-US')}`);
}

/* ------------------------------------------------------------------ c. what is refused */
{
  const oldM = oldAddress();
  const good = T.buildPayload(kv(oldM), 1, 't');
  const career = good.items['beapro.career.v1'];
  const resign = (items: Record<string, string>, extra: Record<string, unknown> = {}) => ({ ...good, items, sha: T.shaOf(items), ...extra });
  const why = (p: unknown) => { const v = T.validatePayload(p); return v.ok ? 'ok' : v.reason; };

  claim(why(good) === 'ok', 'the good payload is refused');
  claim(why({ ...good, kind: 'something-else' }) === 'format', 'a wrong kind is not refused as a format');
  claim(why({ ...good, v: 2 }) === 'version', 'v=2 is not refused as a version');
  claim(why({ ...good, sha: '0'.repeat(64) }) === 'sha', 'a wrong sha is let in');
  claim(why({ ...good, sha: undefined }) === 'sha', 'a missing sha is let in');
  claim(why(resign({ 'beapro.device': 'd' })) === 'nocareer', 'a payload with no career is let in');
  claim(why(resign({ 'beapro.career.v1': JSON.stringify({ ...JSON.parse(career), version: 2 }) })) === 'nocareer', 'a career of version 2 is let in');
  claim(why(resign({ 'beapro.career.v1': JSON.stringify({ ...JSON.parse(career), state: { ...JSON.parse(career).state, clubId: '' } }) })) === 'nocareer', 'a career with no club is let in');
  claim(why(resign({ 'beapro.career.v1': 'not json' })) === 'nocareer', 'a career that is not JSON is let in');
  claim(why(resign({ 'beapro.career.v1': career, 'beapro.device': 5 as unknown as string })) === 'format', 'a value that is not a string is let in');
  claim(why(resign({ 'beapro.career.v1': career, 'beapro.device': 'x'.repeat(T.MAX_CHARS) })) === 'size', 'an oversize payload is let in');
  claim(why(resign({ 'beapro.career.v1': career }, { items: undefined })) === 'format', 'a payload with no items is let in');
  claim(why({ ...good, items: [career] }) === 'format', 'an array of items is let in');
  claim(why(null) === 'format' && why('x') === 'format' && why(42) === 'format' && why({}) === 'format', 'junk is let in');

  // an unknown key is dropped, not refused and not written
  const withExtra = resign({ ...good.items, 'beapro.evil': 'x', 'other.key': 'y' });
  const vx = T.validatePayload(withExtra);
  claim(vx.ok && !('beapro.evil' in vx.payload.items) && !('other.key' in vx.payload.items), 'an unknown key survived validation');
  const target: M = new Map();
  await T.applyTransfer(kv(target), withExtra as T.Payload, () => true);
  claim(!target.has('beapro.evil') && !target.has('other.key'), 'an unknown key was written');
  // and a key that is skipped on purpose cannot be smuggled in either
  const smuggled = resign({ ...good.items, 'beapro.tq': '[1]', 'beapro.xfer.backup': '{}' });
  const t3: M = new Map();
  await T.applyTransfer(kv(t3), smuggled as T.Payload, () => true);
  claim(!t3.has('beapro.tq') && !t3.has('beapro.xfer.backup'), 'a skipped key was written');
  // size is judged on what would be written, so a huge unknown key does not make a good payload fail
  claim(why(resign({ ...good.items, 'junk': 'z'.repeat(T.MAX_CHARS + 10) })) === 'ok', 'a huge unknown key counted against the size');
}

/* ------------------------------------------------------------------ d. a career is already there */
{
  const oldM = oldAddress();
  const payload = T.buildPayload(kv(oldM), 1, 't');
  // the new address has its own, shorter career, and its own device ids
  const other = longCareer(31, 2);
  const target: M = new Map();
  useStore(target);
  saveCareer(other.gs);
  target.set('beapro.device', 'device-of-the-new-address');
  target.set('beapro.aid', 'aid-of-the-new-address');
  const frozen = snap(target);

  let asked: T.Question[] = [];
  const no = await T.applyTransfer(kv(target), payload, q => { asked.push(q); return false; }, 10);
  claim(!no.ok && no.reason === 'declined', 'a no did not stop the transfer');
  claim(snap(target) === frozen, 'a no changed the store');
  claim(asked.length === 1 && asked[0].kind === 'replace', 'the player was not asked exactly once about replacing');
  const q = asked[0] as Extract<T.Question, { kind: 'replace' }>;
  claim(q.current.clubName.length > 0 && q.incoming.clubName.length > 0 && q.current.savedAt > 0 && q.incoming.managerName.length > 0, 'the question does not carry both careers');

  claim(!(await T.applyTransfer(kv(target), payload, () => undefined as unknown as boolean, 10)).ok, 'no answer counted as a yes');
  claim(snap(target) === frozen, 'no answer changed the store');

  asked = [];
  const yes = await T.applyTransfer(kv(target), payload, q2 => { asked.push(q2); return true; }, 11);
  claim(yes.ok && yes.replaced === true, 'a yes did not replace');
  claim(target.get('beapro.career.v1') === payload.items['beapro.career.v1'] && target.get('beapro.device') === payload.items['beapro.device'], 'the replaced keys are not the incoming ones');
  const backup = JSON.parse(target.get(T.BACKUP_KEY) ?? 'null') as { at: number; items: Record<string, string | null> } | null;
  const prev = JSON.parse(frozen) as [string, string][];
  const prevMap = new Map(prev);
  claim(!!backup && backup.at === 11, 'there is no backup after a replace');
  for (const k of Object.keys(payload.items)) claim(backup?.items[k] === (prevMap.get(k) ?? null), `the backup of ${k} is not what was there`);
  claim(backup?.items['beapro.weekend.v1'] === null, 'a key that was absent is not recorded as absent in the backup');

  // the backup is one slot: the next transfer overwrites it
  const again = await T.applyTransfer(kv(target), T.buildPayload(kv(oldM), 2, 't'), () => true, 12);
  claim(again.ok && (JSON.parse(target.get(T.BACKUP_KEY) ?? 'null') as { at: number } | null)?.at === 12, 'the backup was not overwritten by the next transfer');

  // a backup that cannot be written is asked about, and a no stops everything
  const full: M = new Map(prev);
  const total = [...full.entries()].reduce((n, [k, v]) => n + k.length + v.length, 0);
  asked = [];
  const nb = await T.applyTransfer(capped(full, total + 5), payload, q3 => { asked.push(q3); return q3.kind === 'replace'; }, 13);
  claim(!nb.ok, 'a transfer went on when neither the backup nor the career fit');
  claim(snap(full) === frozen, 'a failed transfer changed the store');
  claim(asked.some(x => x.kind === 'nobackup'), 'the missing backup was not asked about');
}

/* ------------------------------------------------------------------ e. a write that fails halfway */
{
  const oldM = oldAddress();
  const payload = T.buildPayload(kv(oldM), 1, 't');
  const other = longCareer(31, 2);
  const seed: M = new Map();
  useStore(seed);
  saveCareer(other.gs);
  seed.set('beapro.device', 'device-here');
  seed.set('beapro.aid', 'aid-here');
  const base = snap(seed);
  const writes = 1 + Object.keys(payload.items).length;   // the backup, then every key

  // the Nth write throws: every key is back
  for (let n = 2; n <= writes; n++) {
    const m: M = new Map(JSON.parse(base));
    const r = await T.applyTransfer(throwsOn(m, n), payload, () => true, 20);
    claim(!r.ok && r.reason === 'quota', `write ${n} failed and the answer was ${JSON.stringify(r)}`);
    claim(snap(m) === base, `write ${n} failed and the store is not as it was`);
  }
  // the store fills up: from just enough for what is there to one short of what is needed
  const sizeOf = (m: M) => [...m.entries()].reduce((n, [k, v]) => n + k.length + v.length, 0);
  const have = sizeOf(new Map(JSON.parse(base)));
  const need = sizeOf(new Map(JSON.parse(base))) + payload.items['beapro.career.v1'].length + 2000;
  let refused = 0;
  for (const limit of [have, have + 10, have + Math.round((need - have) / 3), have + Math.round((need - have) / 2), need - 5000]) {
    const m: M = new Map(JSON.parse(base));
    // a yes to everything, so a career that does not fit is attempted without its backup and has to be rolled back
    const r = await T.applyTransfer(capped(m, limit), payload, () => true, 21);
    if (!r.ok) { refused++; claim(snap(m) === base, `a full store (limit ${limit}) was left changed`); }
  }
  claim(refused >= 3, `only ${refused} of 5 tight stores were refused, the harness is not tight enough to prove anything`);
  // and the same store with room takes it
  const roomy: M = new Map(JSON.parse(base));
  claim((await T.applyTransfer(capped(roomy, need * 6), payload, () => true, 22)).ok, 'a store with room refused the career');
}

/* ------------------------------------------------------------------ f. who may speak */
{
  const OLD = T.OLD_ORIGIN, NEW = T.TARGET_ORIGIN, N = 'n-1234-abcd';
  for (const o of [NEW, 'https://www.beapro.co.il']) claim(T.acceptReady(o, true, N, N), `${o} is refused as the receiver`);
  const notNew = ['https://beapro.co.il.evil.com', 'http://beapro.co.il', 'https://beapro.co.il:8443', 'https://evil.beapro.co.il', 'null', '', OLD,
    'https://beapro.co.il/', 'https://BEAPRO.co.il', 'https://beapro.co.il.', 'https://xbeapro.co.il', 'https://beapro.co.il@evil.com', 'file://', 'https://evil.example'];
  for (const o of notNew) claim(!T.acceptReady(o, true, N, N) && !T.acceptAck(o, true, N, N), `"${o}" is accepted as the new address`);
  claim(!T.acceptReady(NEW, false, N, N), 'a message from another window is accepted');
  claim(!T.acceptReady(NEW, true, 'other-nonce', N) && !T.acceptReady(NEW, true, undefined, N) && !T.acceptReady(NEW, true, 5, N), 'a wrong nonce is accepted');
  claim(T.acceptPayload(OLD, true, N, N), 'the old address is refused as the sender');
  for (const o of ['https://beapromanager.github.io.evil.com', 'http://beapromanager.github.io', 'https://beapromanager.github.io:8443', 'https://x.beapromanager.github.io', 'null', '', 'https://www.beapro.co.il', 'https://evil.example']) {
    claim(!T.acceptPayload(o, true, N, N), `"${o}" is accepted as the old address`);
  }
  claim(!T.acceptPayload(OLD, false, N, N) && !T.acceptPayload(OLD, true, 'x', N), 'the old address with the wrong window or nonce is accepted');
  claim(T.roleOf(OLD) === 'old' && T.roleOf(NEW) === 'new' && T.roleOf('https://www.beapro.co.il') === 'new', 'a role is wrong');
  for (const o of ['https://beapro.co.il.evil.com', 'http://beapro.co.il', 'https://evil.beapro.co.il', 'http://localhost:5180', 'null', '']) claim(T.roleOf(o) === 'other', `"${o}" has a role`);

  // the real thing, with fake windows: nobody but the right window and the right origin is answered
  class Fake { posts: { msg: unknown; to: string }[] = []; postMessage(msg: unknown, to: string) { this.posts.push({ msg, to }); } }
  const oldM = oldAddress();
  const frozen = snap(oldM);
  const popup = new Fake();
  let uuidN = 0;
  const sender = T.createSender({
    store: kv(oldM), now: () => 99, uuid: () => `nonce-${++uuidN}-abcdef`, open: () => popup, setTimer: () => 0, clearTimer: () => {}, build: 'test',
  });
  sender.start();
  claim(sender.state.phase === 'waiting', 'the sender did not wait for the new address');
  const nonce = `nonce-1-abcdef`;
  const ready = { t: 'beapro-xfer', v: 1, step: 'ready', nonce };
  for (const [origin, source, data] of [
    ['https://beapro.co.il.evil.com', popup, ready], ['http://beapro.co.il', popup, ready], ['https://beapro.co.il:8443', popup, ready],
    ['https://evil.beapro.co.il', popup, ready], ['null', popup, ready], [T.OLD_ORIGIN, popup, ready],
    [NEW, new Fake(), ready], [NEW, null, ready], [NEW, popup, { ...ready, nonce: 'nonce-9-zzzzzz' }], [NEW, popup, { ...ready, t: 'x' }],
    [NEW, popup, 'ready'], [NEW, popup, null], [NEW, popup, { ...ready, v: 2 }], [NEW, popup, { t: 'beapro-xfer', v: 1, step: 'ack', nonce, sha: 'x' }],
  ] as [string, unknown, unknown][]) {
    sender.handle({ origin, source, data });
  }
  claim(popup.posts.length === 0, `the sender posted ${popup.posts.length} message(s) to somebody it should have ignored`);
  claim(sender.state.phase === 'waiting', 'a forged message moved the sender');

  sender.handle({ origin: NEW, source: popup, data: ready });
  claim(popup.posts.length === 1 && popup.posts[0].to === NEW, 'the right message did not get the payload, aimed at its own origin');
  const sent = popup.posts[0]?.msg as { step: string; payload: T.Payload; nonce: string };
  claim(sent?.step === 'payload' && sent.nonce === nonce && T.validatePayload(sent.payload).ok, 'the payload that was sent does not validate');
  // a second ready is not answered twice
  sender.handle({ origin: NEW, source: popup, data: ready });
  claim(popup.posts.length === 1, 'a second ready got a second payload');
  // forged acks do not mark the career as moved
  for (const [origin, source, data] of [
    ['https://evil.beapro.co.il', popup, { t: 'beapro-xfer', v: 1, step: 'ack', nonce, sha: sent.payload.sha }],
    [NEW, new Fake(), { t: 'beapro-xfer', v: 1, step: 'ack', nonce, sha: sent.payload.sha }],
    [NEW, popup, { t: 'beapro-xfer', v: 1, step: 'ack', nonce: 'nonce-9-zzzzzz', sha: sent.payload.sha }],
    [NEW, popup, { t: 'beapro-xfer', v: 1, step: 'ack', nonce, sha: 'f'.repeat(64) }],
  ] as [string, unknown, unknown][]) sender.handle({ origin, source, data });
  claim(sender.state.phase === 'sent' && !T.readStatus(kv(oldM)).sentAt, 'a forged ack marked the career as moved');

  // the receiving side: only its opener, from the old origin, with its nonce
  const target: M = new Map();
  useStore(target);
  const opener = new Fake();
  const rx = T.createReceiver({ store: kv(target), opener, nonce, now: () => 1, confirm: () => true });
  rx.begin();
  claim(opener.posts.length === 1 && opener.posts[0].to === T.OLD_ORIGIN && (opener.posts[0].msg as { step: string }).step === 'ready', 'the receiver did not say ready, to the old origin only');
  const payloadMsg = { t: 'beapro-xfer', v: 1, step: 'payload', nonce, payload: sent.payload };
  for (const [origin, source, data] of [
    ['https://evil.example', opener, payloadMsg], ['https://beapromanager.github.io.evil.com', opener, payloadMsg], ['http://beapromanager.github.io', opener, payloadMsg],
    [T.OLD_ORIGIN, new Fake(), payloadMsg], [T.OLD_ORIGIN, null, payloadMsg], [T.OLD_ORIGIN, opener, { ...payloadMsg, nonce: 'nonce-9-zzzzzz' }],
    [T.TARGET_ORIGIN, opener, payloadMsg], [T.OLD_ORIGIN, opener, { ...payloadMsg, payload: { ...sent.payload, sha: '0'.repeat(64) } }],
  ] as [string, unknown, unknown][]) await rx.handle({ origin, source, data });
  claim(target.size === 0, `a forged payload wrote ${[...target.keys()].join()} on the new address`);
  claim(opener.posts.length === 1 || opener.posts.slice(1).every(p => (p.msg as { step: string }).step === 'nack'), 'a forged payload was answered with something other than a refusal');
  // the one with a bad sha comes from the right place, so it is refused out loud and nothing is written
  claim(rx.state.phase === 'waiting' || rx.state.phase === 'failed', 'the receiver is in a state nobody planned');

  // no window to talk to at all: the manual path
  const lonely = T.createReceiver({ store: kv(new Map()), opener: null, nonce, now: () => 1, confirm: () => true });
  lonely.begin();
  claim(lonely.state.phase === 'manual', 'a page with no opener did not go to the manual import');
  const badNonce = T.createReceiver({ store: kv(new Map()), opener: new Fake(), nonce: '../../x', now: () => 1, confirm: () => true });
  badNonce.begin();
  claim(badNonce.state.phase === 'manual', 'a nonce that is not one was accepted');

  // the whole walk, two honest windows: old -> new
  const oldM2 = oldAddress();
  const oldFrozen = snap(oldM2);
  const newM2: M = new Map();
  const popup2 = new Fake(), oldWin = new Fake();
  const tellings: string[] = [];
  const s2 = T.createSender({
    store: kv(oldM2), now: () => 7, uuid: () => 'walk-nonce-0001', open: () => popup2, setTimer: () => 0, clearTimer: () => {}, build: 'test', mark: k => tellings.push(k),
  });
  const r2 = T.createReceiver({ store: kv(newM2), opener: oldWin, nonce: 'walk-nonce-0001', now: () => 8, confirm: () => true });
  s2.start(); r2.begin();
  const rdy = oldWin.posts.shift();
  claim(rdy?.to === T.OLD_ORIGIN, 'the walk: ready was not aimed at the old origin');
  s2.handle({ origin: NEW, source: popup2, data: rdy?.msg });
  const pay = popup2.posts.shift();
  claim(pay?.to === NEW, 'the walk: the payload was not aimed at the new origin');
  await r2.handle({ origin: T.OLD_ORIGIN, source: oldWin, data: pay?.msg });
  claim(r2.state.phase === 'done', `the walk: the receiver ended in ${r2.state.phase}`);
  const ack = oldWin.posts.shift();
  claim(ack?.to === T.OLD_ORIGIN && (ack.msg as { step: string }).step === 'ack', 'the walk: the receiver did not acknowledge to the old origin');
  s2.handle({ origin: NEW, source: popup2, data: ack?.msg });
  claim(s2.state.phase === 'done' && !!T.readStatus(kv(oldM2)).sentAt && tellings.join() === 'xfer_sent', 'the walk: the old address did not note that it was sent');
  claim(newM2.get('beapro.career.v1') === oldM2.get('beapro.career.v1'), 'the walk: the career is not the same');
  const diff = [...oldM2.keys()].filter(k => oldM2.get(k) !== new Map<string, string>(JSON.parse(oldFrozen)).get(k));
  claim(diff.join() === T.STATUS_KEY, `the walk: the old address changed ${diff.join()}, it may only note ${T.STATUS_KEY}`);

  // a blocked popup, a silence
  const blocked = T.createSender({ store: kv(oldM2), now: () => 1, uuid: () => 'blocked-nonce-01', open: () => null, setTimer: () => 0, clearTimer: () => {}, build: 't' });
  blocked.start();
  claim(blocked.state.phase === 'fallback' && (blocked.state as { why: string }).why === 'blocked', 'a blocked popup did not fall back to the file and the code');
  let fire: (() => void) | null = null;
  const quiet = T.createSender({ store: kv(oldM2), now: () => 1, uuid: () => 'quiet-nonce-0001', open: () => new Fake(), setTimer: f => { fire = f; return 1; }, clearTimer: () => {}, build: 't' });
  quiet.start();
  (fire as (() => void) | null)?.();
  claim(quiet.state.phase === 'fallback' && (quiet.state as { why: string }).why === 'timeout', 'twenty seconds of silence did not fall back to the file and the code');
  // an old address with no career has nothing to send
  const empty = T.createSender({ store: kv(new Map()), now: () => 1, uuid: () => 'empty-nonce-0001', open: () => popup, setTimer: () => 0, clearTimer: () => {}, build: 't' });
  empty.start();
  empty.handle({ origin: NEW, source: popup, data: { t: 'beapro-xfer', v: 1, step: 'ready', nonce: 'empty-nonce-0001' } });
  claim(empty.state.phase === 'fallback', 'an address with no career went on to send nothing');
}

/* ------------------------------------------------------------------ g. the code and the file */
{
  const oldM = oldAddress();
  const payload = T.buildPayload(kv(oldM), 1, 't');
  const c1 = await T.encodeCode(payload);
  claim(c1.startsWith('BEAPRO1.') === T.hasCompression(), 'the code prefix does not match what the browser can compress');
  const c0 = await T.encodeCode(payload, false);
  claim(c0.startsWith('BEAPRO0.'), 'the plain code has the wrong prefix');
  for (const [name, c] of [['compressed', c1], ['plain', c0]] as const) {
    const v = await T.parseImportText(c);
    claim(v.ok && v.payload.sha === payload.sha && v.payload.items['beapro.career.v1'] === payload.items['beapro.career.v1'], `the ${name} code did not round trip`);
    const spaced = await T.parseImportText(c.replace(/(.{60})/g, '$1\n  '));
    claim(spaced.ok, `the ${name} code did not survive being wrapped across lines`);
    claim(!/[+/=\s]/.test(c.slice(8)), `the ${name} code has characters that break in a message or a link`);
  }
  claim(c1.length < c0.length, 'compression made the code longer');
  const file = await T.parseImportText(T.fileText(payload));
  claim(file.ok && file.payload.sha === payload.sha, 'the file did not round trip');
  claim(T.fileNameFor(new Date(2026, 9, 25)) === 'beapro-career-2026-10-25.beapro', `the file is called ${T.fileNameFor(new Date(2026, 9, 25))}`);
  // damage
  // (a changed character in the first bytes of a gzip is its timestamp, which nothing reads, so the damage is done in the middle)
  const dmg = (c: string) => [c.slice(0, -40), c.slice(0, c.length >> 1) + (c[c.length >> 1] === 'A' ? 'B' : 'A') + c.slice((c.length >> 1) + 1), c.slice(0, 8) + c.slice(9), 'BEAPRO2.' + c.slice(8), c.replace('BEAPRO', 'BEARPO'), '', '   ', 'BEAPRO1.', 'BEAPRO0.!!!', '{"kind":', '{}'];
  for (const [name, c] of [['compressed', c1], ['plain', c0]] as const) {
    for (const bad of dmg(c)) { const v = await T.parseImportText(bad); claim(!v.ok, `a damaged ${name} code was accepted: ${bad.slice(0, 30)}`); }
  }
  // text that is not ours at all
  for (const t of ['hello', '<html>', 'BEAPRO', JSON.stringify({ kind: 'beapro-transfer' }), JSON.stringify({ a: 1 })]) claim(!(await T.parseImportText(t)).ok, `"${t}" was accepted`);
}

/* ------------------------------------------------------------------ h. the old address never changes the career */
{
  const oldM = oldAddress();
  const careerBefore = oldM.get('beapro.career.v1');
  const others = snap(new Map([...oldM].filter(([k]) => k !== T.STATUS_KEY)));
  useStore(oldM);
  // the whole old side: offer counted, popup flow to an ack, a nack, the file, the code
  const popup = { posts: [] as unknown[], postMessage(m: unknown) { this.posts.push(m); } };
  const s = T.createSender({ store: kv(oldM), now: () => 5, uuid: () => 'purity-nonce-001', open: () => popup, setTimer: () => 0, clearTimer: () => {}, build: 't' });
  T.patchStatus(kv(oldM), { offeredAt: 1 });
  T.patchStatus(kv(oldM), { dismissedAt: 2 });
  s.start();
  s.handle({ origin: T.TARGET_ORIGIN, source: popup, data: { t: 'beapro-xfer', v: 1, step: 'ready', nonce: 'purity-nonce-001' } });
  const pl = (popup.posts[0] as { payload: T.Payload }).payload;
  s.handle({ origin: T.TARGET_ORIGIN, source: popup, data: { t: 'beapro-xfer', v: 1, step: 'nack', nonce: 'purity-nonce-001', reason: 'declined' } });
  const s2 = T.createSender({ store: kv(oldM), now: () => 6, uuid: () => 'purity-nonce-002', open: () => popup, setTimer: () => 0, clearTimer: () => {}, build: 't' });
  s2.start();
  s2.handle({ origin: T.TARGET_ORIGIN, source: popup, data: { t: 'beapro-xfer', v: 1, step: 'ready', nonce: 'purity-nonce-002' } });
  const pl2 = (popup.posts[1] as { payload: T.Payload }).payload;
  s2.handle({ origin: T.TARGET_ORIGIN, source: popup, data: { t: 'beapro-xfer', v: 1, step: 'ack', nonce: 'purity-nonce-002', sha: pl2.sha } });
  await T.encodeCode(T.buildPayload(kv(oldM), 9, 't')); T.fileText(T.buildPayload(kv(oldM), 9, 't'));
  claim(oldM.get('beapro.career.v1') === careerBefore, 'the old address changed its own career');
  claim(snap(new Map([...oldM].filter(([k]) => k !== T.STATUS_KEY))) === others, 'the old address changed a key other than its own note');
  const st = T.readStatus(kv(oldM));
  claim(st.offeredAt === 1 && st.dismissedAt === 2 && st.sentAt === 6 && st.to === T.TARGET_ORIGIN && st.sha === pl2.sha && pl.sha.length === 64, `the note is ${JSON.stringify(st)}`);
  claim(loadCareer() !== null, 'the old career does not open after all of it');
}

/* ------------------------------------------------------------------ j. the game does not know which address it is on */
{
  // one build is served at both addresses, so nothing but the transfer may name either of them
  const walk = (d: string): string[] => readdirSync(d).flatMap(f => {
    const p = `${d}/${f}`;
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });
  for (const f of walk('src')) {
    // the transfer's own logic, and the words its screens say (the new address is spelled out in the question the player is asked)
    if (f === 'src/game/transfer.ts' || f === 'src/ui/components/TransferUi.tsx') continue;
    const code = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    claim(!/beapromanager\.github\.io|beapro\.co\.il/.test(code), `${f} names one of the two addresses, so it would be wrong on the other`);
  }
  // what the pages already build from where they are, still does
  claim(/location\.origin \+ location\.pathname/.test(readFileSync('src/game/invite.ts', 'utf8')), 'the invite link is no longer built from the address the game is on');
  claim(/isOurCrash\([^)]*location\.origin\)/.test(readFileSync('src/ui/components/Crashed.tsx', 'utf8')), 'the crash filter no longer asks the address it is on');
  // the counting house answers any website, so the new address is counted like the old one
  claim(/'access-control-allow-origin': origin \?\? '\*'/.test(readFileSync('worker/src/index.ts', 'utf8')), 'the counting house no longer answers the website that asked');
  claim(/TELEMETRY_URL: string = 'https:\/\/beapro-count\.beapromanager\.workers\.dev'/.test(readFileSync('src/data/telemetry.ts', 'utf8')), 'the counting address is not absolute');
}

/* ------------------------------------------------------------------ i. the counting and the dashboard */
{
  const names = ['xfer_offer', 'xfer_sent', 'xfer_in', 'xfer_code', 'site_new'];
  claim(XFER_MARKS.join() === names.join(), `the client's marks are ${XFER_MARKS.join()}`);
  const worker = readFileSync('worker/src/index.ts', 'utf8');
  const wre = /const MILESTONE = (\/.+\/);/.exec(worker)?.[1] ?? '';
  const re = new RegExp(wre.slice(1, -1));
  for (const n of names) { claim(MILESTONE.test(n), `the game's pattern refuses ${n}`); claim(re.test(n), `the worker's pattern refuses ${n}`); }
  for (const n of ['xfer_', 'xfer_inn', 'site_new2', 'xxfer_in', 'xfer', 'site', 'xfer_in ', 'XFER_IN']) { claim(!MILESTONE.test(n) && !re.test(n), `a pattern accepts ${n}`); }
  claim(wre === String(MILESTONE), 'the two patterns differ');
  claim(/xfer:\s*"SELECT step, COUNT\(\*\) AS n FROM steps WHERE step IN \('xfer_offer', 'xfer_sent', 'xfer_in', 'xfer_code', 'site_new'\) GROUP BY step ORDER BY step"/.test(worker), 'the worker has no query for the marks');
  claim(/env\.DB\.prepare\(REACH_SQL\.xfer\)\.all\(\)/.test(worker) && /xfer: xferRows\.results/.test(worker), 'the worker does not return the marks');
  const admin = readFileSync('src/ui/screens/Admin.tsx', 'utf8');
  claim(/העברה לדומיין/.test(admin) && /reach\.xfer/.test(admin), 'the dashboard has no row for the move');
  // the receiver marker the old address looks for, and nothing that would attach the domain
  claim(existsSync('public/xfer.json') && JSON.stringify(JSON.parse(readFileSync('public/xfer.json', 'utf8'))) === '{"receiver":1}', 'public/xfer.json is not {"receiver":1}');
  claim(!existsSync('public/CNAME'), 'a CNAME file is in the build');
  claim(T.TRANSFER_OFFER === true, 'the offer is switched off');
  claim(T.RECEIVER_URL === 'https://beapro.co.il/xfer.json', `the receiver url is ${T.RECEIVER_URL}`);
}

console.log(`${checked} checks`);
if (fails.length) { console.log(`FAIL (${fails.length} of ${checked})`); for (const f of fails.slice(0, 40)) console.log('  - ' + f); process.exit(1); }
console.log('OK, a career crosses to the new address whole, asks before it overwrites, rolls back when it cannot finish, listens only to the right window, and the old address never changes its own save');
