/**
 * Post match press conference. A reporter from an Israeli sports outlet asks
 * one question, chosen to fit the match you just played and your standing.
 * Your answer nudges morale and prestige, so the media game is part of the loop.
 *
 * Outlets are invented so no real brand is used, but they read like the scene:
 * ספורט WOW, ספורט 555, ספורט ישראל, Yספורט, Nספורט.
 */

import type { Rng } from '../engine/matchEngine.ts';

import { PRESS_TIERS, inTier } from './leagueGate.ts';
import { TOP_PRESS_REWRITE, TOP_PRESS_NEW } from './topFlightText.ts';

export const OUTLETS = ['ספורט WOW', 'ספורט 555', 'ספורט ישראל', 'Yספורט', 'Nספורט'] as const;
export type Outlet = typeof OUTLETS[number];

export type PressTone = 'funny' | 'serious' | 'brutal';

/** The situation after a match, used to pick a fitting question. */
export interface PressContext {
  result: 'big_win' | 'win' | 'draw' | 'loss' | 'thrashing';   // thrashing = heavy loss
  isDerby: boolean;
  lowMorale: boolean;
  highPrestige: boolean;
  tablePos: number;      // 1 = top
  totalTeams: number;
  star: string;          // your best player's family name
  rival: string;         // opponent short name
  city: string;          // the club's home town, for the local press angle
  /* what the terrace saw, for its own questions */
  isHome: boolean;
  fans: number;          // the fans meter
  lossRun: number;       // defeats in a row, tonight's included
  gate: number;          // how full the ground was, 0..1
  justUp: boolean;       // the first rounds after a promotion, when the ticket costs more
  /* the wider night: the season, the league and the stories only some rounds have */
  week: number;
  season: number;
  rounds: number;          // rounds in this season
  tier: number;            // 1 = ליגה ג׳ .. 5 = ליגת העל
  firstSeasonAtTier: boolean;  // promoted into this tier last summer
  lead: number;            // points over second, when first; 0 otherwise
  margin: number;          // my goals minus theirs tonight
  gf: number;              // my goals tonight
  ga: number;              // theirs tonight
  oppPos: number;          // tonight's opponent in the table, 1 = top
  nextIsDerby: boolean;    // the next round is the derby
  unbeatenBefore: number;  // unbeaten run walking INTO tonight
  winRun: number;          // wins in a row, tonight's included
  scoutHired: boolean;     // a scout was hired this season
  scoutManPlayed: boolean; // a man the scout brought got minutes tonight
  youthInSquad: boolean;   // an academy-age boy sits in the senior squad
  youthDebut: boolean;     // an academy-age boy played his first game tonight
  youthStar: boolean;      // an academy-age boy was the best man on the pitch
  injuryTonight: boolean;  // one of mine went off hurt tonight
  allGoalsFirstHalf: boolean; // every goal of the night fell before the break
  /** match 1 of a new-opening career: same questions, first-night words (firstMatchText.ts). Absent everywhere else */
  firstMatch?: boolean;
}

export interface PressAnswer {
  label: string;
  /** what the line does to the dressing room, to his standing, and to the terrace */
  effect: { morale?: number; prestige?: number; fans?: number; money?: number };
  reply: string;   // the reporter's or public reaction after you answer
}

export interface PressQuestion {
  /** stable name of the template, remembered so the same question is not asked again soon */
  id: string;
  tone: PressTone;
  text: string;
  answers: PressAnswer[];
  /** the player a match question is about, so the top flight's rewording can name him */
  who?: string;
}

export type QGen = (c: PressContext) => PressQuestion;

/* Each generator returns a question already filled with the live context. */

