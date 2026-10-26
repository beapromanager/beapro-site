/**
 * The move between the two addresses, in a real browser (Itzik, 25.10).
 *   PW_DIR=<a folder outside the repo with playwright-core in node_modules> \
 *   node --experimental-strip-types scripts/transfer-ui.mjs
 *
 * Neither address is reached: both https://beapromanager.github.io and https://beapro.co.il (and the two lookalikes
 * and the stranger used for forgery) are answered from the built dist by the browser context itself, the telemetry
 * worker is a recorder, and every other request is refused. So this is the real build, the real popup, the real
 * postMessage between two real origins, and nothing leaves the machine.
 *
 * Playwright is not a dependency of the game and is never installed into it (CI runs npm install on every deploy):
 * it is loaded from PW_DIR. With no Playwright the check prints SKIP and exits 2, which is not a pass.
 * The browser is the installed Chrome (a Chromium) when there is one, or Playwright's own.
 *
 *   a. the offer, the click, the popup, the hub on the new address with the same career; the old save untouched
 *   b. no receiver marker on the new address: no offer
 *   c. a career already on the new address: asked, a no changes nothing, a yes replaces and backs up
 *   d. a stranger's window and a lookalike address cannot write to the new address or get anything from the old one
 *   e. the file and the code, by hand
 *   f. a phone (360x740): the three screens, in Hebrew, right to left, no sideways scroll; screenshots kept outside the repo
 *   g. the counting: the marks arrive, in the one shape, with nothing a player typed
 */
import { createRequire } from 'node:module';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import * as T from '../src/game/transfer.ts';

const PW_DIR = process.env.PW_DIR;
let pw = null;
if (PW_DIR) {
  const req = createRequire(path.join(path.resolve(PW_DIR), 'package.json'));
  for (const name of ['playwright', 'playwright-core']) { try { pw = req(name); break; } catch { /* next */ } }
}
if (!pw) { console.log('SKIP: playwright not installed (set PW_DIR to a folder with playwright-core in node_modules)'); process.exit(2); }

const fails = [];
let checked = 0;
const claim = (ok, msg) => { checked++; if (!ok) fails.push(msg); };

const OLD = T.OLD_ORIGIN, NEW = T.TARGET_ORIGIN, WWW = 'https://www.beapro.co.il';
const EVIL = 'https://evil.example', LOOK = 'https://beapro.co.il.evil.com', LOOKOLD = 'https://beapromanager.github.io.evil.com';
const SHOTS = process.env.SHOT_DIR || path.join(os.tmpdir(), 'transfer-shots');
mkdirSync(SHOTS, { recursive: true });
const TELEMETRY = /TELEMETRY_URL: string = '([^']+)'/.exec(readFileSync('src/data/telemetry.ts', 'utf8'))?.[1];
if (!TELEMETRY) { console.log('FAIL: the telemetry address could not be read'); process.exit(1); }

/* ------------------------------------------------------------------ build once, seed two real careers */
const dist = path.resolve('dist');
execFileSync(process.execPath, ['./node_modules/vite/bin/vite.js', 'build'], { stdio: 'ignore' });
claim(existsSync(path.join(dist, 'xfer.json')) && !existsSync(path.join(dist, 'CNAME')), 'the build lacks xfer.json or carries a CNAME');
const seed = (n, who, club = 0) => JSON.parse(execFileSync(process.execPath, ['--experimental-strip-types', 'scripts/transfer-seed.mts', String(n), who, String(club)], { encoding: 'utf8' }).trim().split('\n').pop());
const A = seed(4242, 'מאמן הבדיקה');
const B = seed(777, 'מאמן אחר', 3);
claim(A.phase === 'hub' && B.phase === 'hub' && A.club !== B.club, `the seeded careers are on ${A.phase}/${B.phase} and ${A.club}/${B.club}`);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4' };

/* ------------------------------------------------------------------ the browser */
let browser;
for (const opts of [{ channel: 'chrome' }, {}]) {
  try { browser = await pw.chromium.launch(opts); break; } catch { /* next */ }
}
if (!browser) { console.log('SKIP: no Chromium to drive (install Chrome, or run playwright install chromium outside the repo)'); process.exit(2); }

const events = [];       // every counting post, with the origin it came from
const pageErrors = [];
const allPages = [];

