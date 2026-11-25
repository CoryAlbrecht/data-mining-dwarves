import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tables } from './formulas.ts';

const doc = readFileSync(new URL('../docs/FORMULAS.md', import.meta.url), 'utf8');

describe('docs/FORMULAS.md', () => {
  // Fails after a retune: run `npm run formulas` and paste the changed table under its marker.
  it.each(tables().map((t) => [t.id, t.markdown]))('has the current %s table', (id, markdown) => {
    expect(doc, `table "${id}" is stale or missing in docs/FORMULAS.md`).toContain(`<!-- ${id} -->\n${markdown}\n`);
  });
});
