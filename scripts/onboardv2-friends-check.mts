/**
 * Run:
 *   node --experimental-strip-types scripts/onboardv2-friends-check.mts
 *
 * The friends scene (Itzik, 2.11). A quick-started career kicks off match 1
 * WITHOUT the two from the לאומית; after that match (result -> press) the
 * phone is יוסי and דוד's, once, and only his answer decides whether they
 * sign. Points:
 *   1. squad before: nobody extra in match 1 (gs.friends empty, the XI and
 *      bench the same men quickStart picked), friendsScene 'due', and the
 *      phase after the press room is 'ob-friends'
 *   2. yes: two story friends, first names יוסי (CM) and דוד (ST), both in
 *      the starting XI, story contracts, squad within MAX_SQUAD; the week
 *      then ends as usual (sponsor on a career without one); mate_first_start
 *      is marked seen so it can never fire
 *   3. no: nobody added, squad unchanged, friendsScene 'declined', sponsor next;
 *      over a season no mate thread ever opens (there is no texter)
 *   4. once only: a second answer is a no-op, the scene never comes back in
 *      later weeks or later seasons, forcing the phase back changes nothing
 *   5. old saves never see it: a V2 save from before (friends already in,
 *      no friendsScene) and a classic V1 career both skip straight past it
 *   6. the save keeps 'ob-friends' across a reload (localStorage shim)
 *   7. the back button: 'ob-friends' is in back-check's PROTECTED list
 *   8. the words are Itzik's own, and the yes still is a registered, shown shot
 */
import { readFileSync } from 'node:fs';
import * as G from '../src/game/state.ts';
import { newGameV2, quickStart, answerFriends, addStoryFriends, STORY_FIRST_NAMES } from '../src/game/onboardV2.ts';
import { simulateMatch } from '../src/engine/matchEngine.ts';
import { DEFAULT_FORMATION } from '../src/data/formations.ts';
import { STORY_CONTRACT_YEARS } from '../src/game/friends.ts';

const fails: string[] = [];
let checked = 0;
const CITIES = ['חיפה', 'תל אביב', 'באר שבע', 'נצרת', 'אזור'];
const SEEDS = 12;

function play(gs: G.GameState): G.GameState {
  const inp = G.liveMatchInput(gs);
  const res = simulateMatch(
    { id: inp.homeId, name: inp.homeName, players: inp.iAmHome ? inp.playerStarters : inp.oppStarters,
      tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: true },
    { id: inp.awayId, name: inp.awayName, players: inp.iAmHome ? inp.oppStarters : inp.playerStarters,
      tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: false },
    inp.seed);
  return G.commitRound(gs, res);
}

/** teamsheet -> match -> result -> press room answered -> wherever the week goes next */
function playWeek(gs: G.GameState): G.GameState {
  gs = G.sendTeamsheet({ ...gs, phase: 'teamsheet' });
  gs = play(gs);
  gs = G.continueFromResult(gs);
  let guard = 0;
  while (gs.phase === 'press' && guard++ < 10) gs = G.answerPress(gs, 0);
  return gs;
}

/** back to a playable week from whatever the week's end left on screen */
function toTactic(gs: G.GameState): G.GameState {
  let guard = 0;
  while (gs.phase !== 'tactic' && guard++ < 30) {
    if (gs.phase === 'chat') gs = G.closeChat(gs);
    else if (gs.phase === 'sponsor') gs = G.takeSponsor(gs, 'base');
    else gs = { ...gs, phase: 'tactic', dilemma: null };   // hub, dilemmas and notices: straight to the next sheet
  }
  return gs;
}

const squadIds = (gs: G.GameState) => { const s = G.mySquad(gs); return [...s.starters, ...s.bench].map(p => p.id).sort(); };
const MAX_SQUAD_GUESS = 26;

