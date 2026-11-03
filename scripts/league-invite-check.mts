/**
 * The neighbourhood league's invite (Itzik, 3.11: "אין ייזכור למשחק. אין לינק. כלום.").
 *
 *   1. the friend league's message: the game's name, what it is, the league's name, the code, a link to beapro.co.il that
 *      carries the code, the rounds once each (the final called the final), the registration's close; no "פותחים" twice
 *   2. the open league's message: no code, the plain link, its own rounds
 *   3. every line starts in Hebrew or an emoji followed by Hebrew, so WhatsApp lays it out right to left
 *   4. the link: only a real code goes on it; the code read back off a link is validated and upper-cased; junk is ignored
 *   5. the hours in the message are the grid's own hours (weekendCore), nothing typed by hand
 *   6. the wiring: the lobby builds the message with leagueInviteText, shares through the share sheet with the clipboard
 *      as the fallback and says "הועתק ✓", App reads ?league= before the address is tidied, the join door takes the code
 * Run: npm run check:leagueinvite
 */
import * as I from '../src/game/weekendInvite.ts';
import * as W from '../src/game/weekendCore.ts';
import { readFileSync } from 'node:fs';

const fails: string[] = [];
let checked = 0;
const claim = (ok: boolean, msg: string) => { checked++; if (!ok) fails.push(msg); };

const c = W.cycleOf(Date.UTC(2026, 10, 10, 10));   // Tuesday 10.11.2026, registration open
const friendKeys = ['thu-20', 'fri-10', 'sat-12', 'sun-14', 'sun-20'];
const friend = I.leagueInviteText({ kind: 'friend', name: 'ראש העין על המפה', code: 'VLKNNC', rounds: friendKeys, locks: c.locks });
const open = I.leagueInviteText({ kind: 'open', name: 'הליגה הפתוחה', code: null, rounds: [W.KICKOFF_KEY, ...W.OPEN_SLOTS, W.FINAL_KEY], locks: c.locks });
if (process.argv.includes('--print')) { console.log(friend + '\n\n---\n\n' + open + '\n'); }

