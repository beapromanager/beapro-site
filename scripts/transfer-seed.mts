/**
 * A real career, a few rounds in, written the way the game writes it, for the browser check to put into a page.
 *   node --experimental-strip-types scripts/transfer-seed.mts <seed> <manager name> [club index]
 * Prints one JSON line: { career, device, aid, club, manager, phase }. No browser, no network, nothing written to disk.
 */
import * as G from '../src/game/state.ts';
import { simulateMatch } from '../src/engine/matchEngine.ts';
import { DEFAULT_FORMATION } from '../src/data/formations.ts';
import { saveCareer, savedSummary } from '../src/game/save.ts';
import { myCode } from '../src/game/invite.ts';
import { deviceId } from '../src/game/telemetry.ts';

const store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true, writable: true,
  value: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => { store.set(k, v); }, removeItem: (k: string) => { store.delete(k); } },
});

const seed = Number(process.argv[2] ?? 4242);
const manager = process.argv[3] ?? 'מאמן הבדיקה';
const clubIndex = Number(process.argv[4] ?? 0);

let gs = G.newGame(seed);
gs = G.setProfile(gs, { name: manager, nickname: '', age: 38, type: 'mental' });
gs = G.pickClub(gs, gs.league.clubs[clubIndex].id);
gs = G.afterSigning(gs, {});
gs = G.enterSeason(gs);
if (gs.phase === 'sponsor') gs = G.takeSponsor(gs, 'results');
for (let w = 1; w <= 4; w++) {
  const inp = G.liveMatchInput(gs);
  const res = simulateMatch(
    { id: inp.homeId, name: inp.homeName, players: inp.iAmHome ? inp.playerStarters : inp.oppStarters,
      tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: true },
    { id: inp.awayId, name: inp.awayName, players: inp.iAmHome ? inp.oppStarters : inp.playerStarters,
      tactic: { formation: DEFAULT_FORMATION, approach: 'balanced', press: 'mid' }, chemistry: 0.7, isHome: false },
    inp.seed);
  gs = G.commitRound(gs, res);
  gs = G.continueFromResult(gs);
  while (gs.phase === 'press') gs = G.answerPress(gs, w % 3);
  if (gs.phase === 'chat') gs = G.closeChat(gs);
}
// a manager who has played four rounds has long since read the notices the game put on his hub
while (gs.notices.length) gs = G.dismissNotice(gs);
gs = G.markTutorialSeen(gs);
if (gs.phase !== 'hub') throw new Error(`the seeded career is on ${gs.phase}, not the hub`);
saveCareer(gs);
myCode(); deviceId();
const sum = savedSummary();
console.log(JSON.stringify({
  career: store.get('beapro.career.v1'), device: store.get('beapro.device'), aid: store.get('beapro.aid'),
  club: sum?.clubName, manager: sum?.managerName, phase: gs.phase,
}));
