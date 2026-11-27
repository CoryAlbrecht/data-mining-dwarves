# Tunables: defaults in code, overrides from env files, written into the client by Vite

The numbers written in `packages/shared` stay the defaults that tests, `npm run formulas` and
production use. Any number in a tunable object can be overridden with a `DMD_<OBJECT>__<KEY>`
variable, loaded by `dotenvx` from `config/.env.development` and `config/.env` when `npm run dev`
starts. The server reads them from `process.env`; Vite writes every `DMD_*` value into the client
once at startup (`define: { __DMD_ENV__ }`), so the server, the client and Mine generation see the
same values from their first line of code. A changing value needs a restart. The Mine cache name
carries a hash of the overrides, so a retuned generator never serves stale cached Mines. A
malformed value or an unknown name stops startup. How to use it: "Overriding a tunable" in
`docs/FORMULAS.md`.

## Considered Options

- **Serve the values from `/api/config`, with a client that waits for them before starting**:
  rejected. Every tunable would become async state, the client could not start (or play offline)
  before the server answered, and module-level constants such as the Mine cache name would have
  to be computed later.
- **The env files hold every number, the code none**: rejected. Tests and `npm run formulas` would
  depend on files outside the code, and the code would no longer document its own defaults.
- **Vite's `import.meta.env` (`envPrefix: 'DMD_'`)**: rejected. The shared package also runs in
  Node, where `import.meta.env` does not exist; one injected object works in both.