const BY_RESULT: Record<PressContext['result'], QGen[]> = {
  big_win: [
    c => ({
      id: 'big_win_real',
      tone: 'serious',
      text: `ניצחון גדול. ${c.star} היה בלתי ניתן לעצירה. זו הקבוצה האמיתית או שהיריבה פשוט הייתה חלשה?`,
      answers: [
        { label: 'תתרגלו, זה רק הפרומו! באנו לשבור את הליגה', effect: { morale: +1, prestige: +1, fans: +2 }, reply: 'איזה ביטחון בקבוצה, מרגיש קצת שחצני ויהיר. נראה בסוף העונה.' },
        { label: 'היריבה הייתה חלשה, ואנחנו עוד לא טובים מספיק', effect: { morale: -1, prestige: +2 }, reply: 'כנות זה דבר חשוב, לא סיפקת לנו משהו חדש.' },
      ],
    }),
    c => ({
      id: 'big_win_raise',
      tone: 'funny',
      text: `אחרי הביצוע הזה, מתי אתה מבקש העלאה מהבעלים?`,
      answers: [
        { label: 'מחר על הבוקר, מקווה שהוא יענה לי הקמצן הזה', effect: { morale: +3, prestige: -2, fans: +1 }, reply: 'צחוק באולם. קטע ענק לטיקטוק. הבעלים לקח רציני.' },
        { label: 'קודם שנעלה ליגה, אחר כך נדבר על כסף', effect: { prestige: +2 }, reply: 'תשובה מקצועית, קצת משעממת.' },
      ],
    }),
    c => ({
      id: 'big_win_message',
      tone: 'serious',
      text: `תוצאה כזאת מול ${c.rival} שולחת מסר לכל הליגה, ללא ספק. לא?`,
      answers: [
        { label: 'כן. שיתחילו לפחד! אנחנו פה', effect: { morale: -1, prestige: +2, fans: +3 }, reply: 'שורה שתישאר. גם אצל היריבות הבאות.' },
        { label: 'המסר היחיד הוא לשחקנים שלי: ממשיכים בעבודה קשה', effect: { morale: +3 }, reply: 'מסר לחדר ההלבשה דרך המיקרופון. יגיע ליעד.' },
      ],
    }),
  ],
  win: [
    c => ({
      id: 'win_control',
      tone: 'serious',
      text: `שלוש נקודות חשובות. הרגשת שהקבוצה בשליטה, או שזה היה יותר קרוב ממה שנראה?`,
      answers: [
        { label: 'שליטה מהדקה הראשונה. יכולנו לשחק בעיניים עצומות', effect: { morale: -1, prestige: +3, fans: +1 }, reply: 'ביטחון. היריבה גזרה את הכותרת ותלתה בחדר ההלבשה שלה. מחכה למשחק הבא' },
        { label: 'היה קרוב ולקחנו. ככה מנצחים משחקים כאלה', effect: { morale: +3 }, reply: 'הערכת את השחקנים. חדר ההלבשה מרוצה מהתשובה.' },
      ],
    }),
    c => ({
      id: 'win_quiet',
      tone: 'funny',
      text: `ניצחתם, והיציע יצא בשקט. איפה החגיגה?`,
      answers: [
        { label: 'היציע צריך לחגוג? שיחגוג. אני מאמן לא ברמן', effect: { morale: +2, prestige: -1, fans: -5 }, reply: 'השחקנים צחקו בחדר ההלבשה. היציע קרא את זה בבוקר ולא צחק.' },
        { label: 'אני מבין אותם. ניצחון כזה לא מספיק לי גם', effect: { morale: -1, prestige: +1, fans: +2 }, reply: 'רעב. היציע הרגיש שמישהו מדבר בשמו.' },
      ],
    }),
    c => ({
      id: 'win_habit',
      tone: 'serious',
      text: `מתחילים להתרגל לנצח אצלכם. אתה לא מפחד שזה משעמם?`,
      answers: [
        { label: 'משעמם? תגיד את זה ליריבות שמקבלות בראש', effect: { morale: +1, prestige: +1, fans: +3 }, reply: 'ביטחון. האוהדים אהבו את הגישה.' },
        { label: 'מי שמשתעמם אצלי יושב בספסל', effect: { morale: -2, prestige: +2 }, reply: 'מסר לחדר ההלבשה, לא לעיתונות. חלק מהספסל נלחץ.' },
      ],
    }),
    c => ({
      id: 'win_rival',
      tone: 'serious',
      text: `${c.rival} קבוצה חזקה היא לא באה לפה להפסיד. מה הכריע בסוף?`,
      answers: [
        { label: 'השופט. הפעם הוא שרק לטובתנו', effect: { prestige: -3, fans: +1 }, reply: 'צחוק באולם, ותלונה של איגוד השופטים תוגש למועדון.' },
        { label: 'סבלנות. חיכינו לרגע שלנו. ידענו שהם ייצאו קדימה', effect: { morale: +2, prestige: +2 }, reply: 'ניתוח מדויק. מי שמבין הנהן.' },
      ],
    }),
  ],
  draw: [
    c => ({
      id: 'draw_point',
      tone: 'serious',
      text: `נקודה בחוץ. אתה מרוצה או מאוכזב?`,
      answers: [
        { label: 'הבאתי אוטובוס, לקחתי נקודה, חוזר הביתה', effect: { morale: +2, prestige: -2, fans: -1 }, reply: 'כנות משעשעת. היציע רצה לשמוע על ניצחון.' },
        { label: 'באנו לנצח, וזה מאכזב', effect: { morale: -1, prestige: +2, fans: +1 }, reply: 'שידרת רעב. היציע אוהב את זה.' },
      ],
    }),
    c => ({
      id: 'draw_who',
      tone: 'funny',
      text: `תיקו מול ${c.rival}. מי משתי הקבוצות יצאה מפה מרוצה יותר?`,
      answers: [
        { label: 'הם. והם יזכרו את זה כשנפגוש אותם במחזור הבא', effect: { morale: -1, prestige: +3, fans: +1 }, reply: `איום מנומס. אצל ${c.rival} תלו את זה על הקיר.` },
        { label: 'אף אחד. ואני בסדר עם זה', effect: { morale: +1 }, reply: 'תשובה שקטה. הכתב עבר הלאה.' },
      ],
    }),
  ],
  loss: [
    c => ({
      id: 'loss_fans',
      tone: 'brutal',
      text: `הפסד שכואב. יש אוהדים שכבר קוראים להחליף אותך. יש לך מה להגיד להם?`,
      answers: [
        { label: 'שיבואו לאימון ביום שני ויראו מי עובד פה', effect: { morale: -2, prestige: +2, fans: -2 }, reply: 'הזמנה עם עוקץ. ביום שני האוהדים רוצים להגיע לאימון.' },
        { label: 'הם צודקים. אני כועס יותר', effect: { morale: -1, prestige: -1, fans: +2 }, reply: 'הזדהית עם הכאב שלהם. היציע התרכך.' },
      ],
    }),
    c => ({
      id: 'loss_broke',
      tone: 'serious',
      text: `איפה המשחק נגמר עבורכם לדעתך?`,
      answers: [
        { label: 'בדקה שהשופט החליט למי הוא שורק, פעם באה שישים חולצה שלהם', effect: { morale: +1, prestige: -4, fans: +1 }, reply: 'החדר אהב שמישהו אמר את זה. איגוד השופטים רוצה להגיש קנס.' },
        { label: 'ההרכב שלי, האחריות שלי', effect: { morale: +3, prestige: +2 }, reply: 'הגנת על השחקנים. הם יזכרו את זה.' },
      ],
    }),
    c => ({
      id: 'loss_fair',
      tone: 'brutal',
      text: `אוהדי ${c.rival} יצאו מפה בטוחים שהיו הטובים יותר. הם צודקים?`,
      answers: [
        { label: 'אתה רציני? הם גנבו אותנו היום. היינו טובים בפער מהם.', effect: { morale: +1, prestige: +1, fans: +1 }, reply: 'לא נתת להם קרדיט. חדר ההלבשה שמע שנתת להם גב.' },
        { label: 'היום כן. ואני לא מתבייש להגיד', effect: { morale: -1, prestige: +2, fans: -1 }, reply: 'הגינות. גם היריבה כיבדה את זה. היציע פחות.' },
      ],
    }),
    c => ({
      id: 'loss_lesson',
      tone: 'serious',
      text: `מה לוקחים מהערב הזה לשבוע הבא?`,
      answers: [
        { label: 'את הפיצה אחרי המשחק, מה אפשר לקחת מהערב הזה?', effect: { morale: +2, prestige: -2, fans: +1 }, reply: 'כולם צוחקים, הבעלים חושב שזה לא הזמן לצחוק.' },
        { label: 'שמשחק לא נגמר בשריקת הפתיחה', effect: { morale: +1, prestige: +1 }, reply: 'מסר לשחקנים דרך המיקרופון. הם קלטו.' },
      ],
    }),
    () => ({
      id: 'loss_tactics_blame',
      tone: 'brutal',
      text: `הפרשנים באולפן אמרו הערב שההפסד הזה הוא טקטי, כלומר שלך. אתה מקבל?`,
      answers: [
        { label: `אם ההפסד שלי אז גם הניצחונות שלי. בודקים את המאזן?`, effect: { prestige: +3 }, reply: `תשובת שחמט. הפרשנים באולפן השתתקו לרגע.` },
        { label: `מקבל הכל. התוכנית שלי, הביצוע שלהם, האחריות שלי`, effect: { morale: +4, prestige: -1 }, reply: `כתפיים רחבות. החדר ראה את זה בשידור.` },
      ],
    }),
  ],
  thrashing: [
    c => ({
      id: 'thrash_shame',
      tone: 'brutal',
      text: `ספגתם תבוסה היום. איך בכלל מסבירים משחק כזה לאוהדים שנסעו עד לכאן?`,
      answers: [
        { label: 'יום כזה לא יחזור, אני מבטיח להם. גם אם זה אומר שאנחנו מתאמנים פעמיים ביום', effect: { morale: +2, prestige: -2, fans: +2 }, reply: 'הבטחה גדולה. עכשיו תצטרך לעמוד בה.' },
        { label: 'הביזיון עליי, לא על השחקנים', effect: { morale: +3, prestige: -1 }, reply: 'לקחת אחריות על הביזיון. מהלך של מנהיג אבל פחות מקצועי.' },
      ],
    }),
    c => ({
      id: 'thrash_home',
      tone: 'funny',
      text: `בתוצאה כזאת, בא לך בכלל לענות לי או שאתה מעדיף ללכת הביתה?`,
      answers: [
        { label: 'אחרי המשחק כזה אני לא רוצה לדבר עם אשתי. אז איתך? שחרר אותי', effect: { morale: -2, prestige: -3 }, reply: 'קצר ועצבני. האולם לא ידע אם לצחוק.' },
        { label: 'אני פה כמו שאתה רואה, תשאל מה שבא לך', effect: { prestige: +1, fans: +1 }, reply: 'לא ברחת למרות ההפסד הקשה. מכובד.' },
      ],
    }),
    c => ({
      id: 'thrash_room',
      tone: 'serious',
      text: `מה נאמר בחדר ההלבשה אחרי השריקה?`,
      answers: [
        { label: 'הכל כולל כמה דברים שעפו על השחקנים, בושה.', effect: { morale: -3, prestige: +2, fans: +3 }, reply: 'ברור לכולם שאתה עצבני כי זה חשוב לך. היציע אוהב את האכזבה שלך.' },
        { label: 'כלום. שתיקה. לפעמים זה הכי חזק', effect: { morale: +1 }, reply: 'תשובה רגועה מדי לסיטואציה. הכתב לא שאל עוד.' },
      ],
    }),
    () => ({
      id: 'thrash_tape',
      tone: 'serious',
      text: `משחק כזה, מראים לשחקנים את הצילומים או שורפים את הקלטת?`,
      answers: [
        { label: `רואים הכל, פריים פריים, ביחד. כאב זה מורה טוב`, effect: { prestige: +2, morale: -2 }, reply: `גישת מבוגרים. יום הצפייה יהיה ארוך.` },
        { label: `שורפים. יש משחקים שלומדים מהם רק לשכוח מהר`, effect: { morale: +2 }, reply: `חמלה טקטית. פסיכולוגים הנהנו מהבית.` },
      ],
    }),
  ],
};

/** Special overrides that beat the result based questions when relevant. */
const DERBYS: Array<{ when?: (c: PressContext) => boolean; gen: QGen }> = [
  { gen: c => ({
    id: 'derby_pressure',
    tone: 'serious',
    text: `דרבי מול ${c.rival} זה לא עוד משחק. הרגשת את הלחץ המיוחד היום?`,
    answers: [
      { label: 'בשביל משחקים כאלה אני בתחום הזה, אין על האווירה של דרבי', effect: { morale: +3, prestige: +4, fans: +3 }, reply: 'האוהדים אומרים שיצאת גבר ומאמן עם ביצים.' },
      { label: 'לחץ זה חלק מהמשחק, אני לא ישן טוב לפני משחק כזה', effect: { fans: -3 }, reply: 'תשובה שהאוהדים לא אוהבים לשמוע, פחדן וקר מדי.' },
    ],
  }) },
  { gen: c => ({
    id: 'derby_week',
    tone: 'funny',
    text: `שבוע שלם שכל העיר מדברת על המשחק הזה. איך משאירים את הקבוצה בפוקוס למשחק הבא?`,
    answers: [
      { label: 'נותנים להם ליהנות הלילה בעיר, ואז עובדים', effect: { morale: +3, prestige: -1, fans: +2 }, reply: 'אנושי. חדר ההלבשה אהב לשמוע את זה. הבעלים פחות.' },
      { label: 'מחר בבוקר הדרבי כבר מאחורינו. זה החוק אצלנו', effect: { morale: +1, prestige: +3 }, reply: 'ראש של מקצוען. הבעלים אהב את זה.' },
    ],
  }) },
  { when: c => won(c), gen:
    c => ({
      id: 'derby_city_tomorrow',
      tone: 'funny',
      text: `תאר לי את ${c.city} מחר בבוקר מנקודת המבט של אוהד שלכם.`,
      answers: [
        { label: `קפה טעים יותר, פקקים נעימים יותר, והעבודה עוברת בטיסה. ניצחון דרבי מתקן הכל`, effect: { fans: +6 }, reply: `פואטיקה של יום ראשון. הציטוט הודבק בכל קבוצת וואטסאפ בעיר.` },
        { label: `רגיל. עוד שלוש נקודות. תשאל אותי על הטבלה`, effect: { prestige: +2, fans: -3 }, reply: `קור מקצועי בערב הכי חם. היציע לא הבין אותך.` },
      ],
    }), },
  { when: c => lost(c), gen:
    () => ({
      id: 'derby_lost_captain_face',
      tone: 'brutal',
      text: `ראינו את הקפטן שלך יושב על הדשא חמש דקות אחרי השריקה. מה אומרים לשחקן ברגע כזה?`,
      answers: [
        { label: `כלום. יושבים לידו. ישבתי לידו`, effect: { morale: +4, fans: +2 }, reply: `תמונת הערב, גם בלי מצלמה.` },
        { label: `שיקום. דרבי חוזר בסיבוב השני, והכאב הזה ישרת אותנו`, effect: { morale: +2, prestige: +1 }, reply: `הפיכת כאב לתחמושת. היציע רשם את התאריך.` },
      ],
    }), },
  { when: c => c.result === 'draw', gen:
    () => ({
      id: 'derby_draw_streets',
      tone: 'serious',
      text: `תיקו בדרבי. בעיר אומרים ששני הצדדים הפסידו הערב. אתה מסכים?`,
      answers: [
        { label: `בדרבי מי שלא מפסיד לא הפסיד. תשאל אותם אם הם היו לוקחים את התיקו בדקה 80`, effect: { prestige: +1, fans: +1 }, reply: `היגיון של יציע. חצי העיר הנהנה.` },
        { label: `מסכים. דרבי משחקים כדי לנצח, וזה לא קרה. נתקן בסיבוב השני`, effect: { morale: +2, fans: +2 }, reply: `רעב גלוי והבטחה לתאריך. היציע שמר אותה.` },
      ],
    }), },
  { when: c => won(c), gen:
    () => ({
      id: 'derby_next_year_kids',
      tone: 'funny',
      text: `סיפרו לי שילד ביציע שאל את אבא שלו אם אתם מנצחים בדרבי כל שנה. מה אתה עונה לילד?`,
      answers: [
        { label: `תגיד לו שכן, ואני אדאג שלא אצא שקרן`, effect: { fans: +5 }, reply: `הבטחה לילד בשידור חי. אין מסוכנת ממנה, אין יפה ממנה.` },
        { label: `תגיד לו שבשביל ערבים כאלה שווה לחכות שנה`, effect: { fans: +3, prestige: +1 }, reply: `חינוך לסבלנות של אוהד. האבות ביציע הנהנו.` },
      ],
    }), },
];

