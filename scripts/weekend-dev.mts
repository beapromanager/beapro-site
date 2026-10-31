// a developer's hand on a local league: node --experimental-strip-types scripts/weekend-dev.mts <cmd> ...
//   fill <code> <nowMs>            five more devices join the league with that code
//   lock|round|collect <id> <nowMs> push the league through a stage (the server must run with DEBUG)
//   clock <id> <nowMs>              a fast match clock for that league
const BASE = process.env.DUEL_URL ?? 'http://127.0.0.1:8788';
const [, , cmd, arg, nowArg, extra] = process.argv;
const now = Number(nowArg ?? Date.now());
async function api(path: string, b?: unknown) {
  const res = await fetch(BASE + path, { method: b === undefined ? 'GET' : 'POST', body: b === undefined ? undefined : JSON.stringify(/^\/league(\/join|\/open)?$/.test(path) ? { consent: '2026-10-31', ...(b as object) } : b), headers: { 'content-type': 'application/json', 'x-now': String(now) } });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}
const nicks = ['דודו', 'רועי', 'יוסי', 'מוטי', 'אבי', 'עמית', 'ניר', 'גל', 'שי', 'עומר', 'בן'];
if (cmd === 'fill') {
  const n = Number(extra ?? 5);
  for (let i = 0; i < n; i++) console.log(nicks[i], JSON.stringify((await api('/league/join', { device: `dev-fill-${i}-${arg}`, nick: nicks[i], code: arg })).data));
} else if (cmd === 'lock' || cmd === 'round' || cmd === 'collect') {
  console.log(JSON.stringify((await api(`/league/${arg}/debug`, { device: 'dev-hand', action: cmd })).data));
} else if (cmd === 'clock') {
  console.log(JSON.stringify((await api(`/league/${arg}/debug`, { device: 'dev-hand', action: 'clock', clock: { minuteMs: 1500, decisionMs: 12000, halfMs: 5000 } })).data));
} else console.log('fill|lock|round|collect|clock');
