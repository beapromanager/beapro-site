/**
 * The weekend league asks for consent and keeps no mail (Itzik, 27.10).
 *
 *   1. no mail anywhere: no email field, no mail box, no "אפשר להסיר בכל רגע", nothing sent to the server, nothing
 *      stored by it; a lobby written by an earlier build loses its mails at the first request
 *   2. consent: all three registration screens carry the box, unticked from the start, and their button waits for
 *      it; the box names the terms and the privacy policy; the server refuses a registration without the current
 *      version (all three doors), so a client cannot skip it by not drawing it
 *      16 and up (Itzik, 31.10): all three screens also carry the age box with the agreed sentence, unticked from the
 *      start, its own box, and the button waits for it too; both documents say 16 and up; LEGAL_VERSION is 2026-10-31
 *   3. the league's name goes through the nickname filter
 *   4. deletion: a finished match deletes itself a week later (squads, team names, device ids), the lobby sweeps
 *      itself, and the wording in the game says what is true
 *   5. the contact address is a mailto link on the title screen and in the league; the text of the two documents
 *      is in before the league's door may open
 *   6. twelve months (Itzik, 29.10): the statistics in D1 and the champions count in the lobby delete themselves within
 *      twelve months, the code does it (a daily cron on the counting house, the lobby's alarm), and the text says so
 * Run: npm run check:legal
 */
import { readFileSync } from 'node:fs';
import * as W from '../src/game/weekendCore.ts';
import { makeSquad } from '../src/data/squadGen.ts';
import { createRng } from '../src/engine/matchEngine.ts';
import { LobbyDO, MatchDO } from '../worker/src/weekend.ts';
import { LEGAL_TEXT_READY } from '../src/data/legalText.ts';
import { CONTACT_EMAIL } from '../src/game/legal.ts';
import count from '../worker/src/index.ts';
import { RETAIN_MS, PURGE_SQL } from '../worker/src/retention.ts';

const fails: string[] = [];
let checked = 0;
const claim = (ok: boolean, msg: string) => { checked++; if (!ok) fails.push(msg); };
const read = (p: string) => readFileSync(p, 'utf8');

const screens = read('src/ui/weekend/Weekend.tsx');
const client = read('src/game/weekend.ts');
const worker = read('worker/src/weekend.ts');
const guide = read('src/game/weekendGuide.ts');
const title = read('src/ui/screens/Title.tsx');
const sheet = read('src/ui/components/LegalSheet.tsx');

function openTime(): number {
  for (let t = Date.UTC(2026, 10, 1, 18, 0); t < Date.UTC(2026, 11, 20); t += 3_600_000) {
    if (W.registrationGate(t) === null && W.cyclePhase(W.cycleOf(t), t) === 'open') return t;
  }
  throw new Error('no open registration hour found');
}
function fakeState(store: Map<string, unknown>, onAlarm: (t: number) => void = () => {}) {
  return {
    storage: {
      async get<T>(k: string) { return store.get(k) as T | undefined; },
      async put<T>(k: string, v: T) { store.set(k, structuredClone(v)); },
      async delete(k: string) { return store.delete(k); },
      async setAlarm(t: number) { onAlarm(t); },
      async deleteAlarm() {},
      async deleteAll() { store.clear(); },
    },
  } as never;
}
function fakeEnv() {
  const league = { fetch: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }) };
  return { LEAGUE: { idFromString: (s: string) => s, newUniqueId: () => ({ toString: () => 'L' + Math.random().toString(36).slice(2) }), get: () => league }, MATCH: {}, LOBBY: {} } as never;
}