const RELEGATION: QGen = c => ({
  id: 'relegation_believe',
  tone: 'brutal',
  text: `אתם מקום ${c.tablePos} מתוך ${c.totalTeams}, ממש בתחתית. אתה עדיין מאמין שאפשר להציל את העונה?`,
  answers: [
    { label: 'אם הייתי יודע כמה נקודות יש הייתי עונה ברצינות. נמשיך לשחק כדורגל', effect: { morale: +1, prestige: -3, fans: -1 }, reply: 'חוסר מקצועיות אבל כנה, האוהדים סופרים את הנקודות שיש בקופה ושולחים לך.' },
    { label: 'נילחם על כל נקודה, אין ויתור', effect: { morale: +3, prestige: +2, fans: +2 }, reply: 'קריאת קרב. השחקנים הזדקפו, היציע גם.' },
  ],
});

/**
 * The local angle. The town paper cares less about the league table and more
 * about whether its own club is going somewhere, which is exactly the belonging
 * the city pick is built on.
 */
const LOCAL: QGen[] = [
  c => ({
    id: 'local_town',
    tone: 'serious',
    text: `כתב מקומון ${c.city} כאן. כל העיר שואלת אותי מתי סוף סוף חוזרים למקום שמגיע לנו. מה אני אגיד להם?`,
    answers: [
      { label: 'תגיד להם שרק ברגע שיגיע לעיר מאמן תותח זה יקרה. הוא הגיע, אני כאן!', effect: { morale: +1, prestige: +5, fans: +3 }, reply: 'שורה לכותרת בעיתון המקומון מחר. עכשיו היא תלויה על הצוואר שלך.' },
      { label: 'תגיד להם לבוא למגרש ולראות, הם הדחיפה שלנו להצלחה', effect: { morale: +1, prestige: -1, fans: +5 }, reply: 'קריאה ליציע. פשוט ונכון.' },
    ],
  }),
  c => ({
    id: 'local_cafe',
    tone: 'funny',
    text: `ב${c.city} כבר מדברים עליך בבתי קפה יותר מאשר על ראש העיר. איך זה מרגיש?`,
    answers: [
      { label: 'ראש עיר מתחלף, מאמן טוב כמוני נשאר', effect: { prestige: +3, fans: +1 }, reply: 'שורה לכותרת. חצי חייכו, חצי הרימו גבה. ראש העיר לא חייך.' },
      { label: 'שיפסיקו, אני בסך הכל מאמן כדורגל', effect: { morale: +1 }, reply: 'צניעות זה חשוב. חיבבו את זה.' },
    ],
  }),
  c => ({
    id: 'local_kids',
    tone: 'serious',
    text: `הרבה ילדים ב${c.city} התחילו ללבוש את הצבעים בזכות מה שאתה עושה. אתה מרגיש את האחריות הזאת?`,
    answers: [
      { label: 'הילדים בעיר צריכים ללבוש את החולצות עם השם שלי, הכל בזכותי', effect: { prestige: +3, fans: -2 }, reply: 'שחצן ויהיר, ההורים יחשבו אם לקנות עוד חולצות.' },
      { label: 'זו הסיבה שאני פה, דור ההמשך חשוב', effect: { morale: +3, prestige: +2, fans: +3 }, reply: 'תשובה מהלב. המקומון מעריך אותך.' },
    ],
  }),
];

/**
 * The terrace's own questions. Each one belongs to a night the crowd actually
 * had, so it is gated on what happened rather than rolled from a pool: the
 * away end that travelled for a defeat, the banner after a home win, the
 * ticket that costs more since the promotion. Two of them are the story of
 * the night and beat everything else, once: three defeats running, and a
 * derby lost.
 */
const lost = (c: PressContext) => c.result === 'loss' || c.result === 'thrashing';
const won = (c: PressContext) => c.result === 'win' || c.result === 'big_win';
const FANS: Array<{ when: (c: PressContext) => boolean; urgent?: boolean; gen: QGen }> = [
  { when: c => c.lossRun >= 3, urgent: true, gen: c => ({
    id: 'fans_boo',
    tone: 'brutal',
    text: `האוהדים שורקים לך בוז ורוצים שתתפטר. מה אתה אומר על זה?`,
    answers: [
      { label: 'אף פעם לא הקשבתי להם, וגם עכשיו לא', effect: { morale: +1, prestige: +1, fans: -5 }, reply: 'החדר הזדקף. היציע רשם. שלט מוכן למחר.' },
      { label: 'אשב עם הבעלים ונקבל החלטה ביחד', effect: { morale: -1, prestige: +1, fans: +1 }, reply: 'תשובה שקולה. הבעלים ראה שהוא לא לבד.' },
    ],
  }) },
  { when: c => c.isDerby && lost(c), urgent: true, gen: c => ({
    id: 'fans_ultras',
    tone: 'brutal',
    text: `האולטראס היה עצבני וחיכו לכם בחניה אחרי הדרבי. דיברת איתם?`,
    answers: [
      { label: 'דיברנו? אוהד כמעט קיבל סטירה. אף אחד לא יקלל את השחקנים שלי', effect: { morale: +4, prestige: -1, fans: -7 }, reply: 'קו אדום. האולטראס קבעו לך פגישה למחר.' },
      { label: 'כן. הקשבתי, והם צודקים בחלק מהדברים', effect: { morale: -1, prestige: +2, fans: +3 }, reply: 'יצאת אליהם. זה נזכר יותר מהתוצאה.' },
    ],
  }) },
  { when: c => !c.isHome && lost(c), gen: c => ({
    id: 'fans_away',
    tone: 'serious',
    text: `ארבעים אוהדים נסעו שלוש שעות בשביל זה. מה אתה אומר להם?`,
    answers: [
      { label: 'הדלק עליי. תביאו קבלות', effect: { prestige: -1, fans: +3 }, reply: 'צחוק ביציע, וקבלות בבוקר.' },
      { label: 'סליחה. הם היו טובים מאיתנו היום', effect: { morale: -1, prestige: +2, fans: +2 }, reply: 'כנות. הם נסעו הביתה פחות כועסים.' },
    ],
  }) },
  { when: c => c.isHome && lost(c) && c.fans >= 60, gen: c => ({
    id: 'fans_sing',
    tone: 'serious',
    text: `הפסדתם, והיציע שר עד הדקה התשעים. מה זה אומר עליהם, ומה עליכם?`,
    answers: [
      { label: 'לפעמים אני רוצה לעלות לשיר איתם, איזה תצוגה הם נתנו', effect: { morale: -3, prestige: +2, fans: +3 }, reply: 'היציע אהב. החדר שמע מי בא לפני מי.' },
      { label: 'שאנחנו חייבים להם משחק. וזה חוב שנשלם', effect: { morale: +2, prestige: +1, fans: +2 }, reply: 'הבטחה קטנה ונכונה. כולם קיבלו.' },
    ],
  }) },
  { when: c => c.isHome && c.gate < 0.5, gen: c => ({
    id: 'fans_empty',
    tone: 'funny',
    text: `היציע היה חצי ריק היום. איפה כולם?`,
    answers: [
      { label: 'מה אתה שואל אותי? תשאל אותם. אנחנו על הדשא', effect: { morale: +1, prestige: -1, fans: -3 }, reply: 'קצת מתנשא. מי שנשאר בבית הרגיש צודק.' },
      { label: 'זו העבודה שלי להחזיר אותם. נגביר את הקצב של המשחק', effect: { prestige: +2, fans: +3 }, reply: 'קיבלת את זה על עצמך. הם שמעו.' },
    ],
  }) },
  { when: c => c.isHome && won(c), gen: c => ({
    id: 'fans_kid',
    tone: 'funny',
    text: `ילד בן שמונה עם החולצה חיכה לך שעה אחרי המשחק. יצאת אליו?`,
    answers: [
      { label: 'אתה יודע כמה ילדים מחכים לי? מלא! אין לי זמן לזה', effect: { prestige: -2, fans: -3 }, reply: 'האמא שלו כתבה פוסט עליך. הוא הגיע לאלף לייקים.' },
      { label: 'יצאתי. הוא קיבל חתימה', effect: { morale: +1, prestige: +1, fans: +4 }, reply: 'התמונה של השבוע. המקומון שם אותה בעמוד הראשון.' },
    ],
  }) },
  { when: c => c.isHome && won(c) && c.fans >= 70, gen: c => ({
    id: 'fans_banner',
    tone: 'funny',
    text: `היציע תלה שלט עם השם שלך. אתה מסתכל על זה?`,
    answers: [
      { label: 'ראיתי. שיתלו גם בבית של הבעלים', effect: { morale: +1, prestige: -1, fans: +2 }, reply: 'צחוק באולם. הבעלים שמע.' },
      { label: 'השלט הזה שייך לשחקנים, לא לי', effect: { morale: +4, prestige: +1, fans: +1 }, reply: 'העברת את הקרדיט. גם היציע הנהן.' },
    ],
  }) },
  { when: c => c.justUp, gen: c => ({
    id: 'fans_prices',
    tone: 'serious',
    text: `המועדון העלה את מחירי הכרטיסים והיציע כועס. אתה תומך בהחלטה?`,
    answers: [
      { label: 'אני מאמן. מחירים זה לא האזור שלי', effect: { prestige: +1, fans: -2 }, reply: 'התחמקות מנומסת. היציע רצה שמישהו יעמוד לצידו.' },
      { label: 'לא. ואמרתי את זה לבעלים, האוהדים לפני הכל', effect: { prestige: -4, fans: +7 }, reply: 'עמדת עם היציע נגד הבעלים. הבעלים לא שכח ושוקל לדבר איתך.' },
    ],
  }) },
];

