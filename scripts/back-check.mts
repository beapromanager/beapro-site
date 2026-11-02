/**
 * The phone's back button.
 *   node --experimental-strip-types scripts/back-check.mts
 *
 * On Android, back is how people navigate everything, and in here it threw them
 * straight out of the game. Every tester read it as a crash.
 *
 * The failure mode this guards against is not the wiring breaking — it is the
 * wiring going stale. Somebody adds a screen with a back arrow next month, the
 * arrow works, and the phone's own button silently does something else on that
 * screen and nobody notices for a season. So this reads the App and insists the
 * two ways out agree with each other, screen by screen.
 */
import { readFileSync } from 'node:fs';

const fails: string[] = [];
let checked = 0;

const app = readFileSync('src/ui/App.tsx', 'utf8');
const back = readFileSync('src/ui/back.ts', 'utf8');

/* 1. IT IS ACTUALLY ARMED.
      Without a spare history entry in front of us there is nothing for a back
      press to consume, popstate never fires, and the whole thing is decoration. */
{
  checked += 4;
  if (!/history\.pushState/.test(back)) fails.push('back.ts never pushes a history entry, so a back press just leaves the page');
  if (!/addEventListener\('popstate'/.test(back)) fails.push('back.ts never listens for popstate');
  if (!/function onPop[\s\S]{0,200}pushSpare\(\)/.test(back)) {
    fails.push('a consumed history entry is not replaced, so back works exactly once and then leaves');
  }
  if (!/armBack\(\)/.test(app)) fails.push('App never arms the back button');
}

/* 2. EVERY SCREEN WITH A BACK ARROW ANSWERS THE PHONE'S BUTTON TOO.
      This is the one that goes stale. A screen shipped with onBack and left out
      of the handler looks finished and is not: the arrow works, the phone's
      button opens the leave-the-game question instead, on a screen that plainly
      has somewhere to go back to. */
{
  // Only the render half of the file. The handler tests gs.phase too, and
  // reading from the top of the file found the handler's own lines instead of
  // the JSX — which made this look like it was checking six screens when there
  // are twice that many.
  const anchor = app.indexOf('}, [booted, gs.phase');
  if (anchor < 0) fails.push('cannot find the end of the back handler, this check is guessing');
  const render = app.slice(anchor);

  const rendered = new Set<string>();
  for (const m of render.matchAll(/gs\.phase === '([a-z-]+)'/g)) rendered.add(m[1]);

  const withArrow = new Set<string>();
  for (const phase of rendered) {
    // the JSX block for this phase, up to wherever the next phase is tested
    const at = render.indexOf(`gs.phase === '${phase}'`);
    const next = render.indexOf("gs.phase === '", at + 20);
    const block = render.slice(at, next < 0 ? render.length : next);
    if (/onBack=/.test(block)) withArrow.add(phase);
  }
  checked++;
  if (withArrow.size < 10) {
    fails.push(`only ${withArrow.size} screens were found to have a back arrow, so this check is reading the wrong part of the file`);
  }

  // what the hardware handler knows about
  const hStart = app.indexOf('setBackHandler(() => {');
  const handler = app.slice(hStart, app.indexOf('}, [booted', hStart));
  const hubList = /const BACK_TO_HUB = new Set<G\.Phase>\(\[([\s\S]*?)\]\)/.exec(app)?.[1] ?? '';
  const toHub = new Set([...hubList.matchAll(/'([a-z-]+)'/g)].map(m => m[1]));

  for (const phase of withArrow) {
    checked++;
    const named = new RegExp(`gs\\.phase === '${phase}'`).test(handler);
    if (!named && !toHub.has(phase)) {
      fails.push(`the "${phase}" screen has a back arrow, but the phone's back button does not know about it`);
    }
  }
  console.log(`  ${withArrow.size} screens have a back arrow, and every one of them answers the phone's button`);
}

/* 3. AND THE MOMENTS THAT MUST BE ANSWERED HAVE NO BACK AT ALL.
      A match, the press room, a dilemma, a sacking. Letting a stray thumb walk
      out of one of those loses the answer the manager was asked for, which is
      worse than the bug this whole file is about. */
{
  const PROTECTED = ['match', 'press', 'dilemma', 'tactic', 'result',
    'season-end', 'sacked', 'rescue', 'kit', 'sponsor', 'ultimatum', 'chat',
    'signing', 'preseason', 'preseason-market', 'youth-decision',
    // the friends' question after match 1 (2.11): shown once, so a stray back must not skip it
    'ob-friends'];
  const hStart = app.indexOf('setBackHandler(() => {');
  const handler = app.slice(hStart, app.indexOf('}, [booted', hStart));
  const hubList = /const BACK_TO_HUB = new Set<G\.Phase>\(\[([\s\S]*?)\]\)/.exec(app)?.[1] ?? '';

  for (const phase of PROTECTED) {
    checked++;
    if (new RegExp(`'${phase}'`).test(hubList)) {
      fails.push(`"${phase}" can be backed out of to the hub, and it is a moment that has to be answered`);
    }
    if (new RegExp(`gs\\.phase === '${phase}'`).test(handler)) {
      fails.push(`the back handler has a route out of "${phase}", which must not be interruptible`);
    }
  }
  console.log(`  ${PROTECTED.length} moments that must be answered have no way back out of them`);
}

/* 4. AND WHEN THERE IS NOWHERE TO GO, IT ASKS.
      The whole complaint was the game vanishing without a word. */
{
  checked += 3;
  if (!/setExitOpen\(true\)/.test(app)) fails.push('with nowhere left to go the back button does nothing at all');
  if (!/ExitSheet/.test(app)) fails.push('there is no leave-the-game question wired up');
  if (!/leaveGame\(\)/.test(app)) fails.push('the leave-the-game question cannot actually let him leave');
}

/* 5. THE SHEETS CLOSE FIRST.
      A sheet sitting over the hub is the thing on screen, so back has to shut it
      rather than reach past it and ask about leaving the game. */
{
  const hStart = app.indexOf('setBackHandler(() => {');
  const handler = app.slice(hStart, app.indexOf('}, [booted', hStart));
  for (const sheet of ['exitOpen', 'installOpen']) {
    checked++;
    if (!new RegExp(`if \\(${sheet}\\)`).test(handler)) {
      fails.push(`back reaches straight past the ${sheet} sheet instead of closing it`);
    }
    // and it must be handled before the fall-through that asks about leaving
    if (handler.indexOf(sheet) > handler.indexOf('setExitOpen(true)')) {
      fails.push(`the ${sheet} sheet is checked after the leave question, so back asks about leaving with a sheet open`);
    }
  }
}

/* 5. AND THE WAY OUT IS AT THE TOP OF EVERY ROOM THE HUB OPENS.
      The squad screen had its only back button under eighteen names, and no
      meters bar above them, when every other room from the hub had both. A
      screen the phone's button knows about must also show a way out where a
      thumb looks for it, on the first visit excepted: that one has no hub yet. */
{
  const hubList = /const BACK_TO_HUB = new Set<G\.Phase>\(\[([\s\S]*?)\]\)/.exec(app)?.[1] ?? '';
  const rooms = [...hubList.matchAll(/'([a-z-]+)'/g)].map(m => m[1]);
  const FILE: Record<string, string> = {
    squad: 'Squad', youth: 'Youth', stadium: 'Stadium', coach: 'Coach', packs: 'Packs',
    captain: 'Captain', assistant: 'Assistant', transfers: 'Transfers', inbox: 'Inbox',
    chronicle: 'Chronicle', table: 'Standings', scout: 'Scout', 'euro-bracket': 'EuroBracket', 'cup-bracket': 'CupBracket',
  };
  checked++;
  if (rooms.length < 6) fails.push(`only ${rooms.length} rooms lead back to the hub, this check is reading the wrong list`);
  for (const room of [...rooms, 'transfers', 'inbox', 'chronicle', 'table']) {
    const file = FILE[room];
    checked++;
    if (!file) { fails.push(`no screen file is known for the "${room}" room`); continue; }
    const src = readFileSync(`src/ui/screens/${file}.tsx`, 'utf8');
    if (!/<TopBack\b/.test(src)) fails.push(`the "${room}" screen has no back at the top, only wherever the bottom is`);
    // the meters ride on every room too. Two keep their own top by design:
    // the packs screen shows the gems large, the table is one full list
    if (!['packs', 'table'].includes(room) && !/<Meters\b/.test(src)) fails.push(`the "${room}" screen has no meters bar, every other room from the hub has one`);
  }
  console.log(`  ${rooms.length + 4} rooms opened from the hub show their way out at the top`);
}

/* 6. AND THAT WAY OUT IS NOT ITSELF INSIDE SOMETHING THAT SCROLLS.
      Reported from an iPhone, season one, round four: no way back to the hub
      short of closing the game and opening it again.

      The squad screen opens on the pitch, and the pitch view is a column
      exactly as tall as the window with one scroller inside it. The way out
      sat in that scroller, so it left the screen the moment a thumb reached
      down for the bench, and nothing brought it back: scrollToTop resets the
      page, which is not the element that moved. The pitch view has no bottom
      button behind it either. In a browser tab the phone's own gesture covered
      for all of this. Added to a home screen there is no gesture and no
      hardware button, and back.ts never hears a thing.

      Checking that the file merely CONTAINS a back button, which is what the
      section above does, cannot see any of that. This one reads the order. */
{
  const before = fails.length;
  const squad = readFileSync('src/ui/screens/Squad.tsx', 'utf8');
  const scroller = squad.indexOf("'squad-scroll'");
  const topBack = squad.indexOf('<TopBack');
  checked += 3;
  if (scroller < 0) {
    fails.push('the squad screen has no squad-scroll column, so this check is reading the wrong file');
  } else if (topBack < 0) {
    fails.push('the squad screen has no TopBack at all');
  } else if (topBack > scroller) {
    fails.push('the squad screen keeps its only way out inside the scrolling column, where a thumb reaching for the bench scrolls it off the screen');
  }
  // and the bench, which is what people scroll down to reach, stays outside it
  if (!readFileSync('src/ui/tokens.css', 'utf8').includes('.squad-fit .bench-bar{flex:none')) {
    fails.push('the bench no longer rides outside the scroller, so the scroll distance this is about has changed');
  }
  // said only when it is true: a line claiming the very thing that just failed
  // is worse than no line at all
  if (fails.length === before) {
    console.log('  the squad screen shows its way out above the part that scrolls');
  }
}

console.log(`\n${checked} checks`);
console.log(fails.length ? '\n  ' + fails.slice(0, 8).join('\n  ') + '\nFAIL'
  : '\nOK, back means back, and leaving the game is asked for rather than assumed');
process.exit(fails.length ? 1 : 0);
