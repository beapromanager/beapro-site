/**
 * The terrace. Not four jokers, a whole cast of regulars with different heads
 * on their shoulders, because a real crowd is not one voice. Some are funny,
 * one is a prophet of doom, one counts goal difference in his sleep, and the
 * loudest of the lot is the veteran who is convinced he understands the game
 * better than the man in the dugout and never lets you forget it.
 *
 * Everything they say is keyed to the real save: who stopped scoring, the run
 * of results, the derby, where you sit, and even the tactic you picked. A big
 * pool plus slots plus a short memory means you rarely hear the same line twice.
 */

import type { Rng, Approach } from '../engine/matchEngine.ts';
import { FAN_TIERS, inTier } from './leagueGate.ts';
import { OPENERS } from './openersText.ts';
import { TOP_FAN_REWRITE, TOP_FAN_NEW } from './topFlightText.ts';
import { FIRST_FAN } from './firstMatchText.ts';

/** The head a fan watches football with. Drives which lines are his to say. */
export type Voice =
  | 'sage'       // knows better than the coach, always
  | 'doom'       // it will end badly, it always does
  | 'nostalgic'  // in my day
  | 'hope'       // this is our year, you'll see
  | 'super'      // do not jinx it
  | 'hot'        // pure blood pressure
  | 'numbers'    // quotes the table at you
  | 'heart';     // takes every result personally

export interface Fan {
  id: string;
  name: string;
  bio: string;
  voice: Voice;
}

/**
 * The cast. Weighted toward the everyman voices, with the know-it-all veteran
 * well represented, because that is the one the manager is meant to feel.
 */
export const FANS: Fan[] = [
  { id: 'chico',   name: 'אלי צ׳יקו', bio: 'נהג אוטובוס בדימוס, מבין בכדורגל יותר מכולם', voice: 'sage' },
  { id: 'yair',    name: 'יאיר הפרשן', bio: 'צופה ב-800 משחקים בשנה מהספה', voice: 'sage' },
  { id: 'buzi',    name: 'בוזי', bio: 'שלושים שנה ביציע, כולם יודעים שהוא חרטטן', voice: 'sage' },
  { id: 'shimon',  name: 'שמעון', bio: 'מנוי מאז 1974, יושב ביציע המזרחי', voice: 'nostalgic' },
  { id: 'yosef',   name: 'יוסי הזקן', bio: 'ראה את הקבוצה עולה וגם יורדת, כל עונה. מכור למשחק.', voice: 'nostalgic' },
  { id: 'david',   name: 'דוד הנביא', bio: 'תמיד יודע איך זה ייגמר, לרעה. מנחוס כזה.', voice: 'doom' },
  { id: 'chanan',  name: 'חנן', bio: 'יודע בעל פה את הפרש השערים של כל הליגה', voice: 'numbers' },
  { id: 'rafi',    name: 'רפי', bio: 'בעל המכולת ממול לאצטדיון', voice: 'hope' },
  { id: 'moki',    name: 'מוקי', bio: 'לא פספס משחק בית 30 שנה', voice: 'super' },
  { id: 'avram',   name: 'אברם', bio: 'לוקח כל תוצאה הביתה, מנצחים הבית שמח, מפסידים לא מדבר עם אישתו עד צאת שבת.', voice: 'heart' },
  { id: 'nissim',  name: 'ניסים', bio: 'ממלא טופס רק אחרי שיש הרכבים, כל טופס הוא נופל.', voice: 'hot' },
];

export type FanTiming = 'pre' | 'post';

/**
 * Where the terrace is loud enough, or thin enough, for a fan to say so out
 * loud. Everything between is an ordinary crowd with an ordinary opinion, and
 * gets the lines it always got.
 */
export const FANS_LOUD = 75;
export const FANS_QUIET = 30;

