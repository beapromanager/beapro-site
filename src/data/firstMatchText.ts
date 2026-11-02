/**
 * The first match (Itzik, 2.11). Match 1 of a new-opening career: a new manager at a ליגה ג׳ club in his own
 * city, a squad he met this week, nobody knows him yet, the two friends are not in it, and there is no match
 * before this one and no table yet. The ordinary pools were written for a season in progress ("שוב", "סוף
 * סוף", "כבר חודש", "מתחילים להתרגל", a table position, a training week behind him), so on that one night
 * the lines that lean on a past get the wording below instead.
 *
 * Only the WORDS change. The question picked, its id, its effects and the fan picked are exactly what they
 * were, so the press and terrace memories, and with them every later week, are untouched. Variants are picked
 * from the night itself (scoreline, rival, city), never by drawing on the rng.
 * Gate: isFirstMatch() in state.ts (obV2 && season 1 && week 1).
 */
import type { PressQuestion, PressContext } from './press.ts';

type Words = { text: string; answers: Array<{ label: string; reply: string }> };

/** one of n, read off the night, so the same night always gets the same variant */
export function nightPick<T>(xs: readonly T[], seed: string): T {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  return xs[h % xs.length];
}
const nightOf = (c: PressContext, id: string) => `${id}|${c.rival}|${c.city}|${c.gf}:${c.ga}`;

/* ------------------------------------------------------------------ press, top of the table after one round */

/** a win on night one puts you first on goals; "בפסגה" means nothing yet, so every TOPS question becomes one of these */
const FIRST_TOP: Words[] = [
  { text: 'משחק ראשון וניצחון. כבר מדברים עליכם בעיר. מוקדם לחלום?',
    answers: [
      { label: 'לחלום אף פעם לא מוקדם. באנו לעלות ליגה', reply: 'הכרזה נועזת. עכשיו כולם יחכו לראות אם תעמוד בה.' },
      { label: 'משחק אחד. נדבר בעוד כמה מחזורים', reply: 'ראש שקט. השחקנים אוהבים את השקט הזה.' },
    ] },
  { text: 'עד הערב אף אחד בליגה לא הכיר אותך. עכשיו מכירים?',
    answers: [
      { label: 'עכשיו מכירים. ועוד ישמעו עלינו', reply: 'ביטחון של מאמן חדש. היריבות רשמו את השם.' },
      { label: 'שיכירו את השחקנים, לא אותי', reply: 'העברת את הקרדיט. החדר שמע.' },
    ] },
  { text: 'ניצחון במשחק הבכורה שלך. מה אמרת לשחקנים במלתחה?',
    answers: [
      { label: 'שזאת רק ההתחלה, ושאני רוצה עוד', reply: 'רעב מהיום הראשון. החדר קיבל את הטון.' },
      { label: 'כלום מיוחד. מחר בבוקר חוזרים לעבוד', reply: 'קור של מקצוען. השחקנים הבינו שאין חגיגות.' },
    ] },
  { text: 'קבוצה חדשה, מאמן חדש, ושלוש נקודות בפתיחה. זה יותר מהר ממה שציפית?',
    answers: [
      { label: 'לא. בשביל זה חזרתי הביתה', reply: 'משפט לכותרת. העיר תאהב אותו.' },
      { label: 'קצת. אני עוד לא מכיר את כולם, וזה כבר עובד', reply: 'כנות של מאמן חדש. מי שמבין העריך.' },
    ] },
];

/** a loss or a draw on night one leaves you near the bottom on goals; there is no season to save yet */
const FIRST_BOTTOM: Words[] = [
  { text: 'התחלה לא טובה. מה אתה אומר לאוהדים שבאו לראות את המאמן החדש?',
    answers: [
      { label: 'מה אני אגיד? זה משחק ראשון, אני עוד לומד את השמות', reply: 'כנה, קצת יותר מדי. היציע רצה לשמוע תוכנית.' },
      { label: 'שיבואו גם בשבוע הבא. יראו קבוצה שנלחמת', reply: 'קריאת קרב. השחקנים הזדקפו, היציע גם.' },
    ] },
  { text: 'המשחק הראשון שלך לא הלך כמו שרצית. מתי נראה את הקבוצה שאתה בונה?',
    answers: [
      { label: 'כשאדע איך קוראים לכולם. תן לי כמה שבועות', reply: 'חצי בדיחה, חצי אמת. האוהדים רצו יותר.' },
      { label: 'מהשבוע הבא. נלחמים על כל נקודה מעכשיו', reply: 'הבטחה בשידור. עכשיו תעמוד בה.' },
    ] },
  { text: 'חזרת הביתה לאמן, והפתיחה כואבת. אתה מתחרט שלקחת את זה?',
    answers: [
      { label: 'מתחרט? עוד לא הספקתי לפרוק את התיק', reply: 'צחוק באולם. לא כולם צחקו.' },
      { label: 'בכלל לא. זה הבית שלי, ופה נלחמים עד הסוף', reply: 'קריאת קרב. השחקנים הזדקפו, היציע גם.' },
    ] },
];

