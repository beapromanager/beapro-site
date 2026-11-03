/**
 * The words that explain the neighbourhood league (Itzik, 25.10): four cards at the door, the opener's five steps,
 * the card of a league filling up, the questions people ask, and the one line that says what happens when.
 *
 * No React in here, and no number typed by hand: every figure is read off weekendCore (and the duel's clock), so
 * when a rule moves the words move with it, and weekend-guide-check holds them to it.
 */
import {
  MIN_MEMBERS, MAX_MEMBERS, SQUAD_SIZE, SQUAD_AVG, PACK_EVERY, PACK_OVR, ASSISTANT_MAX, TECH_LOSS, CODE_LEN, POINTS_WIN,
  PRIZE_BY_PLACE, PRIZE_FINISHED, GEMS_BY_PLACE, GEMS_FINISHED, READY_MS, KEEP_MS,
  OPEN_SLOTS, SLOT_GRID, DAY_NAME, KICKOFF_KEY, FINAL_KEY, HE_DAYS, FIRST_REGISTRATION_OPENS_AT,
  cycleOf, regularCycleOf, cyclePhase, isFirstCycle, registrationGate, slotsNeeded, ilParts, ilTime, ilDayDate, weekendSpan,
  type Cycle, type LeagueStatus, type MatchResult,
} from './weekendCore.ts';
import { MINUTE_MS, DECISION_MS } from './duel.ts';

/* --------------------------------------------------------------- the intro, once */

export const INTRO_VERSION = 1;
export const INTRO_KEY = 'beapro.weekend.intro';
export interface StoreLike { getItem(k: string): string | null; setItem(k: string, v: string): void }

function storeOf(store?: StoreLike | null): StoreLike | null {
  if (store !== undefined) return store;
  try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; }
}
/** has this device seen the four cards (this version of them)? never throws, a phone without storage sees them every time */
export function introSeen(store?: StoreLike | null): boolean {
  try { return storeOf(store)?.getItem(INTRO_KEY) === String(INTRO_VERSION); } catch { return false; }
}
export function markIntroSeen(store?: StoreLike | null): void {
  try { storeOf(store)?.setItem(INTRO_KEY, String(INTRO_VERSION)); } catch { /* private mode: they will see it again, which is fine */ }
}

/* ------------------------------------------------------------------ numbers as words */

const HE_NUM: Record<number, string> = { 2: 'שניים', 3: 'שלושה', 4: 'ארבעה', 5: 'חמישה', 6: 'שישה', 7: 'שבעה', 8: 'שמונה', 9: 'תשעה', 10: 'עשרה', 11: 'אחד עשר', 12: 'שנים עשר' };
const HE_ORD_F: Record<number, string> = { 2: 'השנייה', 3: 'השלישית', 4: 'הרביעית', 5: 'החמישית' };
/** "ו-3 יהלומים" and "ויהלום": the Hebrew "and" takes a hyphen before a digit and none before a word */
export function and(word: string): string { return /^\d/.test(word) ? `ו-${word}` : `ו${word}`; }
export function gemWords(n: number): string { return n === 1 ? 'יהלום' : `${n} יהלומים`; }
export function wageWords(rounds: number): string {
  if (rounds === 1.5) return 'מחזור שכר וחצי';
  if (rounds === 1) return 'מחזור שכר';
  if (rounds === 0.75) return 'שלושה רבעים ממחזור שכר';
  if (rounds === 0.5) return 'חצי מחזור שכר';
  if (rounds === 0.25) return 'רבע מחזור שכר';
  return `${rounds} מחזורי שכר`;
}
const minutes = (ms: number) => Math.round(ms / 60_000);
const seconds = (ms: number) => Math.round(ms / 1000);
/** a match: ninety minutes on the duel's clock, give or take the moments and the break */
const MATCH_MIN_LO = Math.ceil(90 * MINUTE_MS / 60_000);
const MATCH_MIN_HI = MATCH_MIN_LO + 2;
const techLoss = `${TECH_LOSS[0]}:${TECH_LOSS[1]}`;

