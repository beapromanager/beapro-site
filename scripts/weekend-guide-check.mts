/**
 * The words that explain the neighbourhood league are the league's own rules, read off the code (Itzik, 25.10).
 *
 *   1. every number in the texts is a constant of weekendCore (or the duel's clock); nothing typed by hand
 *   2. no text promises a draw or playing whenever you like (apart from the question "יש תיקו?" and its "no")
 *   3. the open league's hours in the words are the ones in the code
 *   4. the opener's steps are right for every size six to twelve
 *   5. the when line through whole weekends in three weeks: 25.10.2026 (the clock change), 18.10.2026 and 21.3.2027
 *      (the spring change), at the hour before registration, Thursday 17:00, Thursday 20:00 to 20:05, a bye, Sunday 20:00
 *   6. the first weekend ever: from Monday 2.11 20:00 and on the Tuesday the line says "חמישי 5.11 17:00 · ... חמישי 5.11 20:00"; from 8.11 it is ordinary
 *   7. the intro is shown once (a fake store), and never throws without one
 *   8. every line on a card is short enough for a phone
 *   9. the screens wire it: the help button, the sheet, the steps, the filling card, the cancel words, the when line
 * Run: npm run check:weekendguide
 */
import * as W from '../src/game/weekendCore.ts';
import * as G from '../src/game/weekendGuide.ts';
import { MINUTE_MS, DECISION_MS } from '../src/game/duel.ts';
import { readFileSync } from 'node:fs';

const fails: string[] = [];
let checked = 0;
const claim = (ok: boolean, msg: string) => { checked++; if (!ok) fails.push(msg); };
const Z = (y: number, m: number, d: number, hh: number, mm = 0) => Date.UTC(y, m - 1, d, hh, mm);

const allTexts = (now: number): string[] => [
  ...G.introCards(now).flatMap(c => [c.kick, c.title, ...c.lines, c.foot]),
  ...G.faq(now).flatMap(f => [f.q, f.a]),
  ...[6, 7, 8, 9, 10, 11, 12].flatMap(n => { const a = G.adminSteps(n); return [a.title, ...a.steps, a.note]; }),
  ...[0, 3, 5, 6, 9].flatMap(n => (['friends', 'open'] as const).flatMap(k => [true, false].flatMap(o => { const c = G.fillingCard(n, o, k); return [c.title, c.head, ...c.lines]; }))),
  G.CANCEL_TEXT.lead, G.CANCEL_TEXT.rest, G.COPY_WORDS, G.COPIED_WORDS,
];