/** The terrace questions that fit tonight. */
export function fittingFans(c: PressContext): { urgent: QGen[]; rest: QGen[] } {
  const fit = FANS.filter(f => f.when(c));
  return { urgent: fit.filter(f => f.urgent).map(f => f.gen), rest: fit.filter(f => !f.urgent).map(f => f.gen) };
}

const TOPS: Array<{ when?: (c: PressContext) => boolean; gen: QGen }> = [
  { gen: () => ({
  id: 'top_say_it',
  tone: 'serious',
  text: `אתם בפסגת הטבלה. המילה אליפות כבר לא מוגזמת. אתה מוכן להגיד אותה בקול?`,
  answers: [
    { label: 'תגיד אתה רציני? פחות מ-10 הפרש זה בושה מבחינתי', effect: { morale: +2, prestige: +5, fans: +3 }, reply: 'הכרזה נועזת. עכשיו כולם יחכו לך בפינה בסוף העונה.' },
    { label: 'מחזור מחזור, בלי להתרברב', effect: { morale: +3, prestige: +1 }, reply: 'ראש שקט. השחקנים אוהבים את היציבות.' },
  ],
  }) },
  { gen:
    () => ({
      id: 'top_fall_watch',
      tone: 'brutal',
      text: `כל הליגה מחכה שתיפלו. אתה מרגיש את זה כשאתה נכנס למגרשים?`,
      answers: [
        { label: `שיחכו. אנחנו לא ממהרים לשום מקום`, effect: { morale: +2, prestige: +2 }, reply: `שורה קרה. היריבות עוד ידביקו אותה למקרר.` },
        { label: `אני מרגיש. ובגלל זה אנחנו מתאמנים כפול`, effect: { morale: +3, prestige: +1 }, reply: `כנות של עובד. חדר ההלבשה הנהן.` },
      ],
    }), },
  { gen:
    () => ({
      id: 'top_enjoy',
      tone: 'funny',
      text: `מקום ראשון. אתה בכלל מצליח ליהנות מזה או שאתה ישן עם הטבלה בחדר שינה?`,
      answers: [
        { label: `איזו שינה? אני קם בלילה לבדוק שלא ירדנו`, effect: { morale: +1, fans: +2 }, reply: `צחוק באולם. גם קצת דאגה.` },
        { label: `נהנה כל רגע. בשביל זה עובדים קשה`, effect: { morale: +3 }, reply: `מאמן רגוע. השחקנים אוהבים את השקט הזה.` },
      ],
    }), },
  { when: c => c.week >= 10, gen:
    c => ({
      id: 'top_bus_parade',
      tone: 'funny',
      text: `ב${c.city} כבר שואלים מאיזה כיכר תצא חגיגת האליפות. יש לך העדפה?`,
      answers: [
        { label: `אני אפילו לא יודע איפה הכיכר. שואלים אותי על המשחק הבא בלבד`, effect: { prestige: +3 }, reply: `תשובת ברזל. הכתב ניסה שוב ונכשל.` },
        { label: `מהכיכר הכי גדולה שיש. שיכינו את הבמה והשמפנייה`, effect: { morale: +3, prestige: -2, fans: +4 }, reply: `כותרת ענק. עכשיו אסור לך למעוד.` },
      ],
    }), },
  { gen:
    () => ({
      id: 'top_who_stops',
      tone: 'serious',
      text: `תגיד בכנות, יש קבוצה אחת בליגה שאתה חושש ממנה?`,
      answers: [
        { label: `יש. אנחנו. רק אנחנו יכולים לעצור את עצמנו`, effect: { morale: +3, prestige: +2 }, reply: `משפט לכותרת, והוא נכון.` },
        { label: `מכולן. מי שלא חושש מאף אחד נופל לאחרונה בטבלה`, effect: { prestige: +3 }, reply: `ענווה של מקצוען. מי שמבין העריך.` },
      ],
    }), },
  { gen:
    () => ({
      id: 'top_pressure_kids',
      tone: 'serious',
      text: `יש לך שחקנים צעירים שלא היו אף פעם בצמרת. איך שומרים עליהם מהגובה הזה?`,
      answers: [
        { label: `אני לא שומר עליהם. שיתרגלו, פה אנחנו מתכוונים להישאר`, effect: { morale: +4, prestige: -1 }, reply: `הצהרת כוונות. הצעירים עוד יקראו את זה פעמיים.` },
        { label: `מרחיקים מהם עיתונים. כולל את שלך`, effect: { prestige: +2, morale: +1 }, reply: `חצי בדיחה שכולה אמת. הכתב חייך בלית ברירה.` },
      ],
    }), },
  { gen:
    () => ({
      id: 'top_owner_dream',
      tone: 'funny',
      text: `הבעלים שלך כבר מדבר על אליפות בכל ראיון. אתה לא רוצה לסתום לו את הפה?`,
      answers: [
        { label: `הוא משלם, מותר לו לחלום בקול. אני אשלם על החלום בעבודה`, effect: { morale: +2, prestige: +2 }, reply: `איזון עדין. גם הבעלים וגם החדר ייצאו מרוצים.` },
        { label: `ניסיתי. הוא לא סותם `, effect: { morale: +3, prestige: -1 }, reply: `צחוק באולם. הבעלים יצחק פחות, אבל יצחק.` },
      ],
    }), },
  { when: c => c.season >= 2, gen:
    () => ({
      id: 'top_remember_bottom',
      tone: 'serious',
      text: `היו לך פה גם תקופות קשות. מה מהתקופות ההן נמצא איתך עכשיו בפסגה?`,
      answers: [
        { label: `השקט. מי שעבר תחתית לא נלחץ מצמרת`, effect: { prestige: +3, morale: +2 }, reply: `עומק. הציטוט יפתח ויסגור את המהדורה.` },
        { label: `רשימה של כל מי שספד לנו. אני שומר אותה בטלפון`, effect: { morale: +3, prestige: -1 }, reply: `חצי צחוק, חצי איום. כמה אנשים עוד יבדקו אם הם ברשימה.` },
      ],
    }), },
  { when: c => c.result === 'win', gen:
    () => ({
      id: 'top_style_or_points',
      tone: 'serious',
      text: `ניצחתם, אבל זה לא היה יפה. בפסגה מותר לנצח מכוער?`,
      answers: [
        { label: `אליפויות עשויות מניצחונות מכוערים. את היפים משאירים לסרטים`, effect: { morale: +2, prestige: +3 }, reply: `משפט של מאמן גדול. עוד ייכנס ללקסיקון של היציע.` },
        { label: `לא. ואנחנו נשתפר גם בזה`, effect: { prestige: +2 }, reply: `שאפתנות כפולה. עכשיו מצפים גם ליפה וגם למנצח.` },
      ],
    }), },
  { gen:
    () => ({
      id: 'top_rotation',
      tone: 'serious',
      text: `אותו הרכב כמעט כל שבוע. אתה לא חושש שהספסל שלך יירדם עד שתצטרך אותו?`,
      answers: [
        { label: `הספסל שלי יודע בדיוק מתי יגיע תורו. וכשיגיע, הוא יהיה מוכן`, effect: { morale: +3 }, reply: `מסר פנימה דרך המיקרופון. הספסל שמע.` },
        { label: `מי שמנצח משחק. ככה זה היה וככה יישאר`, effect: { morale: -2, prestige: +2 }, reply: `קשיחות. ההרכב רגוע, הספסל פחות.` },
      ],
    }), },
  { gen:
    c => ({
      id: 'top_city_fever',
      tone: 'funny',
      text: `אומרים שב${c.city} מוכרים עכשיו יותר חולצות שלכם מאשר בקבוקי מים. איך העיר הזאת מרגישה לך השבוע?`,
      answers: [
        { label: `כמו עיר שחיכתה לזה הרבה זמן. מגיע לה`, effect: { fans: +5, morale: +1 }, reply: `אהבה לעיר. העיר תחזיר אהבה.` },
        { label: `שתשמור את החגיגות למאי. אנחנו עוד לא עשינו כלום`, effect: { prestige: +3, fans: -1 }, reply: `מבוגר אחראי. היציע קצת התבאס, קצת העריך.` },
      ],
    }), },
  { gen:
    () => ({
      id: 'top_bet_question',
      tone: 'funny',
      text: `חבר שלי מהדסק רוצה לדעת אם לשים עליכם את המשכורת שלו באליפות. מה אתה אומר לו?`,
      answers: [
        { label: `תגיד לו לשים על עצמו ללמוד מקצוע. אנחנו לא קזינו`, effect: { prestige: +2, morale: +1 }, reply: `צחוק גדול באולם. ושיעור קטן בחיים.` },
        { label: `שישים,חיים רק פעם אחת. אין מצב מפסידים`, effect: { morale: +3, prestige: -2 }, reply: `הכותרת של השבוע. עכשיו יש מישהו שסומך עליך בכסף אמיתי.` },
      ],
    }), },
  { when: c => c.lead >= 5, gen:
    () => ({
      id: 'top_lonely',
      tone: 'serious',
      text: `פער כזה בראש הטבלה. יש בכלל מתח בליגה הזאת, או שאתם משחקים לבד?`,
      answers: [
        { label: `המתח היחיד שלי הוא האימון של יום שלישי. השאר רעש`, effect: { prestige: +3 }, reply: `פוקוס מוחלט. משעמם, ומנצח.` },
        { label: `תגיד את זה בסוף העונה. ראיתי פערים כאלה נמסים כמו גלידה`, effect: { morale: +2, prestige: +2 }, reply: `זהירות של מי שראה דברים. הליגה שמעה אזהרה.` },
      ],
    }), },
  { gen:
    c => ({
      id: 'top_what_scares',
      tone: 'serious',
      text: `מה הדבר היחיד שיכול לקלקל לכם את העונה הזאת?`,
      answers: [
        { label: `שאננות. ואני הורג אותה בכל בוקר מחדש`, effect: { prestige: +3, morale: +1 }, reply: `תשובה של מקצוען. הכתב רשם מילה במילה.` },
        { label: `פציעות. תשאיר לי את ${c.star} בריא ואני רגוע`, effect: { morale: +2, prestige: -1 }, reply: `אמת גלויה. אצל היריבות יקראו אותה בעניין רב.` },
      ],
    }), },
  { when: c => c.result === 'big_win', gen:
    () => ({
      id: 'top_message_chasers',
      tone: 'brutal',
      text: `ניצחון כזה בפסגה. מה המסר לקבוצות שרודפות אחריכם?`,
      answers: [
        { label: `אין מסר. שירדפו, זה התפקיד שלהן`, effect: { prestige: +3 }, reply: `אדישות מוחלטת. הכי מפחידה שיש.` },
        { label: `שיחסכו דלק. הרכבת הזאת כבר יצאה`, effect: { morale: +3, prestige: -2, fans: +4 }, reply: `חוצפה לכותרת. היריבות עוד יתלו אותה במלתחה.` },
      ],
    }), },
];