/* ------------------------------------------------------------------ the fixed hours */

/** the ordinary week's hours, read off a regular cycle: Sunday 20:00, Thursday 17:00, Thursday 20:00, Sunday 20:00 */
const REG: Cycle = regularCycleOf(FIRST_REGISTRATION_OPENS_AT);
const dayTime = (at: number) => `${HE_DAYS[ilParts(at).dow]} ${ilTime(at)}`;
export const OPENS_WORDS = dayTime(REG.opens);       // "ראשון 20:00"
export const LOCKS_WORDS = dayTime(REG.locks);       // "חמישי 17:00"
export const KICKOFF_WORDS = dayTime(REG.kickoff);   // "חמישי 20:00"
export const FINAL_WORDS = dayTime(REG.final);       // "ראשון 20:00"
const hhmm = (hh: number) => `${String(hh).padStart(2, '0')}:00`;

/** "חמישי 20:00, שישי 12:00 ו-14:00, שבת 20:00, ראשון 20:00": the open league's whole week */
export function openSlotsWords(): string {
  const byDay = new Map<string, number[]>();
  for (const k of OPEN_SLOTS) { const s = SLOT_GRID.find(x => x.key === k)!; byDay.set(s.day, [...(byDay.get(s.day) ?? []), s.hh]); }
  const mids = [...byDay.entries()].map(([day, hhs]) => `${DAY_NAME[day as keyof typeof DAY_NAME]} ${hhs.length === 1 ? hhmm(hhs[0]) : `${hhs.slice(0, -1).map(hhmm).join(', ')} ${and(hhmm(hhs[hhs.length - 1]))}`}`);
  return [KICKOFF_WORDS, ...mids, FINAL_WORDS].join(', ');
}

/** the one-off: "הפעם בלבד: ההרשמה לסופ״ש הראשון נפתחה ביום שני 2.11." when the cycle in play is the first ever */
export function firstCycleNote(now: number): string | null {
  const c = cycleOf(now);
  return isFirstCycle(c) ? `הפעם בלבד: ההרשמה לסופ״ש הראשון נפתחה ביום ${ilDayDate(FIRST_REGISTRATION_OPENS_AT)}.` : null;
}
function firstCycleFaqNote(now: number): string | null {
  const c = cycleOf(now);
  return isFirstCycle(c) ? `הפעם בלבד: ההרשמה לסופ״ש הראשון, ${weekendSpan(c)}, נפתחה כבר ביום ${ilDayDate(FIRST_REGISTRATION_OPENS_AT)} ב-${ilTime(FIRST_REGISTRATION_OPENS_AT)}.` : null;
}

/* ------------------------------------------------------------------ the four cards */

export interface IntroCard { kick: string; title: string; lines: string[]; foot: string; art: string }