/** when a step cannot go on, what every page looked like, so the failure can be read instead of guessed */
const within = (ms, p) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('no answer')), ms))]);
async function stopped(why) {
  console.log(`STOPPED: ${why}`);
  let i = 0;
  for (const p of allPages) {
    try {
      const text = (await within(4000, p.evaluate(() => document.body.innerText))).replace(/\s+/g, ' ').slice(0, 260);
      const saved = await within(4000, p.evaluate(() => { try { const s = JSON.parse(localStorage.getItem('beapro.career.v1') ?? 'null')?.state; return s ? `phase ${s.phase} week ${s.week} kit ${!!s.kitReveal}` : 'no career'; } catch { return 'unreadable'; } }));
      console.log(`  page ${i} ${p.url()} [${saved}] :: ${text}`);
      await within(6000, p.screenshot({ path: path.join(SHOTS, `STOPPED-${i}.png`) }));
    } catch { /* closed, or not answering */ }
    i++;
  }
  for (const m of pageErrors.slice(0, 5)) console.log('  pageerror ' + m);
  process.exit(1);
}
process.on('uncaughtException', e => { void stopped(String(e.message).split(/\r?\n/)[0]); });
// nothing in this check takes more than a few minutes: a step that does not end is a failure to read, not a wait
const watchdog = setTimeout(() => { void stopped('the check did not finish in 12 minutes'); }, 12 * 60 * 1000);

/** a context that is the internet: three addresses served from dist, a recorder for the counting, nothing else */
async function newWorld(opts = {}) {
  const st = { marker: true, stubNew: false, ...opts };
  const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, locale: 'he-IL', deviceScaleFactor: 2 });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: OLD }).catch(() => {});
  await ctx.route('**/*', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const origin = url.origin;
    if (req.url().startsWith(TELEMETRY)) {
      const cors = { 'access-control-allow-origin': req.headers().origin ?? '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, OPTIONS' };
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      try { for (const e of JSON.parse(req.postData() ?? '{}').e ?? []) events.push({ from: req.headers().origin ?? '', e }); } catch { /* not ours */ }
      return route.fulfill({ status: 200, headers: { ...cors, 'content-type': 'application/json' }, body: '{"ok":true}' });
    }
    if (![OLD, NEW, WWW, EVIL, LOOK, LOOKOLD].includes(origin)) return route.abort();
    if (url.pathname === '/__blank') return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset="utf-8"><title>blank</title>' });
    if ([EVIL, LOOK, LOOKOLD].includes(origin)) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset="utf-8"><title>other</title>' });
    if (url.pathname === '/xfer.json') {
      if (origin !== NEW && origin !== WWW) return route.fulfill({ status: 404, body: 'no' });
      if (!st.marker) return route.fulfill({ status: 404, body: 'no' });
    }
    if (st.stubNew && origin === NEW && url.pathname === '/') return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><meta charset="utf-8"><title>stub</title>' });
    if (/\.(mp4|mp3)$/.test(url.pathname)) return route.abort();
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    let file = path.join(dist, rel);
    if (!file.startsWith(dist) || !existsSync(file)) {
      if (path.extname(rel)) return route.fulfill({ status: 404, body: 'not found' });
      file = path.join(dist, 'index.html');
    }
    const ext = path.extname(file);
    // GitHub Pages answers every file with access-control-allow-origin: *
    return route.fulfill({ status: 200, body: readFileSync(file), headers: { 'content-type': MIME[ext] ?? 'application/octet-stream', 'access-control-allow-origin': '*' } });
  });
  const watch = p => { allPages.push(p); p.on('pageerror', e => pageErrors.push(`${p.url()} ${e.message}`)); };
  ctx.on('page', watch);
  return { ctx, st, watch };
}

const put = async (ctx, origin, items) => {
  const p = await ctx.newPage();
  await p.goto(`${origin}/__blank`);
  await p.evaluate(it => { for (const [k, v] of Object.entries(it)) localStorage.setItem(k, v); }, items);
  await p.close();
};
const dump = page => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
const careerOf = raw => JSON.parse(raw).state;
const shot = async (page, name) => { await page.screenshot({ path: path.join(SHOTS, `${name}.png`) }); };
const noSideways = async (page, what) => {
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth, dir: getComputedStyle(document.body).direction }));
  claim(r.sw <= r.iw + 1, `${what}: the page scrolls sideways (${r.sw} wide in ${r.iw})`);
  claim(r.dir === 'rtl', `${what}: the direction is ${r.dir}`);
};
const PROMPT = 'הגרסה החדשה שלנו נמצאת ב-beapro.co.il, להעביר את הקריירה?';
const oldItems = s => ({ 'beapro.career.v1': s.career, 'beapro.device': s.device, 'beapro.aid': s.aid });
const seededOld = async (w, s = A) => { await put(w.ctx, OLD, oldItems(s)); const p = await w.ctx.newPage(); await p.goto(OLD + '/'); return p; };
const clickTransfer = async page => {
  const [popup] = await Promise.all([page.waitForEvent('popup'), page.getByRole('button', { name: 'להעביר עכשיו' }).click()]);
  return popup;
};