/* 1. every number is a constant */
{
  const allowed = new Set<number>([
    W.MIN_MEMBERS, W.MAX_MEMBERS, W.SQUAD_SIZE, W.SQUAD_AVG, W.PACK_EVERY, W.PACK_OVR, W.ASSISTANT_MAX, W.TECH_LOSS[0], W.TECH_LOSS[1], W.CODE_LEN, W.POINTS_WIN,
    W.GEMS_BY_PLACE[1], W.GEMS_BY_PLACE[2], W.GEMS_BY_PLACE[3], W.GEMS_FINISHED,
    Math.round(W.READY_MS / 60_000), Math.round(DECISION_MS / 1000), Math.ceil(90 * MINUTE_MS / 60_000), Math.ceil(90 * MINUTE_MS / 60_000) + 2,
    0,   // "הפסד 0"
    ...W.SLOT_GRID.map(s => s.hh), 17, 20,   // the hours of the week, as hh:00
    ...[6, 7, 8, 9, 10, 11, 12].flatMap(n => [n, W.slotsNeeded(n), W.MIN_MEMBERS - n]).filter(x => x >= 0),
  ]);
  // the hours "20:00" and "17:00" are allowed as hh:mm; a bare number must be a constant
  const now = Z(2026, 11, 10, 10);
  for (const t of allTexts(now)) {
    const stripped = t.replace(/\d{1,2}:\d{2}/g, ' ').replace(/\d{1,2}\.\d{1,2}/g, ' ');
    for (const m of stripped.match(/\d+/g) ?? []) claim(allowed.has(Number(m)), `the number ${m} in "${t.slice(0, 60)}" is not a constant of the league`);
    for (const h of t.match(/\d{1,2}:\d{2}/g) ?? []) claim(['20:00', '17:00', ...W.SLOT_GRID.map(s => `${String(s.hh).padStart(2, '0')}:00`)].includes(h), `the hour ${h} in "${t.slice(0, 60)}" is not an hour of the week`);
  }
  // the words move with the constants: the prize line says what settle pays
  const faq = G.faq(now).find(f => f.q === 'מה הפרס?')!;
  claim(faq.a.startsWith(`אלוף: ${G.wageWords(W.PRIZE_BY_PLACE[1])} ${G.and(G.gemWords(W.GEMS_BY_PLACE[1]))}.`), `the prize answer does not start with the champion's prize: ${faq.a.slice(0, 50)}`);
  claim(G.and('יהלום') === 'ויהלום' && G.and('3 יהלומים') === 'ו-3 יהלומים' && G.and('2 יהלומים') === 'ו-2 יהלומים', 'the Hebrew "and" is wrong');
  claim(G.gemWords(1) === 'יהלום' && G.gemWords(3) === '3 יהלומים', 'gem words');
  claim(G.wageWords(1.5) === 'מחזור שכר וחצי' && G.wageWords(0.75) === 'שלושה רבעים ממחזור שכר' && G.wageWords(0.5) === 'חצי מחזור שכר' && G.wageWords(0.25) === 'רבע מחזור שכר', 'wage words');
  claim(G.INTRO.length === 4 && G.FAQ.length === 13, `${G.INTRO.length} cards and ${G.FAQ.length} questions, wanted 4 and 13`);
  claim(G.INTRO.map(c => c.art).join() === '/weekend/entrance.webp,/weekend/fence.webp,/weekend/oneonone.webp,/weekend/win.webp', 'the cards\' pictures');
  claim(G.INTRO[2].foot === `לא הספקת? העוזר משחק במקומך, עד ${W.ASSISTANT_MAX} פעמים. בפעם השלישית, הפסד טכני ${W.TECH_LOSS[0]}:${W.TECH_LOSS[1]}.`, `card 3 foot: ${G.INTRO[2].foot}`);
  claim(G.INTRO[3].lines[2] === 'בראשון 20:00 הטבלה נסגרת. האלוף לוקח לקריירה מחזור שכר וחצי ו-3 יהלומים.', `card 4 line 3: ${G.INTRO[3].lines[2]}`);
  claim(G.INTRO[1].foot === 'ההרשמה מראשון 20:00 עד חמישי 17:00. צריך לפחות 6 בליגה, אחרת היא לא יוצאת לדרך.', `card 2 foot: ${G.INTRO[1].foot}`);
  claim(G.CANCEL_TEXT.lead === 'לא הגעתם לשישה, אז הליגה לא יצאה לדרך.' && G.CANCEL_TEXT.rest === 'ההרשמה הבאה נפתחת בראשון 20:00. אפשר לנסות שוב עם החבר׳ה, או להיכנס לליגה הפתוחה.', 'the cancel words');
}

/* 2. no promise of a draw or of playing whenever */
{
  const now = Z(2026, 11, 10, 10);
  for (const t of allTexts(now)) {
    if (t === 'יש תיקו?') continue;
    claim(!/יש תיקו(?!\?)|אפשר תיקו|תיקו אפשרי/.test(t), `a text promises a draw: "${t.slice(0, 60)}"`);
    if (t === 'אפשר לשחק מתי שבא לי?') continue;
    claim(!/מתי שבא ל|בכל שעה שתרצה|מתי שתרצה/.test(t), `a text promises playing whenever: "${t.slice(0, 60)}"`);
  }
  const draw = G.FAQ.find(f => f.q === 'יש תיקו?')!;
  claim(draw.a.startsWith('אין.'), 'the draw question is not answered "no"');
  const whenever = G.FAQ.find(f => f.q === 'אפשר לשחק מתי שבא לי?')!;
  claim(whenever.a.startsWith('לא.'), 'the whenever question is not answered "no"');
}

