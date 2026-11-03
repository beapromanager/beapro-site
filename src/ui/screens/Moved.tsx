import { TARGET_ORIGIN } from '../../game/transfer.ts';
import { leagueCodeFromUrl, leagueJoinLink } from '../../game/weekendInvite.ts';
import { pendingInvite } from '../../game/weekend.ts';
import { asset } from '../asset.ts';

/**
 * The old address with no career on it (Itzik, 3.11: the game lives only at beapro.co.il; the move between the two
 * addresses is cancelled). Nobody starts a career here any more: this screen stands where the intro and the title
 * would, and its one button goes to the new address. A league invite (?league=CODE) goes along with the code, so the
 * friend lands on the same invite there. The code is read and the link is made by the invite's own helpers
 * (weekendInvite.ts), so there is one rule for what a league code is. A code already kept on this phone goes along
 * too: "קריירה חדשה" comes after the address bar was tidied.
 */
export function movedTarget(search: string, kept: string | null = keptInvite()): string {
  const c = leagueCodeFromUrl(search) ?? leagueCodeFromUrl(kept ? `?league=${kept}` : '');
  return c ? leagueJoinLink(c) : `${TARGET_ORIGIN}/`;
}
function keptInvite(): string | null { try { return pendingInvite(); } catch { return null; } }

/** the address as the player reads it, from the one place that owns it */
const HOST = new URL(TARGET_ORIGIN).host;

export function MovedScreen({ href }: { href: string }) {
  return (
    <div className="screen pad stack" data-testid="moved" style={{ justifyContent: 'center', minHeight: '100dvh', textAlign: 'center', gap: 18 }}>
      <img src={asset('/logo.webp')} alt="" width={120} height={120} style={{ margin: '0 auto', borderRadius: 24 }} />
      <div className="h2" style={{ fontSize: 26 }}>BE A PRO עבר לכתובת חדשה</div>
      <p className="hint" style={{ margin: 0, fontSize: 15.5 }}>
        המשחק ממשיך ב-<bdi dir="ltr">{HOST}</bdi>. שם פותחים קריירה, ושם ליגת השכונה.
      </p>
      <a className="btn" href={href} style={{ minHeight: 64, fontSize: 20, textDecoration: 'none', display: 'grid', placeItems: 'center' }}>להמשך למשחק ←</a>
    </div>
  );
}
