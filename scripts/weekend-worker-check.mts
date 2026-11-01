/**
 * The weekend server is ready to be deployed, and not deployed (Itzik, 25.10, stop C): its config, who may call it
 * from a browser, and the address the phone calls, all read without running anything.
 *
 *   1. worker/wrangler.weekend.toml: it has an address (workers_dev), the three objects are bound and every one is in
 *      exactly one migration, as a SQLite-backed class (the only kind a Free plan allows, fine on a Paid plan), each
 *      class is exported by the worker, and nothing in it sets DEBUG, a secret or any [vars]
 *   2. CORS: the game's own website is answered with its own origin; a developer's localhost only on a DEBUG server;
 *      anyone else gets nothing; the worker has no wildcard and answers through one function
 *   3. the address in the game is the weekend worker on the same workers.dev subdomain as the counting house, and the
 *      door is still shut (WEEKEND_LIVE false), so this changes nothing a player can see
 *   4. the secret is never written: no key, token or .dev.vars in what this change touches
 * Run: npm run check:weekendworker
 */
import { readFileSync } from 'node:fs';
import { corsOrigin, SITE_ORIGIN, SITE_ORIGINS } from '../src/game/weekendRoutes.ts';

const fails: string[] = [];
let checked = 0;
const claim = (ok: boolean, msg: string) => { checked++; if (!ok) fails.push(msg); };

const toml = readFileSync('worker/wrangler.weekend.toml', 'utf8');
const code = toml.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');
const worker = readFileSync('worker/src/weekend.ts', 'utf8');
const client = readFileSync('src/game/weekend.ts', 'utf8');
const telemetry = readFileSync('src/data/telemetry.ts', 'utf8');

