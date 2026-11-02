/**
 * The owner's dashboard (ops/index.html, src/ops/) and why it cannot hurt the game:
 *   1. it holds the key in memory only: no localStorage, sessionStorage, cookie or IndexedDB anywhere in src/ops, no key in the repo
 *   2. the page is noindex, sends no referrer, and may only connect to the counting worker
 *   3. the game does not import it and is built without it: the game's own build (vite.config.ts) has no ops entry, and
 *      dist/index.html + its scripts carry no dashboard text (when dist exists)
 *   4. every step and mark has a plain Hebrew name, and the "not sent yet" list matches what the game really sends
 *   5. buildView on made-up answers: the old shape (basic) and the patched one (full), today vs yesterday, the biggest fall
 *   6. the key: header first, ?key= when the old Worker refuses the header, a wrong key is forgotten, nothing goes elsewhere
 *   7. the service worker does not cache or answer anything (so /ops/ is never served stale to a player or kept offline)
 *   node --experimental-strip-types scripts/ops-check.mts
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { STEPS, OB_MARKS, CUP_MARKS, EURO_MARKS, GIFT_MARKS, SHARE_MARKS, DAILY_MARKS, MONEY_MARKS } from '../src/game/telemetry.ts';
import { labelOf, OB_NOT_SENT_YET, OB_LABEL } from '../src/ops/labels.ts';
import { buildView, worstFall, road } from '../src/ops/model.ts';
import * as api from '../src/ops/api.ts';
import { MOCK_KEY, NOW, basic, full, withWeekend } from './ops-fixture.mjs';

const fails: string[] = [];
let checked = 0;
const ok = (c: unknown, msg: string) => { checked++; if (!c) fails.push(msg); };
const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const read = (f: string) => readFileSync(f, 'utf8');
/** the code of a file without its comments (a comment saying "never localStorage" is not a use of it) */
const code = (f: string) => read(f).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

