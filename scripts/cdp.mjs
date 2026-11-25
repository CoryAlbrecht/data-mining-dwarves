/**
 * Drive a headless Chrome page from a check script, for verifying the game in a real browser.
 *
 *   node scripts/cdp.mjs <check.mjs> [--chrome 9333]
 *
 * The check script default-exports `async (t) => { ... }`, where `t` has:
 *   t.nav(url, ms?)      navigate, then wait ms (default 3000) for the game to boot
 *   t.ev(js)             evaluate an expression in the page (promises awaited), returning its value;
 *                        a thrown error comes back as the string 'EXC <message>'
 *   t.shot(path)         save a PNG screenshot
 *   t.mod(name)          JS expression for the app's own instance of a client module, e.g.
 *                        t.ev(`(async () => (${t.mod('state/world.ts')}).dwarves.value.length)()`)
 *   t.send(method, params)  any raw Chrome DevTools Protocol call (Input.dispatchKeyEvent, …)
 *   t.sleep(ms)
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const script = args[0];
const chromePort = args.includes('--chrome') ? args[args.indexOf('--chrome') + 1] : '9333';
if (!script) {
  console.error('usage: node scripts/cdp.mjs <check.mjs> [--chrome 9333]');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const targets = await (await fetch(`http://127.0.0.1:${chromePort}/json`)).json();
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));

let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  pending.get(m.id)?.(m);
  pending.delete(m.id);
});
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id;
    pending.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params }));
  });

const ev = async (expression) => {
  const r = (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result;
  return r.exceptionDetails ? `EXC ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}` : r.result.value;
};
const nav = async (url, ms = 3000) => {
  await send('Page.navigate', { url });
  await sleep(ms);
};
const shot = async (path) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(path, Buffer.from(r.result.data, 'base64'));
};
// Vite serves each module at a URL with a ?t= stamp; importing that exact URL reuses the page's
// own instance (its live signals), where a fresh import would make a second copy.
const mod = (name) =>
  `(await import(performance.getEntriesByType('resource').map((e) => e.name).filter((u) => u.includes('/src/${name}')).at(-1)))`;

await send('Runtime.enable');
await send('Page.enable');
try {
  const check = await import(pathToFileURL(resolve(script)).href);
  await check.default({ send, ev, nav, shot, mod, sleep });
} finally {
  ws.close();
}
