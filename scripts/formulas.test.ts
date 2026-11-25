import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tables } from './formulas.ts';

const doc = readFileSync(new URL('../docs/FORMULAS.md', import.meta.url), 'utf8');
const generated = tables();

/** Each Markdown table in the doc (a run of lines starting with `|`) and the line just above it. */
function docTables(): { above: string; first: string }[] {
  const lines = doc.split('\n');
  return lines.flatMap((line, i) => (line.startsWith('|') && !lines[i - 1]?.startsWith('|') ? [{ above: lines[i - 1] ?? '', first: line }] : []));
}

describe('docs/FORMULAS.md', () => {
  // Fails after a retune: run `npm run formulas` and paste the changed table under its marker.
  it.each(generated.map((t) => [t.id, t.markdown]))('has the current %s table', (id, markdown) => {
    expect(doc, `table "${id}" is stale or missing in docs/FORMULAS.md`).toContain(`<!-- ${id} -->\n${markdown}\n`);
  });

  it('has a marker for every generated table and a generator for every marker', () => {
    const markers = [...doc.matchAll(/^<!-- ([\w-]+) -->$/gm)].map((m) => m[1]);
    expect(markers.sort()).toEqual(generated.map((t) => t.id).sort());
  });

  it('has no table without a marker (such as an old copy left behind)', () => {
    const unmarked = docTables().filter((t) => !/^<!-- [\w-]+ -->$/.test(t.above));
    expect(unmarked.map((t) => t.first)).toEqual([]);
  });
});
