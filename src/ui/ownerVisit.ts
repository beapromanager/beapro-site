/**
 * The old way to the numbers was an address with the key in it: /?admin=KEY. The numbers now live on their own page
 * (/ops/), which asks for the key in a form and keeps it in memory, so the game has no route to them any more.
 *
 * What is left here is what a stale bookmark or a pasted link must still do right: the key is scrubbed from the address
 * straight away, before any of the game's code can read it, send it, or leave it in the history, and the visit is not
 * counted (it is the owner looking, not a player), exactly as before. Nothing is sent anywhere with it, and nothing is
 * kept: the answer to "was there one" is a yes or a no, and the key is gone with the address it was in.
 *
 * It is imported first in main.tsx so that it has run before anything else in the game exists.
 */

/**
 * The same address without any `admin` parameter, in the query and in the hash (#admin=KEY, #/x?admin=KEY, #a=1&admin=KEY),
 * and whether there was one. Case of the name is ignored. Nothing else is touched.
 */
export function cleanAdminFromUrl(href: string): { href: string; had: boolean } {
  let had = false;
  const drop = (pairs: string): string => pairs.split('&').filter(p => {
    const name = decodeURIComponentSafe(p.split('=')[0]).toLowerCase();
    if (name === 'admin') { had = true; return false; }
    return true;
  }).filter(p => p !== '').join('&');
  let url: URL;
  try { url = new URL(href); } catch { return { href, had: false }; }
  const search = drop(url.search.replace(/^\?/, ''));
  url.search = search ? '?' + search : '';
  const h = url.hash.replace(/^#/, '');
  if (h) {
    const q = h.indexOf('?');
    if (q >= 0) {
      const params = drop(h.slice(q + 1));
      url.hash = h.slice(0, q) + (params ? '?' + params : '');
    } else if (h.includes('=')) {
      url.hash = drop(h);
    }
  }
  return { href: url.href, had };
}

function decodeURIComponentSafe(s: string): string {
  try { return decodeURIComponent(s); } catch { return s; }
}

function scrub(): boolean {
  try {
    const { href, had } = cleanAdminFromUrl(location.href);
    if (!had) return false;
    const u = new URL(href);
    try { history.replaceState(null, '', u.pathname + u.search + u.hash); } catch { /* private mode: it is still not counted */ }
    return true;
  } catch { return false; }
}

/** true when this visit came with an admin parameter. It is worked out once, at load, before anything can fetch. */
export const OWNER_VISIT: boolean = scrub();