/* 3. the open league's hours */
{
  const words = G.openSlotsWords();
  claim(words === 'חמישי 20:00, שישי 12:00 ו-14:00, שבת 20:00, ראשון 20:00', `the open league's hours read "${words}"`);
  const expectKeys = [W.KICKOFF_KEY, ...W.OPEN_SLOTS, W.FINAL_KEY];
  claim(expectKeys.length === 5 && W.OPEN_SLOTS.join() === 'fri-12,fri-14,sat-20', 'OPEN_SLOTS moved; the words above would be wrong');
  claim(G.FAQ.find(f => f.q === 'מתי המשחקים?')!.a.includes(words), 'the questions do not carry the open league\'s hours');
}

/* 4. the opener's steps */
{
  for (let n = W.MIN_MEMBERS; n <= W.MAX_MEMBERS; n++) {
    const a = G.adminSteps(n);
    claim(a.steps.length === 5 && a.title === 'פותח ליגה? ככה זה הולך', `size ${n}: ${a.steps.length} steps`);
    claim(a.steps[1].includes(`עם ${n} חברים בוחרים עוד ${W.slotsNeeded(n)} שעות`), `size ${n}: step 2 reads ${a.steps[1]}`);
    claim(a.note.startsWith('שים לב:'), `size ${n}: no note`);
  }
  claim(G.adminSteps(8).steps[1].includes('עוד 5 שעות') && G.adminSteps(9).steps[1].includes('עוד 7 שעות'), '8 and 9 do not give 5 and 7');
  claim(G.adminSteps(1).steps[1].includes(`עם ${W.MIN_MEMBERS} חברים`) && G.adminSteps(99).steps[1].includes(`עם ${W.MAX_MEMBERS} חברים`), 'a size off the range is not clamped');
  const f = G.fillingCard(3, true, 'friends');
  claim(f.title === 'אתה המנהל. מה עכשיו?' && f.head === '3 בפנים. חסרים עוד 3 עד חמישי 17:00.' && f.lines[0] === 'שלח את הקוד לחבר׳ה. ההודעה המוכנה למטה.', `the opener's filling card: ${JSON.stringify(f)}`);
  claim(G.fillingCard(6, false, 'friends').head === '6 בפנים. יש מספיק, הליגה יוצאת לדרך.' && G.fillingCard(6, false, 'friends').title === 'מחכים לחבר׳ה', 'a friend\'s filling card');
  claim(G.fillingCard(4, false, 'open').title === 'הליגה הפתוחה מתמלאת' && G.fillingCard(4, false, 'open').lines[0] === 'היא מתמלאת לבד, ונסגרת כשיש 6.', 'the open league\'s filling card');
}

