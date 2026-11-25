# Data Mining Dwarves

A parody idle dig-and-merge game with roguelike touches. Theme: dwarves "data mining" for chips.
Puns are encouraged everywhere: chip names, monsters, level themes, UI copy.

- Game rules: `docs/DESIGN.md`. Read it before changing a rule.
- Formulas and tunable numbers: `docs/FORMULAS.md`; the code for them lives in `packages/shared`.
- Coding rules (doc sync, where tunables go, generator determinism, signals, imports), for
  writing code and for review: `CODING_STANDARDS.md`.
- Monorepo using npm workspaces: `apps/client` (React+Vite PWA), `apps/server` (Hono), `packages/shared`.
- Keep all names, art and level designs original. The game shares genre mechanics with other idle
  mining games but must not copy their names, characters, art or look.
- In-game currency only. Never add a real-money purchase path.
- Verify with: `npm run typecheck && npm test && npm run build`. The pre-commit hook runs all
  three.
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
