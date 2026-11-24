# Data Mining Dwarves

A parody idle dig-and-merge game with roguelike touches. Theme: dwarves "data mining" for chips.
Puns are encouraged everywhere: chip names, monsters, level themes, UI copy.

- The game design is in `docs/DESIGN.md`. Read it before changing game rules, and update it when
  the rules change.
- Monorepo using npm workspaces: `apps/client` (React+Vite PWA), `apps/server` (Hono), `packages/shared`.
- Keep all names, art and level designs original. The game shares genre mechanics with other idle
  mining games but must not copy their names, characters, art or look.
- In-game currency only. Never add a real-money purchase path.
- Client state follows the signals rules in README.md. Don't add `useState` or `useEffect` for game
  logic.
- Put game rules and tunable curves (dig time, chip costs, device output, port capacity) in
  `packages/shared`, not in the client or server.
- Level generation is deterministic per depth (`apps/server/src/data/levels.ts`). Keep it that way:
  the service worker caches levels forever.
- Imports use explicit `.ts`/`.tsx` extensions.
- Verify with: `npm run typecheck && npm test && npm run build`.
- CRT levels use the font stack retro face → `DMD Unifont` (chunked, `scripts/build-unifont.py`) →
  Noto Emoji. Any Unicode character is fine in glyph levels.
- Playtest with `?speed=N` in dev, or headless: `google-chrome --headless=new --virtual-time-budget=…`.

## Agent skills

### Issue tracker

GitHub Issues on the private repo `CoryAlbrecht/data-mining-dwarves`, managed with `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root, created when terms or decisions are first settled. See `docs/agents/domain.md`.
