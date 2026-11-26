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

  it('checks quoted file paths like bare ones', () => {
    expect(blocksInPlaceEdit(`sed -i 's/a/b/' "apps/client/src/x.ts"`, repo, repo)).toBe(true);
    expect(blocksInPlaceEdit("perl -pi -e 's/a/b/' 'packages/shared/src/x.ts'", repo, repo)).toBe(true);
  });

  it('resolves relative paths from a cd earlier in the same command', () => {
    expect(blocksInPlaceEdit("cd apps/client && sed -i 's/a/b/' src/x.ts", repo, repo)).toBe(true);
    expect(blocksInPlaceEdit("cd /tmp/scratch && sed -i 's/a/b/' src/x.ts", `${repo}/apps/server`, repo)).toBe(false);
  });

  it('keeps escaped quotes inside quoted text', () => {
    expect(blocksInPlaceEdit(String.raw`echo "path \"x; sed -i s/a/b/ apps/x.ts"`, repo, repo)).toBe(false);
    expect(blocksInPlaceEdit(String.raw`git commit -m "say \"hi\"; sed -i on apps/x.ts"`, repo, repo)).toBe(false);
  });

  it('looks inside subshells', () => {
    expect(blocksInPlaceEdit("(cd apps/client && sed -i 's/a/b/' src/x.ts)", repo, repo)).toBe(true);
    expect(blocksInPlaceEdit("cd apps/client && (sed -i 's/a/b/' src/x.ts)", repo, repo)).toBe(true);
  });

  it('never takes the sed or perl script for a file', () => {
    expect(blocksInPlaceEdit("sed -i 's/a/b/' /tmp/x.txt", `${repo}/apps/client`, repo)).toBe(false);
    expect(blocksInPlaceEdit("cd apps && sed -i -e 's/a/b/' -e 's/c/d/' /tmp/x.txt", repo, repo)).toBe(false);
    expect(blocksInPlaceEdit("perl -pi -e 's/a/b/' /tmp/x.txt", `${repo}/packages/shared`, repo)).toBe(false);
    expect(blocksInPlaceEdit("sed -i -e 's/a/b/' src/x.ts", `${repo}/apps/client`, repo)).toBe(true);
  });

  it('keeps a cd inside a subshell from leaking out', () => {
    expect(blocksInPlaceEdit("(cd apps/client && ls); sed -i 's/a/b/' src/x.ts", repo, repo)).toBe(false);
    expect(blocksInPlaceEdit("x=$(cd apps/client && pwd); sed -i 's/a/b/' src/x.ts", repo, repo)).toBe(false);
  });

  it('finds the script when it is attached to its option', () => {
    for (const cmd of [
      "perl -pi -e's/a/b/' apps/x.ts",
      "sed -i -e's/a/b/' apps/x.ts",
      'sed -i -es/a/b/ apps/x.ts',
      "sed -i --expression='s/a/b/' apps/x.ts",
      'perl -i -pes/a/b/ apps/x.ts',
    ]) {
      expect(blocksInPlaceEdit(cmd, repo, repo), cmd).toBe(true);
    }
  });

  it('never takes a redirection target for a file', () => {
    expect(blocksInPlaceEdit("cd apps/client && sed -i 's/a/b/' /tmp/x.txt 2>/dev/null", repo, repo)).toBe(false);
    expect(blocksInPlaceEdit("cd apps/client && sed -i 's/a/b/' /tmp/x.txt > /dev/null 2>&1", repo, repo)).toBe(false);
    expect(blocksInPlaceEdit("sed -i 's/a/>/' apps/x.ts", repo, repo)).toBe(true); // a quoted > is script text
  });

  it('sees a cd after shell keywords or a line continuation', () => {
    expect(blocksInPlaceEdit("{ cd apps/client && sed -i 's/a/b/' src/x.ts; }", repo, repo)).toBe(true);
    expect(blocksInPlaceEdit("if cd apps/client; then sed -i 's/a/b/' src/x.ts; fi", repo, repo)).toBe(true);
    expect(blocksInPlaceEdit("cd \\\n  apps/client && sed -i 's/a/b/' src/x.ts", repo, repo)).toBe(true);
  });

  it('keeps a $( … ) inside a word as part of that word', () => {
    expect(blocksInPlaceEdit('sed -i s/x/$(date +%F)/ apps/x.ts', repo, repo)).toBe(true);
    expect(blocksInPlaceEdit('perl -pi -e s/a/$(cat V)/ packages/x.ts', repo, repo)).toBe(true);
  });

  it('sees an in-place edit run inside a substitution', () => {
    expect(blocksInPlaceEdit('x=$(sed -i s/a/b/ apps/x.ts)', repo, repo)).toBe(true);
    expect(blocksInPlaceEdit('echo "`sed -i s/a/b/ apps/x.ts`"', repo, repo)).toBe(true);
    expect(blocksInPlaceEdit("echo '$(sed -i s/a/b/ apps/x.ts)'", repo, repo)).toBe(false);
  });

  it('reads letters after -i as the backup suffix', () => {
    expect(blocksInPlaceEdit("sed -iref 's/a/b/' /tmp/x", `${repo}/apps/client`, repo)).toBe(false);
    expect(blocksInPlaceEdit("sed -iref 's/a/b/' apps/x.ts", repo, repo)).toBe(true);
  });

  it('reads &> as a redirection, not a background job', () => {
    expect(blocksInPlaceEdit("sed -i 's/a/b/' &>/dev/null apps/x.ts", repo, repo)).toBe(true);
    expect(blocksInPlaceEdit('sed -i s/a/b/ &>>log apps/x.ts', repo, repo)).toBe(true);
  });

  it('skips quoted brackets when matching a $( … )', () => {
    expect(blocksInPlaceEdit('x=$(echo ")"); sed -i s/a/b/ apps/x.ts', repo, repo)).toBe(true);
    expect(blocksInPlaceEdit("x=$(printf '%s)' a); cd apps && sed -i s/a/b/ x.ts", repo, repo)).toBe(true);
  });

  it('sees through command wrappers like timeout and env', () => {
    expect(blocksInPlaceEdit("timeout 5 sed -i 's/a/b/' apps/x.ts", repo, repo)).toBe(true);
    expect(blocksInPlaceEdit("env LC_ALL=C sed -i 's/a/b/' packages/x.ts", repo, repo)).toBe(true);
  });

  it('reads a heredoc body as data, up to its delimiter', () => {
    const body = "line one\nsed -i 's/a/b/' apps/x.ts\n";
    expect(blocksInPlaceEdit(`git commit -F - <<'EOF'\n${body}EOF`, repo, repo)).toBe(false);
    expect(blocksInPlaceEdit(`cat > notes.md <<EOF\n${body}EOF\necho done`, repo, repo)).toBe(false);
    expect(blocksInPlaceEdit(`cat <<-"END"\n\t${body}\tEND`, repo, repo)).toBe(false);
    expect(blocksInPlaceEdit(`cat <<EOF\n${body}EOF\nsed -i 's/a/b/' apps/y.ts`, repo, repo)).toBe(true); // after it ends
    expect(blocksInPlaceEdit("cat <<< 'x'; sed -i 's/a/b/' apps/y.ts", repo, repo)).toBe(true); // a here-string
  });

  it('still sees the next command after a closed file descriptor', () => {
    expect(blocksInPlaceEdit("foo >&-; sed -i 's/a/b/' apps/x.ts", repo, repo)).toBe(true);
    expect(blocksInPlaceEdit("foo 2>&- && sed -i 's/a/b/' apps/x.ts", repo, repo)).toBe(true);
    expect(blocksInPlaceEdit("exec 3<&-\nsed -i 's/a/b/' apps/x.ts", repo, repo)).toBe(true);
  });
});