export const INTRO: IntroCard[] = [
  {
    kick: 'מה זה בכלל', title: 'ליגת השכונה', art: '/weekend/entrance.webp',
    lines: [
      'ליגה של סופ״ש אחד, מול חברים אמיתיים. לא מול המחשב.',
      `כל אחד מקבל סגל חדש של ${SQUAD_SIZE} שחקנים, ממוצע ${SQUAD_AVG}. שווה לכולם, מנצח מי שמנהל טוב יותר.`,
      'הקריירה שלך לא משחקת ולא נפגעת. היא רק מקבלת פרס בסוף.',
    ],
    foot: `${KICKOFF_WORDS} עד ${FINAL_WORDS} · שעון ישראל`,
  },
  {
    kick: 'איך נכנסים', title: 'קוד אחד בוואטסאפ', art: '/weekend/fence.webp',
    lines: [
      `אחד פותח ליגה, בוחר שעות משחק ומקבל קוד של ${CODE_LEN} תווים.`,
      'שולח את הקוד לחבר׳ה. הם לוחצים ׳נכנסים עם קוד׳, בוחרים כינוי, וזהו.',
      `באים לבד? ׳הליגה הפתוחה׳ שמה אותך בליגה של ${MIN_MEMBERS} שלא מכירים.`,
    ],
    foot: `ההרשמה מ${OPENS_WORDS} עד ${LOCKS_WORDS}. צריך לפחות ${MIN_MEMBERS} בליגה, אחרת היא לא יוצאת לדרך.`,
  },
  {
    kick: 'מתי משחקים', title: 'כל מחזור בשעה קבועה', art: '/weekend/oneonone.webp',
    lines: [
      `${KICKOFF_WORDS} המחזור הראשון, ${FINAL_WORDS} הגמר. באמצע, השעות שהפותח בחר.`,
      `בשעת המחזור נכנסים ולוחצים ׳מוכן?׳. אחרי ${minutes(READY_MS)} דקות כל הליגה שורקת יחד, חי, אחד על אחד.`,
      `משחק לוקח בערך ${MATCH_MIN_LO} עד ${MATCH_MIN_HI} דקות. ברגעים החמים אתה מחליט, ויש לך ${seconds(DECISION_MS)} שניות.`,
    ],
    foot: `לא הספקת? העוזר משחק במקומך, עד ${ASSISTANT_MAX} פעמים. בפעם ${HE_ORD_F[ASSISTANT_MAX + 1]}, הפסד טכני ${techLoss}.`,
  },
  {
    kick: 'מה מרוויחים', title: 'הביתה, לקריירה', art: '/weekend/win.webp',
    lines: [
      `אין תיקו. שוויון הולך לפנדלים. ניצחון שווה ${POINTS_WIN} נקודות.`,
      `כל ${PACK_EVERY} ניצחונות, חבילה: שחקן ${PACK_OVR} לעמדה שתבחר, עד סוף הסופ״ש.`,
      `ב${FINAL_WORDS} הטבלה נסגרת. האלוף לוקח לקריירה ${wageWords(PRIZE_BY_PLACE[1])} ${and(gemWords(GEMS_BY_PLACE[1]))}.`,
    ],
    foot: `גם השני והשלישי מקבלים, וכל מי ששיחק בעצמו לוקח ${wageWords(PRIZE_FINISHED)} ${and(gemWords(GEMS_FINISHED))}.`,
  },
];

/** the cards as shown now: in the first cycle ever, the second card also says the registration opened on Monday 2.11 */
export function introCards(now: number): IntroCard[] {
  const note = firstCycleNote(now);
  if (!note) return INTRO;
  return INTRO.map((c, i) => (i === 1 ? { ...c, lines: [...c.lines, note] } : c));
}

/* ------------------------------------------------------------------ the opener */

export function adminSteps(size: number): { title: string; steps: string[]; note: string } {
  const n = Math.min(MAX_MEMBERS, Math.max(MIN_MEMBERS, Math.round(size)));
  const need = slotsNeeded(n);
  return {
    title: 'פותח ליגה? ככה זה הולך',
    steps: [
      'שם לליגה וכינוי לך. ככה החבר׳ה יזהו אותך בטבלה.',
      `כמה תהיו ומתי. ${KICKOFF_WORDS} ו${FINAL_WORDS} קבועים. עם ${n} חברים בוחרים עוד ${need} שעות, וכל שעה היא מחזור שכולם משחקים בו יחד. תבחרו שעות שמתאימות לכולם.`,
      'לא בטוח כמה יגיעו? תסמן לפי המספר הגבוה, כי יותר מזה לא ייכנסו. אם יגיעו פחות, השעות האחרונות יורדות לבד.',
      'פותחים, מקבלים קוד, שולחים בוואטסאפ. בליגה מחכה לך הודעה מוכנה.',
      `עד ${LOCKS_WORDS} צריך לפחות ${MIN_MEMBERS} בפנים, כולל אותך. אחר כך הסגלים מוגרלים, וב${KICKOFF_WORDS} שורקים.`,
    ],
    note: 'שים לב: אחרי הפתיחה אי אפשר לשנות שעות, להוציא מישהו או לסגור מוקדם. אז קודם סגרו עם החבר׳ה מתי נוח.',
  };
}