let samples = 0;
for (const city of CITIES) {
  for (let s = 0; s < SEEDS; s++) {
    const seed = 410_000 + s * 7;
    const tag = `${city}/${seed}`;
    const start = quickStart(newGameV2(seed), city);
    samples++;

    /* 1. BEFORE */
    checked += 4;
    if (start.obV2?.friendsScene !== 'due') fails.push(`${tag}: friendsScene is "${start.obV2?.friendsScene}" after quickStart, expected "due"`);
    if (start.friends.length) fails.push(`${tag}: ${start.friends.length} friends in the squad for match 1, expected none`);
    if (start.obV2?.namesDue) fails.push(`${tag}: namesDue is set, the names card is gone`);
    const beforeIds = squadIds(start);
    const after1 = playWeek(start);
    if (after1.phase !== 'ob-friends') { fails.push(`${tag}: after match 1's press room the phase is "${after1.phase}", expected ob-friends`); continue; }
    checked += 2;
    if (after1.week !== 1 || after1.season !== 1) fails.push(`${tag}: the scene came on week ${after1.week}/season ${after1.season}, expected 1/1`);
    if (squadIds(after1).join() !== beforeIds.join()) fails.push(`${tag}: the squad changed between quickStart and the scene`);

    /* 2. YES */
    const yes = answerFriends(after1, true);
    checked += 9;
    if (yes.obV2?.friendsScene !== 'joined') fails.push(`${tag}: yes left friendsScene "${yes.obV2?.friendsScene}"`);
    if (yes.friends.length !== 2 || !yes.friends.every(f => f.story)) fails.push(`${tag}: yes brought ${yes.friends.length} friends (story: ${yes.friends.map(f => f.story)})`);
    const sq = G.mySquad(yes);
    const all = [...sq.starters, ...sq.bench];
    const men = yes.friends.map(f => all.find(p => p.id === f.id));
    if (men.some(m => !m)) fails.push(`${tag}: a friend is in gs.friends but not in the squad`);
    if (!yes.friends.every(f => sq.starters.some(p => p.id === f.id))) fails.push(`${tag}: the friends are not both in the starting XI`);
    const firsts = men.map(m => m?.name.split(' ')[0]).sort().join(',');
    if (firsts !== [...STORY_FIRST_NAMES].sort().join(',')) fails.push(`${tag}: friends are called ${men.map(m => m?.name).join(' / ')}, expected יוסי and דוד`);
    const yossi = men.find(m => m?.name.startsWith('יוסי '));
    const david = men.find(m => m?.name.startsWith('דוד '));
    if (yossi?.position !== 'CM' || david?.position !== 'ST') fails.push(`${tag}: יוסי is ${yossi?.position}, דוד is ${david?.position}, expected CM and ST`);
    if (!yes.friends.every(f => yes.contracts[f.id] === STORY_CONTRACT_YEARS)) fails.push(`${tag}: a friend's contract is not STORY_CONTRACT_YEARS`);
    if (all.length > MAX_SQUAD_GUESS) fails.push(`${tag}: squad of ${all.length} after yes`);
    if (!yes.mate.seen.includes('mate_first_start')) fails.push(`${tag}: mate_first_start is not marked seen after yes`);
    checked += 2;
    if (yes.phase !== 'sponsor') fails.push(`${tag}: after yes the phase is "${yes.phase}", expected sponsor (season 1, no sponsor yet)`);
    if (yes.week !== 2) fails.push(`${tag}: after yes the week is ${yes.week}, expected 2`);

    /* 3. NO */
    const no = answerFriends(after1, false);
    checked += 5;
    if (no.obV2?.friendsScene !== 'declined') fails.push(`${tag}: no left friendsScene "${no.obV2?.friendsScene}"`);
    if (no.friends.length) fails.push(`${tag}: no still brought ${no.friends.length} friends`);
    if (squadIds(no).join() !== beforeIds.join()) fails.push(`${tag}: no changed the squad`);
    if (no.phase !== 'sponsor') fails.push(`${tag}: after no the phase is "${no.phase}", expected sponsor`);
    if (no.week !== 2) fails.push(`${tag}: after no the week is ${no.week}, expected 2`);

    /* 4. ONCE ONLY */
    checked += 4;
    if (answerFriends(yes, false) !== yes) fails.push(`${tag}: a second answer after yes changed the state`);
    if (answerFriends(no, true) !== no) fails.push(`${tag}: a second answer after no changed the state`);
    const forced = { ...no, phase: 'ob-friends' as const, week: 1 };
    const forcedOut = answerFriends(forced, true);
    if (forcedOut.friends.length) fails.push(`${tag}: forcing the phase back after no let them sign`);
    const forcedYes = answerFriends({ ...yes, phase: 'ob-friends' as const, week: 1 }, true);
    if (forcedYes.friends.length !== 2) fails.push(`${tag}: forcing the phase back after yes signed them twice (${forcedYes.friends.length})`);

    // and a few weeks on, on one sample per city: it never comes back, and on no nobody ever texts
    if (s === 0) {
      for (const [label, g0] of [['yes', yes], ['no', no]] as const) {
        let g = toTactic(g0);
        for (let w = 0; w < 6 && g.phase === 'tactic'; w++) {
          g = playWeek(g);
          checked += 2;
          if (g.phase === 'ob-friends') { fails.push(`${tag}/${label}: the scene came back on week ${g.week}`); break; }
          if (label === 'no' && g.chatAnswers) fails.push(`${tag}/no: a friend's thread opened on week ${g.week}`);
          if (label === 'no' && g.friends.length) fails.push(`${tag}/no: friends appeared on week ${g.week}`);
          if (g.chatAnswers?.trigger === 'mate_first_start') fails.push(`${tag}/${label}: mate_first_start fired on week ${g.week}`);
          g = toTactic(g);
        }
        if (label === 'no') { checked++; if (g.mate.seen.length) fails.push(`${tag}/no: mate threads seen ${g.mate.seen.join(',')} without any friend`); }
      }
    }
  }
}
console.log(`  ${samples} quick-started careers: no friends in match 1, the scene after its press room, yes signs יוסי (CM) + דוד (ST) into the XI, no signs nobody, once only`);