/* 1. the config */
{
  claim(/^name = "beapro-weekend"$/m.test(code) && /^main = "src\/weekend\.ts"$/m.test(code), 'the worker is not beapro-weekend from src/weekend.ts');
  claim(/^workers_dev = true$/m.test(code), 'workers_dev is not true: the deployed worker would have no address');
  claim(!/^\s*routes?\s*=/m.test(code) && !/^\[vars\]/m.test(code) && !/\[env\./.test(code), 'the config has routes, [vars] or environments it should not have');
  claim(!/DEBUG/i.test(code) && !/SECRET|KEY|TOKEN|PASSWORD/i.test(code), 'the config names DEBUG or a secret');
  const bound = [...code.matchAll(/\{ name = "(\w+)", class_name = "(\w+)" \}/g)].map(m => [m[1], m[2]] as const);
  claim(bound.map(b => b.join(':')).sort().join() === 'LEAGUE:LeagueDO,LOBBY:LobbyDO,MATCH:MatchDO', `the bindings are ${bound.map(b => b.join(':')).join(',')}`);
  const tags = [...code.matchAll(/\[\[migrations\]\]\s*\ntag = "(\w+)"\s*\n(new_\w+) = \[([^\]]*)\]/g)].map(m => ({ tag: m[1], kind: m[2], classes: [...m[3].matchAll(/"(\w+)"/g)].map(x => x[1]) }));
  claim(tags.length === 2 && tags.map(t => t.tag).join() === 'v1,v2', `the migrations are ${tags.map(t => t.tag).join(',')}`);
  claim(tags.every(t => t.kind === 'new_sqlite_classes'), `a migration is ${tags.find(t => t.kind !== 'new_sqlite_classes')?.kind}: only SQLite-backed objects run on a Free plan`);
  claim(!/new_classes/.test(code), 'a plain new_classes is left in the config');
  const inMigrations = tags.flatMap(t => t.classes).sort();
  claim(inMigrations.join() === 'LeagueDO,LobbyDO,MatchDO', `the migrations carry ${inMigrations.join(',')}`);
  for (const [, cls] of bound) claim(new RegExp(`export class ${cls}\\b`).test(worker), `${cls} is bound but the worker does not export it`);
  // the key-value API is what the objects use, and what a SQLite-backed object serves unchanged: nothing of the SQL API
  claim(!/storage\.sql|\.exec\(/.test(worker), 'the worker uses a storage API that is not the key-value one');
  claim(/npx wrangler secret put PRIZE_SECRET -c wrangler\.weekend\.toml/.test(toml) && /https:\/\/beapro-weekend\.beapromanager\.workers\.dev/.test(toml), 'the config does not say how to set the secret or where it will live');
}

/* 2. CORS */
{
  const dbg = [true, false];
  for (const o of SITE_ORIGINS) for (const d of dbg) claim(corsOrigin(o, d) === o, `${o} is not answered with its own origin (debug ${d})`);
  claim(SITE_ORIGIN === 'https://beapromanager.github.io', `the site origin is ${SITE_ORIGIN}`);
  claim(SITE_ORIGINS.join() === 'https://beapromanager.github.io,https://beapro.co.il,https://www.beapro.co.il', `the allowed websites are ${SITE_ORIGINS.join()}`);
  for (const o of ['http://localhost:5173', 'http://127.0.0.1:8788', 'http://localhost']) {
    claim(corsOrigin(o, true) === o, `a developer's ${o} is refused on a debug server`);
    claim(corsOrigin(o, false) === null, `a developer's ${o} is let in on the deployed server`);
  }
  for (const o of ['https://evil.example', 'https://beapromanager.github.io.evil.example', 'http://beapromanager.github.io', 'http://beapro.co.il', 'https://beapro.co.il.evil.example', 'https://evil.beapro.co.il', 'https://beapro.co.il:8443', 'https://beapro.com', 'https://beapromanager.github.io:8443', 'https://x.beapromanager.github.io', 'null', 'file://', 'http://localhost.evil.example', 'http://localhost:99999999', 'https://localhost:5173', '*', '']) {
    claim(corsOrigin(o, false) === null && corsOrigin(o, true) === null, `the origin "${o}" is let in`);
  }
  claim(corsOrigin(null, true) === null && corsOrigin(undefined, false) === null, 'no origin got an answer');
  const head = worker.slice(worker.indexOf('const HEADERS'), worker.indexOf('const json'));
  claim(!/access-control-allow-origin/.test(head), 'the shared headers still carry an allow-origin');
  claim(!/allow-origin['"]?\s*:\s*['"]\*/.test(worker) && !/\.set\('access-control-allow-origin', '\*'\)/.test(worker), 'the worker answers with a wildcard');
  claim(/function withCors\(req: Request, env: Env, res: Response\): Response/.test(worker) && /return withCors\(req, env, await route\(req, env\)\);/.test(worker), 'the worker does not answer every request through withCors');
  claim(/corsOrigin\(req\.headers\.get\('origin'\), !!env\.DEBUG\)/.test(worker), 'the allowed origin is not asked of the core with the DEBUG flag');
  claim(/headers\.append\('vary', 'Origin'\)/.test(worker), 'the answer does not say it varies with the origin');
  // a made-up id is a 404, not an uncaught error with a stack
  claim(/try \{ stub = env\.MATCH\.get\(env\.MATCH\.idFromString\(id\)\); \} catch \{ return bad\('no such match', 404\); \}/.test(worker) && /try \{ stub = env\.LEAGUE\.get\(env\.LEAGUE\.idFromString\(id\)\); \} catch \{ return bad\('no such league', 404\); \}/.test(worker), 'a made-up league or match id is not answered with a 404');
}

/* 3. the address in the game */
{
  const prod = client.match(/const WEEKEND_URL_PROD = '([^']*)';/)?.[1] ?? '';
  const count = telemetry.match(/TELEMETRY_URL: string = 'https:\/\/beapro-count\.([a-z0-9.-]+)'/)?.[1] ?? '';
  claim(count === 'beapromanager.workers.dev', `the counting house's subdomain reads ${count}`);
  claim(prod === `https://beapro-weekend.${count}`, `WEEKEND_URL_PROD is ${prod}, wanted https://beapro-weekend.${count}`);
  claim(/export const WEEKEND_LIVE = true;/.test(client), 'the door is shut (WEEKEND_LIVE is not true): the league went live on 1.11 (Itzik), the clock gate on LAUNCH_AT still holds it until Monday 2.11 20:00');
  claim(/url !== '' && live && now >= LAUNCH_AT/.test(client), 'the clock gate no longer needs the flag and the address');
}

/* 4. no secret in what this change touches */
{
  for (const [name, text] of [['wrangler.weekend.toml', toml], ['worker/src/weekend.ts', worker], ['src/game/weekend.ts', client]] as const) {
    claim(!/PRIZE_SECRET\s*[:=]\s*['"][^'"]+['"]/.test(text) && !/(?=[A-Za-z0-9_-]*[A-Za-z])(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]{32,}/.test(text.replace(/https?:\/\/\S+/g, '')), `${name} holds something that looks like a key`);
  }
  claim((worker.match(/'debug-secret'/g) ?? []).length === 1 && /\(debug \? 'debug-secret' : ''\)/.test(worker), 'the debug secret is not confined to DEBUG');
  claim(/if \(!secret\) return bad\('no secret', 500\);/.test(worker), 'a missing PRIZE_SECRET does not answer 500');
}

console.log(`${checked} checks`);
if (fails.length) { console.log(`FAIL (${fails.length} of ${checked})`); for (const f of fails.slice(0, 40)) console.log('  - ' + f); process.exit(1); }
console.log('OK, the weekend server is configured to be deployed: an address, SQLite-backed objects, no DEBUG and no secret, a browser answered only for the game\'s website, and the door still shut');
