/** how numbers and words are written on the dashboard */

export const RANGES = [
  { days: 7, label: '7 ימים' },
  { days: 30, label: '30 יום' },
  { days: 90, label: '90 יום' },
] as const;

export const num = (n: number | null | undefined): string => (n === null || n === undefined ? '-' : n.toLocaleString('he-IL', { maximumFractionDigits: 1 }));
export const pctText = (x: number | null | undefined): string => (x === null || x === undefined ? '-' : `${x.toLocaleString('he-IL', { maximumFractionDigits: 1 })}%`);

export interface Delta { dir: 'up' | 'down' | 'same' | 'none'; text: string; spoken: string }

/** today against yesterday, with the arrow AND the words, so colour is never the only thing that says it */
export function delta(cur: number | null, prev: number | null): Delta {
  if (cur === null || prev === null) return { dir: 'none', text: 'אין השוואה', spoken: 'אין השוואה לאתמול' };
  if (prev === 0) return cur === 0 ? { dir: 'same', text: 'כמו אתמול', spoken: 'כמו אתמול' } : { dir: 'up', text: '▲ מ-0', spoken: 'עלייה מאפס' };
  if (cur === prev) return { dir: 'same', text: 'כמו אתמול', spoken: 'כמו אתמול' };
  const x = Math.round(Math.abs(cur - prev) / prev * 100);
  return cur > prev
    ? { dir: 'up', text: `▲ ${x}%`, spoken: `עלייה של ${x} אחוז` }
    : { dir: 'down', text: `▼ ${x}%`, spoken: `ירידה של ${x} אחוז` };
}

export const clockOf = (ts: number): string =>
  new Intl.DateTimeFormat('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jerusalem' }).format(new Date(ts));

/** "2026-10-25" -> "25.10" */
export const shortDay = (key: string): string => `${key.slice(8, 10)}.${key.slice(5, 7)}`;

export const ERR_NAME: Record<string, string> = { Error: 'שגיאה', TypeError: 'שגיאת טיפוס', RangeError: 'שגיאת טווח', ReferenceError: 'שגיאת הפניה', SyntaxError: 'שגיאת תחביר', other: 'אחר' };
