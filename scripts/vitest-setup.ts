// Tests run on the code's tunable defaults, whatever DMD_* overrides the shell or the env files set.
// This runs before each test file imports the shared package. tunables.ts registers nothing on its own.
import { OVERRIDE_PREFIX } from '../packages/shared/src/tunables.ts';

for (const key of Object.keys(process.env)) {
  if (key.startsWith(OVERRIDE_PREFIX)) delete process.env[key];
}