/**
 * The stories only some nights have: the league above, the scout, the boy from
 * the academy, the streak, the gate. Each is asked only when the save says its
 * night actually happened, and they share the wide slot with the result pool.
 */
const SITUATION: Array<{ when: (c: PressContext) => boolean; gen: QGen }> = [
  { when: c => c.result === 'draw' && c.tablePos > 2 && c.tier < 5, gen:
    c => ({
      id: 'draw_wasting',
      tone: 'brutal',
      text: `עוד תיקו. בקצב הזה לא עולים ליגה. אתה לא מרגיש שאתה מבזבז עונה?`,
      answers: [
        { label: 'מבזבז? תראה מה השופט עשה לנו בדקה 80', effect: { morale: +1, prestige: -3, fans: +1 }, reply: 'האוהדים הנהנו. איגוד השופטים פחות.' },
        { label: 'צודק. עוד תיקו כזה ואני שולח שחקנים הביתה', effect: { morale: -3, prestige: +2, fans: +1 }, reply: 'איום פומבי. השחקנים קראו את זה בבוקר, פעמיים.' },
      ],
    }) },
  { when: c => c.tier === 5 && c.firstSeasonAtTier, gen:
    () => ({
      id: 'top_league_arrival',
      tone: 'serious',
      text: `מהשכונה עד לליגת העל. עכשיו כשאתה פה, זה נראה כמו שחלמת?`,
      answers: [
        { label: `יותר גדול. ואני מתכוון להישאר פה הרבה זמן`, effect: { morale: +3, prestige: +2 }, reply: `רגע של כבוד. גם המצלמות הרגישו.` },
        { label: `זאת עוד ליגה עם שני שערים ודשא. באנו לעבוד`, effect: { prestige: +3 }, reply: `יובש מקצועי. הוותיקים בליגה עוד ירימו גבה, בכבוד.` },
      ],
    }), },
  { when: c => c.tier >= 4 && !lost(c), gen:
    () => ({
      id: 'top_league_tv',
      tone: 'funny',
      text: `המשחקים שלכם משודרים עכשיו בכל הארץ. ההורים שלך סוף סוף רואים אותך בשידור חי. מה הם אומרים?`,
      answers: [
        { label: `אמא שלי מתקשרת אחרי כל משחק להגיד שאני צועק יותר מדי`, effect: { fans: +4, morale: +2 }, reply: `האולם נמס. אמהות בכל הארץ הזדהו.` },
        { label: `הם אומרים מה שכל ההורים אומרים, תשמור על הגרון ותנצח בשבת`, effect: { fans: +3, morale: +1 }, reply: `חום של בית. הציטוט רץ ברשת כל הערב.` },
      ],
    }), },
  { when: c => c.tier >= 4 && c.firstSeasonAtTier, gen:
    () => ({
      id: 'national_league_budget',
      tone: 'brutal',
      text: `התקציב שלכם הוא מהנמוכים בליגה. אתם פה כדי לשרוד או שיש לך יומרות אמיתיות?`,
      answers: [
        { label: `תקציב קונה שחקנים, לא נקודות. את הנקודות לוקחים בעבודה`, effect: { prestige: +3, morale: +3 }, reply: `משפט שנחרט. קבוצות עשירות שמעו, ויזכרו.` },
        { label: `לשרוד? עובדים קשה להישאר. מי שמזלזל בהישרדות לא שרד אף פעם`, effect: { prestige: +2, fans: -2 }, reply: `ריאליזם קר. חלק מהאוהדים רצו לשמוע חלום.` },
      ],
    }), },
  { when: c => c.tier === 5 && c.isHome, gen:
    () => ({
      id: 'top_league_crowds',
      tone: 'serious',
      text: `אצטדיונים מלאים, תקשורת בכל פינה. איך הקבוצה שלך מתמודדת עם הגודל הזה?`,
      answers: [
        { label: `יש שחקנים שמגלים שהם שחקני ליגת העל, ויש כאלה שמגלים שלא. זה התפקיד שלי לדעת מי זה מי`, effect: { prestige: +3, morale: -1 }, reply: `כנות חדה. כמה שחקנים עוד יקראו את זה פעמיים.` },
        { label: `קהל גדול זה מתנה. מי שמפחד ממתנות שישחק דמקה`, effect: { morale: +3, fans: +3 }, reply: `ביטחון מדבק. היציע יאמץ את השורה.` },
      ],
    }), },
  { when: c => c.tier >= 4 && won(c), gen:
    () => ({
      id: 'national_derby_level',
      tone: 'serious',
      text: `ברמה הזאת כל טעות עולה בשער. מה השתנה בהכנה שלך מאז הליגות הנמוכות?`,
      answers: [
        { label: `הכל. מי שמתכונן ללאומית כמו לליגה ג׳ חוזר לליגה ג׳`, effect: { prestige: +3 }, reply: `כבוד לליגה. מאמנים ותיקים הנהנו מהבית.` },
        { label: `שום דבר. כדורגל זה כדורגל, רק המשכורות השתנו`, effect: { morale: +2, prestige: -1 }, reply: `פשטות מתריסה. חצי העריכו, חצי חיכו שתיפול.` },
      ],
    }), },
  { when: c => c.tier === 5 && lost(c), gen:
    () => ({
      id: 'top_league_media_pressure',
      tone: 'brutal',
      text: `פה זה לא הליגות הנמוכות. הפסד אחד ואתה בכותרות, שניים ואתה בשאלות על הכיסא. אתה בנוי לזה?`,
      answers: [
        { label: `בדוק אותי בעוד שלושה חודשים. אני עוד אהיה פה`, effect: { prestige: +2, morale: +2 }, reply: `אמירה עם תאריך. הכתב שם תזכורת ביומן.` },
        { label: `הכיסא שלי לא מעניין אותי, רק הקבוצה. תשאל על המשחק`, effect: { prestige: +3 }, reply: `החזרת את השיחה לדשא. מקצועי וקר.` },
      ],
    }), },
  { when: c => c.tier === 4 && c.tablePos <= c.totalTeams / 2 && c.week >= 8, gen:
    () => ({
      id: 'national_promotion_race',
      tone: 'serious',
      text: `אתם במרחק נגיעה מליגת העל. כל העיר כבר עושה חשבונות. אתה מרשה לעצמך לחשוב על זה?`,
      answers: [
        { label: `אני חושב על זה כל בוקר, ואז נועל נעליים ושוכח. ככה עולים`, effect: { morale: +3, prestige: +2 }, reply: `איזון של חלום ועבודה. הציטוט של הערב.` },
        { label: `אסור לי. מי שסופר מחזורים מפסיד אותם`, effect: { prestige: +2, fans: -1 }, reply: `זהירות של מקצוען. היציע רצה קצת יותר אש.` },
      ],
    }), },
  { when: c => c.tier === 5 && c.week >= c.rounds - 2 && c.tablePos <= c.totalTeams - 2 && !lost(c), gen:
    () => ({
      id: 'top_league_survive_party',
      tone: 'funny',
      text: `ההישארות בכיס. מותר כבר לראות אותך מחייך או שאתה חוסך את זה לקיץ?`,
      answers: [
        { label: `אני מחייך בפנים. בחוץ יש עוד משחקים`, effect: { prestige: +2, morale: +1 }, reply: `קשיחות עם קריצה. בדיוק הטון הנכון.` },
        { label: `תראה את החיוך הזה? תצלם, זה פעם בעונה`, effect: { morale: +3, fans: +2 }, reply: `תמונה לעמוד הראשון. חיוך נדיר שווה אלף מילים.` },
      ],
    }), },
  { when: c => c.scoutHired, gen:
    () => ({
      id: 'scout_money_question',
      tone: 'brutal',
      text: `שילמתם סכום רציני על סקאוט בזמן שהקופה לא בשמיים. אתה בטוח שזה לא כסף שנזרק לפח?`,
      answers: [
        { label: `שחקן אחד נכון שווה פי עשרה מהעלות. חכה ותראה`, effect: { prestige: +1 }, reply: `הימור מוצהר. הכתב פתח תיק מעקב.` },
        { label: `זה כסף על עתיד. מי שלא משקיע בעתיד נשאר בעבר`, effect: { prestige: +2 }, reply: `סיסמה טובה. עכשיו תצטרך הוכחה על הדשא.` },
      ],
    }), },
  { when: c => c.scoutManPlayed, gen:
    () => ({
      id: 'scout_find_debut',
      tone: 'serious',
      text: `השחקן שהסקאוט שלך מצא קיבל היום דקות. שווה את הכסף והרעש?`,
      answers: [
        { label: `תשפוט אותו בעוד עשרה משחקים, לא אחרי ערב אחד`, effect: { morale: +2, prestige: +1 }, reply: `הגנה שקטה. השחקן קרא ונשם.` },
        { label: `ראית בעצמך. אני לא צריך להוסיף`, effect: { prestige: +2, morale: +1 }, reply: `ביטחון קצר. אם הוא שיחק טוב, זאת תשובה מושלמת.` },
      ],
    }), },
  { when: c => c.scoutHired && !lost(c), gen:
    () => ({
      id: 'scout_methods',
      tone: 'funny',
      text: `הסקאוט שלכם יושב במגרשים עם כובע ומשקפי שמש כאילו הוא בסרט ריגול. באמת ככה מוצאים שחקנים ב-2026?`,
      answers: [
        { label: `אל תצחק עליו. הכובע הזה ראה יותר כישרונות ממך`, effect: { morale: +1, prestige: +1 }, reply: `הגנה משעשעת. הסקאוט שלח לך הודעת תודה עם אימוג׳י כובע.` },
        { label: `יש גם מחשב וגם נתונים. אבל עין טובה לא מחליפים`, effect: { prestige: +2 }, reply: `תשובה מודרנית. גם רומנטית. הכתב קיבל פסקה טובה.` },
      ],
    }), },
  { when: c => c.scoutHired && c.tablePos <= c.totalTeams / 2, gen:
    () => ({
      id: 'scout_poach_fear',
      tone: 'serious',
      text: `סקאוט שמוצא זהב לא נשאר הרבה זמן בקבוצה אחת. אתה לא חושש שיקנו לך אותו?`,
      answers: [
        { label: `שינסו. אצלנו הוא לא עובד, הוא בבית`, effect: { morale: +1, prestige: +1 }, reply: `חום. הסקאוט שמע, ומישהו למעלה עוד ירשום לתקצב לו העלאה.` },
        { label: `בכדורגל קונים הכל. בגלל זה אני לומד ממנו כל מה שאפשר`, effect: { prestige: +2 }, reply: `ריאליזם צלול. קצת קר, מאוד נכון.` },
      ],
    }), },
  { when: c => c.youthDebut, gen:
    () => ({
      id: 'youth_debut_night',
      tone: 'serious',
      text: `ילד מהאקדמיה שלכם עלה היום לדשא בפעם הראשונה. מה אמרת לו לפני שנכנס?`,
      answers: [
        { label: `תיהנה. את הלחץ תשאיר לי`, effect: { morale: +3, fans: +2 }, reply: `משפט שההורים שלו ישמרו. אולי גם הוא.` },
        { label: `כלום. מי שמוכן לא צריך נאום`, effect: { morale: +2, prestige: +1 }, reply: `אמון שקט. הנער סיפר אחר כך שזה בדיוק מה שהרגיע אותו.` },
      ],
    }), },
  { when: c => c.youthStar, gen:
    () => ({
      id: 'youth_debut_star',
      tone: 'funny',
      text: `הילד מהנוער היה הכי טוב על הדשא. אתה כבר נועל אותו בכספת או מחכה שההצעות יתחילו?`,
      answers: [
        { label: `איזו כספת, הוא בא אליי באוטובוס. תן לו להיות ילד`, effect: { morale: +2, prestige: +2 }, reply: `הגנה חכמה. הורדת לו מאה זרקורים מהגב.` },
        { label: `שיתחילו להציע. שידעו כמה עולה הילד שלנו`, effect: { prestige: +1 }, reply: `גאווה עם תג מחיר. הסוכנים רשמו את המספר החסר.` },
      ],
    }), },
  { when: c => c.youthInSquad, gen:
    () => ({
      id: 'youth_academy_pride',
      tone: 'serious',
      text: `עוד ילד מהאקדמיה בסגל הבוגרים. זאת שיטה אצלך או שאין כסף לקנות שחקנים?`,
      answers: [
        { label: `גם וגם, ואני גאה בשניהם`, effect: { prestige: +2, morale: +2 }, reply: `כנות חצופה. האולם צחק והבין.` },
        { label: `שחקן מבחוץ משחק בשבילך. ילד מהבית ימות בשבילך. זאת השיטה`, effect: { morale: +3, prestige: +2 }, reply: `משפט לדורות. מאמן הנוער עוד ימסגר אותו במשרד.` },
      ],
    }), },
  { when: c => c.result === 'draw' && c.tablePos === 1, gen:
    () => ({
      id: 'draw_top_dropped',
      tone: 'brutal',
      text: `תיקו בפסגה זה שתי נקודות שהלכו. הרודפות מתקרבות. אתה רגוע?`,
      answers: [
        { label: `נקודה לא הורגת אף אחד. מי שרגוע לוקח אליפויות`, effect: { prestige: +3 }, reply: `קור של מוביל. הרודפות קיוו לפאניקה ולא קיבלו.` },
        { label: `לא רגוע. ואני לא אמור להיות. ככה שומרים על פסגה`, effect: { morale: +2, prestige: +2 }, reply: `דריכות בריאה. החדר הבין שאין חופש.` },
      ],
    }), },
  { when: c => c.result === 'draw' && c.tablePos >= c.totalTeams - 1, gen:
    () => ({
      id: 'draw_bottom_point',
      tone: 'serious',
      text: `נקודה כשאתם בתחתית. זה קרש הצלה או טביעה איטית?`,
      answers: [
        { label: `קרש הצלה. מנקודות כאלה בונים הישרדות`, effect: { morale: +2 }, reply: `חצי כוס מלאה. היציע רצה שלוש, קיבל הסבר.` },
        { label: `טביעה איטית. ואנחנו נפסיק לטבוע, מילה שלי`, effect: { morale: +3, prestige: -1 }, reply: `הבטחה בשידור. עכשיו תעמוד בה.` },
      ],
    }), },
  { when: c => c.result === 'draw' && c.gf === 0, gen:
    () => ({
      id: 'draw_zero_zero',
      tone: 'funny',
      text: `תשעים דקות, אפס שערים. תגיד משהו למי ששילם כרטיס ובא לראות כדורגל.`,
      answers: [
        { label: `שיבוא שבוע הבא, אני חייב לו שערים. רשום אצלי`, effect: { fans: +3 }, reply: `חוב פומבי. היציע פתח פנקס.` },
        { label: `הוא ראה מלחמה טקטית. מי שמבין נהנה, מבטיח לך`, effect: { prestige: +1 }, reply: `חצי אולם צחק, חצי הנהן. אף אחד לא השתכנע לגמרי.` },
      ],
    }), },
  { when: c => c.result === 'draw' && (c.tablePos === 2 || c.tablePos === 3) && c.week >= 8, gen:
    () => ({
      id: 'draw_promotion_race',
      tone: 'serious',
      text: `במרוץ הזה כל נקודה שמתפספסת היא זהב. המוביל אמר תודה הערב?`,
      answers: [
        { label: `שיגיד תודה. אנחנו עוד ניפגש איתו, והוא יודע את זה`, effect: { morale: +2, prestige: +1 }, reply: `איום אלגנטי. אצל המוביל עוד יקראו את זה פעמיים.` },
        { label: `אני לא מסתכל למעלה, אני מסתכל על הקבוצה שלי. היא תקבע`, effect: { prestige: +2 }, reply: `פוקוס פנימי. משעמם, יעיל.` },
      ],
    }), },
  { when: c => c.result === 'draw' && !c.isHome && c.oppPos < c.tablePos, gen:
    () => ({
      id: 'draw_respect_point',
      tone: 'serious',
      text: `נקודה בחוץ אצל קבוצה מעליכם בטבלה. אתה חוזר הביתה מרוצה?`,
      answers: [
        { label: `מרוצה. מי שלא מכבד נקודה כזאת לא מבין כדורגל`, effect: { prestige: +2, morale: +2 }, reply: `הערכה מפוכחת. גם היריבה הנהנה.` },
        { label: `היינו קרובים לשלוש. דווקא בגלל זה קצת כואב`, effect: { morale: +1, fans: +2 }, reply: `רעב בריא. היציע אהב את הטון.` },
      ],
    }), },
  { when: c => c.result === 'win' && c.margin === 1, gen:
    () => ({
      id: 'win_ugly_three',
      tone: 'funny',
      text: `ניצחון בקושי, בעצימת עיניים, עם הלב בגרון. ככה אתה אוהב?`,
      answers: [
        { label: `ככה אני שונא. אבל שלוש נקודות אני אוהב בכל צורה`, effect: { morale: +2, fans: +2 }, reply: `כנות מצחיקה. הציטוט עף ברשת.` },
        { label: `ניצחון בשער אחד זה סימן של קבוצה שיודעת לסבול. דווקא גאה`, effect: { morale: +3 }, reply: `קריאה אחרת של אותו ערב. השחקנים אימצו.` },
      ],
    }), },
  { when: c => won(c) && c.injuryTonight, gen:
    () => ({
      id: 'win_but_injury',
      tone: 'serious',
      text: `ניצחתם אבל איבדתם שחקן לפציעה. איך מרגיש ערב כזה, מתוק או חמוץ?`,
      answers: [
        { label: `חמוץ. שלוש נקודות לא שוות בן אדם על אלונקה`, effect: { morale: +3, prestige: +1 }, reply: `אנושיות לפני טבלה. החדר ראה מאמן, לא מנהל.` },
        { label: `זה כדורגל. שמחים על הנקודות ומטפלים בפצוע. במקביל`, effect: { prestige: +2 }, reply: `מקצוענות קרה. נכונה, פחות מחבקת.` },
      ],
    }), },
  { when: c => won(c) && c.allGoalsFirstHalf, gen:
    () => ({
      id: 'win_first_half_show',
      tone: 'funny',
      text: `מחצית ראשונה מבריקה, מחצית שנייה של שינה. מה קרה בהפסקה, הגשתם אוכל כבד?`,
      answers: [
        { label: `הגשנו יתרון, וזה האוכל הכי מרדים שיש. נעבוד על זה`, effect: { prestige: +2 }, reply: `הודאה מחויכת. גם ביקורת עצמית, גם כותרת.` },
        { label: `ניהלנו משחק. לא כל מחצית צריכה להיות סרט פעולה`, effect: { prestige: +1, fans: -1 }, reply: `הסבר של מבוגרים. היציע עדיין רצה סרט.` },
      ],
    }), },
  { when: c => lost(c) && c.unbeatenBefore >= 4, gen:
    () => ({
      id: 'loss_first_after_run',
      tone: 'serious',
      text: `הרצף היפה נגמר הערב. איך מונעים מהפסד אחד להפוך לשניים?`,
      answers: [
        { label: `קוברים אותו הלילה וקמים מחר לעבודה. הפסד חי רק אם מאכילים אותו`, effect: { morale: +3, prestige: +2 }, reply: `משפט למסגרת. חדר ההלבשה קיבל את הטון.` },
        { label: `רצפים נגמרים. מה שחשוב זה שהעבודה לא נגמרת`, effect: { prestige: +2 }, reply: `פרופורציה. משעמם ובריא.` },
      ],
    }), },
  { when: c => lost(c) && c.isHome && c.margin <= -2, gen:
    () => ({
      id: 'loss_crowd_left',
      tone: 'brutal',
      text: `האוהדים עזבו בדקה 70. כשהקהל מוותר לפני השחקנים, זה לא סימן אזהרה?`,
      answers: [
        { label: `זה סימן. וקיבלתי אותו. עכשיו תורנו להחזיר אותם`, effect: { fans: +3, prestige: +1 }, reply: `קבלת אחריות בלי התפתלות. חלק מהעוזבים יקראו את זה מחר ויתרככו.` },
        { label: `מי שעזב פספס את העשרים דקות שבהן נלחמנו. חבל לי עליו`, effect: { morale: +2, fans: -4 }, reply: `עקיצה לקהל שלך. מסוכן, היציע לא שוכח.` },
      ],
    }), },
  { when: c => lost(c) && c.nextIsDerby, gen:
    () => ({
      id: 'loss_next_week_derby',
      tone: 'serious',
      text: `הפסדתם, ובשבוע הבא מחכה הדרבי. זה הזמן הכי גרוע להיות בירידה, לא?`,
      answers: [
        { label: `הפוך. אין תרופה יותר טובה להפסד מדרבי`, effect: { morale: +3, fans: +3 }, reply: `הפכת מועקה לדלק. היציע התחיל לספור ימים.` },
        { label: `הדרבי לא קשור להערב. נכין אותו כמו שצריך, בנפרד`, effect: { prestige: +2 }, reply: `קירות בין משחקים. שיטתי וקר.` },
      ],
    }), },
  { when: c => c.result === 'thrashing' && !c.isHome, gen:
    () => ({
      id: 'thrash_apology',
      tone: 'brutal',
      text: `תבוסה כזאת בחוץ. אתה מתנצל בפני מי שנסע לראות את זה?`,
      answers: [
        { label: `מתנצל, ומזמין את כולם למשחק הבית הבא על חשבוני`, effect: { money: -5_000, fans: +5 }, reply: `התנצלות עם קבלה. ארבעים איש עוד יבואו לקופה עם צילום של הציטוט.` },
        { label: `מתנצלים במעשים. בדיבורים זה שווה כלום`, effect: { prestige: +2 }, reply: `עקרוני. היציע מחכה למעשים, עם סטופר.` },
      ],
    }), },
  { when: c => c.result === 'thrashing' && c.isHome, gen:
    () => ({
      id: 'thrash_youth_watching',
      tone: 'serious',
      text: `ביציע ישבו היום ילדים מהאקדמיה שלכם וראו את זה. מה הם אמורים ללמוד מערב כזה?`,
      answers: [
        { label: `שגם ככה נראה כדורגל לפעמים. ומי שחוזר אחרי ערב כזה, הוא שחקן אמיתי`, effect: { prestige: +3, morale: +1 }, reply: `שיעור אמיתי במקום סיסמה. מאמן הנוער שלח לך הודעה.` },
        { label: `שיסתכלו טוב. זה מה שקורה כשלא נותנים מאה אחוז`, effect: { morale: -2, prestige: +2 }, reply: `הפכת תבוסה לתמרור אזהרה. קשה, אולי נכון.` },
      ],
    }), },
  { when: c => c.isHome && c.gate >= 0.9, gen:
    () => ({
      id: 'gate_record',
      tone: 'serious',
      text: `המגרש היה מלא היום כמו שלא היה מזמן. מה אתה עושה עם אשראי כזה מהקהל?`,
      answers: [
        { label: `מחזיר אותו בריבית. המשחק הבא בבית יהיה בשבילם`, effect: { fans: +4 }, reply: `שטר חוב פומבי. היציע שמר את הקבלה.` },
        { label: `לא עושה כלום, ממשיך לעבוד. הם באו בגלל העבודה הזאת`, effect: { prestige: +2 }, reply: `ענווה הגיונית. פחות רומנטית, יותר אמינה.` },
      ],
    }), },
  { when: c => c.isHome && won(c) && c.gate < 0.5, gen:
    () => ({
      id: 'home_empty_win',
      tone: 'funny',
      text: `ניצחתם יפה, וחבל שכמעט אף אחד לא ראה. מה הסיפור של היציע הריק?`,
      answers: [
        { label: `אנחנו נמלא אותו. תן לנו עוד כמה ערבים כאלה והם יחזרו`, effect: { fans: +3 }, reply: `אופטימיות עם כתובת. הקופות מחכות.` },
        { label: `תשאל את מי שלא בא. מי שבא ראה כדורגל טוב`, effect: { fans: -2, morale: +2 }, reply: `עקיצה למי שנשאר בבית. לא בטוח שתקרב אותו.` },
      ],
    }), },
  { when: c => won(c) && c.winRun >= 3, gen:
    () => ({
      id: 'streak_build_or_luck',
      tone: 'serious',
      text: `שלושה ניצחונות ומעלה ברצף. תגיד לי את האמת, זה מבנה או מזל?`,
      answers: [
        { label: `מזל זה כשזה קורה פעם אחת. שלוש פעמים זה כבר תוכנית אימונים`, effect: { prestige: +3 }, reply: `הגדרה חדה. הסטטיסטיקאים אהבו.` },
        { label: `גם וגם. ומי שמוותר על חלק מהשניים מפסיד`, effect: { prestige: +1, morale: +1 }, reply: `כנות לא צפויה. כולם ציטטו את החצי שנוח להם.` },
      ],
    }), },
  { when: c => lost(c) && c.lossRun >= 3, gen:
    () => ({
      id: 'streak_losing_door',
      tone: 'brutal',
      text: `שלושה הפסדים רצופים. בוא נדבר ישירות: אתה עוד מחזיק את חדר ההלבשה?`,
      answers: [
        { label: `תיכנס לאימון מחר ותסתכל להם בעיניים. אחר כך תשאל שוב`, effect: { prestige: +2, morale: +2 }, reply: `הזמנה פתוחה במקום הכחשה. הכתב יבוא. אתה כבר יודע שיבוא.` },
        { label: `חדר הלבשה לא מחזיקים, מרוויחים. ואני מרוויח אותו כל יום מחדש`, effect: { prestige: +3 }, reply: `הגדרה שתישאר אחריך. גם אם לא תישאר.` },
      ],
    }), },
];