/* ------------------------------------------------------------------ press, one by one */

/** by id: the new text and/or answers (by index; null keeps the answer as it was). `who` is the player a match question is about */
const FIRST_PRESS: Record<string, (c: PressContext, who: string) => { text?: string; answers?: Array<{ label: string; reply?: string } | null> }> = {
  // the match questions (pressFacts.ts)
  brace: (_c, who) => ({
    text: `שני שערים ל${who} במשחק הראשון שלך פה. מה אמרת לו לפני שעלה?`,
    answers: [
      { label: 'אמרתי לו איפה לעמוד. את השאר הוא עשה לבד' },
      { label: 'כלום מיוחד. הכל שלו, אני רק נתתי לו לשחק', reply: 'קרדיט לשחקן. החדר אוהב לשמוע את זה.' },
    ] }),
  top_man_rest: (_c, who) => ({
    text: `${who} הכי טוב שלכם הערב. כבר סגרת לו מקום בהרכב?`,
    answers: [
      { label: 'מה השאלה? 90 דקות כל משחק, לא מוציא אותו' },
      { label: 'יש בספסל חבר׳ה שרוצים את המקום שלו. אצלי כולם מתחילים מאפס' },
    ] }),
  clean_sheet: () => ({ text: 'משחק ראשון ושער נקי. ככה אתה בונה קבוצה, מאחורה קודם?' }),
  clean_sheet_why: () => ({ answers: [{ label: 'זה מה שביקשתי מהם לפני המשחק, וזה מה שהם עשו', reply: 'לקחת קרדיט על ההכנה. מקובל.' }, null] }),
  star_rating: (_c, who) => ({
    text: `${who} היה הטוב במגרש הערב. הכרת אותו לפני שהגעת?`,
    answers: [{ label: 'שמעתי עליו. עכשיו הוא יראה מה הוא יכול לעשות אצלי' }, null] }),
  def_red_cover: () => ({ answers: [{ label: 'דיברנו על זה לפני המשחק. הרחקה זה לא הפתעה, זה תרחיש' }, null] }),
  def_red_ten_men: () => ({
    text: 'משחק ראשון שלך, עשרה בלי בלם, ועדיין יוצאים עם תוצאה. ככה רצית להתחיל?',
    answers: [{ label: 'לא ככה. אבל עכשיו אני יודע שהחבר׳ה האלה לא מוותרים' }, null] }),
  draw_late_concede: () => ({ text: 'הובלתם עד הדקות האחרונות ונתתם להם לחזור. מה חסר כדי לסגור משחק כזה?' }),
  shape_change_players: () => ({ text: 'ראינו אותך צועק מספרים מהקו הערב, 4-4-2, 3-5-2. הם כבר מכירים את הקול שלך?' }),
  shape_failed: () => ({ answers: [null, { label: 'אולי. אני אבדוק את זה בווידאו הלילה' }] }),
  win_comeback_mentality: () => ({ answers: [{ label: 'מההפסקה. אמרתי להם שככה לא מתחילים, והם הבינו', reply: 'נאום מחדר ההלבשה. הכותרת כתבה את עצמה.' }, null] }),
  loss_own_goal: () => ({ answers: [{ label: 'שזה לא אומר עליו כלום. הוא עוד יכבוש בשבילנו, לשער הנכון', reply: 'חיבוק פומבי. השחקן יישן קצת יותר טוב הלילה.' }, null] }),
  legend_goal: () => ({ answers: [{ label: 'עכשיו שאני פה, הוא לא הולך לשום מקום', reply: 'לקחת קרדיט על מה שעוד לא עשית. חצוף, אבל עובד.' }, null] }),

  // the wider questions (press.ts)
  local_town: c => ({ text: `כתב מקומון ${c.city} כאן. כל העיר רוצה לדעת אם הבן של העיר יחזיר אותנו למקום שמגיע לנו. מה אני אגיד להם?` }),
  win_but_injury: () => ({ answers: [{ label: 'חמוץ. שלוש נקודות לא שוות בן אדם על אלונקה', reply: 'אנושיות לפני נקודות. החדר ראה מאמן, לא מנהל.' }, null] }),
  win_habit: () => ({
    text: 'ניצחון במשחק הראשון שלך. ככה אתה מתכנן להתחיל כל עונה?',
    answers: [{ label: 'ככה אני מתכנן לגמור אותה. שהיריבות יתכוננו' }, { label: 'מי שחושב שזה נגמר פה, יושב אצלי בספסל' }] }),
  loss_fans: () => ({
    text: 'הפסד במשחק הראשון שלך. ביציע כבר שואלים מי זה המאמן החדש. מה אתה אומר להם?',
    answers: [
      { label: 'שיבואו לאימון ביום שני ויכירו אותי', reply: 'הזמנה עם עוקץ. ביום שני יהיו כמה סקרנים ליד הגדר.' },
      { label: 'שהם צודקים לשאול. אני כועס יותר מהם' },
    ] }),
  derby_city_tomorrow: () => ({ answers: [null, { label: 'רגיל. שלוש נקודות וזהו. תשאל אותי אחרי עוד כמה מחזורים' }] }),
  local_cafe: c => ({
    text: `ב${c.city} כבר מדברים בבתי הקפה על המאמן החדש. איך זה לחזור הביתה ככה?`,
    answers: [{ label: 'שידברו. עוד יהיה להם על מה', reply: 'שורה לכותרת. חצי חייכו, חצי הרימו גבה.' }, null] }),
  local_kids: c => ({
    text: `ילדים מ${c.city} באו הערב לראות את המאמן החדש. אתה מרגיש את האחריות הזאת?`,
    answers: [{ label: 'שיתחילו להזמין חולצות עם השם שלי' }, null] }),
  youth_academy_pride: () => ({ text: 'יש ילד מהאקדמיה בסגל כבר במשחק הראשון שלך. זה מכוון או שאין כסף לקנות?' }),
  draw_wasting: () => ({
    text: 'תיקו בפתיחה. מי שרוצה לעלות ליגה לא אמור לנצח משחקים כאלה?',
    answers: [{ label: 'תראה מה השופט עשה לנו בדקה 80' }, { label: 'צודק. עוד ערב כזה ואני מתחיל לשלוח שחקנים הביתה' }] }),
  draw_top_dropped: () => ({
    text: 'תיקו בפתיחה. שתי נקודות הלכו, או נקודה ראשונה בכיס?',
    answers: [{ label: 'נקודה לא הורגת אף אחד. מי שרגוע לוקח אליפויות', reply: 'קור רוח. מי שחיכה לפאניקה לא קיבל.' }, { label: 'לא רגוע. משחק ראשון זה לא תירוץ' }] }),
  draw_bottom_point: () => ({
    text: 'נקודה אחת מהמשחק הראשון. בסיס לבנות עליו או התחלה חלשה?',
    answers: [{ label: 'בסיס. מנקודות כאלה בונים עונה' }, { label: 'התחלה חלשה. ואנחנו נשתפר, מילה שלי' }] }),
  draw_respect_point: () => ({ text: 'נקודה בחוץ במשחק הראשון שלך. אתה חוזר הביתה מרוצה?' }),
};