/* ------------------------------------------------------------------ a league filling up */

export function fillingCard(n: number, isOpener: boolean, kind: 'friends' | 'open'): { title: string; head: string; lines: string[] } {
  const head = n >= MIN_MEMBERS ? `${n} בפנים. יש מספיק, הליגה יוצאת לדרך.` : `${n} בפנים. חסרים עוד ${MIN_MEMBERS - n} עד ${LOCKS_WORDS}.`;
  if (kind === 'open') return { title: 'הליגה הפתוחה מתמלאת', head, lines: [`היא מתמלאת לבד, ונסגרת כשיש ${MIN_MEMBERS}.`] };
  if (isOpener) return { title: 'אתה המנהל. מה עכשיו?', head, lines: ['שלח את הקוד לחבר׳ה. ההודעה המוכנה למטה.', `ב${LOCKS_WORDS} הרשימה ננעלת, ומשם אתה מנהל כמו כולם.`] };
  return { title: 'מחכים לחבר׳ה', head, lines: ['מכיר עוד מישהו? שלח לו את ההזמנה.'] };
}
/** the invite button (Itzik, 3.11): the phone's share sheet where there is one, the clipboard where there is not */
export const COPY_WORDS = 'לשלוח הזמנה לחבר׳ה';
export const COPIED_WORDS = 'הועתק ✓ עכשיו להדביק בוואטסאפ';
export const SHARED_WORDS = 'נשלח ✓';

/** the league did not make six at the lock */
export const CANCEL_TEXT = {
  lead: `לא הגעתם ל${HE_NUM[MIN_MEMBERS] ?? MIN_MEMBERS}, אז הליגה לא יצאה לדרך.`,
  rest: `ההרשמה הבאה נפתחת ב${OPENS_WORDS}. אפשר לנסות שוב עם החבר׳ה, או להיכנס לליגה הפתוחה.`,
};

/* ------------------------------------------------------------------ the questions */

export interface Faq { q: string; a: string }

