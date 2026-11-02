/**
 * The counting counts, and tells nobody anything it should not.
 *   node --experimental-strip-types scripts/telemetry-check.mts
 *
 * This is the first thing in the game that sends anything anywhere, and the
 * promise made on the title screen is that what a player types stays on his
 * phone. A promise in a comment is a wish; this measures it.
 *
 * Four things hold here:
 *   1. the funnel is a funnel: every step is known, ordered, and never sent
 *      twice, so a restarted career cannot invent people
 *   2. the road is walked: a whole career, phase by phase, reaches every step
 *      in order and skips none
 *   3. nothing personal can reach the wire, by reading the source rather than
 *      trusting it
 *   4. with no endpoint the game sends nothing at all, which is how it ships
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import * as T from '../src/game/telemetry.ts';
import { TELEMETRY_URL } from '../src/data/telemetry.ts';
import * as G from '../src/game/state.ts';
import { simulateMatch } from '../src/engine/matchEngine.ts';
import type { MatchResult } from '../src/engine/matchEngine.ts';
import { DEFAULT_FORMATION } from '../src/data/formations.ts';
import { MANAGERS } from '../src/data/managers.ts';
import { isOurCrash } from '../src/game/report.ts';


const fails: string[] = [];
let checked = 0;

/* 1. THE FUNNEL IS A FUNNEL. */
{
  checked += 4;
  if (new Set(T.STEPS).size !== T.STEPS.length) fails.push('a step is listed twice, so its bar counts double');
  const orders = T.STEPS.map(s => T.STEP_ORDER[s]);
  if (orders.some((n, i) => n !== i)) fails.push('the step order does not match the step list');

  // Reaching a step means having reached every step before it, so reporting
  // where you are reports how you got there. That is what lets a phone repair
  // its own history: the server keeps whatever it has not already got, and a
  // bar can never come out smaller than the one below it.
  const upToThree = T.stepsUpTo('round_3');
  if (upToThree[0] !== 'open' || upToThree[upToThree.length - 1] !== 'round_3') {
    fails.push('reporting a step does not report the road to it');
  }
  if (upToThree.length !== T.STEP_ORDER['round_3'] + 1) {
    fails.push(`reaching round three reports ${upToThree.length} steps, not ${T.STEP_ORDER['round_3'] + 1}`);
  }
  if (T.stepsUpTo('open').join() !== 'open') fails.push('merely opening the game reports more than that');
  console.log(`  ${T.STEPS.length} steps, in order, and reaching one reports the road to it`);
}

/* 2. THE ROAD IS WALKED, BY A REAL CAREER.
      Every step must be reached by a state the GAME produces, in order, and a
      step nothing reaches is a bar that is always zero and a drop-off that is
      always a lie.

      This used to walk a road of hand-written states, and it passed while
      stepFor was badly wrong: the week is the round a manager is ON and starts
      at one, so reading it as rounds played reported the first match before a
      ball was kicked. The made-up road agreed with the made-up mapping,
      because the same hand wrote both. Now every state comes out of the game
      itself, so only the game can say what a step means. */
{
  const seen: { step: T.Step | null; where: string }[] = [];
  const note = (gs: { phase: string; season: number; week: number }, where: string) =>
    seen.push({ step: T.stepFor(gs), where });

  let gs = G.newGame(20260923);
  note(gs, 'a career that has done nothing');
  const blank = T.stepFor(gs);
  checked++;
  if (blank !== null) fails.push(`a brand new career already reports "${blank}" before anything was done`);

  // in the order the GAME walks, which is not the order the screens are named
  gs = G.setProfile(gs, { name: 'בודק', face: 0 }); note(gs, 'named');
  checked++;
  {
    const kicked = T.stepFor({ phase: 'match', season: 1, week: 1 });
    if (kicked !== 'match1_start') fails.push(`the first live match reports "${kicked}", not match1_start`);
    const second = T.stepFor({ phase: 'match', season: 1, week: 2 });
    if (second === 'match1_start') fails.push('the second week of matches still reports match1_start');
  }
  gs = G.pickCity(gs, 'חיפה'); note(gs, 'club picked');
  gs = G.setArchetype(gs, MANAGERS[0].id); note(gs, 'archetype picked');
  gs = G.afterSigning(gs, {}); note(gs, 'signed');
  gs = G.addFriends(gs, []); note(gs, 'friends done');
  gs = G.enterPreseason(gs); note(gs, 'the summer market');
  gs = G.enterSeason({ ...gs, crisisDone: true }); note(gs, 'the shirt and the sponsor');
  gs = G.closeKitReveal(gs); gs = G.takeSponsor(gs, 'base'); gs = G.dismissNotice(gs);
  note(gs, 'out into the league');

  // and the first whistle has not blown yet
  checked++;
  if (T.stepFor(gs) !== 'season') {
    fails.push(`a manager who has not played a match reports "${T.stepFor(gs)}", not "season"`);
  }

  const played: Record<number, T.Step | null> = {};
  for (let n = 1; n <= 8; n++) {
    gs = playRound(gs, n);
    played[n] = T.stepFor(gs);
    note(gs, `${n} rounds played`);
  }
  checked += 3;
  if (played[1] !== 'round_1') fails.push(`after one round the step is "${played[1]}", not round_1`);
  if (played[3] !== 'round_3') fails.push(`after three rounds the step is "${played[3]}", not round_3`);
  if (played[7] !== 'round_7') fails.push(`after seven rounds the step is "${played[7]}", not round_7`);

  const reached = new Set(seen.map(s => s.step).filter((s): s is T.Step => s !== null));
  checked += 2;
  // season_end and season_2 are the far end of a whole season, checked by the
  // phase and the season count the game itself uses for them
  const far = ['season_end', 'season_2'] as const;
  if (T.stepFor({ phase: 'season-end', season: 1, week: 14 }) !== 'season_end') fails.push('finishing a season reports something else');
  if (T.stepFor({ phase: 'hub', season: 2, week: 1 }) !== 'season_2') fails.push('a second season reports something else');
  // open, title and career_new are the three the SCREENS report, not the state:
  // the app mounting, the title screen coming up behind the cold open, and the
  // tap. stepFor reads a career, and none of the three is one yet.
  // match1_start comes from the state (phase 'match'), match1_half from the match
  // screen's half time, through the App's onHalfTime, so the walk below, which
  // plays rounds without the screen, never hits them
  const fromScreens = ['open', 'title', 'career_new', 'match1_start', 'match1_half'];
  const missing = T.STEPS.filter(s => !fromScreens.includes(s) && !far.includes(s as never) && !reached.has(s));
  if (missing.length) fails.push(`a real career never reaches: ${missing.join(', ')}`);

  /* AND THE THREE THE SCREENS REPORT ARE ACTUALLY REPORTED BY A SCREEN.
     A step nobody fires is a bar that is always empty, and an empty bar reads
     as people leaving rather than as a line of code nobody wrote. */
  const appSrc = readFileSync('src/ui/App.tsx', 'utf8');
  for (const s of ['open', 'title', 'career_new', 'match1_half']) {
    checked++;
    if (!appSrc.includes(`track('${s}')`)) fails.push(`nothing in the App ever reports "${s}", so its bar can only ever be empty`);
  }
  // and the half is only counted for the FIRST match, and never on a dashboard visit
  checked += 2;
  if (!appSrc.includes("onHalfTime={gs.season === 1 && gs.week === 1 && !ownerVisit ? () => track('match1_half') : undefined}")) {
    fails.push('the half of every match would be counted as the first, or the dashboard visit counts one');
  }
  const matchSrc = readFileSync('src/ui/screens/Match.tsx', 'utf8');
  if (!matchSrc.includes("if (!halfSaid.current && st.phase === 'halftime') { halfSaid.current = true; onHalfTime?.(); }")) {
    fails.push('the match screen never fires the half time callback once');
  }
  checked++;
  if (T.STEP_ORDER['title'] !== T.STEP_ORDER['open'] + 1) {
    fails.push('"title" is not the step straight after "open", which is the only place it answers anything');
  }

  // and it never goes backwards
  const order = seen.map(s => (s.step ? T.STEP_ORDER[s.step] : -1));
  for (let i = 1; i < order.length; i++) {
    if (order[i] < order[i - 1]) {
      fails.push(`the step went backwards at "${seen[i].where}": ${seen[i - 1].step} then ${seen[i].step}`);
      break;
    }
  }

  // the two the state cannot describe are reported from the App instead
  const app = readFileSync('src/ui/App.tsx', 'utf8');
  checked++;
  if (!/track\('open'\)/.test(app) || !/track\('career_new'\)/.test(app)) {
    fails.push('opening the game, or starting a career, is not counted anywhere');
  }
  console.log(`  a real career walks ${reached.size} steps in order, and plays its first match before saying so`);
}

