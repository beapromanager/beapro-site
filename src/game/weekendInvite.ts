/**
 * The message a manager sends to bring friends into the neighbourhood league (Itzik, 3.11).
 *
 * The old one was a single run-on line: no link, no word on what the game is, the league's name ("ראש העין על המפה")
 * read as if it were part of the sentence, and Thursday 20:00 said twice. Now it is a few short lines that each start
 * in Hebrew (so WhatsApp lays every line out right to left), the league's name in quotes, the code on its own line,
 * the rounds once, the registration's close on the real cycle's clock, and a link to the game.
 *
 * The link carries the code (?league=CODE). The game reads it once on load, keeps it on the phone, and opens
 * "נכנסים עם קוד" with the code already in the box (App.tsx, Weekend.tsx). A phone that ignores the link still has
 * the code in the words, so nothing depends on it.
 *
 * No React, no browser: every word is read off weekendCore, so check:leagueinvite can hold it to the code.
 */
import { CODE_LEN, KICKOFF_KEY, FINAL_KEY, DAY_NAME, slotByKey, ilTime, ilDayDate } from './weekendCore.ts';
import { TARGET_ORIGIN } from './transfer.ts';

/** the game's address: the new origin, wherever the message is written from (the transfer owns the address, check:transfer) */
export const GAME_URL = TARGET_ORIGIN;
/** the league codes the server makes (weekendCore makeCode): no 0/O, no 1/I */
const CODE_RE = new RegExp(`^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{${CODE_LEN}}$`);

export function validLeagueCode(code: string | null | undefined): code is string {
  return typeof code === 'string' && CODE_RE.test(code);
}

/** the link that opens the game on "נכנסים עם קוד" with the code in the box; the bare address if the code is no code */
export function leagueJoinLink(code: string | null | undefined): string {
  const c = (code ?? '').trim().toUpperCase();
  return validLeagueCode(c) ? `${GAME_URL}/?league=${c}` : GAME_URL;
}

/** the code on a link that came in, if it is a league code at all (anything else is ignored) */
export function leagueCodeFromUrl(search: string): string | null {
  try {
    const v = new URLSearchParams(search).get('league');
    const c = (v ?? '').trim().toUpperCase();
    return validLeagueCode(c) ? c : null;
  } catch { return null; }
}

/** "חמישי 20:00": the round's day and hour, off the same grid the server plays by */
export function roundWords(key: string): string {
  if (key === KICKOFF_KEY) return 'חמישי 20:00';
  if (key === FINAL_KEY) return 'ראשון 20:00';
  const s = slotByKey(key);
  return s ? `${DAY_NAME[s.day]} ${String(s.hh).padStart(2, '0')}:00` : key;
}

/** the rounds, once each, the last one called the final: "חמישי 20:00 · שישי 10:00 · ... · גמר ראשון 20:00" */
export function scheduleLine(keys: readonly string[]): string {
  return keys.map((k, i) => (i === keys.length - 1 && k === FINAL_KEY ? `גמר ${roundWords(k)}` : roundWords(k))).join(' · ');
}

export interface InviteFacts {
  kind: 'friend' | 'open';
  /** the league's name as its opener typed it */
  name: string;
  /** the friend league's code; the open league has none */
  code: string | null;
  /** the round keys in order (LeagueView.roundKeys) */
  rounds: readonly string[];
  /** when registration closes (the cycle's lock) */
  locks: number;
}

export const INVITE_HOOK = 'מי באמת הכי חזק?';
export const INVITE_ABOUT = 'משחק ניהול כדורגל ישראלי, בדפדפן.';

/** the whole message, link inside, ready for the share sheet, WhatsApp or the clipboard */
export function leagueInviteText(f: InviteFacts): string {
  const lockWords = `${ilDayDate(f.locks)} ${ilTime(f.locks)}`;
  const head = `⚽ ליגת השכונה ב-BE A PRO - ${INVITE_HOOK}`;
  const when = `🗓️ המחזורים: ${scheduleLine(f.rounds)}`;
  const until = `⏳ נרשמים עד ${lockWords}`;
  if (f.kind === 'friend' && validLeagueCode(f.code)) {
    return [
      head,
      INVITE_ABOUT,
      `מזמין אותך לליגה שלי: "${f.name.trim()}"`,
      `🔑 קוד הליגה: ${f.code}`,
      when,
      until,
      `👉 להצטרפות: ${leagueJoinLink(f.code)}`,
      'פעם ראשונה במשחק? פותחים קבוצה, ואז לוחצים שוב על הלינק.',
    ].join('\n');
  }
  return [
    head,
    INVITE_ABOUT,
    'כל סופ״ש יש ליגה פתוחה: נכנסים לבד, בלי קוד.',
    when,
    until,
    `👉 נכנסים: ${GAME_URL}`,
    'ליגת השכונה ← הליגה הפתוחה. פעם ראשונה? קודם פותחים קבוצה.',
  ].join('\n');
}

/** the champion's words to the group, with the way in */
export function championBrag(name: string, date: string): string {
  return `🏆 אלוף ליגת השכונה ב-BE A PRO · ${name} · ${date}\nחושב שאתה יותר טוב? ${GAME_URL}`;
}