/* 1. storage and key */
const opsFiles = walk('src/ops');
for (const f of opsFiles) {
  const s = code(f);
  ok(!/localStorage|sessionStorage|document\.cookie|indexedDB|caches\.|serviceWorker/.test(s), `${f}: touches storage`);
  ok(!/[A-Za-z0-9_\-]{32,}/.test(s.replace(/https?:\/\/\S+/g, '')), `${f}: a long token-like literal (a key?)`);
  if (!f.endsWith('api.ts')) ok(!/\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/.test(s), `${f}: talks to the network outside api.ts`);
}
const apiSrc = code('src/ops/api.ts');
ok((apiSrc.match(/https:\/\/[^'"`\s]+/g) ?? []).every(u => u === 'https://beapro-count.beapromanager.workers.dev/stats'), 'api.ts names an address other than /stats');
for (const p of ["cache: 'no-store'", "credentials: 'omit'", "referrerPolicy: 'no-referrer'"]) ok(apiSrc.includes(p), `api.ts: the request lacks ${p}`);
for (const f of [...walk('src'), ...walk('ops'), 'vite.ops.config.ts', 'package.json'])
  ok(!/ADMIN_KEY\s*[:=]\s*['"][^'"]{8,}/.test(read(f)) && !/[?&#]admin=[A-Za-z0-9]{8,}/.test(read(f)), `${f}: looks like it carries a key`);

/* 2. the page */
const html = read('ops/index.html');
ok(/<meta name="robots" content="noindex,\s*nofollow"/.test(html), 'ops/index.html is not noindex,nofollow');
ok(/<meta name="referrer" content="no-referrer"/.test(html), 'ops/index.html sends a referrer');
const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';
ok(/connect-src https:\/\/beapro-count\.beapromanager\.workers\.dev(;|$)/.test(csp), `the dashboard may connect elsewhere: ${csp}`);
ok(/default-src 'self'/.test(csp) && !/unsafe-eval/.test(csp), 'the CSP is loose');
ok(!/manifest|sw\.js|gtag|analytics/i.test(html), 'the dashboard page loads a manifest, a service worker or analytics');

/* 3. the game is built without it */
const gameVite = read('vite.config.ts');
ok(!/ops/.test(gameVite), 'vite.config.ts (the game) mentions ops');
const opsVite = read('vite.ops.config.ts');
ok(/emptyOutDir:\s*false/.test(opsVite) && /publicDir:\s*false/.test(opsVite), 'vite.ops.config.ts could wipe or copy over the game build');
for (const f of walk('src').filter(f => !f.startsWith(path.join('src', 'ops')))) ok(!/from ['"][./]*ops\//.test(read(f)) && !/['"]\.\.?\/(\.\.\/)*ops\//.test(read(f)), `${f}: the game imports the dashboard`);
const pkg = JSON.parse(read('package.json'));
ok(/vite build --config vite\.ops\.config\.ts/.test(pkg.scripts.build), 'npm run build does not build the dashboard separately');
if (existsSync('dist/index.html')) {
  const gameHtml = read('dist/index.html');
  ok(!/ops/.test(gameHtml.replace(/<meta[^>]+>/g, '')), 'dist/index.html refers to the dashboard');
  const assets = readdirSync('dist/assets');
  const gameJs = [...gameHtml.matchAll(/assets\/([^"']+\.js)/g)].map(m => m[1]);
  ok(gameJs.length > 0 && gameJs.every(f => !f.startsWith('ops')), `the game loads ${gameJs.join(', ')}`);
  for (const f of assets.filter(f => f.endsWith('.js') && !f.startsWith('ops'))) {
    const s = read(path.join('dist/assets', f));
    ok(!s.includes('הכי הרבה נושרים') && !s.includes('beapro-count.beapromanager.workers.dev/stats') && !s.includes('Bearer'), `dist/assets/${f}: dashboard code in a game file`);
  }
  ok(existsSync('dist/ops/index.html') && /noindex/.test(read('dist/ops/index.html')), 'dist/ops/index.html missing or indexable');
  ok(!existsSync('dist/ops/sw.js') && !existsSync('dist/ops/manifest.webmanifest'), 'the dashboard build copied public/ into ops');
} else console.log('note: no dist, the build part was not checked (run npm run build first)');

/* 4. names */
for (const k of [...STEPS, ...OB_MARKS, ...CUP_MARKS, ...EURO_MARKS, ...GIFT_MARKS, ...SHARE_MARKS, ...DAILY_MARKS, ...MONEY_MARKS])
  ok(labelOf(k) !== k && /[\u0590-\u05FF]/.test(labelOf(k)), `no Hebrew name for ${k}`);
const sent = new Set<string>();
for (const f of walk('src').filter(f => /\.(ts|tsx)$/.test(f) && !f.startsWith(path.join('src', 'ops'))))
  for (const m of read(f).matchAll(/obMark\(\s*(?:[^)]*?)['"](ob_[a-z0-9_]+)['"]/g)) sent.add(m[1]);
for (const f of walk('src').filter(f => /\.(ts|tsx)$/.test(f) && !f.startsWith(path.join('src', 'ops'))))
  for (const m of read(f).matchAll(/obMark\([^;\n]*\)/g)) for (const q of m[0].matchAll(/['"](ob_[a-z0-9_]+)['"]/g)) sent.add(q[1]);
for (const k of OB_MARKS) ok(sent.has(k) === !OB_NOT_SENT_YET.includes(k), `${k}: the game ${sent.has(k) ? 'sends it but the dashboard says "not sent yet"' : 'does not send it but the dashboard counts on it'}`);
ok(Object.keys(OB_LABEL).length === OB_MARKS.length, 'OB_LABEL and OB_MARKS differ in size');

/* 5. buildView */
{
  const v = buildView(basic() as never, NOW, 30);
  ok(v.mode === 'basic' && v.dayZone === 'UTC', 'basic: wrong mode');
  ok(v.trend.length === 30 && v.trend[29].day === '2026-11-02' && v.trend.every(d => d.fresh === null), 'basic: trend not 30 filled days ending today');
  ok(v.trend.some(d => d.people === 0), 'basic: a missing day is not a zero');
  ok(v.cards.find(c => c.key === 'people')!.today !== null && v.cards.find(c => c.key === 'career_new')!.today === null, 'basic: cards do not say what is unknown');
  ok(v.ob.every(r => r.n === null), 'basic: ob counts drawn as numbers without the patch');
  ok(v.cup.every(c => c.n === null) && v.money.every(c => c.n === null), 'basic: cup/money drawn without the patch');
  ok(v.oldRoad.length === 18 && v.oldRoad[0].n === 1200 && v.oldRoad[2].lost === 400, 'basic: old road wrong');
  ok(v.worst?.from === 'open' && v.worst?.to === 'career_new' && v.worst.lost === 500, `basic: biggest fall ${JSON.stringify(v.worst)}`);
  ok(v.europe.find(e => e.key === 'eu_final')!.n === 3 && v.share.tap === 25 && v.depth.gift10 === 7 && v.dailyGift[2].n === 2, 'basic: europe/share/gift/daily wrong');
  ok(v.weekend === null && v.crashes[0].where !== 'match1_half', 'basic: weekend or crash name');
  ok(v.totals.returnedPct === 31.7, `basic: returned ${v.totals.returnedPct}`);
}
{
  const raw = full();
  const v = buildView(raw as never, NOW, 30);
  ok(v.mode === 'full' && v.dayZone === 'ישראל' && v.newRoadWindow, 'full: wrong mode');
  const c = v.cards.find(x => x.key === 'career_new')!;
  ok(c.partial && c.today === raw.ext.days[29].steps.career_new && c.yesterday === raw.ext.soFar.yesterday.steps.career_new, 'full: today vs yesterday-so-far wrong');
  const ob = v.ob.find(r => r.key === 'ob_prologue')!;
  ok(ob.n === 260 && ob.sent && v.ob.find(r => r.key === 'ob_market')!.sent === false, 'full: ob rows wrong');
  ok(v.cup.find(x => x.key === 'cup_won')!.n === 9 && v.money.find(x => x.key === 'money_sack')!.n === 11, 'full: cup/money wrong');
  const sum = raw.ext.days.reduce((a, d) => a + d.steps.ob_prologue, 0);
  ok(v.newRoad.find(s => s.key === 'ob_prologue')!.n === sum, 'full: new road is not the window sum');
  ok(buildView(withWeekend() as never, NOW, 30).weekend?.managers === 37, 'full: weekend not passed');
  ok(buildView(raw as never, NOW, 7).trend.length === 7, 'full: 7-day window');
}
{
  const st = road(['a', 'b', 'c', 'd'], k => ({ a: 100, b: 90, c: 30, d: 1 } as Record<string, number>)[k], {});
  ok(worstFall(st, { d: 'late' })?.to === 'c', 'worstFall does not skip a late step');
}

/* 6. the key on the wire, with a fake fetch */
{
  const calls: { url: string; init: RequestInit }[] = [];
  let live: 'old' | 'patched' = 'old';
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (u: string, init: RequestInit) => {
    calls.push({ url: String(u), init });
    const url = new URL(String(u));
    const h = (init.headers ?? {}) as Record<string, string>;
    if (url.origin + url.pathname !== api.STATS_URL) throw new TypeError('blocked');
    if (live === 'old' && h.authorization) throw new TypeError('Failed to fetch');       // CORS refusal of the header
    const given = h.authorization?.replace(/^Bearer /, '') ?? url.searchParams.get('key');
    if (given !== MOCK_KEY) return new Response('{"ok":false}', { status: 401 });
    return new Response(JSON.stringify(live === 'old' ? basic() : full()), { status: 200 });
  }) as typeof fetch;
  try {
    ok((await api.getStats(30)).kind === 'unauthorized' && calls.length === 0, 'asked without a key');
    api.setKey(MOCK_KEY);
    let r = await api.getStats(30);
    ok(r.kind === 'ok' && api.sentAs() === 'query' && calls.length === 2, `old worker: header then query (${calls.length}, ${api.sentAs()})`);
    calls.length = 0; await api.getStats(7);
    ok(calls.length === 1 && calls[0].url.includes('days=7'), 'old worker: the second ask tried the header again');
    for (const c of calls) ok(c.init.credentials === 'omit' && c.init.cache === 'no-store' && c.init.referrerPolicy === 'no-referrer', 'a request with cookies, cache or referrer');
    api.clearKey(); live = 'patched'; calls.length = 0;
    api.setKey(MOCK_KEY);
    r = await api.getStats(30);
    ok(r.kind === 'ok' && api.sentAs() === 'header' && calls.length === 1 && !calls[0].url.includes('key='), 'patched worker: the key went in the address');
    api.clearKey(); api.setKey('wrong'); calls.length = 0;
    r = await api.getStats(30);
    ok(r.kind === 'unauthorized' && api.sentAs() === null, 'a wrong key was not refused');
    api.clearKey();
    ok(!api.hasKey(), 'clearKey kept the key');
    ok(calls.every(c => c.url.startsWith(api.STATS_URL)), 'a request went elsewhere');
  } finally { globalThis.fetch = realFetch; }
}

/* 7. the service worker */
{
  const sw = code('public/sw.js');
  ok(!/respondWith|caches\.(open|match|put|add)/.test(sw) && !/\.(put|addAll?)\(/.test(sw), 'public/sw.js answers or caches requests');
}

if (fails.length) { console.log(`ops check: ${fails.length} of ${checked} failed`); for (const f of fails) console.log('  ✗ ' + f); process.exit(1); }
console.log(`ops check: all ${checked} good`);