/* 5. OLD SAVES NEVER SEE IT */
{
  // a V2 career started before 2.11: friends already in, no friendsScene at all
  for (const city of CITIES) {
    let old = addStoryFriends(quickStart(newGameV2(520_001), city));
    const { friendsScene: _drop, ...ob } = old.obV2!;
    old = { ...old, obV2: ob };
    const after = playWeek(old);
    checked += 2;
    if (after.phase === 'ob-friends') fails.push(`${city}: a pre-2.11 V2 save was shown the friends scene`);
    if (after.friends.length !== 2) fails.push(`${city}: a pre-2.11 V2 save lost its friends (${after.friends.length})`);
  }
  // a classic V1 career, no obV2
  let v1 = G.newGame(520_002);
  checked += 1;
  if (v1.obV2) fails.push('newGame carries an obV2 block');
  v1 = { ...v1, phase: 'ob-friends' };
  checked += 2;
  if (G.obFriendsDue(v1)) fails.push('obFriendsDue is true for a V1 career');
  if (answerFriends(v1, true) !== v1) fails.push('answerFriends moved a V1 career');
  console.log('  pre-2.11 V2 saves and V1 careers never reach the scene');
}

/* 6. A RELOAD KEEPS THE SCENE */
{
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); }, clear: () => store.clear(), key: () => null, length: 0,
  };
  const { saveCareer, loadCareer } = await import('../src/game/save.ts');
  const at = playWeek(quickStart(newGameV2(530_001), 'חיפה'));
  saveCareer(at);
  const back = loadCareer();
  checked += 3;
  if (!back) fails.push('a career on the friends scene did not save/load');
  else {
    if (back.phase !== 'ob-friends') fails.push(`reloaded on the scene, came back on "${back.phase}"`);
    if (!G.obFriendsDue(back)) fails.push('reloaded on the scene, it is no longer due');
  }
  console.log('  a reload on the scene comes back to the scene, still due');
}

/* 7. THE BACK BUTTON */
{
  const bc = readFileSync(new URL('./back-check.mts', import.meta.url), 'utf8');
  const prot = /const PROTECTED = \[([\s\S]*?)\]/.exec(bc)?.[1] ?? '';
  checked++;
  if (!/'ob-friends'/.test(prot)) fails.push("'ob-friends' is not in back-check's PROTECTED list");
  const app = readFileSync(new URL('../src/ui/App.tsx', import.meta.url), 'utf8');
  const hubList = /const BACK_TO_HUB = new Set<G\.Phase>\(\[([\s\S]*?)\]\)/.exec(app)?.[1] ?? '';
  checked++;
  if (/'ob-friends'/.test(hubList)) fails.push("'ob-friends' can be backed out of to the hub");
  console.log('  the back button cannot skip it');
}

/* 8. THE WORDS AND THE STILL */
{
  const ui = readFileSync(new URL('../src/ui/screens/onboard/ObFriends.tsx', import.meta.url), 'utf8');
  const MUST = [
    'אני חייב להגיד לך, מאז שאתה לא בקבוצה החברים מבואסים.', 'אני ודוד החלטנו שאנחנו אחריך.',
    'איזה גברים, מה אתם רוצים לעשות?', 'אתם חסרים לי בחדר ההלבשה, הלוואי הייתם יכולים להצטרף.',
    'תקשיב, אני עוזב עכשיו את הליגה הלאומית ומצטרף אליך לקבוצה בליגה ג׳.', 'וואלה גם אני.',
    'מוותר על המשכורת שלי.', 'גם אני. יאללה בוא נעלה אותם ליגה.',
    'שמעו, ריגשתם. יאללה, תחתמו.', 'לא נראה לי שזה אפשרי בשלב הזה.',
    'מה שתגיד, שיהיה בהצלחה, אנחנו ממשיכים בלאומית.', 'באסה, שיהיה לך בהצלחה.',
    "shot=\"s13-friends-join\"",
  ];
  for (const m of MUST) { checked++; if (!ui.includes(m)) fails.push(`ObFriends.tsx is missing: ${m}`); }
  const shots = readFileSync(new URL('../src/ui/onboard/shots.ts', import.meta.url), 'utf8');
  checked++;
  if (!/'s13-friends-join':\s*\{[^}]*s13-friends-join\.v\d+\.webp/.test(shots)) fails.push('s13-friends-join is not registered with a versioned webp');
  const arrive = readFileSync(new URL('../src/ui/screens/onboard/ObArrive.tsx', import.meta.url), 'utf8');
  checked++;
  if (/לא נשארו שם בלעדיך/.test(arrive)) fails.push('ObArrive still says the two followed him down');
  console.log(`  every line of Itzik's script is on the screen, and the yes still is registered`);
}

if (fails.length) {
  console.error(`\nFAIL — ${fails.length} problem(s) out of ${checked} checks:`);
  for (const f of fails.slice(0, 40)) console.error('  - ' + f);
  process.exit(1);
}
console.log(`\nPASS — ${checked} checks.`);