export const FAQ: Faq[] = [
  { q: 'מה זה ליגת השכונה?', a: `ליגה של סופ״ש אחד מול חברים אמיתיים. כולם מקבלים סגל חדש של ${SQUAD_SIZE}, ממוצע ${SQUAD_AVG}, ומשחקים כל אחד מול כל אחד.` },
  { q: 'צריך קריירה?', a: 'כן. בלי קריירה במכשיר אי אפשר להירשם, כי לשם הולך הפרס. הקריירה עצמה לא משחקת ולא נפגעת.' },
  { q: 'עד מתי נרשמים?', a: `מ${OPENS_WORDS} עד ${LOCKS_WORDS}, שעון ישראל. ב${LOCKS_WORDS} הרשימות ננעלות והסגלים מוגרלים.` },
  { q: 'מתי המשחקים?', a: `כל מחזור בשעה קבועה וכל הליגה משחקת בו יחד. ${KICKOFF_WORDS} הראשון, ${FINAL_WORDS} הגמר, ובאמצע השעות שהפותח בחר. בליגה הפתוחה: ${openSlotsWords()}.` },
  { q: 'אפשר לשחק מתי שבא לי?', a: `לא. זה משחק חי מול בן אדם, אז שניכם צריכים להיות שם בשעת המחזור. מגיעים, לוחצים ׳מוכן?׳, ואחרי ${minutes(READY_MS)} דקות שורקים.` },
  { q: 'ומה אם לא הגעתי?', a: `העוזר משחק במקומך, עד ${ASSISTANT_MAX} פעמים בסופ״ש. בפעם ${HE_ORD_F[ASSISTANT_MAX + 1]} זה הפסד טכני ${techLoss}.` },
  { q: 'מה עושה מי שפותח את הליגה?', a: 'נותן שם, בוחר כמה יהיו ובאילו שעות, ושולח את הקוד. זה הכול. אחרי הפתיחה אין כפתורי ניהול: אי אפשר לשנות שעות, להוציא מישהו או לסגור מוקדם.' },
  { q: 'כמה חברים צריך?', a: `בין ${MIN_MEMBERS} ל-${MAX_MEMBERS}. פחות מ-${MIN_MEMBERS} ב${LOCKS_WORDS}, הליגה לא יוצאת לדרך. בשבוע הבא אפשר לנסות שוב, עם החבר׳ה או בליגה הפתוחה.` },
  { q: 'יש תיקו?', a: `אין. שוויון הולך לפנדלים. ניצחון ${POINTS_WIN} נקודות, הפסד 0. בטבלה קובעים נקודות, הפרש, זכות ואז המשחק ביניכם.` },
  { q: 'מה זו החבילה?', a: `כל ${PACK_EVERY} ניצחונות פותחים חבילה: בוחרים עמדה ומקבלים שחקן ${PACK_OVR}, שנכנס במקום החלש בעמדה. רק לסופ״ש הזה.` },
  { q: 'מה הפרס?', a: `אלוף: ${wageWords(PRIZE_BY_PLACE[1])} ${and(gemWords(GEMS_BY_PLACE[1]))}. שני: ${wageWords(PRIZE_BY_PLACE[2])} ${and(gemWords(GEMS_BY_PLACE[2]))}. שלישי: ${wageWords(PRIZE_BY_PLACE[3])} ${and(gemWords(GEMS_BY_PLACE[3]))}. כל מי ששיחק בעצמו לפחות חצי מהמשחקים: ${wageWords(PRIZE_FINISHED)} ${and(gemWords(GEMS_FINISHED))}. השכר לפי הליגה שלך בקריירה, ואלוף שחוזר על התואר מקבל קצת פחות.` },
  { q: 'אפשר להיות בשתי ליגות?', a: 'לא. ליגה אחת לכל מכשיר בכל סופ״ש.' },
  { q: 'מה נשמר עליי?', a: `הכינוי, שם הליגה, הסגל שהוגרל, הבחירות שלך במשחק והתוצאות נמחקים מהשרת ${KEEP_MS === 7 * 86_400_000 ? 'שבוע' : `${Math.round(KEEP_MS / 86_400_000)} ימים`} אחרי הגמר. בשרת נשאר מספר האליפויות של המכשיר, עם המספר האקראי שלו ובלי כינוי, ונמחק 12 חודשים אחרי האליפות האחרונה. אצלך במכשיר, הכינוי ושם הליגה נשארים בקריירה. לא נאסף טלפון, מיקום או מייל.` },
];

/** the questions as asked now: in the first cycle ever, "עד מתי נרשמים" also says the one-off */
export function faq(now: number): Faq[] {
  const note = firstCycleFaqNote(now);
  if (!note) return FAQ;
  return FAQ.map(f => (f.q === 'עד מתי נרשמים?' ? { ...f, a: `${f.a} ${note}` } : f));
}

/* ------------------------------------------------------------------ when */

const DAY = 86_400_000;
/** the Israeli calendar day of an instant, as a count of days, so "today" and "tomorrow" are Israel's and not the phone's */
function ilDayIndex(t: number): number { const p = ilParts(t); return Math.round(Date.UTC(p.y, p.m - 1, p.d) / DAY); }

/**
 * "היום 17:00", "מחר 20:00", "חמישי 17:00", and with the date when it is six days or more away, or the same weekday
 * as today but not today, or when `dated` asks for it: "חמישי 5.11 17:00". Israel's clock throughout, whatever the
 * phone is set to. The first weekend ever is always dated: its registration starts on an odd day, and "חמישי 17:00" on the
 * Friday before would sound like the day it is not.
 */
export function ilWhen(at: number, now: number, dated = false): string {
  const diff = ilDayIndex(at) - ilDayIndex(now);
  const time = ilTime(at);
  if (diff === 0) return `היום ${time}`;
  if (diff === 1) return `מחר ${time}`;
  const p = ilParts(at);
  if (dated || diff >= 6 || diff < 0 || p.dow === ilParts(now).dow) return `${HE_DAYS[p.dow]} ${p.d}.${p.m} ${time}`;
  return `${HE_DAYS[p.dow]} ${time}`;
}

