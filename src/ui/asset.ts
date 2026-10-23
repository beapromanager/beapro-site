/**
 * Resolve a public asset URL against the app's base path, so images work whether
 * the site is served from the domain root (Netlify) or a project subpath
 * (a project site, e.g. /BE-A-PRO/, as it once was). Pass a root-relative path like "/stadium/x.webp".
 */
export const asset = (p: string): string => (import.meta.env?.BASE_URL ?? '/') + p.replace(/^\/+/, '');