/** press.ts's TOPS pool, the questions for the club at the top of the table (not the top_man* match questions) */
const TOPS_IDS = new Set(['top_say_it', 'top_fall_watch', 'top_enjoy', 'top_bus_parade', 'top_who_stops', 'top_pressure_kids',
  'top_owner_dream', 'top_remember_bottom', 'top_style_or_points', 'top_rotation', 'top_city_fever', 'top_bet_question',
  'top_lonely', 'top_what_scares', 'top_message_chasers']);
const isTop = (id: string) => TOPS_IDS.has(id);

/** The first match's wording of a question already picked. Same id, same tone, same effects, same order. */
export function firstWording(q: PressQuestion, c: PressContext): PressQuestion {
  const whole = q.id === 'relegation_believe' ? nightPick(FIRST_BOTTOM, nightOf(c, q.id))
    : isTop(q.id) ? nightPick(FIRST_TOP, nightOf(c, q.id)) : null;
  if (whole) {
    return { ...q, text: whole.text, answers: q.answers.map((a, i) => whole.answers[i] ? { ...a, label: whole.answers[i].label, reply: whole.answers[i].reply } : a) };
  }
  const f = FIRST_PRESS[q.id];
  if (!f) return q;
  const w = f(c, q.who ?? c.star);
  return {
    ...q,
    text: w.text ?? q.text,
    answers: q.answers.map((a, i) => { const n = w.answers?.[i]; return n ? { ...a, label: n.label, reply: n.reply ?? a.reply } : a; }),
  };
}

