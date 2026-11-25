# Coding standards

Follow these while writing code; review checks them. Each rule is a judgement call that no
automated check makes for you; the mechanical ones live in tests and the pre-commit hook instead.

## Game rules and numbers

- **Tunables live in `packages/shared`.** Every game rule and tunable number (dig time, chip costs,
  device output, port capacity, spawn odds, loot shares, time caps) is a named constant or function
  there. The client and server import it. A bare number in `apps/` that changes how the game plays
  is a finding.
- **Docs move with the code.** A diff that changes a rule updates `docs/DESIGN.md`; a diff that
  changes a curve, constant or formula updates `docs/FORMULAS.md` (regenerate its tables with
  `npm run formulas`). Both in the same change.
- **Mine generation stays deterministic per depth.** `apps/server/src/data/levels.ts` draws every
  random choice from the depth's seeded streams, never from `Math.random`, the clock or saved
  state. A diff that changes what any depth generates bumps `GENERATOR_VERSION` (the fingerprint
  test in `levels.test.ts` fails until it does), because players' devices cache Mines forever.
- **Words follow `GLOSSARY.md`.** Names in code, UI copy and docs use the glossary's terms (a Mine
  has no Level; a Level is a rank).

## Client

- **Game state lives in signals**, following the rules in `README.md`. Game logic uses no
  `useState` or `useEffect`.

## Code shape

- **Imports carry explicit extensions**: `./foo.ts`, `./Bar.tsx`.
