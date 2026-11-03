/**
 * The old address starts no careers (Itzik, 3.11: the game lives only at beapro.co.il, the move between the addresses
 * is cancelled).
 *   node --experimental-strip-types scripts/old-domain-check.mts
 *
 *   1. which host is "old": anything but the game's own two hosts, never a developer's machine, never by a suffix
 *   2. the offer to move is switched off, and nothing was deleted
 *   3. the app: no career saved on the old address is the moved screen, before the intro; a new career asked for there
 *      is the moved screen too; the moved screen's link is the new address (TARGET_ORIGIN) with a valid league code
 *   4. a career already on the old address plays on: the title, the league, one quiet line, no button to move
 * The browser half is scripts/old-domain-ui.mjs (check:olddomain-ui).
 */
import { readFileSync } from 'node:fs';
import { isOldDomain, NEW_HOSTS, weekendFrozen, OLD_ORIGIN } from '../src/game/transferLock.ts';
import * as T from '../src/game/transfer.ts';

const fails: string[] = [];
let checked = 0;
const claim = (ok: boolean, msg: string) => { checked++; if (!ok) fails.push(msg); };

/* 1. which host is old */
claim(NEW_HOSTS.join() === 'beapro.co.il,www.beapro.co.il', `the game's hosts are ${NEW_HOSTS.join()}`);
for (const h of ['beapromanager.github.io', 'BEAPROMANAGER.GITHUB.IO', 'beapro.co.il.evil.com', 'evil-beapro.co.il', 'beapro.co', 'itzik200592-byte.github.io', 'example.com']) {
  claim(isOldDomain(h), `${h} is not treated as the old address`);
}
for (const h of ['beapro.co.il', 'www.beapro.co.il', 'WWW.BEAPRO.CO.IL', 'localhost', '127.0.0.1', '[::1]', 'game.localhost', '192.168.68.59', '10.0.0.5', '']) {
  claim(!isOldDomain(h), `${h} is treated as the old address`);
}
claim(!isOldDomain('beapromanager.github.io', true), 'a developer build is treated as the old address');

/* 2. the offer is off, the code is there */
claim(T.TRANSFER_OFFER === false, 'the offer to move is switched on');
claim(typeof T.createSender === 'function' && typeof T.createReceiver === 'function' && typeof T.applyTransfer === 'function', 'the transfer code was deleted instead of switched off');
const lockStore = { getItem: () => null, setItem() {}, removeItem() {} };
claim(!weekendFrozen(OLD_ORIGIN, lockStore), 'a career that never moved is frozen out of the weekend league on the old address');

/* 3. the app */
const app = readFileSync('src/ui/App.tsx', 'utf8');
const moved = readFileSync('src/ui/screens/Moved.tsx', 'utf8');
claim(/const \[moved, setMoved\] = useState<string \| null>\(\(\) => \(isOldDomainHere\(\) && savedSummary\(\) === null \? movedTarget\(location\.search\) : null\)\)/.test(app), 'the old address with no career does not start on the moved screen');
const gate = app.indexOf('if (moved) {'), intro = app.indexOf('if (!introDone) {');
claim(gate > 0 && intro > 0 && gate < intro, 'the moved screen does not come before the intro');
claim(/function startNew\(veteran = saved !== null\) \{\n\s+if \(isOldDomainHere\(\)\) \{ setMoved\(movedTarget\(location\.search\)\); return; \}/.test(app.replace(/\r\n/g, '\n')), 'a new career can still be started on the old address');
claim(/`\$\{TARGET_ORIGIN\}\/\?league=\$\{c\}`/.test(moved) && /`\$\{TARGET_ORIGIN\}\/`/.test(moved), 'the moved link is not built from TARGET_ORIGIN');
claim(!/https?:\/\//.test(moved.replace(/\/\*[\s\S]*?\*\//g, '')), 'the moved screen spells an address out by hand');
claim(/BE A PRO עבר לכתובת חדשה/.test(moved) && /להמשך למשחק ←/.test(moved), 'the moved screen does not say the agreed words');

/* 4. a career already there */
const ui = readFileSync('src/ui/components/TransferUi.tsx', 'utf8');
claim(/המשחק עבר ל-<bdi dir="ltr">beapro\.co\.il<\/bdi>\. הקריירה שלך נשארת כאן\./.test(ui), 'the old address with a career does not say the game moved and the career stays');
claim(/\{TRANSFER_OFFER && <button className="xf-link" onClick=\{\(\) => setImportOpen\(true\)\}>ייבוא קריירה<\/button>\}/.test(ui), 'the import link on the new address is not behind the switch');

console.log(`${checked} checks`);
if (fails.length) { console.log(`FAIL (${fails.length} of ${checked})`); for (const f of fails) console.log('  - ' + f); process.exit(1); }
console.log('OK, the old address starts no careers, sends a newcomer (and an invite) to beapro.co.il, and lets a career already there play on');