export interface FanContext {
  /** the division, 1 = ליגה ג׳ .. 5 = ליגת העל */
  tier?: number;
  timing: FanTiming;
  isDerby: boolean;
  isHome: boolean;
  rival: string;
  /** the club's home town, so the terrace can say its own name */
  city: string;
  /** a starter who has gone a long time without scoring, if there is one */
  coldStriker: string | null;
  coldWeeks: number;
  /** the most tired starter after the match, or the youngest talent */
  youngster: string | null;
  /** the tactical approach currently set, which the know-it-all loves to judge */
  approach: Approach;
  /** last result, only for post */
  result?: 'win' | 'draw' | 'loss';
  scoreLine?: string;
  scorer?: string | null;
  streak?: number;        // losses in a row before this match
  /** match 1 of a new-opening career: same lines, first-night words (firstMatchText.ts). Absent everywhere else */
  firstMatch?: boolean;
  tablePos: number;
  totalTeams: number;
  /** how many league matches the club has played: before the league starts, and in its first rounds, there is no table to read (a context that leaves it out counts as mid-season) */
  played?: number;
  /** the first rounds after a promotion or a title, and a season that is not the first and not after one (for the opening lines) */
  justUp?: boolean;
  newSeason?: boolean;
  /** our club's short name, for a fan who speaks of it */
  club?: string;
  /** the terrace meter itself, so the stand can talk about how full it is */
  fans: number;
}

export interface FanMessage {
  fan: Fan;
  text: string;
  /** stable id of the chosen line, used to avoid repeating it soon */
  id: string;
}

export type Line = {
  id: string;
  voice?: Voice;
  when: (c: FanContext) => boolean;
  text: (c: FanContext, r: Rng) => string;
};

/* ----------------------------------------------------------------- slots */

/** the table means something only after a few rounds: a terrace never quotes a place on the eve of the opening round */
const ranked = (c: FanContext) => (c.played ?? 99) >= 3;

const pick = (r: Rng, arr: string[]) => arr[Math.floor(r() * arr.length)];

const FORMATION = ['4-4-2', '4-3-3', 'חמישה מאחורה', 'שלישיית בלמים', '4-2-3-1', 'שני קשרים אחורה'];
const OTHER_JOB = ['שופצניק', 'כפכף', 'נהג משאית', 'הבן של חנן', 'כל ילד ביציע', 'אשתי', 'המוכר בפלאפל'];
const OLD_NAME = ['שיקו', 'אליקים', 'בוזגלו הזקן', 'רחמים', 'הפנתר'];

/** How the know-it-all sees the tactic you actually set. */
function tacticGripe(c: FanContext): string {
  if (c.approach === 'attacking') return 'אתה נפתח יותר מדי, שוכח שיש גם הגנה במגרש';
  if (c.approach === 'defensive') return 'למה להסתגר ככה, קבוצה טובה משחררת ולא מפחדת';
  return 'הכל אצלך באמצע, בלי טקטיקה, לא כאן ולא שם';
}

/**
 * The same judgement, pointed forward. Before the match the know it all is not
 * complaining about what happened, he is telling you what to do, so the line
 * has to name the opposite of whatever you set rather than describe it.
 */
function tacticAdvice(c: FanContext): string {
  if (c.approach === 'attacking') return 'תסגור מאחור, אתה נפתח כאילו אין הגנה במגרש';
  if (c.approach === 'defensive') return 'תשחרר קדימה, קבוצה טובה לא מפחדת';
  return 'רק בעיטות למעלה, עזוב אותך טיקי-טאקה';
}

/* ------------------------------------------------------------- pre match */

