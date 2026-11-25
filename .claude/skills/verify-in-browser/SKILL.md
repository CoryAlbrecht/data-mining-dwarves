---
name: verify-in-browser
description: Check a change in the real game in headless Chrome (taps, keys, dialogs, screenshots, timing) on a private copy of the dev servers, leaving the developer's own `npm run dev` alone. Use when a change needs proof in a browser beyond unit tests.
---

Every browser check runs on a **private copy** of the game that you start, check against, and stop. Touch only the copy you started; the developer's own server (5173 / 8787) and other agents' copies keep running.

## 1. Start a private copy

```sh
npm run serve:private
```

It picks free ports away from the defaults, starts the API, the client and headless Chrome as one unit, waits until the game answers, and prints the game URL, the Chrome port (`--chrome N`) and the copy's id. Use exactly those values below.

## 2. Write and run a check

A check is a small `.mjs` file in your scratch directory that default-exports `async (t) => {…}`. The helpers (`t.nav`, `t.ev`, `t.mod`, `t.shot`, `t.send`, `t.sleep`) are documented at the top of `scripts/cdp.mjs`. Run it with `node scripts/cdp.mjs <check.mjs> --chrome <N>`.

- **Start clean**: `await t.nav('<game URL>?reset', 4500)` wipes the copy's save and caches, then boots a fresh game.
- **Reach game state** through the page's own modules: `` t.ev(`(async () => { const w = ${t.mod('state/world.ts')}; return w.dwarves.value; })()`) ``.
- **Real input** for keys, Escape and backdrop clicks: `t.send('Input.dispatchKeyEvent', …)` / `Input.dispatchMouseEvent`. `element.click()` is fine for buttons.
- **Look** at screenshots (`t.shot(path)`, then read the PNG) whenever layout or Theme matters.
- Print every observation with `console.log`, and judge each acceptance criterion from that output.

## 3. Stop the copy

```sh
npm run serve:private -- stop <id>
```

It stops every process of the copy, port or no port, and says `Stopped <id>.` Stopping is part of the check: you're done when it has printed that line, including after a check that failed or was abandoned halfway.