/* ------------------------------------------------------------------ a. the offer, the move, the hub */
{
  const w = await newWorld();
  const old = await seededOld(w);
  await old.locator('.xf-text').first().waitFor({ timeout: 20000 });
  claim((await old.locator('.xf-text').first().innerText()).trim() === PROMPT, `the offer reads "${await old.locator('.xf-text').first().innerText()}"`);
  claim(await old.getByRole('button', { name: 'להעביר עכשיו' }).isVisible() && await old.getByRole('button', { name: 'אחר כך' }).isVisible() && await old.getByRole('button', { name: 'להעביר עם קוד או קובץ' }).isVisible(), 'the offer lacks one of its three ways');
  await noSideways(old, 'the offer');
  // the wordmark is the top of the title screen: with the offer and the league ticket under it, it must still be on a short phone
  const wm = await old.locator('.title-wm').boundingBox();
  claim(!!wm && wm.y >= 0, `the offer pushes the wordmark off the top of a 360x740 phone (y ${wm?.y})`);
  await shot(old, 'a1-offer-on-the-old-title-screen');
  const before = (await dump(old))['beapro.career.v1'];
  const popup = await clickTransfer(old);
  await popup.getByText(A.club).first().waitFor({ timeout: 40000 });
  const nw = await dump(popup);
  const mine = careerOf(nw['beapro.career.v1']), theirs = careerOf(A.career);
  claim(mine.clubId === theirs.clubId && mine.week === theirs.week && mine.season === theirs.season && mine.profile.name === theirs.profile.name, 'the career on the new address is not the career from the old one');
  claim(nw['beapro.device'] === A.device && nw['beapro.aid'] === A.aid, 'the device or counting id did not move');
  claim(!!nw['beapro.xfer.in'] && JSON.parse(nw['beapro.xfer.in']).via === 'auto', 'the new address has no arrival note');
  claim(!popup.url().includes('xfer='), `the address bar still says ${popup.url()}`);
  const od = await dump(old);
  claim(od['beapro.career.v1'] === before, 'the old address changed its career');
  claim(!!od['beapro.xfer.v1'] && !!JSON.parse(od['beapro.xfer.v1']).sentAt && JSON.parse(od['beapro.xfer.v1']).to === NEW, 'the old address did not note that it was sent');
  // on the page that made the move: said once, in the sheet, with the way across
  await old.getByText('הקריירה הועברה ל-beapro.co.il. היא נשארה גם כאן').waitFor({ timeout: 10000 });
  await old.waitForTimeout(800);
  await shot(old, 'a2-old-sheet-after-the-move');
  await old.getByRole('button', { name: 'סגור' }).click();
  // and afterwards, on every visit, as one line
  await old.getByText('הקריירה הועברה ל-beapro.co.il · לשחק שם').first().waitFor({ timeout: 10000 });
  claim((await old.locator('.xf-done').first().innerText()).replace(/\s+/g, ' ').includes('לשחק שם'), 'the line after the move is missing');
  claim(await old.locator('.xf-done a').first().getAttribute('href') === NEW + '/', 'the line after the move does not link to the new address');
  const wm2 = await old.locator('.title-wm').boundingBox();
  claim(!!wm2 && wm2.y >= 0, `the line after the move pushes the wordmark off the top of a 360x740 phone (y ${wm2?.y})`);
  await shot(old, 'a2b-old-title-with-the-line');
  await shot(popup, 'a3-new-address-hub');
  await noSideways(popup, 'the hub on the new address');
  await w.ctx.close();
}

