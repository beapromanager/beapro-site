/**
 * The old address starts no careers (Itzik, 3.11), walked in Chrome at 390x844: the build served as both addresses,
 * nothing real reached (the counting and the weekend server are refused).
 *   PW_DIR=<a folder outside the repo with playwright-core> npm run check:olddomain-ui   (after npm run build)
 *   1. the old address, no career: the moved screen at once (no intro, no title), its link the new address
 *   2. the old address, an invite (?league=CODE), no career: the link carries the code; a bad code is dropped
 *   3. the old address, a career: the title with "המשך קריירה", the quiet line, no offer; the career opens;
 *      "קריירה חדשה" there is the moved screen, and the saved career is still there
 *   4. the new address: the title as before, no offer and no import link; a new career starts
 */
import { createRequire } from 'node:module';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

if (!process.env.PW_DIR) { console.log('SKIP: set PW_DIR to a folder with playwright-core in node_modules'); process.exit(2); }
const pw = createRequire(path.join(process.env.PW_DIR, 'package.json'))('playwright-core');
const shots = process.env.SHOT_DIR ?? path.join(os.tmpdir(), 'old-domain-shots');
mkdirSync(shots, { recursive: true });
const dist = path.resolve('dist');
const OLD = 'https://beapromanager.github.io', NEW = 'https://beapro.co.il';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4' };
const seed = JSON.parse(execFileSync(process.execPath, ['--experimental-strip-types', 'scripts/transfer-seed.mts', '4242', 'מאמן הבדיקה'], { encoding: 'utf8' }).trim().split('\n').pop());

const fails = []; let checked = 0;
const claim = (ok, msg) => { checked++; if (!ok) fails.push(msg); };
const errors = [];
const browser = await pw.chromium.launch({ channel: 'chrome' });

