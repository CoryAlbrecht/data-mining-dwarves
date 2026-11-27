/**
 * Env overrides for tunables (docs/adr/0002-tunables-from-env-overrides.md). The numbers written
 * in the code are the defaults; a `DMD_<OBJECT>__<KEY>` variable replaces one of them, e.g.
 * `DMD_DIG_CURVE__ROCK_GROWTH=2.4` or, for a nested key, `DMD_LOOT__BYTES__BASE=10`. Keys are the
 * code's keys in SCREAMING_SNAKE_CASE (`rockGrowth` → `ROCK_GROWTH`, `kernel-panic` →
 * `KERNEL_PANIC`). Only numbers and arrays of numbers can be overridden.
 *
 * On the server the variables come from `process.env`; in the client Vite writes every `DMD_*`
 * value in as `__DMD_ENV__` when it starts (apps/client/vite.config.ts).
 */

/** Every variable this module reads starts with this. */
export const OVERRIDE_PREFIX = 'DMD_';

export type Env = Readonly<Record<string, string | undefined>>;

declare const __DMD_ENV__: Env | undefined;

/** The variables in effect: Vite's copy in the client, `process.env` elsewhere. */
export function currentEnv(): Env {
  if (typeof __DMD_ENV__ !== 'undefined') return __DMD_ENV__;
  return (globalThis as { process?: { env: Env } }).process?.env ?? {};
}

/** Only the `DMD_*` entries of `env`, sorted by name. */
export function overridesIn(env: Env): [string, string][] {
  return Object.entries(env)
    .filter((e): e is [string, string] => e[0].startsWith(OVERRIDE_PREFIX) && e[1] !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
}

/** A tunable's type once overrides may have replaced its numbers: literal types widen. */
export type Tuned<T> = T extends number
  ? number
  : T extends readonly (infer U)[]
    ? readonly Tuned<U>[]
    : T extends object
      ? { readonly [K in keyof T]: Tuned<T[K]> }
      : T;

/** `rockGrowth` → `ROCK_GROWTH`, `kernel-panic` → `KERNEL_PANIC`. */
export function envKeyPart(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .toUpperCase();
}

/** Every variable name the registered tunables answer to. */
const known = new Set<string>();

function parse(name: string, raw: string, fallback: number | readonly unknown[]): number | number[] {
  if (typeof fallback === 'number') {
    const n = raw.trim() === '' ? NaN : Number(raw);
    if (!Number.isFinite(n)) throw new Error(`${name}=${JSON.stringify(raw)}: expected a number`);
    return n;
  }
  let list: unknown;
  try {
    list = JSON.parse(raw);
  } catch {
    list = undefined;
  }
  if (!Array.isArray(list) || !list.every((x) => typeof x === 'number' && Number.isFinite(x))) {
    throw new Error(`${name}=${JSON.stringify(raw)}: expected a JSON array of numbers, e.g. [2,3,4]`);
  }
  return list as number[];
}

function overridable(v: unknown): v is number | readonly number[] {
  return typeof v === 'number' || (Array.isArray(v) && v.every((x) => typeof x === 'number'));
}

function apply(path: string, value: unknown, env: Env, register: boolean): unknown {
  if (overridable(value)) {
    if (register) known.add(path);
    const raw = env[path];
    return raw === undefined ? value : parse(path, raw, value);
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, apply(`${path}__${envKeyPart(k)}`, v, env, register)]),
    );
  }
  return value;
}

/**
 * `defaults` with every `DMD_<name>__<KEY>` override in `env` applied, as a new object. It never
 * registers the keys, so tests can call it freely; a malformed value throws, naming the variable.
 */
export function withOverrides<T extends object>(name: string, defaults: T, env: Env): Tuned<T> {
  return apply(`${OVERRIDE_PREFIX}${name}`, defaults, env, false) as Tuned<T>;
}

/**
 * Declare a tunable object: `name` is its exported constant's name. Returns `defaults` with the
 * current env's overrides applied, and records its keys for `assertKnownOverrides`.
 */
export function tunable<T extends object>(name: string, defaults: T): Tuned<T> {
  return apply(`${OVERRIDE_PREFIX}${name}`, defaults, currentEnv(), true) as Tuned<T>;
}

/**
 * Throw if `env` holds a `DMD_*` variable that names no tunable. Call it at startup, after the
 * shared package has loaded (so every tunable is registered).
 */
export function assertKnownOverrides(env: Env = currentEnv()): void {
  const unknown = overridesIn(env)
    .map(([k]) => k)
    .filter((k) => !known.has(k));
  if (unknown.length) {
    throw new Error(`${unknown.join(', ')}: names no tunable (see "Overriding a tunable" in docs/FORMULAS.md)`);
  }
}

/**
 * A short hash of the overrides in `env`, or '' when there are none. Changes whenever any
 * override's name or value does.
 */
export function overridesHash(env: Env = currentEnv()): string {
  const entries = overridesIn(env);
  if (!entries.length) return '';
  // FNV-1a, 32-bit: short, stable, and the same in Node and the browser.
  let h = 0x811c9dc5;
  for (const ch of entries.map(([k, v]) => `${k}=${v}\n`).join('')) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}