/* 5. the when line through whole weekends */
{
  const sunday = (y: number, m: number, d: number) => W.ilAt(y, m, d, 20);
  const weeks: Array<[number, number, number, string]> = [[2026, 10, 18, 'the 18.10 cycle'], [2026, 10, 25, 'the 25.10 cycle (clock change)'], [2027, 3, 21, 'the 21.3.2027 cycle (spring change)']];
  for (const [y, m, d, label] of weeks) {
    const opens = sunday(y, m, d);
    const c = W.regularCycleOf(opens + 1);
    claim(c.opens === opens, `${label}: does not open on Sunday 20:00`);
    const L0 = (status: W.LeagueStatus, extra: Partial<G.WhenInput> = {}): G.WhenInput => ({ status, cycle: c, current: null, mine: null, me: { nick: 'איציק' }, rounds: [], ...extra });
    // the hour before registration: the previous weekend is still playing (no league of mine)
    const hourBefore = opens - 3_600_000;
    const gate = W.registrationGate(hourBefore);
    if (!gate) claim(G.whenLine(null, hourBefore).text === 'הסופ״ש כבר בעיצומו · ההרשמה הבאה נפתחת ראשון 20:00', `${label}, the hour before: ${G.whenLine(null, hourBefore).text}`);
    // registration open, Monday noon
    const mon = opens + 16 * 3_600_000;
    if (!W.registrationGate(mon)) {
      claim(G.whenLine(null, mon).text === `ההרשמה פתוחה עד חמישי ${W.ilParts(c.locks).d}.${W.ilParts(c.locks).m} 17:00 · שורקים חמישי ${W.ilParts(c.kickoff).d}.${W.ilParts(c.kickoff).m} 20:00` || G.whenLine(null, mon).text === 'ההרשמה פתוחה עד חמישי 17:00 · שורקים חמישי 20:00', `${label}, Monday: ${G.whenLine(null, mon).text}`);
      claim(G.whenLine(L0('open'), mon).text === G.whenLine(null, mon).text, `${label}, Monday with an open league differs`);
    }
    // Thursday 16:00: today
    const thu16 = c.locks - 3_600_000;
    claim(G.whenLine(L0('open'), thu16).text === 'ההרשמה פתוחה עד היום 17:00 · שורקים היום 20:00', `${label}, Thursday 16:00: ${G.whenLine(L0('open'), thu16).text}`);
    // Thursday 17:00: locked
    claim(G.whenLine(L0('locked'), c.locks).text === 'הסגלים מוכנים · המחזור הראשון היום 20:00' && !G.whenLine(L0('locked'), c.locks).hot, `${label}, Thursday 17:00: ${G.whenLine(L0('locked'), c.locks).text}`);
    // without a league the line reads the calendar, which before the first registration ever is the gate's own words
    if (!W.registrationGate(c.locks)) claim(G.whenLine(null, c.locks).text === 'ההרשמה נסגרה · המחזור הראשון היום 20:00', `${label}, Thursday 17:00 without a league: ${G.whenLine(null, c.locks).text}`);
    else claim(G.whenLine(null, c.locks).text === W.registrationGate(c.locks), `${label}, Thursday 17:00 before the first registration: ${G.whenLine(null, c.locks).text}`);
    // Thursday 19:00: my first match tonight
    const cur = { index: 0, at: c.kickoff, startsAt: c.kickoff + W.READY_MS };
    const playing = (extra: Partial<G.WhenInput>) => L0('playing', { current: cur, rounds: [{ index: 0, bye: null, matches: [{ mine: true, result: null }] }], ...extra });
    const mine = { matchId: 'm', opponent: 'דודו', result: null };
    claim(G.whenLine(playing({ mine }), c.kickoff - 3_600_000).text === 'המשחק הבא שלך היום 20:00 · מול דודו', `${label}, 19:00: ${G.whenLine(playing({ mine }), c.kickoff - 3_600_000).text}`);
    // Thursday 20:00 to 20:05: hot, press ready
    for (const t of [c.kickoff, c.kickoff + 2 * 60_000, c.kickoff + W.READY_MS - 1]) {
      const w = G.whenLine(playing({ mine }), t);
      claim(w.hot && w.text === 'המחזור עכשיו! לחץ ׳מוכן?׳ · שורקים ב-20:05', `${label}, ${new Date(t).toISOString()}: ${JSON.stringify(w)}`);
    }
    // 20:05: live
    const live = G.whenLine(playing({ mine }), c.kickoff + W.READY_MS);
    claim(live.hot && live.text === 'המשחק שלך חי עכשיו · מול דודו', `${label}, 20:05: ${JSON.stringify(live)}`);
    // my match done, the rest still going
    const doneMine = { ...mine, result: { score: [2, 1] as [number, number], shootout: null, winner: 'home' as const, homeAssistant: false, awayAssistant: false, technical: null } };
    claim(G.whenLine(playing({ mine: doneMine }), c.kickoff + 10 * 60_000).text === 'סיימת את המחזור · מחכים לשאר המשחקים', `${label}, done: ${G.whenLine(playing({ mine: doneMine }), c.kickoff + 10 * 60_000).text}`);
    // a bye: before and during
    const bye = L0('playing', { current: cur, mine: null, rounds: [{ index: 0, bye: 'איציק', matches: [{ mine: false, result: null }] }] });
    claim(G.whenLine(bye, c.kickoff - 3_600_000).text === 'במחזור של היום 20:00 אתה נח', `${label}, bye before: ${G.whenLine(bye, c.kickoff - 3_600_000).text}`);
    claim(G.whenLine(bye, c.kickoff + 60_000).text === 'במחזור הזה אתה נח · אפשר לצפות בטבלה' && !G.whenLine(bye, c.kickoff + 60_000).hot, `${label}, bye during: ${G.whenLine(bye, c.kickoff + 60_000).text}`);
    // everything played, the table closing
    claim(G.whenLine(L0('playing', { current: null }), c.final + 60_000).text === 'כל המשחקים שוחקו · הטבלה נסגרת', `${label}, all played`);
    // Sunday 20:00: done
    claim(G.whenLine(L0('done'), c.final + 60_000).text === 'הסופ״ש נגמר · ההרשמה לסופ״ש הבא כבר פתוחה', `${label}, Sunday 20:00 done: ${G.whenLine(L0('done'), c.final + 60_000).text}`);
    claim(G.whenLine(L0('cancelled'), c.locks + 60_000).text === `הליגה לא יצאה לדרך · ההרשמה הבאה ראשון ${W.ilParts(c.final).d}.${W.ilParts(c.final).m} 20:00` || G.whenLine(L0('cancelled'), c.locks + 60_000).text === 'הליגה לא יצאה לדרך · ההרשמה הבאה ראשון 20:00', `${label}, cancelled: ${G.whenLine(L0('cancelled'), c.locks + 60_000).text}`);
    // the phone's zone does not matter: the same instants give the same words whatever TZ node runs in (ilWhen uses Asia/Jerusalem)
    claim(G.ilWhen(c.kickoff, c.kickoff - 60_000) === 'היום 20:00' && G.ilWhen(c.kickoff, c.kickoff - 86_400_000) === 'מחר 20:00', `${label}: today/tomorrow`);
  }
  // ilWhen's date rule: six days or more away, or the same weekday but not today
  const thu = Z(2026, 10, 29, 18);
  claim(G.ilWhen(Z(2026, 11, 5, 15), thu) === 'חמישי 5.11 17:00', `a week ahead: ${G.ilWhen(Z(2026, 11, 5, 15), thu)}`);
  claim(G.ilWhen(Z(2026, 11, 3, 10), thu) === 'שלישי 12:00', `five days ahead: ${G.ilWhen(Z(2026, 11, 3, 10), thu)}`);
  claim(G.ilWhen(Z(2026, 11, 4, 10), thu) === 'רביעי 4.11 12:00', `six days ahead: ${G.ilWhen(Z(2026, 11, 4, 10), thu)}`);
  claim(G.ilWhen(Z(2026, 10, 30, 6), thu) === 'מחר 08:00', `tomorrow: ${G.ilWhen(Z(2026, 10, 30, 6), thu)}`);
  // the spring change: 26.3.2027 02:00 the clocks go forward; Friday 25.3 23:30 Israel to Saturday 26.3 is "tomorrow"
  const fri = Z(2027, 3, 25, 21, 30);   // Friday 25.3.2027 23:30 Israel (winter, UTC+2)
  claim(G.ilWhen(Z(2027, 3, 26, 17), fri) === 'מחר 20:00', `across the spring change: ${G.ilWhen(Z(2027, 3, 26, 17), fri)} (26.3 17:00Z is 20:00 Israel in summer time)`);
}