const PRE: Line[] = [
  // the know-it-all, tactics. always eligible, so this voice is a constant
  { id: 'sage-tactic', voice: 'sage',
    when: () => true,
    text: c => `אני לא מאמן, אבל אם היית שואל אותי ואתה לא שואל, הייתי אומר לך ${tacticAdvice(c)}.` },
  { id: 'sage-formation', voice: 'sage',
    when: () => true,
    text: (c, r) => `תשמע לי טוב, מול קבוצה כזאת משחקים ${pick(r, FORMATION)} וזהו. בלי פוזות! שנים אני אומר את זה ואף אחד לא מקשיב.` },
  { id: 'sage-listen', voice: 'sage',
    when: () => true,
    text: (c, r) => `הבעיה שלך זה לא השחקנים, זה מה שאתה עושה איתם באימונים. ${pick(r, OTHER_JOB)} היה מבין את זה, למה אתה לא.` },
  { id: 'sage-experience', voice: 'sage',
    when: () => true,
    text: () => `תקשיב לי, אני צופה ביציע הזה עוד לפני שנולדת. תקשיב לאנשים שראו כדורגל, לא רק קראו עליו.` },
  { id: 'sage-derby', voice: 'sage',
    when: c => c.isDerby,
    text: c => `דרבי מול ${c.rival}. יש דרך אחת לשחק את זה נכון, ואתה כנראה כרגיל תבחר בדרך הקשה. תוכיח לי שאני טועה.` },
  { id: 'sage-fav', voice: 'sage',
    when: c => ranked(c) && c.tablePos <= 2,
    text: () => `מקום ראשון ומשחקים ככה. תאר לך איפה היינו אם היו מקשיבים לי מההתחלה.` },

  // doom
  { id: 'doom-generic', voice: 'doom',
    when: () => true,
    text: () => `יש לי הרגשה רעה על מחר. אל תגידו שלא אמרתי, אני תמיד יודע מראש ומזהיר.` },
  { id: 'doom-derby', voice: 'doom',
    when: c => c.isDerby,
    text: c => `דרבי מול ${c.rival}, ואנחנו נכנסים לזה בדיוק כמו כל שנה. אני כבר מכין את עצמי לגרוע מכל.` },
  { id: 'doom-streak', voice: 'doom',
    when: c => (c.streak ?? 0) >= 2,
    text: () => `שני הפסדים ומחר יבוא השלישי, שלא תגיד לא אמרתי לך. הלוואי ותוכיח שאני מנחוס, אבל אני לא.` },

  // nostalgic
  { id: 'nost-day', voice: 'nostalgic',
    when: (c) => true,
    text: (c, r) => `בזמני ${pick(r, OLD_NAME)} היה משחק פצוע ולא בוכה. היום ילד מקבל מכה ורוצה חילוף. תזכיר להם מאיפה באנו.` },
  { id: 'nost-home', voice: 'nostalgic',
    when: c => c.isHome,
    text: () => `פעם היו באים 3000 איש למשחק כזה. גם אם באים פחות היום, על המגרש חייבים לכבד את הסמל על החולצה.` },

  // hope
  { id: 'hope-generic', voice: 'hope',
    when: () => true,
    text: () => `יש לי הרגשה טובה השבוע. הכנתי אפילו ג'חנונים וסמבוסקים לחבר׳ה. הולכים על שלוש נקודות, אני מאמין בך.` },
  { id: 'hope-top', voice: 'hope',
    when: c => ranked(c) && c.tablePos <= 4,
    text: c => `מקום ${c.tablePos}, ואתה יודע מה, זו השנה שלנו. אני מרגיש את זה בעצמות.` },

  // superstition
  { id: 'super-derby', voice: 'super',
    when: c => c.isDerby,
    text: () => `לובש את אותה חולצה מהניצחון הקודם בדרבי, לא כיבסתי בכוונה. אתה תעשה את שלך, אני אעשה את שלי.` },
  { id: 'super-top', voice: 'super',
    when: c => ranked(c) && c.tablePos <= 2,
    text: c => `לא רוצה לדבר ולהגיד באיזה מקום אנחנו שחס וחלילה לא נעשה עין הרע. רק תמשיך, בשקט, בלי לספר לאף אחד. טפו טפו טפו חמסה!` },

  // hot head
  { id: 'hot-generic', voice: 'hot',
    when: () => true,
    text: c => `מחר אני אהיה צרוד עד סוף השבוע, כרגיל. תביא לי סיבה לצעוק מרוב שמחה ולא מרוב עצבים.` },

  // numbers
  { id: 'num-table', voice: 'numbers',
    when: c => ranked(c),
    text: c => `מקום ${c.tablePos} מתוך ${c.totalTeams}. ניצחון מחר וקופצים, תיקו ונשארים תקועים. אני כבר חישבתי הכל, סמוך עליי.` },
  { id: 'num-away', voice: 'numbers',
    when: c => !c.isHome,
    text: c => `בחוץ מול ${c.rival} מספיק לא להפסיד. נקודה שם שווה שתיים אצלנו, תשחק על נקודה.` },

  // heart
  { id: 'heart-generic', voice: 'heart',
    when: () => true,
    text: () => `אני לא ישן טוב לפני משחק, אתה יודע את זה. תעשו את זה בשבילנו, זה כל מה שיש לנו בחיים.` },
  { id: 'heart-away', voice: 'heart',
    when: c => !c.isHome,
    text: c => `נוסעים ל${c.rival}, יוצאים בצהריים בשביל משחק בערב. אל תביישו אותנו שם, בחייאת באנו מרחוק.` },

  // the town itself, this is what makes it your club and not just a club
  { id: 'city-hope', voice: 'hope',
    when: () => true,
    text: c => `כל ${c.city} מדברת רק על המשחק הזה. תביא לנו נצחון בחייאת רבאק! אנחנו צריכים את זה.` },
  { id: 'city-heart', voice: 'heart',
    when: () => true,
    text: c => `אני נולדתי ב${c.city}, אבא שלי ואפילו סבא שלי נולדו פה. תדאג שנלך גאים ברחוב אחרי המשחק.` },
  { id: 'city-sage', voice: 'sage',
    when: () => true,
    text: c => `אני רואה כדורגל ב${c.city} עוד לפני שהיה לך שיער בפרצוף. תקשיב למי שמכיר את הקבוצה הזאת.` },
  { id: 'city-nost', voice: 'nostalgic',
    when: c => c.isHome,
    text: c => `פעם חצי ${c.city} הייתה במגרש במשחק כזה. תזכיר להם על מה אנחנו משחקים פה.` },
  { id: 'city-num', voice: 'numbers',
    when: () => true,
    text: c => `${c.city} מחכה לעלייה כבר שנים. אני יודע כמה נקודות צריך, רק תעשה את שלך על המגרש.` },

  // context lines that any everyman voice can carry
  { id: 'ctx-cold',
    when: c => c.coldStriker !== null && c.coldWeeks >= 3,
    text: c => `${c.coldStriker} כבר ${c.coldWeeks} מחזורים לא שם את הכדור ברשת. אני לא מאמן, אבל אולי תן לו לנוח קצת, מה כבר יש להפסיד.` },
  { id: 'ctx-young',
    when: c => c.youngster !== null,
    text: c => `ראיתי את ${c.youngster} בנוער ואמרתי אז שהילד הזה משהו אחר. תן לו דקות, אתה עוד תודה לי.` },
  { id: 'ctx-streak',
    when: c => (c.streak ?? 0) >= 2,
    text: () => `שני הפסדים ברצף, בבית כבר מסתכלים עליי בעין עקומה. תביא ניצחון אחד, קטן, רק שנוכל להרים ראש.` },
  // the terrace meter, at either end of the scale
  { id: 'fans-full-pre', voice: 'hope',
    when: c => (c.fans ?? 50) >= FANS_LOUD,
    text: () => `היציע מלא כבר שבועות, אנשים באים שעה לפני בשביל מקום טוב. תראה להם שזה שווה את זה.` },
  { id: 'fans-full-warn', voice: 'sage',
    when: c => (c.fans ?? 50) >= FANS_LOUD,
    text: () => `עכשיו כל העיר אוהבת אותך, אז תקשיב לי דווקא עכשיו. בדיוק ככה מתחילים להתפזר.` },
  { id: 'fans-empty-kid', voice: 'heart',
    when: c => (c.fans ?? 50) <= FANS_QUIET,
    text: () => `הבאתי את הילד והוא שאל למה אין אנשים. לא ידעתי מה לענות לו. בושה.` },
  { id: 'fans-empty-season', voice: 'doom',
    when: c => (c.fans ?? 50) <= FANS_QUIET,
    text: () => `חצי מהמנויים שלי כבר לא טורחים לבוא. אני עוד בא, אבל גם אני מתחיל לשאול למה.` },

  { id: 'ctx-generic',
    when: () => true,
    text: () => `מחר משחק. החולצה מוכנה, סוגר את המכולת מוקדם, אנחנו נהיה שם. תעשו שיהיה שווה את זה.` },
];