/* ------------------------------------------------------------------ the hub: a slim card, once a sitting */
{
  const w = await newWorld();
  const old = await seededOld(w);
  await old.getByRole('dialog', { name: 'העברת הקריירה לאתר החדש' }).waitFor({ timeout: 20000 });
  // "later" on the title screen closes the sheet and leaves the title as it always was
  await old.getByRole('button', { name: 'אחר כך' }).click();
  await old.getByRole('dialog', { name: 'העברת הקריירה לאתר החדש' }).waitFor({ state: 'detached' });
  claim(await old.getByRole('button', { name: 'המשך קריירה' }).isVisible(), 'the continue button is not reachable after "later"');
  await old.getByRole('button', { name: 'המשך קריירה' }).click();
  await old.getByText(A.club).first().waitFor({ timeout: 30000 });
  const card = old.locator('.xf-card.hub');
  await card.waitFor({ timeout: 10000 });
  claim((await card.locator('.xf-text').innerText()).trim() === PROMPT, 'the hub card does not say the same words');
  await noSideways(old, 'the hub with the card');
  await shot(old, 'h1-offer-in-the-hub');
  await card.getByRole('button', { name: 'אחר כך' }).click();
  await card.waitFor({ state: 'detached' });
  claim(await old.locator('.xf-card.hub').count() === 0, 'the hub card stayed after "later"');
  await w.ctx.close();
}

/* ------------------------------------------------------------------ b. no marker, no offer */
{
  const w = await newWorld({ marker: false });
  const old = await seededOld(w);
  await old.waitForTimeout(3500);
  claim(await old.locator('.xf-card').count() === 0 && await old.getByText('להעביר את הקריירה?').count() === 0, 'an offer appeared though the new address does not say it can receive');
  claim(await old.getByRole('button', { name: 'המשך קריירה' }).isVisible(), 'the old title screen is not there');
  await shot(old, 'b1-old-title-without-an-offer');
  await w.ctx.close();
}

/* ------------------------------------------------------------------ c. a career is already there */
{
  const w = await newWorld();
  await put(w.ctx, NEW, { 'beapro.career.v1': B.career, 'beapro.device': B.device, 'beapro.aid': B.aid });
  const old = await seededOld(w);
  await old.locator('.xf-text').first().waitFor({ timeout: 20000 });
  const popup = await clickTransfer(old);
  await popup.getByText('כבר יש כאן קריירה. להחליף אותה בקריירה מהאתר הישן?').waitFor({ timeout: 30000 });
  const sheet = await popup.locator('.sheet').innerText();
  claim(sheet.includes(A.club) && sheet.includes(B.club), 'the question does not show both careers');
  await noSideways(popup, 'the question');
  await popup.waitForTimeout(800);
  await shot(popup, 'c1-the-question-on-the-new-address');
  await popup.getByRole('button', { name: 'לא, להשאיר את מה שיש כאן' }).click();
  await popup.getByText('ההעברה בוטלה').first().waitFor({ timeout: 10000 });
  const kept = await dump(popup);
  claim(kept['beapro.career.v1'] === B.career && kept['beapro.device'] === B.device && kept['beapro.aid'] === B.aid && !('beapro.xfer.backup' in kept) && !('beapro.xfer.in' in kept), 'a no changed the new address');
  await old.getByText('ההעברה בוטלה').first().waitFor({ timeout: 10000 });
  claim(!JSON.parse((await dump(old))['beapro.xfer.v1'] ?? '{}').sentAt, 'a no was noted as sent');
  await w.ctx.close();

  const w2 = await newWorld();
  await put(w2.ctx, NEW, { 'beapro.career.v1': B.career, 'beapro.device': B.device, 'beapro.aid': B.aid });
  const old2 = await seededOld(w2);
  await old2.locator('.xf-text').first().waitFor({ timeout: 20000 });
  const popup2 = await clickTransfer(old2);
  await popup2.getByText('כבר יש כאן קריירה. להחליף אותה בקריירה מהאתר הישן?').waitFor({ timeout: 30000 });
  await popup2.getByRole('button', { name: 'כן, להחליף' }).click();
  await popup2.getByText(A.club).first().waitFor({ timeout: 40000 });
  const now = await dump(popup2);
  claim(careerOf(now['beapro.career.v1']).clubId === careerOf(A.career).clubId && now['beapro.device'] === A.device, 'a yes did not replace the career');
  const backup = JSON.parse(now['beapro.xfer.backup'] ?? 'null');
  claim(backup?.items?.['beapro.career.v1'] === B.career && backup?.items?.['beapro.device'] === B.device, 'the backup is not the career that was replaced');
  await w2.ctx.close();
}