/* 6. the first weekend ever */
{
  for (const t of [Z(2026, 11, 2, 18), Z(2026, 11, 2, 21, 59), Z(2026, 11, 3, 10), Z(2026, 11, 3, 21, 59)]) {
    const w = G.whenLine(null, t);
    claim(w.text === 'ההרשמה פתוחה עד חמישי 5.11 17:00 · שורקים חמישי 5.11 20:00', `at ${new Date(t).toISOString()} the line reads "${w.text}"`);
  }
  for (const t of [Z(2026, 10, 29, 18), Z(2026, 11, 1, 18, 30), Z(2026, 11, 2, 17, 59)]) claim(G.whenLine(null, t).text === 'ההרשמה נפתחת ביום שני 2.11 ב-20:00', `before the Monday (${new Date(t).toISOString()}) the line reads "${G.whenLine(null, t).text}"`);
  claim(G.whenLine(null, Z(2026, 11, 4, 10)).text === 'ההרשמה פתוחה עד מחר 17:00 · שורקים מחר 20:00' && G.whenLine(null, Z(2026, 11, 5, 14, 59)).text === 'ההרשמה פתוחה עד היום 17:00 · שורקים היום 20:00', 'the first registration\'s Wednesday or Thursday line');
  claim(G.whenLine(null, Z(2026, 11, 5, 15)).text === 'ההרשמה נסגרה · המחזור הראשון היום 20:00', `Thursday 5.11 17:00: ${G.whenLine(null, Z(2026, 11, 5, 15)).text}`);
  const cards = G.introCards(Z(2026, 11, 3, 10));
  claim(G.introCards(Z(2026, 11, 2, 17, 59))[1].lines.length === 3, 'card 2 tells of the one-off before it opened');
  claim(cards[1].lines.length === 4 && cards[1].lines[3] === 'הפעם בלבד: ההרשמה לסופ״ש הראשון נפתחה ביום שני 2.11.', `card 2 in the first cycle: ${JSON.stringify(cards[1].lines)}`);
  claim(G.introCards(Z(2026, 11, 10, 10))[1].lines.length === 3, 'card 2 keeps the one-off line after the first weekend');
  const q = G.faq(Z(2026, 11, 3, 10)).find(f => f.q === 'עד מתי נרשמים?')!;
  claim(q.a.endsWith('הפעם בלבד: ההרשמה לסופ״ש הראשון, 5-8.11, נפתחה כבר ביום שני 2.11 ב-20:00.'), `the question in the first cycle: ${q.a}`);
  claim(!G.faq(Z(2026, 11, 10, 10)).find(f => f.q === 'עד מתי נרשמים?')!.a.includes('הפעם בלבד'), 'the one-off stays in the questions after the first weekend');
  claim(G.firstStrip(Z(2026, 11, 3, 10)) === 'הליגה הראשונה אי פעם: סופ״ש 5-8.11. ההרשמה פתוחה כבר עכשיו.', `the strip: ${G.firstStrip(Z(2026, 11, 3, 10))}`);
  claim(G.firstStrip(Z(2026, 11, 2, 17, 59)) === null && G.firstStrip(Z(2026, 11, 1, 19)) === null, 'the strip is up before the Monday opening');
  claim(G.firstStrip(Z(2026, 11, 5, 16)) === null && G.firstStrip(Z(2026, 11, 10, 10)) === null, 'the strip stays after the registration closed');
  // from 8.11 20:00 the ordinary words
  const w = G.whenLine(null, Z(2026, 11, 9, 10));
  claim(w.text === 'ההרשמה פתוחה עד חמישי 17:00 · שורקים חמישי 20:00', `on 9.11 the line reads "${w.text}"`);
}

