/**
 * The owner's dashboard in a real browser, on made-up numbers, at a phone's size (390x844), with a made-up key.
 *   PW_DIR=<a folder outside the repo with playwright-core in node_modules> SHOT_DIR=<where screenshots go> node scripts/ops-ui.mjs
 *
 * Nothing is reached on the network: every host name resolves to nothing, the site is served from dist as
 * https://beapromanager.github.io, and the counting worker's GET /stats is answered here from scripts/ops-fixture.mjs,
 * once as the Worker live today (refuses the Authorization header, answers ?key=, the basic shape) and once as the patched
 * one (header, the full shape). Fonts and anything else are refused. No PW_DIR: SKIP, exit 2, which is not a pass.
 *   1. sign in on the old Worker: header refused -> ?key=; the key is in no storage, cookie, address, history or page
 *   2. sign in on the patched Worker: the key only in the header, never in an address
 *   3. a wrong key: "המפתח לא נכון", nothing kept; "צא" forgets the key and the numbers
 *   4. 390 wide: right to left, no sideways scroll, every section has a heading
 *   5. the game with an old /?admin= link: the address is scrubbed and nothing asks /stats
 */
import { createRequire } from 'node:module';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { MOCK_KEY, basic, full, withWeekend } from './ops-fixture.mjs';

const PW_DIR = process.env.PW_DIR;
let pw = null;
if (PW_DIR) {
  const req = createRequire(path.join(path.resolve(PW_DIR), 'package.json'));
  for (const name of ['playwright', 'playwright-core']) { try { pw = req(name); break; } catch { /* next */ } }
}
if (!pw) { console.log('SKIP: playwright not installed (set PW_DIR to a folder with playwright-core in node_modules)'); process.exit(2); }

const fails = [];
let checked = 0;
const ok = (c, msg) => { checked++; if (!c) fails.push(msg); };
const SITE = 'https://beapromanager.github.io';
const STATS = 'https://beapro-count.beapromanager.workers.dev/stats';
const WORKER = 'https://beapro-count.beapromanager.workers.dev';
const SHOTS = process.env.SHOT_DIR || path.join(os.tmpdir(), 'dashboard-shots');
mkdirSync(SHOTS, { recursive: true });

const dist = path.resolve('dist');
if (!existsSync(path.join(dist, 'ops/index.html')) || !existsSync(path.join(dist, 'index.html')))
  execFileSync('npm', ['run', '-s', 'build'], { stdio: 'ignore' });
ok(existsSync(path.join(dist, 'ops/index.html')), 'the build has no dashboard page');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };

const ARGS = ['--host-resolver-rules=MAP * ~NOTFOUND'];
let browser;
for (const opts of [{ executablePath: '/usr/bin/google-chrome', args: ARGS }, { channel: 'chrome', args: ARGS }, { args: ARGS }]) { try { browser = await pw.chromium.launch(opts); break; } catch { /* next */ } }
if (!browser) { console.log('SKIP: no Chromium to drive'); process.exit(2); }
const watchdog = setTimeout(() => { console.log('STOPPED: did not finish in 8 minutes'); process.exit(1); }, 8 * 60 * 1000);

/** a world: the site from dist, /stats answered from a fixture by a Worker that is either 'old' or 'patched' */
async function newWorld({ worker = 'old', answer = basic, width = 390, height = 844 } = {}) {
  const st = { seen: [], statsAsks: [], posts: [] };
  const ctx = await browser.newContext({ viewport: { width, height }, locale: 'he-IL', deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.route('**/*', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const headers = req.headers();
    st.seen.push({ url: req.url(), method: req.method(), headers, post: req.postData() });
    const cors = { 'access-control-allow-origin': headers.origin ?? '*', 'content-type': 'application/json' };
    if (url.origin === WORKER) {
      if (req.method() === 'POST') { st.posts.push(req.postData() ?? ''); return route.fulfill({ status: 200, headers: cors, body: '{"ok":true}' }); }
      if (url.pathname !== '/stats') return route.fulfill({ status: 404, headers: cors, body: '{}' });
      const bearer = (headers.authorization ?? '').replace(/^Bearer /, '');
      st.statsAsks.push({ url: req.url(), bearer, referer: headers.referer ?? null, cookie: headers.cookie ?? null });
      // the Worker live today names only content-type in its CORS answer: the browser refuses a request with Authorization
      if (worker === 'old' && headers.authorization) return route.abort('accessdenied');
      const given = worker === 'old' ? url.searchParams.get('key') : bearer;
      if (given !== MOCK_KEY) return route.fulfill({ status: 401, headers: cors, body: '{"ok":false}' });
      return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(answer()) });
    }
    if (url.origin !== SITE) return route.abort();       // fonts and everything else
    if (/\.(mp4|mp3|ogg|wav)$/.test(url.pathname)) return route.abort();
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    let file = path.join(dist, rel);
    if (!file.startsWith(dist) || !existsSync(file)) {
      if (path.extname(rel)) return route.fulfill({ status: 404, body: 'not found' });
      file = path.join(dist, rel.startsWith('/ops') ? 'ops/index.html' : 'index.html');
    }
    return route.fulfill({ status: 200, body: readFileSync(file), headers: { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' } });
  });
  const errors = [];
  ctx.on('page', p => p.on('pageerror', e => errors.push(e.message)));
  return { ctx, st, errors };
}
const shot = (page, name, fullPage = false) => page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage });
const openOps = async w => { const p = await w.ctx.newPage(); await p.goto(`${SITE}/ops/`); await p.locator('input[type=password]').waitFor(); return p; };
const login = async (page, key = MOCK_KEY) => { await page.locator('input[type=password]').fill(key); await page.getByRole('button', { name: 'כניסה' }).click(); };