/**
 * One of a pool, skipping whatever was asked recently. When the whole pool has
 * been heard lately the one heard longest ago is the least bad repeat, so a
 * pool of one still yields a question rather than nothing.
 */
/* ליגת העל has its own wording for part of the questions (topFlightText.ts). What an answer does stays with the old answer of the same place. */
function topSlots(t: string, c: PressContext, who = ''): string {
  return t.replace(/{(star|rival|city|who)}/g, (_, k: 'star' | 'rival' | 'city' | 'who') => (k === 'who' ? who : c[k]) || '');
}
function topWording(q: PressQuestion, c: PressContext): PressQuestion {
  const t = c.tier >= 5 ? TOP_PRESS_REWRITE[q.id] : undefined;
  if (!t) return q;
  // a question about a named player (the hat trick, the red card) is rewritten with that player's name; with no name to put in, the old wording stays rather than a sentence about nobody
  if (/{who}/.test(t.text) && !q.who) return q;
  return { ...q, text: topSlots(t.text, c, q.who), answers: t.answers.map((a, i) => ({ ...(q.answers[i] ?? { effect: {} }), label: topSlots(a.label, c, q.who), reply: topSlots(a.reply, c, q.who) })) };
}

/** The questions only a professional top flight is asked, each with the night it fits. Ones that need a system the game lacks (national team, VAR, Europe) are not here. */
const TOP_WHEN: Record<string, (c: PressContext) => boolean> = {
  owner_three_games: c => c.lossRun >= 2,
  foreign_coach_rumour: c => c.lossRun >= 3,
  title_decider_rival: c => c.tablePos <= 2 && c.week >= c.rounds - 6,
  euro_place_budget: c => c.tablePos >= 3 && c.tablePos <= 6 && c.week >= c.rounds * 0.7,
  fans_flares_fine: c => c.isDerby && c.fans >= 75,
  fans_protest_owner: c => c.fans <= 30,
  leak_lineup: c => c.week % 4 === 0,
  leak_dressing_room: c => c.lowMorale || c.lossRun >= 2,
};
const TOP_NEW_GENS: QGen[] = Object.keys(TOP_WHEN).filter(id => TOP_PRESS_NEW[id]).map(id => (c: PressContext): PressQuestion => ({
  id, tone: 'serious', text: topSlots(TOP_PRESS_NEW[id].text, c),
  answers: TOP_PRESS_NEW[id].answers.map((a, i) => ({
    label: topSlots(a.label, c), reply: topSlots(a.reply, c),
    effect: i === 0 ? { morale: +3, prestige: -1 } : { morale: -2, prestige: +3 },
  })),
}));
const topTonight = (c: PressContext): QGen[] => c.tier < 5 ? [] : Object.keys(TOP_WHEN).filter(id => TOP_PRESS_NEW[id] && TOP_WHEN[id](c)).map(id => TOP_NEW_GENS.find(g => g(c).id === id)!);