/* ------------------------------------------------------------------ d. strangers */
{
  // a stranger opens the new address as if it were the old one and throws payloads at it
  const w = await newWorld();
  const forged = T.buildPayload({ getItem: k => oldItems(A)[k] ?? null, setItem() {}, removeItem() {} }, 1, 'forged');
  const evil = await w.ctx.newPage();
  await evil.goto(EVIL + '/__blank');
  await evil.evaluate(() => { window.__got = []; window.addEventListener('message', e => window.__got.push(String(e.origin))); });
  const [rx] = await Promise.all([w.ctx.waitForEvent('page'), evil.evaluate(() => { window.__w = window.open('https://beapro.co.il/?xfer=forged-nonce-0001', 'rx'); })]);
  await rx.getByText('מחכים לקריירה מהאתר הישן').waitFor({ timeout: 20000 });
  for (let i = 0; i < 6; i++) {
    await evil.evaluate(p => { window.__w.postMessage({ t: 'beapro-xfer', v: 1, step: 'payload', nonce: 'forged-nonce-0001', payload: p }, '*'); }, forged);
    await evil.waitForTimeout(300);
  }
  const after = await dump(rx);
  claim(!('beapro.career.v1' in after) && after['beapro.device'] !== A.device && after['beapro.aid'] !== A.aid, 'a stranger wrote onto the new address');
  claim((await evil.evaluate(() => window.__got)).length === 0, 'the new address answered a stranger');
  await w.ctx.close();

  // strangers, and a lookalike of the new address, forge "ready" into an old address that is waiting for the real one
  for (const bad of [EVIL, LOOK]) {
    const w2 = await newWorld({ stubNew: true });
    await put(w2.ctx, OLD, oldItems(A));
    const host = await w2.ctx.newPage();
    await host.goto(bad + '/__blank');
    await host.evaluate(() => { window.__got = []; window.addEventListener('message', e => window.__got.push(String(e.origin))); });
    // the stranger is the page that opened the old address, so it holds a window onto it, which is as much reach as a page ever has
    const [old] = await Promise.all([w2.ctx.waitForEvent('page'), host.evaluate(o => { window.__o = window.open(o + '/', 'o'); }, OLD)]);
    await old.locator('.xf-text').first().waitFor({ timeout: 20000 });
    const popup = await clickTransfer(old);
    await popup.waitForLoadState();
    const nonce = new URL(popup.url()).searchParams.get('xfer');
    claim(!!nonce && /^[A-Za-z0-9-]{8,64}$/.test(nonce), `the popup was opened with "${nonce}" for a nonce`);
    await popup.evaluate(() => { window.__p = []; window.addEventListener('message', e => window.__p.push(e.data && e.data.step)); });
    // the stranger knows the nonce (the check hands it over, which no real stranger has) and says "ready" as itself
    for (let i = 0; i < 3; i++) {
      await host.evaluate(n => { window.__o.postMessage({ t: 'beapro-xfer', v: 1, step: 'ready', nonce: n }, '*'); }, nonce);
      await host.waitForTimeout(250);
    }
    await host.waitForTimeout(1000);
    claim((await host.evaluate(() => window.__got)).length === 0, `${bad} got something back from the old address`);
    claim((await popup.evaluate(() => window.__p)).length === 0, `the old address sent something to the new window after ${bad} said ready`);
    claim(await old.getByText('מעבירים את הקריירה...').count() > 0, `${bad} moved the old address out of waiting`);
    // the control: the same words from the real window, with the real origin, are answered, so the silence above means something
    await popup.evaluate(n => { window.opener.postMessage({ t: 'beapro-xfer', v: 1, step: 'ready', nonce: n }, 'https://beapromanager.github.io'); }, nonce);
    await popup.waitForFunction(() => window.__p.includes('payload'), null, { timeout: 8000 }).catch(() => {});
    claim((await popup.evaluate(() => window.__p)).includes('payload'), 'the real new address was not answered either, so the silence proves nothing');
    claim((await host.evaluate(() => window.__got)).length === 0, `${bad} saw the payload that went to the real window`);
    await w2.ctx.close();
  }
}