async function world(career, origin) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'he-IL', deviceScaleFactor: 2, serviceWorkers: 'block' });
  await ctx.route('**/*', route => {
    const u = new URL(route.request().url());
    if (u.origin !== OLD && u.origin !== NEW) return route.abort();
    let f = path.join(dist, decodeURIComponent(u.pathname));
    if (u.pathname === '/' || !existsSync(f) || !path.extname(f)) f = path.join(dist, 'index.html');
    return route.fulfill({ status: 200, body: readFileSync(f), headers: { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream' } });
  });
  if (career) await ctx.addInitScript(([s, o]) => {
    if (location.origin !== o || localStorage.getItem('beapro.seeded')) return;
    localStorage.setItem('beapro.seeded', '1');
    localStorage.setItem('beapro.career.v1', s.career); localStorage.setItem('beapro.device', s.device); localStorage.setItem('beapro.aid', s.aid);
  }, [seed, origin]);
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  return { ctx, page };
}
const text = p => p.evaluate(() => document.body.innerText);
const shot = (p, n) => p.screenshot({ path: path.join(shots, n + '.png') });

/* 1. old, no career */
{
  const { ctx, page } = await world(false, OLD);
  await page.goto(OLD + '/');
  await page.getByTestId('moved').waitFor({ timeout: 15000 });
  const t = await text(page);
  claim(t.includes('BE A PRO עבר לכתובת חדשה') && t.includes('להמשך למשחק ←'), 'the moved screen does not say the agreed words');
  claim(!t.includes('דלג') && !t.includes('התחל קריירה'), 'the intro or the title shows on the old address with no career');
  claim((await page.getByRole('link', { name: 'להמשך למשחק ←' }).getAttribute('href')) === NEW + '/', 'the moved link is not the new address');
  claim(!(await page.evaluate(() => localStorage.getItem('beapro.career.v1'))), 'a career was written on the old address');
  await page.waitForTimeout(600);
  await shot(page, 'o1-old-address-no-career');
  await ctx.close();
}
/* 2. old, an invite, no career */
{
  const { ctx, page } = await world(false, OLD);
  await page.goto(OLD + '/?league=KX7R2M');
  await page.getByTestId('moved').waitFor({ timeout: 15000 });
  claim((await page.getByRole('link', { name: 'להמשך למשחק ←' }).getAttribute('href')) === NEW + '/?league=KX7R2M', 'the invite code does not go along to the new address');
  for (const bad of ['KX7R2', 'KX7R2O', '<b>x</b>', 'KX7R2M&x=1']) {
    await page.goto(OLD + '/?league=' + encodeURIComponent(bad));
    await page.getByTestId('moved').waitFor({ timeout: 15000 });
    claim((await page.getByRole('link', { name: 'להמשך למשחק ←' }).getAttribute('href')) === NEW + '/', `the bad code "${bad}" went along`);
  }
  await ctx.close();
}
/* 3. old, a career */
{
  const { ctx, page } = await world(true, OLD);
  await page.goto(OLD + '/');
  await page.getByRole('button', { name: 'המשך קריירה' }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(4000);   // the offer, when it was on, came after the probe of the new address
  const t = await text(page);
  claim(t.includes('המשחק עבר ל-beapro.co.il. הקריירה שלך נשארת כאן.'), 'the quiet line is missing on the old address with a career');
  claim(!t.includes('העבר אותי עכשיו') && !t.includes('להעביר עכשיו') && !t.includes('להעביר את הקריירה'), 'an offer to move shows on the old address');
  claim(await page.getByTestId('moved').count() === 0, 'the old address with a career shows the moved screen');
  await shot(page, 'o2-old-address-with-a-career');
  const before = await page.evaluate(() => localStorage.getItem('beapro.career.v1'));
  await page.getByRole('button', { name: 'קריירה חדשה' }).click();
  await page.getByTestId('moved').waitFor({ timeout: 10000 });
  claim(await page.evaluate(() => localStorage.getItem('beapro.career.v1')) === before, 'asking for a new career on the old address changed the saved one');
  await shot(page, 'o3-old-address-new-career-asked');
  await page.goto(OLD + '/');
  await page.getByRole('button', { name: 'המשך קריירה' }).click({ timeout: 20000 });
  await page.getByText(JSON.parse(seed.career).state ? seed.club : seed.club).first().waitFor({ timeout: 20000 });
  claim((await text(page)).includes(seed.club), 'the career on the old address does not open');
  await shot(page, 'o4-old-address-career-plays');
  await ctx.close();
}
/* 4. new */
{
  const { ctx, page } = await world(false, NEW);
  await page.goto(NEW + '/');
  // the intro plays on the new address as before; skip it
  await page.getByText('דלג').first().click({ timeout: 15000 }).catch(() => {});
  await page.getByRole('button', { name: 'התחל קריירה' }).waitFor({ timeout: 20000 });
  await page.waitForTimeout(1500);
  const t = await text(page);
  claim(await page.getByTestId('moved').count() === 0, 'the new address shows the moved screen');
  claim(!t.includes('ייבוא קריירה') && !t.includes('להעביר'), 'the new address shows an import link or an offer');
  await shot(page, 'o5-new-address-title');
  await page.getByRole('button', { name: 'התחל קריירה' }).click();
  await page.waitForTimeout(2500);
  claim(await page.getByTestId('moved').count() === 0 && !(await text(page)).includes('BE A PRO עבר לכתובת חדשה'), 'a new career on the new address was stopped');
  await ctx.close();
}

await Promise.race([browser.close(), new Promise(r => setTimeout(r, 10000))]);
for (const e of errors.slice(0, 5)) fails.push('pageerror ' + e);
console.log(`${checked} checks, screenshots in ${shots}`);
if (fails.length) { console.log(`FAIL (${fails.length} of ${checked})`); for (const f of fails) console.log('  - ' + f); process.exit(1); }
console.log('OK, in Chrome: the old address sends a newcomer and an invite to beapro.co.il, a career there plays on, the new address is as before');
process.exit(0);