/* 1 */
claim(friend.startsWith('⚽ ליגת השכונה ב-BE A PRO - מי באמת הכי חזק?\n'), 'no game name / hook on the first line');
claim(I.GAME_URL === 'https://beapro.co.il', 'the link is not the game\'s new address');
claim(friend.includes(I.INVITE_HOOK) && friend.includes('ניהול כדורגל ישראלי'), 'no hook / what the game is');
claim(friend.includes('"ראש העין על המפה"'), 'the league name is not set apart');
claim(friend.includes('🔑 קוד הליגה: VLKNNC'), 'the code is not on its own line');
claim(friend.includes('https://beapro.co.il/?league=VLKNNC'), 'no join link with the code');
claim(friend.includes('חמישי 20:00 · שישי 10:00 · שבת 12:00 · ראשון 14:00 · גמר ראשון 20:00'), `the rounds line: ${friend}`);
claim((friend.match(/חמישי 20:00/g) ?? []).length === 1, 'Thursday 20:00 is said more than once');
claim(!friend.includes('פותחים.'), 'the old "פותחים" is back');
claim(friend.includes(`נרשמים עד ${W.ilDayDate(c.locks)} ${W.ilTime(c.locks)}`) && friend.includes('חמישי 12.11 17:00'), 'the registration close is not the cycle\'s lock');
claim(friend.split('\n').length <= 9 && friend.length < 420, `the message is too long: ${friend.length}`);
/* 2 */
claim(!/קוד הליגה|\?league=/.test(open) && open.includes('👉 נכנסים: https://beapro.co.il') && open.includes('BE A PRO'), 'the open league message');
claim(open.includes('חמישי 20:00 · שישי 12:00 · שישי 14:00 · שבת 20:00 · גמר ראשון 20:00'), `the open rounds: ${open}`);
claim(I.leagueInviteText({ kind: 'friend', name: 'x', code: null, rounds: friendKeys, locks: c.locks }) === I.leagueInviteText({ kind: 'open', name: 'x', code: null, rounds: friendKeys, locks: c.locks }), 'a friend league with no code still prints a code');
/* 3 */
for (const t of [friend, open]) for (const l of t.split('\n')) claim(/^[\u0590-\u05FF]/.test(l.replace(/^[^\u0590-\u05FFA-Za-z0-9]+/u, '')), `a line does not start in Hebrew: ${l}`);
/* 4 */
claim(I.leagueJoinLink('vlknnc') === 'https://beapro.co.il/?league=VLKNNC', 'lower case code');
claim(I.leagueJoinLink('VLKNN0') === 'https://beapro.co.il' && I.leagueJoinLink(null) === 'https://beapro.co.il' && I.leagueJoinLink('<script>') === 'https://beapro.co.il', 'a bad code goes on the link');
claim(I.leagueCodeFromUrl('?league=vlknnc') === 'VLKNNC' && I.leagueCodeFromUrl('?ref=ABCDEF&league=KX7R2M') === 'KX7R2M', 'reading the code off a link');
for (const bad of ['', '?league=', '?league=ABC', '?league=ABCDEFG', '?league=ABCDE1', '?league=%3Cscript%3E', '?leagues=ABCDEF', '?league=ABCDE%20F']) claim(I.leagueCodeFromUrl(bad) === null, `junk read as a code: ${bad}`);
for (let i = 0; i < 200; i++) { let s = 0.1 + i * 0.0043; const code = W.makeCode(() => { s = (s * 9301 + 49297) % 233280 / 233280; return s; }); claim(I.validLeagueCode(code), `a server code is refused: ${code}`); }
/* 5 */
const hours = new Set(['20:00', '17:00', ...W.SLOT_GRID.map(s => `${String(s.hh).padStart(2, '0')}:00`)]);
for (const h of [...friend.matchAll(/\d{1,2}:\d{2}/g), ...open.matchAll(/\d{1,2}:\d{2}/g)]) claim(hours.has(h[0]), `the hour ${h[0]} is not an hour of the week`);
for (const k of W.SLOT_GRID.map(s => s.key)) claim(I.roundWords(k) === `${W.DAY_NAME[W.slotByKey(k)!.day]} ${String(W.slotByKey(k)!.hh).padStart(2, '0')}:00`, `round words for ${k}`);
/* 6 */
const ui = readFileSync('src/ui/weekend/Weekend.tsx', 'utf8');
const guide = readFileSync('src/ui/weekend/WeekendGuide.tsx', 'utf8');
const app = readFileSync('src/ui/App.tsx', 'utf8');
const words = readFileSync('src/game/weekendGuide.ts', 'utf8');
claim((ui.match(/leagueInviteText\(/g) ?? []).length === 1 && !/ליגת השכונה ב-BE A PRO\. /.test(ui), 'the lobby does not build the message with leagueInviteText (once)');
claim(/nav\.share\(\{ title: 'BE A PRO', text \}\)/.test(guide) && /AbortError/.test(guide) && /clipboard\.writeText\(text\)/.test(guide) && /execCommand\('copy'\)/.test(guide), 'share sheet first, then the clipboard, then the old copy');
claim(/COPIED_WORDS = 'הועתק ✓/.test(words), 'the copied words do not say "הועתק ✓"');
claim(/<ShareButton text=\{shareText\}/.test(guide) && /<ShareButton text=\{shareText\}/.test(ui) && /<ShareButton text=\{brag\}/.test(ui), 'the share buttons are not wired');
claim(/leagueCodeFromUrl\(location\.search\)/.test(app) && /keepInvite\(code\)/.test(app), 'App does not read the invite link');
claim(app.indexOf('leagueCodeFromUrl(location.search)') < app.indexOf("history.replaceState(null, '', location.pathname)"), 'the link is read after the address is tidied');
claim(/initialCode=\{pendingInvite\(\) \?\? ''\}/.test(ui) && /useState\(initialCode\)/.test(ui), 'the join door does not take the code');
claim(/const enter = \(id: string\) => \{ dropInvite\(\);/.test(ui), 'the invite is not dropped once in a league');

console.log(`${checked} checks`);
if (fails.length) { console.log(`FAIL (${fails.length} of ${checked})`); for (const f of fails.slice(0, 40)) console.log('  - ' + f); process.exit(1); }
console.log('OK, the invite says what the game is, the league, the code, the rounds once and the way in, and the link fills the code');