async function keyNowhere(page, w, what, { allowQueryToStats }) {
  const r = await page.evaluate(async () => ({
    href: location.href, hist: JSON.stringify(history.state), ls: JSON.stringify({ ...localStorage }), ss: JSON.stringify({ ...sessionStorage }),
    ck: document.cookie, html: document.documentElement.outerHTML, name: window.name, dbs: (await indexedDB.databases?.())?.length ?? 0,
  }));
  for (const [k, v] of Object.entries(r)) ok(!String(v).includes(MOCK_KEY), `${what}: the key is in ${k}`);
  ok(r.ls === '{}' && r.ss === '{}' && r.ck === '' && r.dbs === 0, `${what}: something was stored (${r.ls} ${r.ss} ${r.ck} ${r.dbs})`);
  for (const q of w.st.seen) {
    const toStats = q.url.startsWith(STATS);
    if (!(toStats && allowQueryToStats)) ok(!q.url.includes(MOCK_KEY), `${what}: the key is in the address of ${q.url.slice(0, 70)}`);
    ok(!(q.post ?? '').includes(MOCK_KEY) && !(q.headers.referer ?? '').includes(MOCK_KEY), `${what}: the key in a body or referer`);
    if (!toStats) ok(!(q.headers.authorization ?? '').includes(MOCK_KEY), `${what}: the key went to ${q.url.slice(0, 60)}`);
  }
  for (const a of w.st.statsAsks) ok(a.referer === null && a.cookie === null, `${what}: /stats was sent a referer or a cookie`);
}

async function layout(page, what) {
  const r = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    dir: getComputedStyle(document.body).direction, lang: document.documentElement.lang,
    h1: document.querySelectorAll('h1').length,
    secs: [...document.querySelectorAll('section.sec')].map(s => !!s.querySelector('h2')),
    robots: document.querySelector('meta[name=robots]')?.getAttribute('content'),
  }));
  ok(r.sw <= r.cw, `${what}: scrolls sideways (${r.sw} in ${r.cw})`);
  ok(r.dir === 'rtl' && r.lang === 'he', `${what}: not Hebrew RTL`);
  ok(r.h1 === 1, `${what}: ${r.h1} h1`);
  ok(r.secs.every(Boolean), `${what}: a section without a heading`);
  ok(/noindex/.test(r.robots ?? ''), `${what}: indexable`);
  return r;
}

/* 1. the Worker live today */
{
  const w = await newWorld({ worker: 'old', answer: basic });
  const page = await openOps(w);
  await layout(page, 'login');
  await shot(page, '01-login-390');
  await login(page);
  await page.locator('.cards').waitFor({ timeout: 20000 });
  await page.waitForTimeout(300);
  await shot(page, '02-basic-top-390');
  await shot(page, '03-basic-full-390', true);
  const r = await layout(page, 'basic dashboard');
  ok(r.secs.length >= 8, `basic: only ${r.secs.length} sections`);
  ok(page.url() === `${SITE}/ops/`, `basic: address after sign-in ${page.url()}`);
  ok(w.st.statsAsks.length >= 2 && w.st.statsAsks[0].bearer === MOCK_KEY && new URL(w.st.statsAsks[1].url).searchParams.get('key') === MOCK_KEY, 'old worker: not header first then ?key=');
  await keyNowhere(page, w, 'old worker', { allowQueryToStats: true });
  const text = await page.locator('main').innerText();
  for (const t of ['דורש עדכון Worker', 'גביע המדינה', 'ליגת אירופה', 'שיתוף', 'ליגת סוף השבוע', 'היום מול אתמול'.slice(0, 4)]) ok(text.includes(t), `basic: lacks "${t}"`);
  ok(w.st.posts.length === 0, 'the dashboard counted a visit');
  ok(!w.st.seen.some(q => /\/sw\.js|manifest/.test(q.url)), 'the dashboard loaded a service worker or a manifest');
  // the range
  const asks = w.st.statsAsks.length;
  await page.getByRole('radio', { name: /7/ }).click();
  await page.waitForFunction(() => document.querySelector('[role=radio][aria-checked=true]')?.textContent?.includes('7'));
  await page.locator('.cards').waitFor();
  ok(w.st.statsAsks.length === asks + 1 && w.st.statsAsks.at(-1).url.includes('days=7') && !w.st.statsAsks.at(-1).bearer, 'old worker: a new range tried the header again or did not ask');
  // out
  await page.getByRole('button', { name: 'צא' }).click();
  await page.locator('input[type=password]').waitFor();
  ok(!(await page.locator('body').innerText()).includes('גביע המדינה'), 'numbers stay after "צא"');
  await keyNowhere(page, w, 'after צא', { allowQueryToStats: true });
  ok(w.errors.length === 0, `page errors: ${w.errors.join(' | ')}`);
  await w.ctx.close();
}