/* ------------------------------------------------------------------ e. by hand */
let fileCode = null, textCode = null;
{
  const w = await newWorld();
  const old = await seededOld(w);
  await old.locator('.xf-text').first().waitFor({ timeout: 20000 });
  await old.getByRole('button', { name: 'להעביר עם קוד או קובץ' }).click();
  await old.getByText('להעביר את הקריירה עם קובץ או קוד').waitFor();
  await noSideways(old, 'the export sheet');
  const [dl] = await Promise.all([old.waitForEvent('download'), old.getByRole('button', { name: 'שמירה לקובץ' }).click()]);
  claim(/^beapro-career-\d{4}-\d{2}-\d{2}\.beapro$/.test(dl.suggestedFilename()), `the file is called ${dl.suggestedFilename()}`);
  fileCode = path.join(SHOTS, dl.suggestedFilename());
  await dl.saveAs(fileCode);
  await old.getByRole('button', { name: 'העתקת קוד' }).click();
  await old.locator('.xf-code').waitFor();
  textCode = await old.locator('.xf-code').inputValue();
  claim(/^BEAPRO[01]\./.test(textCode), `the code starts ${textCode.slice(0, 10)}`);
  claim(/KB/.test(await old.getByRole('dialog', { name: 'העברת הקריירה', exact: true }).innerText()), 'the sheet does not show the size of the code');
  await old.waitForTimeout(800);
  await shot(old, 'e1-export-sheet-on-the-old-address');
  claim((await dump(old))['beapro.career.v1'] === A.career, 'exporting changed the old career');
  await w.ctx.close();

  for (const how of ['file', 'code']) {
    const w2 = await newWorld();
    const page = await w2.ctx.newPage();
    await page.goto(NEW + '/');
    await page.getByRole('button', { name: 'ייבוא קריירה' }).waitFor({ timeout: 30000 });
    await page.getByRole('button', { name: 'ייבוא קריירה' }).click();
    await page.getByText('הדבק את הקוד, או בחר את הקובץ ששמרת מהאתר הישן.').waitFor();
    await noSideways(page, 'the import sheet');
    if (how === 'file') { await page.waitForTimeout(800); await shot(page, 'e2-import-sheet-on-the-new-address'); }
    if (how === 'file') await page.locator('.xf-file input').setInputFiles(fileCode);
    else {
      await page.locator('textarea.xf-code').fill(textCode.slice(0, -40));
      await page.getByRole('button', { name: 'ייבוא מהקוד' }).click();
      await page.locator('.xf-err').waitFor();
      claim((await page.locator('.xf-err').innerText()).includes('נפגמו') || (await page.locator('.xf-err').innerText()).includes('לא נראה'), 'a damaged code got no clear answer');
      await page.locator('textarea.xf-code').fill(textCode);
      await page.getByRole('button', { name: 'ייבוא מהקוד' }).click();
    }
    await page.getByText(A.club).first().waitFor({ timeout: 40000 });
    const nw = await dump(page);
    claim(careerOf(nw['beapro.career.v1']).clubId === careerOf(A.career).clubId && nw['beapro.device'] === A.device && JSON.parse(nw['beapro.xfer.in']).via === 'code', `the ${how} did not carry the career over`);
    await w2.ctx.close();
  }
}

/* ------------------------------------------------------------------ g. the counting */
{
  await new Promise(r => setTimeout(r, 1500));
  const keys = events.map(x => `${new URL(x.from || OLD).origin === OLD ? 'old' : 'new'}:${x.e.k}`);
  for (const k of ['old:xfer_offer', 'old:xfer_sent', 'new:site_new', 'new:xfer_in', 'new:xfer_code']) claim(keys.includes(k), `the counting never got ${k} (got ${[...new Set(keys)].join(', ')})`);
  claim(events.every(x => Object.keys(x.e).every(k => ['a', 's', 'k', 't'].includes(k)) || x.e.k === 'crash'), 'an event has a key other than a, s, k, t');
  const all = JSON.stringify(events);
  for (const secret of [A.club, B.club, 'מאמן הבדיקה', 'מאמן אחר', A.career.slice(40, 90)]) claim(!all.includes(secret), `the counting carries "${secret}"`);
  claim(!events.some(x => x.e.k === 'xfer_in' && x.from === OLD), 'xfer_in came from the old address');
  claim(pageErrors.length === 0, `the pages threw: ${pageErrors.slice(0, 3).join(' | ')}`);
}

clearTimeout(watchdog);
await browser.close();
console.log(`${checked} checks, screenshots in ${SHOTS}`);
if (fails.length) { console.log(`FAIL (${fails.length} of ${checked})`); for (const f of fails.slice(0, 40)) console.log('  - ' + f); process.exit(1); }
console.log('OK, in real browsers: the offer, the move to the hub, the question before an overwrite, strangers ignored, the file and the code, a phone screen without sideways scroll, and a counting with nothing a player typed');