/** the slice of the league view the line reads; the server's LeagueView fits it as it is */
export interface WhenInput {
  status: LeagueStatus;
  cycle: Cycle;
  current: { index: number; at: number; startsAt: number } | null;
  mine: { matchId: string | null; opponent: string; result: MatchResult | null } | null;
  me: { nick: string } | null;
  rounds: { index: number; bye: string | null; matches: { mine: boolean; result: MatchResult | null }[] }[];
}

/** the one line under the card: what happens next and when; hot when it is happening right now and wants a press */
export function whenLine(league: WhenInput | null, now: number): { text: string; hot: boolean } {
  const cold = (text: string) => ({ text, hot: false });
  if (!league) {
    const gate = registrationGate(now);
    if (gate) return cold(gate);
    const c = cycleOf(now);
    const ph = cyclePhase(c, now);
    const dated = isFirstCycle(c);
    if (ph === 'open') return cold(`ההרשמה פתוחה עד ${ilWhen(c.locks, now, dated)} · שורקים ${ilWhen(c.kickoff, now, dated)}`);
    if (ph === 'locked') return cold(`ההרשמה נסגרה · המחזור הראשון ${ilWhen(c.kickoff, now, dated)}`);
    return cold(`הסופ״ש כבר בעיצומו · ההרשמה הבאה נפתחת ${OPENS_WORDS}`);
  }
  const L = league;
  if (L.status === 'cancelled') return cold(`הליגה לא יצאה לדרך · ההרשמה הבאה ${ilWhen(L.cycle.final, now)}`);
  if (L.status === 'done') return cold(now >= L.cycle.final ? 'הסופ״ש נגמר · ההרשמה לסופ״ש הבא כבר פתוחה' : `הסופ״ש נגמר · ההרשמה הבאה ${ilWhen(L.cycle.final, now)}`);
  const dated = isFirstCycle(L.cycle);
  if (L.status === 'open') return cold(`ההרשמה פתוחה עד ${ilWhen(L.cycle.locks, now, dated)} · שורקים ${ilWhen(L.cycle.kickoff, now, dated)}`);
  if (L.status === 'locked') return cold(`הסגלים מוכנים · המחזור הראשון ${ilWhen(L.cycle.kickoff, now, dated)}`);
  // playing
  const cur = L.current;
  if (!cur) return cold('כל המשחקים שוחקו · הטבלה נסגרת');
  const round = L.rounds.find(r => r.index === cur.index);
  const resting = !L.mine && (!!L.me && round?.bye === L.me.nick || !round?.matches.some(m => m.mine));
  if (resting) return cold(now < cur.at ? `במחזור של ${ilWhen(cur.at, now)} אתה נח` : 'במחזור הזה אתה נח · אפשר לצפות בטבלה');
  if (!L.mine) return cold('כל המשחקים שוחקו · הטבלה נסגרת');
  if (L.mine.result) return cold('סיימת את המחזור · מחכים לשאר המשחקים');
  if (now < cur.at) return cold(`המשחק הבא שלך ${ilWhen(cur.at, now)} · מול ${L.mine.opponent}`);
  if (now < cur.startsAt) return { text: `המחזור עכשיו! לחץ ׳מוכן?׳ · שורקים ב-${ilTime(cur.startsAt)}`, hot: true };
  return { text: `המשחק שלך חי עכשיו · מול ${L.mine.opponent}`, hot: true };
}

/** the first-ever strip on the home screen: "הליגה הראשונה אי פעם: סופ״ש 5–8.11. ההרשמה פתוחה כבר עכשיו." */
export function firstStrip(now: number): string | null {
  const c = cycleOf(now);
  if (!isFirstCycle(c) || cyclePhase(c, now) !== 'open') return null;
  return `הליגה הראשונה אי פעם: סופ״ש ${weekendSpan(c)}. ההרשמה פתוחה כבר עכשיו.`;
}

export { KICKOFF_KEY, FINAL_KEY };