/* 2. the patched Worker */
for (const [name, answer] of [['full', full], ['weekend', withWeekend]]) {
  const w = await newWorld({ worker: 'patched', answer });
  const page = await openOps(w);
  await login(page);
  await page.locator('.cards').waitFor({ timeout: 20000 });
  await page.waitForTimeout(300);
  await layout(page, `${name} dashboard`);
  ok(w.st.statsAsks.length === 1 && w.st.statsAsks.every(a => !a.url.includes('key=') && a.bearer === MOCK_KEY), `${name}: the key did not go in the header only`);
  await keyNowhere(page, w, name, { allowQueryToStats: false });
  const text = await page.locator('main').innerText();
  ok(!text.includes('דורש עדכון Worker') || name === 'full', `${name}: still says the Worker needs an update`);
  if (name === 'weekend') ok(text.includes('ליגות חברים') && text.includes('37'), 'weekend counts not drawn');
  if (name === 'full') {
    ok(text.includes('הפרולוג') && text.includes('עוד לא נשלח מהמשחק'), 'full: no ob_ table');
    await shot(page, '04-full-top-390');
    await shot(page, '05-full-full-390', true);
    await page.addStyleTag({ content: '.top{position:static !important}' });   // the sticky header would cover each section's picture
    let i = 0;
    for (const sec of await page.locator('section.sec').all()) { await sec.scrollIntoViewIfNeeded(); await sec.screenshot({ path: path.join(SHOTS, `06-section-${String(++i).padStart(2, '0')}.png`) }); }
  } else await shot(page, '07-weekend-full-390', true);
  ok(w.errors.length === 0, `${name} page errors: ${w.errors.join(' | ')}`);
  await w.ctx.close();
}

/* 3. a wrong key */
{
  const w = await newWorld({ worker: 'patched', answer: full });
  const page = await openOps(w);
  await login(page, 'MOCK_WRONG_0000');
  await page.getByText('המפתח לא נכון').waitFor({ timeout: 10000 });
  await shot(page, '08-wrong-key-390');
  ok(await page.locator('input[type=password]').inputValue() === '', 'the wrong key stays in the field');
  ok(await page.evaluate(() => localStorage.length + sessionStorage.length) === 0 && await page.evaluate(() => document.cookie) === '', 'a wrong key left something stored');
  ok(await page.locator('.cards').count() === 0, 'numbers shown on a wrong key');
  await w.ctx.close();
}

/* 4. the game with an old admin link */
{
  const w = await newWorld({ worker: 'old', answer: basic });
  const page = await w.ctx.newPage();
  await page.goto(`${SITE}/?admin=${MOCK_KEY}`);
  await page.waitForTimeout(4000);
  ok(!page.url().includes('admin') && !page.url().includes(MOCK_KEY), `the game keeps the admin link in its address: ${page.url()}`);
  ok(w.st.statsAsks.length === 0, 'the game asked /stats');
  ok(!w.st.posts.some(b => b.includes(MOCK_KEY)), 'the game sent the key');
  ok(!(await page.locator('body').innerText()).includes('דשבורד'), 'the game shows a dashboard');
  ok(await page.evaluate(k => !JSON.stringify({ ...localStorage }).includes(k) && !JSON.stringify({ ...sessionStorage }).includes(k), MOCK_KEY), 'the game stored the key');
  await shot(page, '09-game-after-admin-link-390');
  await w.ctx.close();
}

clearTimeout(watchdog);
await browser.close();
if (fails.length) { console.log(`ops ui: ${fails.length} of ${checked} failed (screenshots in ${SHOTS})`); for (const f of fails) console.log('  ✗ ' + f); process.exit(1); }
console.log(`ops ui: all ${checked} good (screenshots in ${SHOTS})`);