/** One round, played for real, so the week moves the way the game moves it. */
function playRound(gs: G.GameState, seed: number): G.GameState {
  const inp = G.liveMatchInput(gs);
  const res: MatchResult = simulateMatch(
    { id: inp.homeId, name: inp.homeName, players: inp.iAmHome ? inp.playerStarters : inp.oppStarters,
      tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: true },
    { id: inp.awayId, name: inp.awayName, players: inp.iAmHome ? inp.oppStarters : inp.playerStarters,
      tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: false },
    inp.seed + seed);
  let next = G.continueFromResult(G.commitRound(gs, res));
  while (next.phase === 'press') next = G.answerPress(next, 0);
  if ((next as { phase: string }).phase === 'chat') next = G.closeChat(next);
  if (next.phase === 'dilemma') next = G.chooseDilemma(next, 0);
  return next;
}

/* 3. NOTHING PERSONAL CAN REACH THE WIRE.
      Read rather than trusted. The event has four fields and they are built in
      one place; if a name could get in, it would have to get in there. */
{
  const tele = readFileSync('src/game/telemetry.ts', 'utf8');
  checked += 4;

  // the only thing that is posted is the queue of events, and an event is
  // built from these four and nothing else
  if (!/enqueued\(queue, \{ a, s: sessionId, k: s, t \}\)/.test(tele) || !/const a = deviceId\(\);/.test(tele)) {
    fails.push('the event is no longer built from exactly the device, the sitting, the step and the time');
  }
  // The real boundary is the import list. Every name a player types lives on
  // the career state, so a file that cannot reach state.ts or the save cannot
  // leak one, whatever anybody writes in it later. Checking for the WORDS
  // instead was worse than useless: two of the funnel's own steps are called
  // friends and squad, so the guard fired on its own step names.
  const imports = [...tele.matchAll(/from '([^']+)'/g)].map(m => m[1]);
  const forbidden = imports.filter(i => /state\.ts|save\.ts|squadGen|personalities|clubs\.ts|names\.ts/.test(i));
  if (forbidden.length) {
    fails.push(`telemetry.ts imports ${forbidden.join(', ')}, and the career state is where every typed name lives`);
  }
  if (/GameState/.test(tele)) fails.push('telemetry.ts handles a whole career state');
  // stepFor is handed three plain numbers and a phase, never a career
  if (!/export function stepFor\(g: \{ phase: string; season: number; week: number \}\)/.test(tele)) {
    fails.push('stepFor takes something wider than a phase, a season and a week');
  }
  // Only one place in the game SENDS, and the career state is not near it.
  // state.ts holds every name a player typed and must never reach the network
  // at all; the App may only ask the worker for the numbers, which is a read
  // that carries nothing but the dashboard key.
  const state = readFileSync('src/game/state.ts', 'utf8');
  if (/fetch\(/.test(state)) fails.push('state.ts, where every typed name lives, can reach the network');
  const app = readFileSync('src/ui/App.tsx', 'utf8');
  // (27.10, dashboard v2: this was "every fetch in the App is /stats?key="; the numbers have their own page now, so the App
  // may not fetch at all, which is stronger)
  const appFetches = [...app.matchAll(/fetch\(([^\n]*)/g)].map(m => m[1]);
  if (appFetches.length) fails.push(`the App fetches: ${appFetches.join(' | ')}`);
  if (/XMLHttpRequest|sendBeacon|new WebSocket/.test(app)) fails.push('the App reaches the network some other way');
  if (/method: 'POST'/.test(app)) fails.push('the App posts to the network, which only telemetry.ts may do');
  console.log(`  only telemetry.ts sends; state.ts and the App cannot reach the network`);
}

/* 3b. THE WORKER AGREES WITH THE GAME ABOUT WHAT THE ROAD IS.
      The step list lives twice, once in the game and once in the worker, since
      a worker cannot import from the game's source. The worker's copy decides
      the order of the funnel on the dashboard, and it has already gone stale
      once: the game's order was corrected and the worker's was not, so the
      chart drew people picking who they are before they had named themselves.
      A copy nobody compares is a copy that drifts. */
{
  const wsrc = readFileSync('worker/src/index.ts', 'utf8');
  const block = /const STEPS = \[([^\]]+)\] as const;/.exec(wsrc)?.[1] ?? '';
  const theirs = [...block.matchAll(/'([a-z0-9_]+)'/g)].map(m => m[1]);
  checked += 2;
  if (theirs.join(',') !== T.STEPS.join(',')) {
    fails.push(`the worker's steps are [${theirs.join(', ')}] and the game's are [${T.STEPS.join(', ')}]`);
  }
  // and the dashboard (src/ops, its own page since 2.11) has plain Hebrew for every step and every closed mark it can show
  const labels = readFileSync('src/ops/labels.ts', 'utf8');
  const names = [...T.STEPS, ...T.OB_MARKS, ...T.CUP_MARKS, ...T.EURO_MARKS, ...T.GIFT_MARKS, ...T.SHARE_MARKS, ...T.DAILY_MARKS, ...T.MONEY_MARKS] as string[];
  const unlabelled = names.filter(d => !new RegExp(`\\b${d}: '[^']*[\u0590-\u05FF]`).test(labels));
  checked += 1;
  if (unlabelled.length) fails.push(`the dashboard has no Hebrew words for: ${unlabelled.join(', ')}`);
  console.log(`  the worker and the game agree on all ${theirs.length} steps, and every step and mark has a Hebrew name on the dashboard`);
}

/* 3c. THE GAME HAS NO DOOR TO THE NUMBERS, AND AN OLD LINK TO ONE IS NOT A PLAYER.
      (Rewritten 27.10 with the dashboard moved to its own page, /ops/. The four things this used to hold, and what holds them now:
        - "any ?admin= value does not mount the dashboard", "it is gated on the worker having said yes": the game cannot mount a
          dashboard at all, there is no screen for it in the game
        - "no wrong-password screen, which advertises the door": no file of the game says a key or a password is wrong; only the
          dashboard page may, and a stranger cannot reach it from the game
        - "a visit carrying a key is not counted as a player": still held, now as `ownerVisit`, which is true when the address
          carried an admin parameter and which the address is scrubbed of before anything else runs
        - "the App only reads the numbers": the App does not read anything; see the check on fetch above)
      The rest of the door (the key in memory only, where it is sent, the page itself) is scripts/ops-check.mts and scripts/ops-ui.mjs. */
{
  const app = readFileSync('src/ui/App.tsx', 'utf8');
  checked += 6;
  if (/AdminScreen|adminStats|AdminStats|screens\/Admin/.test(app) || existsSync('src/ui/screens/Admin.tsx')) {
    fails.push('the game still has a screen for the numbers, so a stranger who tries ?admin=anything could be shown one');
  }
  const walk = (d: string): string[] => readdirSync(d).flatMap(f => { const q = `${d}/${f}`; return statSync(q).isDirectory() ? walk(q) : [q]; });
  const wrong = walk('src').filter(f => /\.(ts|tsx)$/.test(f) && !f.startsWith('src/ops') && /סיסמה שגויה|המפתח לא נכון|wrong password|wrong key/i.test(readFileSync(f, 'utf8')));
  if (wrong.length) fails.push(`${wrong.join(', ')} says a key is wrong, which advertises the door`);
  // his own visits are not players
  if (!/if \(ownerVisit\) return;\s*\n\s*track\('open'\)/.test(app)) {
    fails.push('a visit that came with an admin parameter is counted as somebody playing the game');
  }
  if (!/const ownerVisit = OWNER_VISIT;/.test(app) || !/export const OWNER_VISIT: boolean = scrub\(\);/.test(readFileSync('src/ui/ownerVisit.ts', 'utf8'))) {
    fails.push('the visit is not told from an address that was scrubbed at load');
  }
  const idx = readFileSync('src/main.tsx', 'utf8').split('\n').filter(l => /^import /.test(l));
  if (idx[0] !== "import './ui/ownerVisit.ts';") fails.push('the scrub is not the first thing the game loads');
  // and nothing of the counting runs for such a visit: every report the App makes is behind the same guard
  const reports = [...app.matchAll(/useEffect\(\(\) => \{\s*\n\s*if \(([^)]*)\) return;/g)].map(m => m[1]);
  const unguarded = reports.filter(g => /!booted|booted/.test(g) && !/ownerVisit/.test(g));
  if (unguarded.length) fails.push(`a report that the owner's own visit would make: if (${unguarded.join('), if (')})`);
  console.log('  the game has no screen for the numbers and no word about a key; an old link is scrubbed and not counted as a player');
}

/* 3d. THE DEVICE IS NOT THE AUTHORITY ON WHAT THE SERVER KNOWS.
      Dedupe used to be written to localStorage and kept for good, which made
      each phone the final word on what it had already reported. When the table
      was emptied after a bad build, every phone that had touched it went on
      believing it had already said everything, and Itzik's own funnel came
      back with one bar in it. The server is the only thing that must not
      double count, and it cannot, because a step is a primary key there.
      Nothing about what was sent may outlive the sitting. */
{
  const tele = readFileSync('src/game/telemetry.ts', 'utf8');
  checked += 3;
  if (/FAR_KEY|beapro\.far/.test(tele)) {
    fails.push('the device writes down what it has reported, so a wrong note silences it forever');
  }
  if (!/const sentThisSitting = new Set<Step>\(\);/.test(tele)) {
    fails.push('nothing stops one sitting posting the same step over and over');
  }
  // the worker is what makes that safe, so the primary key has to still be there
  const schema = readFileSync('worker/schema.sql', 'utf8');
  if (!/PRIMARY KEY \(aid, step\)/.test(schema)) {
    fails.push('the server no longer dedupes, so re-reporting would inflate the funnel');
  }
  console.log('  nothing about what was sent outlives the sitting; the server is what cannot double count');
}

/* 3e. A CRASH IS COUNTED, WITHOUT A WORD OF FREE TEXT.
      The funnel says where people stop and cannot say why. A bar that falls at
      the squad screen means one thing if nobody crashed there and something
      else entirely if everybody did, and those want opposite fixes.

      The error's MESSAGE is never sent, and that is the whole of the privacy
      argument: a message is free text written by whatever threw, and free text
      is the one shape that could carry a name a player typed. The class of
      error is a closed list and cannot. */
{
  const tele = readFileSync('src/game/telemetry.ts', 'utf8');
  const worker = readFileSync('worker/src/index.ts', 'utf8');
  checked += 6;

  // a real error reports its kind, an odd one lands on 'other', and neither
  // can smuggle anything through
  if (T.errorName(new TypeError('x')) !== 'TypeError') fails.push('a TypeError is not reported as one');
  if (T.errorName(new Error('איציק')) !== 'Error') fails.push('a plain Error is not reported as one');
  class Weird extends Error { name = 'איציק כהן'; }
  if (T.errorName(new Weird()) !== 'other') fails.push('an error can name itself anything and have it sent');
  if (T.errorName('a string') !== 'other') fails.push('a thrown string is not handled');

  // The message never leaves. Written with plain string matching rather than a
  // pattern: the first try was a regex whose backslash was eaten on the way
  // into this file, so ".message" meant "any character then message" and it
  // matched the word in its own explaining comment. A guard that fires on its
  // own prose teaches you to ignore it.
  if (tele.includes('describeError') || tele.includes('.message')) {
    fails.push('telemetry.ts can see an error message, which is free text a name could ride in');
  }
  const crashed = readFileSync('src/ui/components/Crashed.tsx', 'utf8');
  if (!crashed.includes('trackCrash(error, gs ? stepFor(gs) : null)')) {
    fails.push('a crash is not counted, so a black screen and boredom look identical in the funnel');
  }
  // and the worker refuses anything outside the two closed lists
  if (!worker.includes('ERROR_NAMES.has(e.n)') || !worker.includes("KNOWN.has(e.w) || e.w === 'none'")) {
    fails.push('the worker takes the crash fields on trust instead of checking them against a list');
  }
  console.log(`  a crash reports where and what kind, out of ${T.ERROR_NAMES.length} known kinds, and never a message`);
}

/* 3e2. AND ONLY OUR OWN CRASHES COUNT.
      The window hears everything thrown on the page, not only what the game
      threw. An extension, an injected script, a blocked tracker: each one used
      to put "משהו נשבר" over a game that was working perfectly, and now that
      crashes are counted, each one would also fill the numbers with faults
      nobody can fix. Caught in the act during testing, when a line typed into
      a console raised the crash screen.

      The test is whether our own address is in the blame. These are the shapes
      a real browser hands over. */
{
  const O = 'https://beapromanager.github.io';
  const cases: [string, string | undefined, string | undefined, boolean][] = [
    ['our own bundle', 'TypeError: x\n    at s (' + O + '/assets/index-a1.js:5:1)', undefined, true],
    ['our own, named by filename', undefined, O + '/assets/index-a1.js', true],
    ['a chrome extension', 'TypeError\n    at chrome-extension://abcd/content.js:1:1', 'chrome-extension://abcd/content.js', false],
    ['a firefox extension', 'Error\n    at moz-extension://ef/inject.js:2:2', undefined, false],
    ['a safari extension', 'Error\n    at safari-web-extension://zz/x.js:1:1', undefined, false],
    ['a script from another origin, which gives nothing at all', undefined, undefined, false],
    ['something typed into a console', 'TypeError\n    at <anonymous>:1:1', undefined, false],
    ['a third party script', 'Error\n    at https://ads.example.com/t.js:9:9', 'https://ads.example.com/t.js', false],
    ['an extension that also touched our frames', 'Error\n    at chrome-extension://a/c.js:1:1\n    at ' + O + '/assets/i.js:2:2', undefined, false],
  ];
  for (const [what, stack, file, want] of cases) {
    checked++;
    const got = isOurCrash(stack, file, O);
    if (got !== want) fails.push(`${what}: ${want ? 'should count as ours' : 'should be ignored'}, and is not`);
  }
  // and the window listeners have to actually ask
  const crashed = readFileSync('src/ui/components/Crashed.tsx', 'utf8');
  checked++;
  if (!crashed.includes('isOurCrash(e.error.stack, e.filename, location.origin)')) {
    fails.push('the crash net still catches anything the page throws, including other people\'s code');
  }
  console.log(`  ${cases.length} kinds of error sorted into ours and not ours, and the net asks`);
}

/* 3f. THE LINK HAS A FACE.
      This game travels by one person sending it to another on WhatsApp, and a
      link with no card is a bare address nobody taps. The addresses have to be
      absolute, since an unfurler fetches the page from outside and cannot
      resolve a relative one, and the picture has to be under the size
      WhatsApp will render. */
{
  const html = readFileSync('index.html', 'utf8');
  const { statSync } = await import('node:fs');
  checked += 4;
  for (const tag of ['og:title', 'og:description', 'og:image', 'og:url']) {
    if (!html.includes(`property="${tag}"`)) fails.push(`the link preview has no ${tag}`);
  }
  const img = /property="og:image" content="([^"]+)"/.exec(html)?.[1] ?? '';
  if (!img.startsWith('https://')) fails.push(`the preview picture is "${img}", which nothing outside the site can fetch`);
  const file = 'public/' + img.split('/').pop();
  const size = statSync(file).size;
  if (size > 300 * 1024) fails.push(`the preview picture is ${Math.round(size / 1024)}KB, over what WhatsApp renders`);
  if (!/og:image:width" content="1200"/.test(html)) fails.push('the preview picture does not declare its size');
  console.log(`  the link carries a card: ${Math.round(size / 1024)}KB, absolute, with a title and words`);
}

/* 3g. WHERE CAREERS GET TO.
      The funnel stops at a second season, so a manager who has won two divisions and one who has just survived a
      year look the same on it. Two kinds of milestone say more: a division in a season (t3s5) and a title (w5).
      They are numbers and nothing else, they are not steps (no backfill: a career can be sacked back down), and
      the worker keeps one of each per device. */
{
  checked += 13;
  // the keys, in the shapes agreed
  if (T.reachKey(3, 5) !== 't3s5') fails.push(`the third division in the fifth season is "${T.reachKey(3, 5)}", expected t3s5`);
  if (T.reachKey(5, 25) !== 't5s20') fails.push(`a twenty fifth season is "${T.reachKey(5, 25)}", expected t5s20, twenty or more`);
  if (T.titleKey(5) !== 'w5') fails.push(`winning the top division is "${T.titleKey(5)}", expected w5`);
  for (const [t, sn] of [[0, 1], [6, 1], [3, 0], [3, -2], [NaN, 1], [3, NaN], [Infinity, 2]] as [number, number][]) {
    if (T.reachKey(t, sn) !== null) fails.push(`reachKey(${t}, ${sn}) is "${T.reachKey(t, sn)}", it is not a division in a season`);
  }
  if (T.titleKey(0) !== null || T.titleKey(6) !== null) fails.push('a title in a division that does not exist is reported');
  // every real one is accepted, and the near misses are not
  let valid = 0;
  for (let t = 1; t <= 5; t++) for (let sn = 1; sn <= 20; sn++) if (T.isMilestone(T.reachKey(t, sn))) valid++;
  if (valid !== 100) fails.push(`${valid} of the 100 division and season keys pass the pattern`);
  for (const bad of ['t6s1', 't0s1', 't3s21', 't3s0', 't3s05', 'w0', 'w6', 't3', 's5', 'title', 'season', 'round_1', 't3s5 ', 'x t3s5', '']) {
    if (T.isMilestone(bad)) fails.push(`"${bad}" passes as a milestone`);
  }
  if (T.STEP_ORDER['t3s5' as never] !== undefined) fails.push('a milestone is in the step order, which would backfill it');

  // the worker holds the same pattern, and runs the same questions over real rows
  const wsrc = readFileSync('worker/src/index.ts', 'utf8');
  const theirs = /const MILESTONE = (\/.+\/);/.exec(wsrc)?.[1] ?? '';
  if (theirs !== String(T.MILESTONE)) fails.push(`the worker's pattern is ${theirs} and the game's is ${T.MILESTONE}`);

  const worker = (await import('../worker/src/index.ts')) as {
    default: { fetch: (r: Request, e: unknown) => Promise<Response> };
    REACH_SQL: Record<'grid' | 'ever' | 'best' | 'seasons' | 'titles' | 'europe' | 'gift' | 'share' | 'daily', string>;
  };
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE steps (aid TEXT NOT NULL, step TEXT NOT NULL, ts INTEGER NOT NULL, day TEXT NOT NULL, PRIMARY KEY (aid, step))');
  const put = (aid: string, ...steps: string[]) => { for (const st of steps) db.prepare('INSERT INTO steps VALUES (?, ?, 0, ?)').run(aid, st, '2026-10-01'); };
  put('A', 'open', 'title', 'season', 'round_1', 'season_2', 't1s1', 't1s2', 't2s3', 't3s4', 'w1', 'w2');
  put('B', 'open', 'season_2', 't1s1', 't1s2');
  put('C', 'open', 't1s1', 't2s2', 't3s3', 't4s4', 't5s5', 'w5');
  put('D', 'open', 't3s2', 't3s12');
  const q = (sql: string) => db.prepare(sql).all() as Record<string, number>[];
  const flat = (rows: Record<string, number>[], ...keys: string[]) => rows.map(r => keys.map(k => r[k]).join(':')).join(' ');
  const R = worker.REACH_SQL;
  const grid = flat(q(R.grid), 'tier', 'season', 'n');
  if (grid !== '1:1:3 1:2:2 2:2:1 2:3:1 3:2:1 3:3:1 3:4:1 3:12:1 4:4:1 5:5:1') fails.push(`who was where, by division and season: ${grid}`);
  const ever = flat(q(R.ever), 'tier', 'n');
  if (ever !== '1:3 2:2 3:3 4:1 5:1') fails.push(`who has ever been in each division: ${ever}`);
  const best = flat(q(R.best), 'tier', 'n');
  if (best !== '1:1 3:2 5:1') fails.push(`the highest division each person reached: ${best}`);
  // twelve is bigger than four, which a text sort would not say
  const seasons = flat(q(R.seasons), 'season', 'n');
  if (seasons !== '2:1 4:1 5:1 12:1') fails.push(`the furthest season each person reached: ${seasons}`);
  const titles = flat(q(R.titles), 'tier', 'n');
  if (titles !== '1:1 2:1 5:1') fails.push(`who has won each division: ${titles}`);

  // Europe: three closed marks, counted once a device, and the question that counts them
  put('E', 'open', 'eu_in', 'eu_final', 'eu_won');
  put('F', 'open', 'eu_in', 'eu_final');
  put('G', 'open', 'eu_in');
  const eu = (db.prepare(R.europe).all() as unknown as { step: string; n: number }[]).map(r => `${r.step}:${r.n}`).join(' ');
  if (eu !== 'eu_final:2 eu_in:3 eu_won:1') fails.push(`how many were drawn into the cup, stood in its final and lifted it: ${eu}`);
  if (flat(q(R.grid), 'tier', 'season', 'n') !== grid || flat(q(R.titles), 'tier', 'n') !== titles) fails.push('a European mark leaked into the divisions or the titles');

  // the loyalty gift: one closed mark, counted once a device
  put('H', 'open', 'gift10');
  put('I', 'open', 'gift10');
  put('J', 'open', 'gift1'); // not a mark the door lets in, but a row that looks like one must not be counted either
  const gift = (db.prepare(R.gift).all() as unknown as { n: number }[])[0]?.n;
  if (gift !== 2) fails.push(`how many signed the loyalty gift: ${gift}, wanted 2`);
  if (flat(q(R.grid), 'tier', 'season', 'n') !== grid || flat(q(R.titles), 'tier', 'n') !== titles) fails.push('the gift mark leaked into the divisions or the titles');

  // the share button: one closed mark, counted once a device, and not the gift
  put('K', 'open', 'share_tap');
  put('L', 'open', 'share_tap', 'gift10');
  put('M', 'open', 'share_taps');
  const sharedN = (db.prepare(R.share).all() as unknown as { n: number }[])[0]?.n;
  if (sharedN !== 2) fails.push(`how many devices sent a moment to a friend: ${sharedN}, wanted 2`);
  if ((db.prepare(R.gift).all() as unknown as { n: number }[])[0]?.n !== 3) fails.push('the share mark changed the gift count');

  // the daily gift: three closed marks, counted once a device, one row each
  put('N', 'open', 'daily_1');
  put('O', 'open', 'daily_1', 'daily_7');
  put('P', 'open', 'daily_1', 'daily_7', 'daily_30');
  put('Q', 'open', 'daily_', 'daily_8', 'daily_100');
  const dailyRows = (db.prepare(R.daily).all() as unknown as { step: string; n: number }[]).map(r => `${r.step}:${r.n}`).join(' ');
  if (dailyRows !== 'daily_1:3 daily_30:1 daily_7:2') fails.push(`how far the daily gift goes: ${dailyRows}, wanted daily_1:3 daily_30:1 daily_7:2`);
  if ((db.prepare(R.share).all() as unknown as { n: number }[])[0]?.n !== 2) fails.push('the daily marks changed the share count');

  // and the door lets the milestones in, and nothing that only looks like one
  const written: unknown[][] = [];
  const env = {
    ADMIN_KEY: 'k',
    DB: { prepare: (sql: string) => ({ bind: (...v: unknown[]) => ({ sql, v }) }), batch: async (stmts: { sql: string; v: unknown[] }[]) => { for (const x of stmts) if (/INTO steps/.test(x.sql)) written.push(x.v); } },
  };
  const post = (keys: string[]) => worker.default.fetch(
    new Request('https://w.example/', { method: 'POST', body: JSON.stringify({ e: keys.map(k => ({ a: 'dev1', s: 'sit1', k, t: Date.now() })) }) }), env);
  await post(['t3s5', 'w5', 't6s1', 't3s21', 'w9', 'bogus', 't3s05', 'season_2']);
  const kept = written.map(v => v[1]).join(',');
  if (kept !== 't3s5,w5,season_2') fails.push(`the worker kept [${kept}] out of a batch of eight, expected t3s5, w5 and season_2`);
  written.length = 0;
  await post(['eu_in', 'eu_final', 'eu_won', 'eu_lost', 'eu_', 'eu_won2', 'EU_IN', 'eu_in ']);
  const keptEu = written.map(v => v[1]).join(',');
  if (keptEu !== 'eu_in,eu_final,eu_won') fails.push(`the worker kept [${keptEu}] out of eight European-looking names, expected eu_in, eu_final and eu_won`);
  console.log('  where careers get to: a division in a season and a title, the worker keeps only those, and five questions give the right answers');
}

/* 3g2. THE MONEY MARKS: a career that fell below zero, and one the owner ended
       over debt. Closed names, counted like milestones, nothing typed near them. */
{
  checked += 5;
  if (!T.isMilestone('money_red') || !T.isMilestone('money_sack')) fails.push('the money marks are not accepted by the game pattern');
  if (T.isMilestone('money_')) fails.push('a half-written money mark passes');
  const wsrc2 = readFileSync('worker/src/index.ts', 'utf8');
  if (!/money_red\|money_sack/.test(wsrc2)) fails.push('the worker refuses the money marks, they would be dropped at the door');
  const app2 = readFileSync('src/ui/App.tsx', 'utf8');
  if (!app2.includes("if (gs.meters.money < 0) moneyMark('money_red');")) fails.push('nothing reports a purse below zero');
  if (!app2.includes("if (G.sackedOverDebt(gs)) moneyMark('money_sack');")) fails.push('nothing reports a debt sacking');
}

/* 3g3. EUROPE: three closed marks. The worker must know them BEFORE the game that sends them is out, or they are
        dropped at its door, so the game's pattern, the worker's pattern and the sending code are held together. */
{
  checked += 12;
  const E = await import('../src/game/euro.ts');
  const marks = ['eu_in', 'eu_final', 'eu_won'];
  if (JSON.stringify(T.EURO_MARKS) !== JSON.stringify(marks) || JSON.stringify(E.EURO_MARKS) !== JSON.stringify(marks)) fails.push('the game and the competition do not agree on the three European marks');
  if (!marks.every(k => T.isMilestone(k))) fails.push('a European mark is not accepted by the game pattern');
  for (const bad of ['eu_', 'eu_lost', 'eu_in2', 'EU_IN', 'eu_in ', 'eu_finals', 'e_in']) if (T.isMilestone(bad)) fails.push(`"${bad}" passes as a European mark`);
  if (T.STEP_ORDER['eu_in' as never] !== undefined) fails.push('a European mark is in the step order, which would backfill it');
  const wsrc3 = readFileSync('worker/src/index.ts', 'utf8');
  if (!/eu_in\|eu_final\|eu_won/.test(wsrc3)) fails.push('the worker refuses the European marks');
  if (!wsrc3.includes('europe: europe.results')) fails.push('the worker does not answer the dashboard with the European counts');
  const tele3 = readFileSync('src/game/telemetry.ts', 'utf8');
  if (!/export function euroMark\(k: typeof EURO_MARKS\[number\]\): void/.test(tele3)) fails.push('euroMark() takes something wider than the three closed names');
  const app3 = readFileSync('src/ui/App.tsx', 'utf8');
  if (!app3.includes('const euroReports = G.euroMarksFor(gs).join(\',\');') || !app3.includes('euroMark(k)')) fails.push('nothing in the App reports Europe');
  if (!/useEffect\(\(\) => \{\s*\n\s*if \(!booted \|\| ownerVisit \|\| !gs\.clubId\) return;\s*\n\s*for \(const k of euroReports/.test(app3)) fails.push('a visit to the dashboard, or a career with no club, reports Europe');
  const adm3 = readFileSync('src/ops/Dashboard.tsx', 'utf8');
  if (!adm3.includes('ליגת אירופה') || !adm3.includes('eu_final')) fails.push('the dashboard has no place for the European cup');
  // the door is shut, so no career carries a cup and nothing is reported until it opens
  if (G.euroMarksFor(G.newGame(5)).length !== 0) fails.push('a career with no cup reports Europe');
  console.log('  Europe: three closed marks in the game, the worker and the sending code, counted once a device, nothing while the door is shut');
}

/* 3g4. THE LOYALTY GIFT: one closed mark, gift10, held in the game, the worker, the App and the dashboard together for the same reason. */
{
  checked += 9;
  if (JSON.stringify(T.GIFT_MARKS) !== '["gift10"]') fails.push('the name of the gift mark changed, and the worker holds the same one');
  if (!T.isMilestone('gift10')) fails.push('the gift mark is not accepted by the game pattern');
  for (const bad of ['gift', 'gift1', 'gift100', 'GIFT10', 'gift10 ', 'gift_10']) if (T.isMilestone(bad)) fails.push(`"${bad}" passes as the gift mark`);
  if (T.STEP_ORDER['gift10' as never] !== undefined) fails.push('the gift mark is in the step order, which would backfill it');
  const wsrc4 = readFileSync('worker/src/index.ts', 'utf8');
  if (!wsrc4.includes('|gift10|') && !wsrc4.includes('|gift10)$/')) fails.push('the worker refuses the gift mark');
  if (!wsrc4.includes('gift: gift.results')) fails.push('the worker does not answer the dashboard with the gift count');
  const tele4 = readFileSync('src/game/telemetry.ts', 'utf8');
  if (!tele4.includes('export function giftMark(k: typeof GIFT_MARKS[number]): void')) fails.push('giftMark() takes something wider than the one closed name');
  const app4 = readFileSync('src/ui/App.tsx', 'utf8');
  if (!app4.includes('const giftSigned = !!gs.loyalGift?.playerId;') || !app4.includes("if (giftSigned) giftMark('gift10');")) fails.push('nothing in the App reports the gift');
  const adm4 = readFileSync('src/ops/Dashboard.tsx', 'utf8');
  if (!adm4.includes('depth.gift10') || !adm4.includes('המתנה למי שנשאר')) fails.push('the dashboard has no place for the gift count');
  console.log('  the loyalty gift: one closed mark in the game, the worker, the sending code and the dashboard, counted once a device');
}

/* 3g5. THE SHARE BUTTON: one closed mark, share_tap, held in the game, the worker, the sending code and the dashboard together. */
{
  checked += 11;
  if (JSON.stringify(T.SHARE_MARKS) !== '["share_tap"]') fails.push('the name of the share mark changed, and the worker holds the same one');
  if (!T.isMilestone('share_tap')) fails.push('the share mark is not accepted by the game pattern');
  for (const bad of ['share', 'share_', 'share_tap2', 'SHARE_TAP', 'share_tap ', 'shared']) if (T.isMilestone(bad)) fails.push(`"${bad}" passes as the share mark`);
  if (T.STEP_ORDER['share_tap' as never] !== undefined) fails.push('the share mark is in the step order, which would backfill it');
  const wsrc5 = readFileSync('worker/src/index.ts', 'utf8');
  if (!wsrc5.includes('|gift10|share_tap|')) fails.push('the worker refuses the share mark');
  if (!wsrc5.includes('share: share.results')) fails.push('the worker does not answer the dashboard with the share count');
  if (!readFileSync('src/game/telemetry.ts', 'utf8').includes('export function shareMark(k: typeof SHARE_MARKS[number]): void')) fails.push('shareMark() takes something wider than the one closed name');
  const end5 = readFileSync('src/ui/screens/SeasonEnd.tsx', 'utf8');
  if (!end5.includes("onShared={() => shareMark('share_tap')}")) fails.push('nothing reports a share');
  const adm5 = readFileSync('src/ops/Dashboard.tsx', 'utf8');
  if (!adm5.includes('share.tap') || !adm5.includes('שיתוף לחבר')) fails.push('the dashboard has no place for the share count');
}

/* 3g6. THE DAILY GIFT: three closed marks, held in the game, the worker, the sending code and the dashboard together. */
{
  checked += 11;
  if (JSON.stringify(T.DAILY_MARKS) !== '["daily_1","daily_7","daily_30"]') fails.push('the names of the daily marks changed, and the worker holds the same three');
  if (!T.DAILY_MARKS.every((k: string) => T.isMilestone(k))) fails.push('a daily mark is not accepted by the game pattern');
  for (const bad of ['daily', 'daily_', 'daily_2', 'daily_70', 'DAILY_1', 'daily_1 ', 'daily_300']) if (T.isMilestone(bad)) fails.push(`"${bad}" passes as a daily mark`);
  if (T.STEP_ORDER['daily_1' as never] !== undefined) fails.push('a daily mark is in the step order, which would backfill it');
  const wsrc6 = readFileSync('worker/src/index.ts', 'utf8');
  if (!wsrc6.includes('|daily_1|daily_7|daily_30)$/')) fails.push('the worker refuses the daily marks');
  if (!wsrc6.includes('daily: dailyGift.results')) fails.push('the worker does not answer the dashboard with the daily counts');
  if (!readFileSync('src/game/telemetry.ts', 'utf8').includes('export function dailyMark(k: typeof DAILY_MARKS[number]): void')) fails.push('dailyMark() takes something wider than the three closed names');
  const app6 = readFileSync('src/ui/App.tsx', 'utf8');
  if (!app6.includes("if (dailyStreak >= 1) dailyMark('daily_1');") || !app6.includes("if (dailyStreak >= 7) dailyMark('daily_7');") || !app6.includes("if (dailyStreak >= 30) dailyMark('daily_30');")) fails.push('nothing reports how far a run has gone');
  const adm6 = readFileSync('src/ops/Dashboard.tsx', 'utf8');
  if (!adm6.includes('dailyGift') || !adm6.includes('המתנה היומית')) fails.push('the dashboard has no place for the daily counts');
}

/* 3h. THE GAME REPORTS THEM, AND ONLY FROM A REAL CAREER ON A REAL PAGE. */
{
  checked += 11;
  const tele = readFileSync('src/game/telemetry.ts', 'utf8');
  const app = readFileSync('src/ui/App.tsx', 'utf8');
  const admin = readFileSync('src/ops/Dashboard.tsx', 'utf8');
  // handed numbers, never a career
  if (!/export function reached\(tier: number, season: number\): void/.test(tele)) fails.push('reached() takes something wider than two numbers');
  if (!/export function wonLeague\(tier: number\): void/.test(tele)) fails.push('wonLeague() takes something wider than a number');
  if (!/function trackMilestone\(k: Milestone\): void \{\s*\n\s*if \(!endpoint\(\)/.test(tele)) fails.push('with no endpoint a milestone is still queued');
  // the App asks, from a career that is out in the league, and never for the dashboard's own visits
  if (!app.includes('reached(G.club(gs).tier, gs.season)')) fails.push('nothing in the App reports the division and the season');
  if (!app.includes('wonLeague(G.club(gs).tier)') || !app.includes('G.wonTheLeague(gs)')) fails.push('nothing in the App reports a title');
  if (!/if \(!booted \|\| ownerVisit \|\| !gs\.clubId\) return;\s*\n\s*const at = stepFor\(gs\);/.test(app)) fails.push('a visit to the dashboard, or a career with no club, is counted as a division');
  if (!app.includes('STEP_ORDER[at] >= STEP_ORDER.season')) fails.push('a manager still picking a colour is counted as having arrived in a division');
  if (!admin.includes('לאן מגיעים')) fails.push('the dashboard has no place for where careers get to');

  // a title is the season being over and the club first, nothing else
  const base = G.pickCity(G.setProfile(G.newGame(777), { name: 'בודק', face: 0 }), 'חיפה');
  const withPts = (mine: number, theirs: number, phase: string) => {
    const table = Object.fromEntries(Object.entries(base.league.table).map(([id, row]) =>
      [id, { ...row, pts: id === base.clubId ? mine : theirs, gf: 0, ga: 0 }]));
    return { ...base, phase, league: { ...base.league, table } } as unknown as G.GameState;
  };
  const won = G.wonTheLeague(withPts(90, 10, 'season-end'));
  const lost = G.wonTheLeague(withPts(10, 90, 'season-end'));
  const midSeason = G.wonTheLeague(withPts(90, 10, 'hub'));
  if (!won) fails.push('a club that finished first is not reported as having won');
  if (lost) fails.push('a club that finished below the others is reported as having won');
  if (midSeason) fails.push('leading the table in the middle of a season is reported as a title');
  console.log('  the App reports a division in a season from a career that is out in the league, and a title only at the end');
}

/* 3i. ON A REAL PAGE THE MILESTONES QUEUE, ONCE A SITTING; ON A MACHINE THEY DO NOT. */
{
  checked += 5;
  const globals = globalThis as { location?: unknown; localStorage?: unknown; fetch?: unknown };
  const hadLocation = 'location' in globals;
  const realLocation = globals.location, realStorage = globals.localStorage, realFetch = globals.fetch;
  const store = new Map<string, string>();
  globals.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  };
  globals.fetch = async () => ({ ok: false });
  const kinds = () => T.readQueue().map(e => e.k).join(',');

  globals.location = { hostname: 'beapromanager.github.io' };
  T.reached(3, 5); T.reached(3, 5); T.reached(3, 5);
  T.wonLeague(5);
  if (kinds() !== 't3s5,w5') fails.push(`a real page queued [${kinds()}] for the same division three times and a title, expected t3s5 once and w5`);
  T.reached(9, 1); T.reached(3, 0); T.wonLeague(7);
  if (kinds() !== 't3s5,w5') fails.push('something that is not a division in a season was queued');
  await new Promise(r => setTimeout(r, 0));

  store.clear();
  globals.location = { hostname: 'localhost' };
  T.reached(4, 6); T.wonLeague(4);
  if (T.readQueue().length !== 0) fails.push('the dev server queues milestones into the real numbers');
  // the event is only ever the four values
  globals.location = { hostname: 'beapromanager.github.io' };
  T.reached(2, 7);
  const e = T.readQueue()[0];
  if (!e || Object.keys(e).sort().join() !== 'a,k,s,t') fails.push(`a milestone carries more than the device, the sitting, the key and the time: ${e ? Object.keys(e) : 'none'}`);
  if (e && e.k !== 't2s7') fails.push(`a milestone is queued as "${e.k}", expected t2s7`);
  // let the post in the air settle, or the next section finds the in flight latch still held
  await new Promise(r => setTimeout(r, 0));

  globals.fetch = realFetch;
  if (realStorage === undefined) delete globals.localStorage; else globals.localStorage = realStorage;
  if (!hadLocation) delete globals.location; else globals.location = realLocation;
  console.log('  a real page queues each division once a sitting and a title, a machine queues nothing');
}

/* 4. AND WITH NOWHERE TO SEND IT, IT SENDS NOTHING.
      The state the game ships in until the worker is up. */
{
  checked += 2;
  const tele = readFileSync('src/game/telemetry.ts', 'utf8');
  if (!/export function track\(step: Step\): void \{\s*\n\s*if \(!endpoint\(\)\) return;/.test(tele)) {
    fails.push('with no endpoint the game still tries to count');
  }
  if (!/export async function flush\(\)[^]{0,120}if \(!endpoint\(\)[^]{0,30}\) return;/.test(tele)) {
    fails.push('with no endpoint the queue is still posted');
  }
  console.log(`  the endpoint is ${TELEMETRY_URL ? 'set, so the game counts' : 'empty, so the game counts nothing at all'}`);
}

/* 5. AND A MACHINE THAT IS NOT THE INTERNET IS NOT A PLAYER.
      The dev server and a local preview run the same code against the same
      address, so an hour spent walking a career to test a screen arrived as a
      person who had walked a career, and an error thrown on a laptop arrived
      as a crash on somebody else, twice over, because React runs an effect
      twice in development. This measures that both roads are shut: nothing is
      queued and nothing is posted. */
{
  checked += 12;
  const globals = globalThis as {
    location?: unknown; localStorage?: unknown; fetch?: unknown;
  };
  const hadLocation = 'location' in globals;
  const realLocation = globals.location;
  const realStorage = globals.localStorage;
  const realFetch = globals.fetch;
  const asHost = (hostname: string | null) => {
    if (hostname === null) delete globals.location;
    else globals.location = { hostname };
  };

  asHost(null);
  if (T.servedLocally()) fails.push('node, which is not a page at all, is read as a local page');
  for (const h of ['localhost', '127.0.0.1', '192.168.1.153', '10.0.0.7', 'itzik-mac.local']) {
    asHost(h);
    if (!T.servedLocally()) fails.push(`a page served from ${h} would be counted as a player`);
  }
  for (const h of ['beapromanager.github.io', 'beapro.co.il']) {
    asHost(h);
    if (T.servedLocally()) fails.push(`${h} is read as a machine, so real players would stop being counted`);
  }

  // and it is the queue and the wire that stop, not merely a flag
  const store = new Map<string, string>();
  globals.localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  };
  const posted: string[] = [];
  globals.fetch = async (url: unknown) => { posted.push(String(url)); return { ok: false }; };

  asHost('beapromanager.github.io');
  T.trackCrash(new Error('a crash on a real phone'), null);
  const queuedFromAPhone = T.readQueue().length;
  const postsFromAPhone = posted.length;
  // let that post settle, or the second one is refused by the in flight latch
  // rather than by the guard, and the assertion below could never fail
  await new Promise(r => setTimeout(r, 0));

  store.clear();
  asHost('localhost');
  T.trackCrash(new Error('the same crash, on the machine it was written on'), null);
  if (queuedFromAPhone === 0) fails.push('a real crash no longer queues, which is the opposite of the point');
  if (postsFromAPhone === 0) fails.push('a real crash no longer reaches the wire');
  if (T.readQueue().length !== 0) fails.push('a crash on the dev server still queues itself into the real numbers');
  if (posted.length !== postsFromAPhone) fails.push('the dev server still posts to the live worker');

  globals.fetch = realFetch;
  if (realStorage === undefined) delete globals.localStorage; else globals.localStorage = realStorage;
  if (!hadLocation) delete globals.location; else globals.location = realLocation;
  console.log('  localhost, a lan address and a .local name queue nothing and post nothing');
}

/* 5. THE QUEUE SURVIVES A BAD NETWORK WITHOUT GROWING FOREVER. */
{
  const e = (k: T.Step): T.Event => ({ a: 'x', s: 'y', k, t: 1 });
  let q: T.Event[] = [];
  for (let i = 0; i < T.QUEUE_CAP + 25; i++) q = T.enqueued(q, e('open'), T.QUEUE_CAP);
  checked += 2;
  if (q.length !== T.QUEUE_CAP) fails.push(`a phone offline for a month queues ${q.length} events, not ${T.QUEUE_CAP}`);
  // and it keeps the NEWEST, because a month old event is worth less
  const mixed = T.enqueued([e('open'), e('club')], e('season_2'), 2);
  if (mixed[mixed.length - 1].k !== 'season_2') fails.push('the queue drops the newest event instead of the oldest');
  console.log(`  an offline phone holds ${T.QUEUE_CAP} events and keeps the newest`);
}

/* 6. THE DASHBOARD POINTS AT THE CLIFF.
      The smallest bar is always the last one and says nothing; the number
      worth reading is the biggest single fall. */
{
  const drop = T.biggestDrop([
    { step: 'open', n: 100 }, { step: 'career_new', n: 90 },
    { step: 'archetype', n: 40 }, { step: 'manager', n: 38 },
  ]);
  checked += 2;
  if (drop?.from !== 'career_new' || drop?.to !== 'archetype') {
    fails.push(`the dashboard points at ${drop?.from} to ${drop?.to}, not at the cliff`);
  }
  if (T.biggestDrop([{ step: 'open', n: 0 }]) !== null) fails.push('an empty funnel invents a drop-off');
  console.log('  the dashboard names the biggest fall, not the smallest bar');
}

console.log('');
if (fails.length) {
  console.log(`FAIL (${fails.length} of ${checked})`);
  for (const f of fails) console.log(`  - ${f}`);
  process.exit(1);
}
console.log(`OK (${checked} checks), and nothing a player types can reach the wire`);