export function fresh(pool: QGen[], c: PressContext, rng: Rng, recent: string[]): PressQuestion {
  const every = pool.map(g => topWording(g(c), c));
  const kept = every.filter(q => inTier(PRESS_TIERS, q.id, c.tier));
  const all = kept.length ? kept : every;
  const unheard = all.filter(q => !recent.includes(q.id));
  if (unheard.length) return unheard[Math.floor(rng() * unheard.length)];
  return all.reduce((a, b) => recent.indexOf(a.id) <= recent.indexOf(b.id) ? a : b);
}

/** The national sites only write about the Leumit and the top flight (ליגה א׳ and below are covered by the town paper and a regional site). */
const OUTLET_TIERS: Record<string, readonly [number, number]> = {
  'ספורט WOW': [3, 5], 'ספורט 555': [3, 5], 'ספורט ישראל': [4, 5], 'Yספורט': [4, 5], 'Nספורט': [4, 5],
};
function outletFor(tier: number, city: string, rng: Rng): Outlet {
  const ok = OUTLETS.filter(o => { const s = OUTLET_TIERS[o]; return !s || (tier >= s[0] && tier <= s[1]); });
  if (!ok.length) return `מקומון ${city}` as Outlet;
  return ok[Math.floor(rng() * ok.length)];
}