/* ------------------------------------------------------------ post match */

const POST: Line[] = [
  // the know-it-all takes the credit or says he told you so
  { id: 'sage-win', voice: 'sage',
    when: c => c.result === 'win',
    text: () => `סוף סוף עשית מה שאני אומר כבר חודש. רואה, לא צריך תואר במאמנות, צריך רק להקשיב לי.` },
  { id: 'sage-win-score', voice: 'sage',
    when: c => c.result === 'win' && !!c.scorer,
    text: c => `${c.scoreLine}. ${c.scorer} הבקיע בדיוק מאיפה שאמרתי שצריך לשחק. אני לא רוצה להגיד, אבל אמרתי לך.` },
  { id: 'sage-loss', voice: 'sage',
    when: c => c.result === 'loss',
    text: c => `אתה מאמן אתה? אמרתי לך לא לשחק ככה, ${tacticGripe(c)}. עכשיו כולם חכמים אחרי המשחק, אבל אני אמרתי לפני.` },
  { id: 'sage-draw', voice: 'sage',
    when: c => c.result === 'draw',
    text: () => `תיקו, וגם אותו היית יכול להפוך לניצחון אם היית משנה בזמן. אני ראיתי את זה מהיציע, איך אתה לא ראית מהקווים.` },

  // doom
  { id: 'doom-loss', voice: 'doom',
    when: c => c.result === 'loss',
    text: () => `אמרתי שזה ייגמר ככה, לא אמרתי. אני לא נהנה בלהיות צודק, פשוט אני מכיר את הקבוצה הזאת שנים. חלשים.` },
  { id: 'doom-draw', voice: 'doom',
    when: c => c.result === 'draw',
    text: () => `תיקו היום, הפסד בשבוע הבא, אני כבר מריח את זה. תוכיח לי שאני טועה, באמת שאשמח.` },
  { id: 'doom-win', voice: 'doom',
    when: c => c.result === 'win',
    text: () => `ניצחנו, יופי, אבל אל תתרגלו. אחרי ניצחון כזה תמיד באה נפילה, ראיתי את הסרט הזה מיליון פעם.` },

  // nostalgic
  { id: 'nost-any', voice: 'nostalgic',
    when: () => true,
    text: (c, r) => `${c.scoreLine}. ${pick(r, OLD_NAME)} היה סוגר משחק כזה בעיניים עצומות. משהו בכדורגל של פעם היה אחר, אני אומר לך.` },

  // numbers
  { id: 'num-win', voice: 'numbers',
    when: c => c.result === 'win' && ranked(c),
    text: c => `שלוש נקודות, ${c.scoreLine}, ועכשיו אנחנו במקום ${c.tablePos}. עשיתי את החשבון בראש עוד לפני השריקה.` },
  { id: 'num-loss', voice: 'numbers',
    when: c => c.result === 'loss',
    text: c => `הפסד, וזה הפרש שערים שלא נשכח בסוף העונה. אני סופר כל שער, גם אלה שאנחנו סופגים בדקה ה90.` },

  // hope
  { id: 'hope-loss', voice: 'hope',
    when: c => c.result === 'loss',
    text: () => `הפסדנו, בסדר, קמים וממשיכים. עוד לא נגמר כלום, אני עדיין מאמין בחבר׳ה האלה ובך. משחק הבא תנו הכל!` },
  { id: 'hope-draw', voice: 'hope',
    when: c => c.result === 'draw',
    text: () => `נקודה זו נקודה, לוקחים והולכים הביתה בראש מורם. השבוע הבא שלנו, אתה תראה.` },

  // heart
  { id: 'heart-win', voice: 'heart',
    when: c => c.result === 'win',
    text: () => `רקדתי ביציע כמו ילד. תמסור לחבר׳ה שהם עשו לי את השבוע, שיידעו כמה זה חשוב לנו.` },
  { id: 'heart-loss', voice: 'heart',
    when: c => c.result === 'loss',
    text: () => `נכנס לי ישר ללב, אני לוקח את זה הביתה עד שבת. תעשו משהו במחזור הבא, בשבילי בחייאת.` },

  // hot
  { id: 'hot-win', voice: 'hot',
    when: c => c.result === 'win' && c.isDerby,
    text: c => `ניצחנו את הדרבי מול ${c.rival}! צרחתי עד שהשכן דפק בקיר. שווה כל דקה, אלוף.` },
  { id: 'hot-loss', voice: 'hot',
    when: c => c.result === 'loss',
    text: () => `יצאתי צרוד ועצבני, אבל מחר כבר אחשוב על המשחק הבא. ככה זה שאוהבים את הקבוצה, תעשה שיהיה שווה את זה.` },

  // the town, after the whistle
  { id: 'city-win', voice: 'heart',
    when: c => c.result === 'win',
    text: c => `הלילה כל ${c.city} חוגגת. עברתי ברחוב וכולם מחייכים, זה מה שאנחנו אוהבים אצלך.` },
  { id: 'city-win-hope', voice: 'hope',
    when: c => c.result === 'win',
    text: c => `${c.scoreLine}. עוד כאלה ו${c.city} חוזרת למפה של הכדורגל. אמרתי לך שזו השנה שלנו.` },
  { id: 'city-loss', voice: 'heart',
    when: c => c.result === 'loss',
    text: c => `כל ${c.city} הולכת לישון עצובה הלילה. תחזיר לנו את החיוך במחזור הבא, בשביל העיר. אנחנו גמורים.` },

  // context
  { id: 'ctx-win-derby',
    when: c => c.result === 'win' && c.isDerby,
    text: c => `ניצחנו את ${c.rival}. עברתי ליד היציע שלהם ולא אמרתי מילה, רק חייכתי. זה הספיק. אפסים!` },
  { id: 'ctx-loss-derby',
    when: c => c.result === 'loss' && c.isDerby,
    text: c => `הפסדנו את הדרבי ל${c.rival}. אני מנתק את הטלפון עד יום רביעי, שלא יחפשו אותי. בושות.` },
  { id: 'ctx-loss-cold',
    when: c => c.result === 'loss' && c.coldStriker !== null,
    text: c => `${c.scoreLine}. ושוב, ${c.coldStriker} לא בעניינים. אני לא מאמן, אבל יש לי עיניים בראש. תעשה איתו משהו כבר.` },
  { id: 'ctx-draw',
    when: c => c.result === 'draw',
    text: () => `תיקו. חצי יציע יצא מרוצה וחצי קילל, וזה בערך מסכם הכל. אין על מה לבכות ואין על מה לחגוג.` },
  // the terrace meter, at either end of the scale
  { id: 'fans-full-win', voice: 'heart',
    when: c => c.result === 'win' && (c.fans ?? 50) >= FANS_LOUD,
    text: () => `שמעת אותנו היום? זה לא יציע, זה גדוד. תמסור לחבר׳ה שהם עשו את זה.` },
  { id: 'fans-full-roar', voice: 'nostalgic',
    when: c => c.result === 'win' && (c.fans ?? 50) >= FANS_LOUD,
    text: () => `לא שמעתי את האצטדיון ככה מאז שעלינו. אל תיתן לזה להיגמר. חיים את החלום! גאה בכם.` },
  { id: 'fans-empty-loss', voice: 'hot',
    when: c => c.result === 'loss' && (c.fans ?? 50) <= FANS_QUIET,
    text: () => `האצטדיון היה ריק וגם מה שהיה בו יצא בדקה 60. תעשה משהו לפני שלא יישאר אף אחד.` },
  { id: 'fans-empty-habit', voice: 'sage',
    when: c => c.result === 'loss' && (c.fans ?? 50) <= FANS_QUIET,
    text: () => `פעם היה פה קהל. היום באים מתוך הרגל, וגם זה נגמר. אני עדיין פה, אבל תעשה חשבון נפש.` },

  { id: 'ctx-loss',
    when: c => c.result === 'loss',
    text: () => `הפסד. שילמתי חניה, קניתי גרעינים. הוצאתי 100 שקל על המשחק המעפן הזה! ובשביל מה?! תעשה משהו עד המחזור הבא.` },
];

