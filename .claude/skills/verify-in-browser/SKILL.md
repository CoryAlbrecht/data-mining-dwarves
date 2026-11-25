---
name: verify-in-browser
description: Check a change in the real game in headless Chrome (taps, keys, dialogs, screenshots, timing) on a second copy of the dev servers, leaving the developer's own `npm run dev` alone. Use when a change needs proof in a browser beyond unit tests.
---

Run a private copy of the game on alternate ports, drive it with `scripts/cdp.mjs`, then stop it. The developer's own dev server (5173 / 8787) may be running: never stop it, restart it, or point checks at it.

## 1. Start a private copy

Pick a scratch directory `$S` (the session scratchpad), then:

```sh
API_PORT=8799 CLIENT_PORT=5198 VITE_CACHE_DIR=$S/vite-cache npm run dev > $S/dev.log 2>&1 &
google-chrome --headless=new --remote-debugging-port=9333 --user-data-dir=$S/chrome \
  --window-size=420,900 about:blank > $S/chrome.log 2>&1 &
```

Running from the bash tool's background mode works too. Ready when `curl -s localhost:5198/api/levels/1` returns JSON.

## 2. Write and run a check

A check is a small `.mjs` file in `$S` that default-exports `async (t) => {…}`. The helpers (`t.nav`, `t.ev`, `t.mod`, `t.shot`, `t.send`, `t.sleep`) are documented at the top of `scripts/cdp.mjs`. Run it with `node scripts/cdp.mjs $S/check.mjs`.

- **Start clean**: `await t.nav('http://localhost:5198/?reset', 4500)` wipes the private Chrome profile's save and caches, then boots a fresh game.
- **Reach game state** through the page's own modules, never a fresh import: `` t.ev(`(async () => { const w = ${t.mod('state/world.ts')}; return w.dwarves.value; })()`) ``.
- **Real input** for keys, Escape and clicks on the backdrop: `t.send('Input.dispatchKeyEvent', …)` / `Input.dispatchMouseEvent`. `element.click()` is fine for buttons.
- **Look** at screenshots (`t.shot($S/x.png)`, then read the PNG) whenever layout or Theme matters.
- Print every observation with `console.log`, and judge each acceptance criterion from that output.

## 3. Stop the copy

Stop by port, so no child process survives. Leave 5173 and 8787 alone:

```sh
for p in 5198 8799 9333; do fuser -k $p/tcp; done
```

Done when `ss -ltn | grep -E ':(5198|8799|9333)\b'` prints nothing.