/** Pick a fitting question. `recent` is what was asked lately, oldest first, and is avoided. */
export function pickPressQuestion(c: PressContext, rng: Rng, recent: string[] = []): { outlet: Outlet; q: PressQuestion } {
  const outlet = outletFor(c.tier, c.city, rng);
  const roll = rng();
  const fits = fittingFans(c);
  const inLeague = (g: QGen) => inTier(PRESS_TIERS, g(c).id, c.tier);
  const terrace = { urgent: fits.urgent.filter(inLeague), rest: fits.rest.filter(inLeague) };

  // the terrace's two big nights come before anything else, and are asked
  // once: the whistling is one question, not one a week until a win
  const shout = terrace.urgent.map(g => g(c)).find(q => !recent.includes(q.id));
  if (shout) return { outlet, q: shout };

  // priority overrides. A derby and the top of the table are worth repeating
  // ourselves for. The relegation question is not: once it has been asked the
  // ordinary questions come back until enough weeks have passed
  if (c.isDerby && roll > 0.4) {
    return { outlet, q: fresh(DERBYS.filter(d => !d.when || d.when(c)).map(d => d.gen), c, rng, recent) };
  }
  if (c.tablePos >= c.totalTeams - 1 && (c.result === 'loss' || c.result === 'draw') && !recent.includes(RELEGATION(c).id))
    return { outlet, q: RELEGATION(c) };
  if (c.tablePos === 1 && (c.result === 'win' || c.result === 'big_win')) {
    return { outlet, q: fresh(TOPS.filter(t => !t.when || t.when(c)).map(t => t.gen), c, rng, recent) };
  }

  // roughly a quarter of the time the town paper gets in first, with its own byline
  if (roll < 0.25 && c.tier <= 4) return { outlet: `מקומון ${c.city}` as Outlet, q: fresh(LOCAL, c, rng, recent) };

  // and about a third of the nights the crowd gave him something to answer
  // for, that is the question, provided it has not been asked lately
  if (terrace.rest.length && rng() < 0.35) {
    const unheard = terrace.rest.filter(g => !recent.includes(g(c).id));
    if (unheard.length) return { outlet, q: fresh(unheard, c, rng, recent) };
  }

  const night = SITUATION.filter(s => s.when(c)).map(s => s.gen);
  return { outlet, q: fresh([...night, ...topTonight(c), ...BY_RESULT[c.result]], c, rng, recent) };
}

/**
 * The ids each pool can produce, for the checks. Ids are fixed strings, so a
 * bare context is enough to read them out.
 */
const BARE: PressContext = {
  result: 'win', isDerby: false, lowMorale: false, highPrestige: false,
  tablePos: 5, totalTeams: 10, star: '', rival: '', city: '',
  isHome: true, fans: 50, lossRun: 0, gate: 0.7, justUp: false,
  week: 5, season: 1, rounds: 14, tier: 3, firstSeasonAtTier: false, lead: 0,
  margin: 2, gf: 2, ga: 0, oppPos: 6, nextIsDerby: false, unbeatenBefore: 0, winRun: 1,
  scoutHired: false, scoutManPlayed: false, youthInSquad: false, youthDebut: false,
  youthStar: false, injuryTonight: false, allGoalsFirstHalf: false,
};
/** Every wider question there is, filled with the given context, for the checks. */
export function everyWideQuestion(c: PressContext = BARE): PressQuestion[] {
  return [...Object.values(BY_RESULT).flat(), ...DERBYS.map(d => d.gen), RELEGATION, ...LOCAL,
    ...TOPS.map(t => t.gen), ...SITUATION.map(s => s.gen), ...FANS.map(f => f.gen)].map(g => g(c));
}
export const WIDE_POOLS: Record<PressContext['result'] | 'local' | 'derby' | 'fans' | 'top' | 'situation', string[]> = {
  big_win: BY_RESULT.big_win.map(g => g(BARE).id),
  win: BY_RESULT.win.map(g => g(BARE).id),
  draw: BY_RESULT.draw.map(g => g(BARE).id),
  loss: BY_RESULT.loss.map(g => g(BARE).id),
  thrashing: BY_RESULT.thrashing.map(g => g(BARE).id),
  local: LOCAL.map(g => g(BARE).id),
  derby: DERBYS.map(d => d.gen(BARE).id),
  top: TOPS.map(t => t.gen(BARE).id),
  situation: SITUATION.map(s => s.gen(BARE).id),
  fans: FANS.map(f => f.gen(BARE).id),
};