/** Every line in the terrace's mouth, for the checks that read them all. */
export function everyFanLine(): ReadonlyArray<Line & { pool: FanTiming }> {
  return [...PRE.map(l => ({ ...l, pool: 'pre' as const })), ...POST.map(l => ({ ...l, pool: 'post' as const }))];
}

/**
 * Choose a line that fits what actually happened, prefer one not heard lately,
 * then hand it to a fan whose head matches the line. Deterministic for a given
 * rng, so it is stable across re renders of the same week.
 */
export function fanMessage(ctx: FanContext, rng: Rng, recent: string[] = []): FanMessage {
  const pool = ctx.timing === 'pre' ? PRE : POST;
  const seen = new Set(recent);
  const fits = pool.filter(l => (ctx.tier === undefined ? !TOP_FAN_NEW[l.id] : inTier(FAN_TIERS, l.id, ctx.tier)) && l.when(ctx));
  const base = fits.length ? fits : [pool[pool.length - 1]];
  const fresh = base.filter(l => !seen.has(l.id));
  const from = fresh.length ? fresh : base;
  const line = from[Math.floor(rng() * from.length)];

  // a fan whose voice owns the line, or anyone when the line is voice neutral
  const cast = ctx.tier === undefined ? FANS : FANS.filter(f => inTier(FAN_TIERS, f.id, ctx.tier!));
  const candidates = line.voice ? cast.filter(f => f.voice === line.voice) : cast;
  const roster = candidates.length ? candidates : cast.length ? cast : FANS;
  const fan = roster[Math.floor(rng() * roster.length)];

  // ליגת העל has its own wording for part of the terrace (topFlightText.ts)
  const own = ctx.tier !== undefined && ctx.tier >= 5 ? TOP_FAN_REWRITE[line.id] : undefined;
  // the first match of a new-opening career: the same line and fan, said without a past (firstMatchText.ts)
  const first = ctx.firstMatch && !own ? FIRST_FAN[line.id] : undefined;
  if (first) {
    const say = first({ scoreLine: ctx.scoreLine ?? '', city: ctx.city, scorer: ctx.scorer, coldStriker: ctx.coldStriker, gripe: tacticGripe(ctx) });
    return { fan, text: say[Math.floor(rng() * say.length)], id: line.id };
  }
  return { fan, text: own ? own.text : line.text(ctx, rng), id: line.id };
}

