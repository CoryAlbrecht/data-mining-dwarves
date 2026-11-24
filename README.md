# Data Mining Dwarves

An idle mining game with a few roguelike touches. Dwarves dig through bit-rocks in a chain of
**data mines** for **bytes** and **chips**. Each level has buried, era-appropriate hardware: a
4004 CPU, 8 kB of DRAM, an 8″ floppy. Feed it chips to level it up, collect the bytes it produces,
and upgrade the network port to send dwarves deeper. The full design is in
[docs/DESIGN.md](docs/DESIGN.md).

The game uses in-game currency only. There are no real-money purchases, so nobody can pay for
better performance.

## Layout

```
apps/client      React 19 + Vite 8 PWA. Most of the gameplay runs here.
apps/server      Hono API: levels, level art, leaderboards, store.
packages/shared  Types and game rules (chips, merging, monsters, RNG) used by both apps.
```

## Getting started

```sh
npm install
npm run dev        # API on :8787, client on :5173 (the client proxies /api to the API)
npm test           # vitest across all workspaces
npm run typecheck
npm run build      # typecheck everything, then build the client PWA into apps/client/dist
npm run fonts:unifont  # regenerate the Unifont chunks (needs Python: fonttools + brotli)
```

In dev, add `?speed=20` to the URL to fast-forward the game clock for playtesting.

## State management: signals, not useState/useEffect

All game state lives in `@preact/signals-react` signals in `apps/client/src/state/`. The
`@preact/signals-react-transform` Babel plugin (in `vite.config.ts`) makes any component that reads
`signal.value` re-render when that signal changes.

- State is a `signal()`. Derived values are `computed()`. Never copy one signal into another.
- State lives in `state/world.ts`. Change it only through the functions in `state/actions.ts`
  (the clock is `state/loop.ts`). Use `batch()` when several signals change together.
- Each level in the chain owns its own signals (`LevelState`), so a change on one level only
  re-renders that level.
- Components read `.value` and call actions. Don't use `useState` for game state, and don't use
  `useEffect` for game logic.
- Timers, persistence and other side effects are module-level `effect()`s or start once in
  `main.tsx`, not inside components.
- Replace arrays and objects in signals instead of mutating them (`lvl.blocks.value = next`).