/** every question id that has words of its own on the first night, for the checks and the review doc */
export const FIRST_PRESS_IDS = [...Object.keys(FIRST_PRESS), 'relegation_believe', ...TOPS_IDS];

/* ------------------------------------------------------------------ the terrace */

export interface FirstFanSlots { scoreLine: string; city: string; scorer?: string | null; coldStriker?: string | null; gripe: string }

/** by fan-line id, 2-3 ways to say it on the first night; the fan who says it is the one the pool picked */
export const FIRST_FAN: Record<string, (s: FirstFanSlots) => string[]> = {
  'sage-win': () => [
    'ניצחון בהתחלה, יפה. אבל יש לי רשימה של דברים לשנות, תשאל אותי. אני פה כל משחק.',
    'עוד לא מכיר אותך, אבל ניצחת, אז בינתיים אתה בסדר. רק תקשיב למה שאני צועק מהיציע.',
    'יפה, מאמן. בפעם הבאה תשאל אותי לפני המשחק, אני רואה כדורגל שלושים שנה.',
  ],
  'sage-win-score': s => [
    `${s.scoreLine}. ${s.scorer} הבקיע בדיוק מאיפה שהייתי שם אותו. אתה חדש, אז אני אסביר לך את הקבוצה הזאת.`,
    `${s.scoreLine}. יפה, ${s.scorer} במקום הנכון. רק שתדע, את זה הייתי אומר לך גם לפני המשחק.`,
  ],
  'sage-loss': s => [
    `אתה חדש, אז אגיד לך בעדינות: ${s.gripe}. תשאל אותי בפעם הבאה, אני ביציע כל משחק.`,
    `עוד לא מכירים אותך פה, ואחרי ערב כזה גם לא תרצה שיכירו. ${s.gripe}, נו באמת.`,
  ],
  'ctx-loss-cold': s => [
    `${s.scoreLine}. ${s.coldStriker} לא היה בעניינים הערב. אני לא מאמן, אבל יש לי עיניים בראש. תבדוק אותו.`,
    `${s.scoreLine}. מה היה עם ${s.coldStriker} הערב? אתה חדש פה, אז תדע שהוא יכול הרבה יותר מזה.`,
  ],
  'city-win': s => [
    `הלילה כל ${s.city} חוגגת. משחק ראשון שלך, ועברתי ברחוב וכולם מחייכים.`,
    `כל ${s.city} מדברת על המאמן החדש. התחלה כזאת, ככה אנחנו אוהבים.`,
  ],
  'city-win-hope': s => [
    `${s.scoreLine}. ככה מתחילים! ${s.city} חוזרת למפה של הכדורגל, אני מרגיש את זה.`,
    `${s.scoreLine}. פתיחה כמו שצריך. אני אומר לך, זאת יכולה להיות השנה שלנו.`,
  ],
  'hope-loss': () => [
    'הפסדנו, בסדר, זה רק המשחק הראשון. אני מאמין בחבר׳ה האלה, ותן לנו זמן להאמין גם בך.',
    'פתיחה לא טובה, קורה. שום דבר לא נגמר, הכל רק מתחיל. משחק הבא תנו הכל!',
  ],
  'fans-full-roar': () => [
    'לא שמעתי את האצטדיון ככה הרבה זמן. מאמן חדש, יציע מלא. חיים את החלום!',
    'איזה רעש היה פה היום. משחק ראשון שלך וכבר יש לך יציע מאחוריך, אל תיתן לזה להיגמר.',
  ],
};

/* ------------------------------------------------------------------ the scout, before kickoff */

/** the derby pool's lines that talk of a table or a season already under way, by their index in SCOUT_LINES.derby */
export const FIRST_SCOUT_DERBY: Record<number, string> = {
  0: 'דרבי בפתיחה. אף אחד עוד לא מכיר אותנו, אז תיכנסו חזק מהדקה הראשונה. פה מי שרוצה יותר לוקח.',
  3: 'דרבי במשחק הראשון. אל תשחקו פתוח בשביל הכבוד, תוצאה טובה פה תעשה לנו שקט לכל העונה.',
};

/** the result screen's ledger, under the season prize: after one round there is no "where you are today" */
export const FIRST_PURSE = (amount: string) => `הערכה ראשונה: בסוף העונה ייכנסו עוד ${amount}. אחרי מחזור אחד זה עוד ישתנה.`;