/* ליגת העל only: the terrace of a professional club. Each one with the night it fits. */
const TOP_FAN_WHEN: Record<string, (c: FanContext) => boolean> = {
  'ultras-derby-police': c => c.isDerby,
  'ultras-away-convoy': c => !c.isHome,
  'fans-euro-place': c => ranked(c) && c.tablePos >= 3 && c.tablePos <= 5,
  'fans-title-race': c => ranked(c) && c.tablePos <= 2,
  'fans-win-linger': c => c.isHome && c.result === 'win',
  'fans-relegation-fear': c => ranked(c) && c.result !== 'win' && c.tablePos >= c.totalTeams - 3,
};
for (const [id, when] of Object.entries(TOP_FAN_WHEN)) {
  const n = TOP_FAN_NEW[id];
  if (n) (n.when === 'pre' ? PRE : POST).push({ id, when, text: () => n.text });
}

/* ----------------------------------------------------------------- the opening rounds
   Itzik, 15.10: on the eve of the first round a fan talked of a table that did not exist. The opening rounds have lines of
   their own, written for them and approved by him, that never read a table, a score or a result. */
const opens = (c: FanContext) => (c.played ?? 99) <= 2;
for (const o of OPENERS) {
  PRE.push({
    id: o.id,
    voice: o.voice as Voice,
    when: c => opens(c)
      && (o.when === 'any' || (o.when === 'home' ? c.isHome : !c.isHome))
      && (o.season === 'any' || (o.season === 'promoted' ? !!c.justUp : !!c.newSeason))
      && (c.tier === undefined || c.tier < 5 || o.top),
    text: c => o.text.replace(/\{rival\}/g, c.rival).replace(/\{city\}/g, c.city).replace(/\{club\}/g, c.club ?? c.city),
  });
}