/* 1. no mail */
{
  claim(!/MailOpt/.test(screens), 'the mail box component is still in the weekend screens');
  claim(!/type="email"|inputMode="email"|setEmail|\bemail\b/i.test(screens), 'a mail input or state is still in the weekend screens');
  claim(!/אפשר להסיר בכל רגע|רוצה לקבל עדכונים|מייל רק אם סימנת/.test(screens + guide + sheet), 'the mail wording is still in the game');
  claim(!/\bemail\b/i.test(client), 'the client API still has an email field');
  claim(!/\bemail\b/i.test(worker.replace(/\/\*[\s\S]*?\*\//g, '')), 'the server code still reads an email');
  claim(!/s\.mails\b|mails:/.test(worker), 'the server still stores mails');
  const store = new Map<string, unknown>([['lobby', { codes: {}, devices: {}, open: [], last: {}, champions: {}, mails: { dev1: { mail: 'a@b.co', at: 1 } }, counter: 0 }]]);
  const lobby = new LobbyDO(fakeState(store), fakeEnv());
  await lobby.fetch(new Request('https://do/mine?device=dev1xxxxxxxx'));
  claim(!('mails' in (store.get('lobby') as object)), 'a lobby written with mails kept them after the first request');
}

/* 2. consent */
{
  const boxes = (screens.match(/<ConsentBox /g) ?? []).length;
  claim(boxes === 3, `${boxes} registration screens carry the consent box, not 3`);
  claim((screens.match(/const \[ok, setOk\] = useState\(false\)/g) ?? []).length === 3, 'the consent is not false from the start on all three screens');
  claim((screens.match(/disabled=\{busy \|\| !ok \|\|/g) ?? []).length === 3, 'a registration button does not wait for the consent');
  claim((screens.match(/consent: LEGAL_VERSION/g) ?? []).length === 3, 'a registration does not send the consent version');
  claim(/קראתי ואני מסכים\/ה ל/.test(sheet) && /תנאי השימוש/.test(sheet) && /מדיניות הפרטיות/.test(sheet), 'the consent sentence is not the agreed one');
  const regs = screens.slice(screens.indexOf('function CreateLeague'), screens.indexOf('function Lobby'));
  // 16 and up (Itzik, 31.10): the age is its own box, unticked, on all three doors, and the button waits for it
  claim(sheet.includes("export const AGE_DECLARATION = 'אני מצהיר/ה שאני בן/בת 16 ומעלה'"), 'the age sentence is not the agreed one');
  const consentFn = sheet.slice(sheet.indexOf('export function ConsentBox'), sheet.indexOf('/** the sentence a person ticks for their age'));
  claim(sheet.includes('export function AgeBox') && !/16|גיל/.test(consentFn), 'the age is not its own box');
  claim((regs.match(/<AgeBox checked=\{age16\} onChange=\{setAge16\} \/>/g) ?? []).length === 3, 'not all three registration screens carry the age box');
  claim((regs.match(/const \[age16, setAge16\] = useState\(false\)/g) ?? []).length === 3, 'the age box is not false from the start on all three screens');
  claim((regs.match(/disabled=\{busy \|\| !ok \|\| !age16 \|\|/g) ?? []).length === 3, 'a registration button does not wait for the age box');
  claim(W.LEGAL_VERSION === '2026-10-31', `LEGAL_VERSION is ${W.LEGAL_VERSION}, not the 16-and-up version 2026-10-31`);
  {
    const legalTxt = read('src/data/legalText.ts');
    const terms = legalTxt.slice(legalTxt.indexOf('export const TERMS'));
    const privacy = legalTxt.slice(0, legalTxt.indexOf('export const TERMS'));
    claim(/ליגת השכונה מיועדת לבני 16 ומעלה/.test(privacy) && /ליגת השכונה מיועדת לבני 16 ומעלה/.test(terms), 'the privacy policy or the terms do not say 16 and up');
    claim(!/אין הגבלת גיל/.test(legalTxt), 'the policy still says there is no age limit');
    claim(/נתוני הליגה נמחקים 7 ימים אחרי הגמר/.test(privacy) && /עד 12 חודשים/.test(privacy), 'the short retention line is missing');
    claim(/Cloudflare[^"]*גיבויים/.test(privacy), 'the policy says nothing of the backups Cloudflare keeps');
  }
  claim(!/defaultChecked|useState\(true\)/.test(sheet), 'the consent box is ticked by default');

  const t0 = openTime();
  const store = new Map<string, unknown>();
  const lobby = new LobbyDO(fakeState(store), fakeEnv());
  const post = async (path: string, b: object, at = t0) => {
    const res = await lobby.fetch(new Request(`https://do${path}`, { method: 'POST', body: JSON.stringify(b), headers: { 'x-now': String(at) } }));
    return { ok: res.ok, status: res.status, data: await res.json() as { error?: string } };
  };
  const slots = ['fri-12', 'fri-14', 'sat-20'];
  const base = (i: number) => ({ device: `consent-dev-${i}-xxxxxxxx`, nick: `שחקן${i}` });
  const doors: [string, object][] = [['/league', { name: 'ליגה טובה', slots, size: 6 }], ['/league/join', { code: 'ABCDEF' }], ['/league/open', {}]];
  for (const [path, extra] of doors) {
    const none = await post(path, { ...base(1), ...extra });
    claim(!none.ok && /לאשר/.test(none.data.error ?? ''), `${path}: a registration without consent was not refused for consent (${none.status} ${none.data.error})`);
    const old = await post(path, { ...base(1), ...extra, consent: '2020-01-01' });
    claim(!old.ok && /לאשר/.test(old.data.error ?? ''), `${path}: an old consent version was accepted`);
    const yes = await post(path, { ...base(1), ...extra, consent: W.LEGAL_VERSION });
    claim(!/לאשר/.test(yes.data.error ?? ''), `${path}: the right consent was refused for consent`);
  }
  claim(!JSON.stringify([...store.values()]).includes('@'), 'a mail-looking value ended up in storage');
}

/* 3. the name filter */
{
  claim(W.nameProblem('ליגת היטלר') !== null && W.nameProblem('FUCK league') !== null, 'a league name with a bad word passed nameProblem');
  claim(W.nameProblem('ליגת בניין 7') === null, 'a clean league name was refused');
  claim(W.nameProblem('א') !== null && W.nameProblem('א'.repeat(25)) !== null, 'the length rule of the name is gone');
  const store = new Map<string, unknown>();
  const lobby = new LobbyDO(fakeState(store), fakeEnv());
  const res = await lobby.fetch(new Request('https://do/league', { method: 'POST', headers: { 'x-now': String(openTime()) }, body: JSON.stringify({ device: 'name-dev-xxxxxxxxxx', nick: 'דודו', name: 'ליגת היטלר', slots: ['fri-12', 'fri-14', 'sat-20'], size: 6, consent: W.LEGAL_VERSION }) }));
  claim(res.status === 400 && /לא נכנס/.test((await res.json() as { error: string }).error), 'the server let a league with a bad name open');
}

/* 4. deletion */
{
  const rng = createRng(5);
  const h = makeSquad(85, rng), a = makeSquad(85, rng);
  const side = (id: string, name: string, s: ReturnType<typeof makeSquad>) => ({ id, name, starters: s.starters, bench: s.bench, tactic: { approach: 'balanced' as const, press: 'mid' as const, formation: '4-4-2' as const } });
  const store = new Map<string, unknown>();
  let alarmAt: number | null = null;
  const m = new MatchDO(fakeState(store, t => { alarmAt = t; }), fakeEnv());
  const real = Date.now;
  const t0 = real();
  await m.fetch(new Request('https://do/create', { method: 'POST', headers: { 'x-now': String(t0) }, body: JSON.stringify({ seed: 9, home: side('h', 'בניין 7', h), away: side('a', 'הגבעה', a), homeDevice: 'matchdev-home-xx', awayDevice: 'matchdev-away-xx' }) }));
  let done = false;
  for (let t = t0; !done && t < t0 + 3 * 3_600_000; t += 20_000) {
    const r = await m.fetch(new Request('https://do/result', { headers: { 'x-now': String(t) } }));
    done = (await r.json() as { done: boolean }).done;
  }
  claim(done, 'the match did not finish');
  const purgeAt = store.get('purgeAt') as number | undefined;
  claim(typeof purgeAt === 'number' && Math.abs(purgeAt - (real() + W.KEEP_MS)) < 60_000, 'a finished match does not set a purge a week ahead');
  claim(alarmAt === purgeAt, 'the purge is not set as the alarm');
  claim(store.has('duel') && store.has('devices'), 'the match has nothing to delete');
  Date.now = () => real() + W.KEEP_MS - 5 * 60_000;
  await m.alarm();
  claim(store.has('duel'), 'a match was deleted before its week was out');
  Date.now = () => real() + W.KEEP_MS + 5 * 60_000;
  await m.alarm();
  Date.now = real;
  claim(store.size === 0, `a match a week after its end still holds ${[...store.keys()].join(',')}`);

  claim(/async alarm\(\)[\s\S]{0,200}sweepLobby/.test(worker), 'the lobby does not sweep itself on an alarm');
  const faq = guide.slice(guide.indexOf("q: 'מה נשמר עליי?'"));
  claim(/הסגל/.test(faq) && /הבחירות/.test(faq) && /נמחקים/.test(faq) && /מספר האליפויות/.test(faq) && /לא נאסף טלפון, מיקום או מייל/.test(faq), 'the FAQ answer on what is kept is not the true one');
  claim(!/הכול נמחק/.test(guide + screens), 'a "everything is deleted" claim is back');
}

/* 5. contact and the text */
{
  claim(CONTACT_EMAIL === 'beapromanager@gmail.com', 'the contact address is not the agreed one');
  claim(/href=\{`mailto:\$\{CONTACT_EMAIL\}`\}/.test(sheet), 'the contact address is not a mailto link');
  claim(/LegalLinks open=\{setLegal\}/.test(title), 'the title screen has no legal links and contact line');
  claim((screens.match(/<WkFooter \/>/g) ?? []).length === 2, 'the league home and lobby do not both carry the footer');
  const live = /export const WEEKEND_LIVE\s*=\s*(\w+)/.exec(client);
  claim(!!live, 'WEEKEND_LIVE not found');
  claim(!live || live[1] !== 'true' || LEGAL_TEXT_READY, 'the league is open but the text of the terms and privacy policy is not in');
  claim(!/טיוטה|draft|עו״ד|עורך דין/i.test(read('src/data/legalText.ts')), 'the legal text carries a note meant for the lawyer or the word draft');
  // a decision still open is marked [[להשלים: ...]] in the text (29.10); the league's door stays shut while one is left
  const open = (read('src/data/legalText.ts').match(/\[\[להשלים/g) ?? []).length;
  claim(!live || live[1] !== 'true' || open === 0, `the league is open but the legal text still has ${open} open [[להשלים]] marker(s)`);
  // the review of 29.10: the operator line, the jurisdiction sentence, no "at any time", nothing called anonymous
  const legal = read('src/data/legalText.ts');
  claim(legal.includes('איציק עוזיאל, הפועל בשם העסקי ISRU-E') && !legal.includes('עוסק פטור'), 'the operator line is not the agreed one');
  claim(legal.includes('על תנאי השימוש יחול הדין הישראלי. סמכות השיפוט תהיה לבתי המשפט המוסמכים בהתאם להוראות הדין'), 'the jurisdiction sentence is not the agreed one');
  claim(!/בכל זמן|30 יום|חסימ/.test(legal), 'the legal text promises a time or a block it cannot keep, or says "at any time"');
  claim(!/אנונימי נספר/.test(title) && /לא בהכרח אנונימיים/.test(legal), 'the game still calls the counting anonymous');
}

/* 6. twelve months */
{
  const DAY = 86_400_000;
  const legal = read('src/data/legalText.ts');
  // the code keeps nothing past twelve months, counted with the cron's day between runs
  claim(RETAIN_MS + DAY <= 365 * DAY, `the statistics can outlive twelve months (RETAIN_MS ${RETAIN_MS / DAY} days and a day between runs)`);
  claim(W.CHAMPIONS_KEEP_MS <= 365 * DAY, 'a champions count can outlive twelve months');
  claim(/\[triggers\][\s\S]*crons\s*=\s*\["17 3 \* \* \*"\]/.test(read('worker/wrangler.toml')), 'the counting house has no daily cron, so nothing deletes the statistics');
  // and the text says the same: the statistics and the champions count, twelve months, deleted on their own
  claim(/כמה זמן: עד 12 חודשים\. .*נמחק אוטומטית מהשרת לא יאוחר מ-12 חודשים אחרי שנרשם/.test(legal), 'the policy does not say the statistics go within twelve months');
  claim(/מספר האליפויות של כל מכשיר: .*נמחק מהשרת אוטומטית 12 חודשים אחרי האליפות האחרונה של המכשיר/.test(legal), 'the policy does not say the champions count goes twelve months after the last championship');
  claim(/המספר האקראי עצמו נשמר גם במכשיר שלך/.test(legal) && /הכינוי, שם הליגה והתוצאה נשארים בתוך הקריירה שלך/.test(legal), 'the policy hides what stays on the device');
  claim(!/אין לו מחיקה אוטומטית|אין להם מחיקה אוטומטית/.test(legal), 'the policy still says nothing deletes them');
  claim(/12 חודשים אחרי האליפות האחרונה/.test(guide) && /12 חודשים אחרי האליפות האחרונה/.test(screens), 'the FAQ or the league screen does not say the champions count goes after twelve months');

  // the counting house: real rows in SQLite behind a D1-shaped door, the cron run in process
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  db.exec(read('worker/schema.sql'));
  const d1 = {
    prepare(sql: string) {
      const make = (args: unknown[]) => ({
        bind: (...v: unknown[]) => make(v),
        all: async () => ({ results: db.prepare(sql).all(...(args as never[])) }),
        run: async () => db.prepare(sql).run(...(args as never[])),
      });
      return make([]);
    },
    async batch(stmts: { run(): Promise<unknown> }[]) { db.exec('BEGIN'); try { for (const st of stmts) await st.run(); db.exec('COMMIT'); } catch (e) { db.exec('ROLLBACK'); throw e; } return []; },
  };
  const env = { DB: d1, ADMIN_KEY: '' } as never;
  const real = Date.now;
  const T = Date.UTC(2027, 10, 20, 12, 0);
  Date.now = () => T;
  // a device whose clock is a week ahead lands on its arrival, never after it
  await count.fetch(new Request('https://c/', { method: 'POST', body: JSON.stringify({ e: [{ a: 'fresh-aid', s: 's1', k: 'open', t: T + 7 * DAY }, { a: 'fresh-aid', s: 's1', k: 'crash', t: T, w: 'title', n: 'Error' }] }) }), env);
  const fresh = db.prepare("SELECT ts FROM steps WHERE aid = 'fresh-aid'").get() as { ts: number } | undefined;
  claim(fresh?.ts === T, `a future device clock was written as ${fresh?.ts}, not the arrival ${T}`);
  const put = (aid: string, ts: number) => {
    db.prepare('INSERT INTO steps VALUES (?, ?, ?, ?)').run(aid, 'title', ts, new Date(ts).toISOString().slice(0, 10));
    db.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?)').run('sid-' + aid, aid, ts, new Date(ts).toISOString().slice(0, 10));
    db.prepare('INSERT INTO crashes VALUES (?, ?, ?, ?, ?, ?)').run(aid, 'sid-' + aid, ts, new Date(ts).toISOString().slice(0, 10), 'title', 'Error');
  };
  put('old-aid', T - RETAIN_MS - 1);
  put('edge-aid', T - RETAIN_MS + 60_000);
  put('year-aid', T - 365 * DAY);
  const left = (aid: string) => ['steps', 'sessions', 'crashes'].map(t => (db.prepare(`SELECT COUNT(*) AS n FROM ${t} WHERE aid = ?`).get(aid) as { n: number }).n);
  const runs: Promise<unknown>[] = [];
  const sched = (count as unknown as { scheduled?: (e: unknown, env: unknown, ctx: { waitUntil(p: Promise<unknown>): void }) => Promise<void> }).scheduled;
  claim(typeof sched === 'function', 'the counting house has no scheduled() for its cron');
  if (sched) { await sched({ cron: '17 3 * * *', scheduledTime: T }, env, { waitUntil: p => { runs.push(p); } }); await Promise.all(runs); }
  claim(left('old-aid').join() === '0,0,0', `rows older than RETAIN_MS are still there: ${left('old-aid')}`);
  claim(left('year-aid').join() === '0,0,0', `rows a year old are still there: ${left('year-aid')}`);
  claim(left('edge-aid').join() === '1,1,1', `rows inside the year were deleted: ${left('edge-aid')}`);
  claim(left('fresh-aid').join() === '1,1,1', `today's rows were deleted: ${left('fresh-aid')}`);
  // the entry module may export only the handler, interfaces and the REACH_SQL object: wrangler dev showed a number export stops the worker
  const extra = [...read('worker/src/index.ts').matchAll(/^export (?:const|let|var|async function|function|class) (\w+)/gm)].map(m => m[1]).filter(n => n !== 'REACH_SQL');
  claim(extra.length === 0, `worker/src/index.ts exports ${extra.join(', ')}, and the Workers runtime refuses non-handler exports of the entry module`);
  claim(PURGE_SQL.length === 3 && ['steps', 'sessions', 'crashes'].every(t => PURGE_SQL.some(q => q.includes(`FROM ${t} `))), 'the cron does not cover all three tables');
  Date.now = real;

  // the lobby: a count from before 29.10 is stamped when first read; each count goes a year after its last championship
  const K = W.CHAMPIONS_KEEP_MS;
  const store = new Map<string, unknown>([['lobby', { codes: {}, devices: {}, open: [], last: {}, champions: { 'champ-old-xx': 2, 'champ-two-xx': 1 }, counter: 0 }]]);
  let alarmAt = 0;
  const lobby = new LobbyDO(fakeState(store, t => { alarmAt = t; }), fakeEnv());
  const L0 = Date.UTC(2026, 11, 1, 12, 0);
  const at = (t: number) => ({ 'x-now': String(t) });
  Date.now = () => L0;
  await lobby.fetch(new Request('https://do/mine?device=champ-old-xx', { headers: at(L0) }));
  let saved = store.get('lobby') as { champions: Record<string, number>; championsAt?: Record<string, number> };
  claim(saved.championsAt?.['champ-old-xx'] === L0 && saved.championsAt?.['champ-two-xx'] === L0, 'an old count was not stamped with the moment it was first read');
  claim(alarmAt > L0 && alarmAt <= L0 + K, 'the lobby does not wake by the time a count is due');
  const L1 = L0 + 200 * DAY;
  Date.now = () => L1;
  await lobby.fetch(new Request('https://do/champion', { method: 'POST', headers: at(L1), body: JSON.stringify({ device: 'champ-two-xx' }) }));
  saved = store.get('lobby') as typeof saved;
  claim(saved.champions['champ-two-xx'] === 2 && saved.championsAt?.['champ-two-xx'] === L1, 'a new championship did not restart the year');
  Date.now = () => L0 + K - 60_000;
  await lobby.alarm();
  saved = store.get('lobby') as typeof saved;
  claim(saved.champions['champ-old-xx'] === 2, 'a count was deleted before its year was out');
  Date.now = () => L0 + K;
  await lobby.alarm();
  saved = store.get('lobby') as typeof saved;
  claim(!('champ-old-xx' in saved.champions) && !('champ-old-xx' in (saved.championsAt ?? {})), 'a count a year after the last championship is still on the server');
  claim(saved.champions['champ-two-xx'] === 2, 'a count still inside its year was deleted');
  claim(alarmAt <= L1 + K, 'the lobby does not wake by the time the next count is due');
  const res = await lobby.fetch(new Request('https://do/champions', { method: 'POST', headers: at(L0 + K), body: JSON.stringify({ devices: ['champ-old-xx', 'champ-two-xx'] }) }));
  const seen = await res.json() as Record<string, number>;
  claim(seen['champ-old-xx'] === 0 && seen['champ-two-xx'] === 2, `the prize reads the wrong counts after a deletion: ${JSON.stringify(seen)}`);
  // and on access, without waiting for the alarm
  Date.now = () => L1 + K;
  await lobby.fetch(new Request('https://do/mine?device=champ-two-xx', { headers: at(L1 + K) }));
  saved = store.get('lobby') as typeof saved;
  claim(Object.keys(saved.champions).length === 0 && Object.keys(saved.championsAt ?? {}).length === 0, 'a request a year after the last championship did not delete the count');
  Date.now = real;
}

if (fails.length) { console.log(`FAIL (${fails.length} of ${checked}):`); for (const f of fails) console.log(' - ' + f); process.exit(1); }
console.log(`ok: ${checked} claims. no mail; consent on all three doors, in the screen and on the server; names filtered; a finished match deletes itself; statistics and champions counts go within twelve months.`);
