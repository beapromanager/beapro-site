/**
 * Plain Hebrew for every name the counting worker can hold. Nothing here is imported from the game (the game's
 * telemetry module has side effects and must not be in this page); scripts/telemetry-check.mts and scripts/ops-check.mts
 * compare this list with STEPS and the *_MARKS lists in src/game/telemetry.ts, so a new name cannot arrive unlabelled.
 */

/** the road, in the order the game walks it (src/game/telemetry.ts STEPS) */
export const STEP_LABEL: Record<string, string> = {
  open: 'פתחו את המשחק',
  title: 'ראו את מסך הפתיחה',
  career_new: 'לחצו "קריירה חדשה"',
  manager: 'נתנו שם למאמן',
  club: 'בחרו עיר וצבעים',
  archetype: 'בחרו איזה מאמן הם',
  signing: 'חתמו על החוזה',
  friends: 'נתנו שמות לחברים',
  squad: 'פגשו את הסגל',
  market: 'ראו את שוק הקיץ',
  season: 'יצאו לליגה',
  match1_start: 'שריקת פתיחה במשחק הראשון',
  match1_half: 'הגיעו למחצית במשחק הראשון',
  round_1: 'סיימו מחזור 1',
  round_3: 'סיימו 3 מחזורים',
  round_7: 'חצי עונה (7 מחזורים)',
  season_end: 'סיימו עונה',
  season_2: 'חזרו לעונה שנייה',
};

/** steps that started being measured after the game was already out, so older players never sent them */
export const LATE_STEPS: Record<string, string> = {
  title: 'נמדד מ-29.9',
  match1_start: 'נמדד מ-3.10',
  match1_half: 'נמדד מ-3.10',
};

/** the new opening (ONBOARD_V2), src/game/telemetry.ts OB_MARKS */
export const OB_LABEL: Record<string, string> = {
  ob_prologue: 'הפרולוג התחיל',
  ob_goal5: 'ראו את ה-5:0',
  ob_choice_bench: 'בחרו "לשבת על הספסל"',
  ob_choice_bottle: 'בחרו "לזרוק בקבוק"',
  ob_skip: 'דילגו על הפרולוג',
  ob_stills: 'פרולוג בתמונות (בלי וידאו)',
  ob_fired: 'שיחת הפיטורים',
  ob_call: 'שיחה מהבעלים החדש',
  ob_city: 'בחרו עיר',
  ob_named_self: 'כתבו שם למאמן',
  ob_kickoff: 'המשחק הראשון התחיל',
  ob_match1_end: 'סיימו את המשחק הראשון',
  ob_names: 'נתנו שמות לשני החברים',
  ob_names_skip: 'דילגו על שמות החברים',
  ob_kit: 'סגרו את כרטיס התלבושת',
  ob_arch: 'סגרו את כרטיס סוג המאמן',
  ob_sponsor: 'סגרו את כרטיס הספונסר',
  ob_market: 'סגרו את כרטיס השוק',
};

/**
 * Accepted by the worker but not sent by the game at 13ea7f2 (friends-scene sends ob_names / ob_names_skip): the dashboard says so instead of drawing a zero
 * that looks like nobody got there. scripts/ops-check.mts greps the game for obMark('…') and fails when this goes stale.
 */
export const OB_NOT_SENT_YET = ['ob_stills', 'ob_match1_end', 'ob_kit', 'ob_arch', 'ob_sponsor', 'ob_market'];

/** the opening in the order a player meets it; the two choices and the skip are side roads */
export const OB_ROAD = ['ob_prologue', 'ob_goal5', 'ob_fired', 'ob_call', 'ob_city', 'ob_kickoff', 'ob_match1_end', 'ob_kit', 'ob_arch', 'ob_sponsor', 'ob_market'] as const;
export const OB_SIDE = ['ob_choice_bench', 'ob_choice_bottle', 'ob_skip', 'ob_stills', 'ob_named_self', 'ob_names', 'ob_names_skip'] as const;

/** the cup and the rest of the closed marks */
export const MARK_LABEL: Record<string, string> = {
  cup_in: 'נכנסו לגביע',
  cup_sf: 'הגיעו לחצי גמר הגביע',
  cup_final: 'הגיעו לגמר הגביע',
  cup_won: 'זכו בגביע',
  eu_in: 'הגיעו לליגת אירופה',
  eu_final: 'הגיעו לגמר אירופה',
  eu_won: 'זכו בליגת אירופה',
  gift10: 'חתמו על המתנה אחרי 10 עונות',
  share_tap: 'לחצו "שתף"',
  daily_1: 'לקחו מתנה יומית ראשונה',
  daily_7: 'רצף של 7 ימים',
  daily_30: 'רצף של 30 יום',
  money_red: 'הקופה ירדה מתחת לאפס',
  money_sack: 'פוטרו בגלל חובות',
};

export const TIER_LABEL: Record<number, string> = { 1: 'ליגה ג׳', 2: 'ליגה ב׳', 3: 'ליגה א׳', 4: 'הלאומית', 5: 'ליגת העל' };

export const labelOf = (k: string): string => STEP_LABEL[k] ?? OB_LABEL[k] ?? MARK_LABEL[k] ?? k;