/* 7. the intro once */
{
  const mem = new Map<string, string>();
  const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); } };
  claim(!G.introSeen(store), 'a fresh device has seen the intro');
  G.markIntroSeen(store);
  claim(G.introSeen(store) && mem.get(G.INTRO_KEY) === String(G.INTRO_VERSION), 'marking did not stick');
  claim(G.INTRO_KEY === 'beapro.weekend.intro' && G.INTRO_VERSION === 1, 'the key or the version');
  claim(!G.introSeen(null), 'no store counts as seen');
  let threw = false;
  try { G.markIntroSeen(null); G.markIntroSeen({ getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } }); G.introSeen({ getItem: () => { throw new Error('x'); }, setItem: () => {} }); } catch { threw = true; }
  claim(!threw, 'a broken store throws');
}

/* 8. short lines */
{
  for (const c of G.introCards(Z(2026, 11, 3, 10))) {
    for (const l of c.lines) claim(l.length <= 95, `a card line is ${l.length} long: ${l}`);
    claim(c.foot.length <= 110 && c.title.length <= 24 && c.kick.length <= 16, `card "${c.title}" has a long foot, title or kick`);
  }
}

/* 9. the screens */
{
  const ui = readFileSync('src/ui/weekend/Weekend.tsx', 'utf8');
  const guide = readFileSync('src/ui/weekend/WeekendGuide.tsx', 'utf8');
  const css = readFileSync('src/ui/weekend/weekend.css', 'utf8');
  claim(/<HelpButton onClick=\{\(\) => setSheet\('intro'\)\} \/>/.test(ui), 'the home screen has no help button');
  claim(/aria-label="איך זה עובד">\?<\/button>/.test(ui), 'the lobby has no "?" button');
  claim(/useState<null \| 'intro' \| 'faq'>\(\(\) => \(introSeen\(\) \? null : 'intro'\)\)/.test(ui), 'the intro does not open on the first visit');
  claim(/<WhenLine league=\{null\} now=\{now\} \/>/.test(ui) && /<WhenLine league=\{L\} now=\{now\} \/>/.test(ui), 'the when line is not on both the home and the league');
  claim(/<AdminGuide size=\{size\} \/>/.test(ui), 'the opener\'s steps are not on the create screen');
  claim(/L\.status === 'open' && <FillingCard n=\{L\.members\.length\} isOpener=\{L\.opener\}/.test(ui), 'the filling card is not shown while open (and only then)');
  claim(/<b>\{CANCEL_TEXT\.lead\}<\/b> <span className="wk-muted">\{CANCEL_TEXT\.rest\}<\/span>/.test(ui), 'the cancel card does not show the new words');
  // the invite's words live in game/weekendInvite.ts (3.11), held by check:leagueinvite; the lobby builds them once
  claim(/const shareText = L\.code \|\| L\.kind === 'open' \? leagueInviteText\(/.test(ui) && (ui.match(/leagueInviteText\(/g) ?? []).length === 1, 'the share text is written twice');
  claim(/שאלות נפוצות: מתי משחקים, מה הפרס, מה עושה מי שפותח/.test(ui), 'the questions link is not on the home screen');
  claim(/export function HelpButton/.test(guide) && /איך זה עובד\?<\/button>/.test(guide), 'the help button\'s words');
  claim(/Math\.abs\(dx\) < 40 \|\| Math\.abs\(dx\) <= Math\.abs\(dy\)/.test(guide) && /if \(dx > 0\) next\(\); else prev\(\);/.test(guide), 'the swipe is not the RTL way (right for next, 40px, horizontal only)');
  claim(/e\.key === 'Escape'/.test(guide), 'Esc does not close the sheets');
  claim(/const close = \(\) => \{ markIntroSeen\(\); onClose\(\); \};/.test(guide) && /onClick=\{\(\) => \{ markIntroSeen\(\); onFaq\(\); \}\}/.test(guide), 'closing the intro (skip, finish, Esc, the questions) does not mark it seen');
  claim(/יאללה, לליגה/.test(guide) && /יש לי עוד שאלות/.test(guide) && /לראות שוב את ההסבר הקצר/.test(guide), 'the sheet\'s words');
  claim(/clipboard\.writeText\(text\)/.test(guide) && /nav\.share\(/.test(guide), 'the copy button does not share or copy');
  claim(/role="status"/.test(guide), 'the when line has no role=status');
  for (const cls of ['.wk-help', '.wk-sheet', '.wk-intro', '.wk-dots', '.wk-faq', '.wk-guide', '.wk-steps', '.wk-when', '.wk-when.hot']) claim(css.includes(cls + '{') || css.includes(cls + ','), `no style for ${cls}`);
  claim(/prefers-reduced-motion: reduce\)\{\.wk-when\.hot::before\{animation:none\}/.test(css), 'the hot dot ignores reduced motion');
  claim(/min-height:44px/.test(css), 'no 44px buttons');
}

console.log(`${checked} checks`);
if (fails.length) { console.log(`FAIL (${fails.length} of ${checked})`); for (const f of fails.slice(0, 40)) console.log('  - ' + f); process.exit(1); }
console.log('OK, the explanation reads the league\'s own numbers, says when on Israel\'s clock through the clock changes and the first weekend, and is shown once');
