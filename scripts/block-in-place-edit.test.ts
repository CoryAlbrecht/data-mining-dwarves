import { describe, expect, it } from 'vitest';
import { blocksInPlaceEdit } from './block-in-place-edit.ts';

const repo = '/home/dev/dmd';

describe('in-place edits of source are blocked', () => {
  it('blocks sed -i and perl -i on files under apps/ or packages/', () => {
    expect(blocksInPlaceEdit("sed -i 's/a/b/' apps/client/src/main.tsx", repo, repo)).toBe(true);
    expect(blocksInPlaceEdit("sed -i.bak -e 's/a/b/' packages/shared/src/loot.ts", repo, repo)).toBe(true);
    expect(blocksInPlaceEdit("sed --in-place 's/a/b/' apps/server/src/app.ts", repo, repo)).toBe(true);
    expect(blocksInPlaceEdit("perl -pi -e 's/a/b/' apps/client/src/App.tsx", repo, repo)).toBe(true);
    expect(blocksInPlaceEdit("cd /x && sed -i 's/a/b/' /home/dev/dmd/apps/client/vite.config.ts", repo, repo)).toBe(true);
  });

  it('blocks relative paths when the shell is already inside apps/ or packages/', () => {
    expect(blocksInPlaceEdit("sed -i 's/a/b/' src/zz.ts", `${repo}/apps/server`, repo)).toBe(true);
  });

  it('lets reading, piping and scratch-file edits through', () => {
    expect(blocksInPlaceEdit('sed -n 1,40p apps/client/src/main.tsx', repo, repo)).toBe(false);
    expect(blocksInPlaceEdit("grep -n x apps/a.ts | sed 's/^/  /'", repo, repo)).toBe(false);
    expect(blocksInPlaceEdit("sed -i 's/a/b/' /tmp/scratch/notes.md", repo, repo)).toBe(false);
    expect(blocksInPlaceEdit("sed -i 's/x/y/' docs/DESIGN.md", repo, repo)).toBe(false);
    expect(blocksInPlaceEdit('git commit -m "use sed -i on apps/ never"', repo, repo)).toBe(false);
  });
});
