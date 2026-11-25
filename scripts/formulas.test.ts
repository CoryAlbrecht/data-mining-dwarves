import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tables } from './formulas.ts';

const doc = readFileSync(new URL('../docs/FORMULAS.md', import.meta.url), 'utf8');
const lines = doc.split('\n');
const generated = tables();
const MARKER = /^<!-- ([\w-]+) -->$/;

/** The table under `<!-- id -->`: every `|` line straight after the marker. */
function markedTable(id: string): string | undefined {
  const at = lines.indexOf(`<!-- ${id} -->`);
  if (at < 0) return undefined;
  const end = lines.findIndex((line, i) => i > at && !line.startsWith('|'));
  return lines.slice(at + 1, end < 0 ? lines.length : end).join('\n');
}

/** First line of each Markdown table in the doc, with the line just above it. */
function docTables(): { above: string; first: string }[] {
  return lines.flatMap((line, i) => {
    const starts = line.startsWith('|') && !lines[i - 1]?.startsWith('|');
    return starts ? [{ above: lines[i - 1] ?? '', first: line }] : [];
  });
}

describe('docs/FORMULAS.md', () => {
  // Fails after a retune: run `npm run formulas` and paste the changed table under its marker.
  it.each(generated.map((t) => [t.id, t.markdown]))('has the current %s table', (id, markdown) => {
    expect(markedTable(id), `table "${id}" is stale or missing in docs/FORMULAS.md`).toBe(markdown);
  });

  it('has a marker for every generated table and a generator for every marker', () => {
    const markers = lines.flatMap((line) => line.match(MARKER)?.[1] ?? []);
    expect(markers.sort()).toEqual(generated.map((t) => t.id).sort());
  });

  it('has no table without a marker', () => {
    const unmarked = docTables().filter((t) => !MARKER.test(t.above));
    expect(
      unmarked.map((t) => t.first),
      'every table in FORMULAS.md must come from scripts/formulas.ts; put hand-written ones in prose, or delete an old copy',
    ).toEqual([]);
  });
});
