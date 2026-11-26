import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { editBlocked, gitBlocked, gitFreeEnv } from './block-main-checkout.ts';

/** A real repo on `main` (the main checkout) with a linked worktree on `feat/x`. */
let main: string;
let linked: string;
let outside: string;

/** git in the scratch repo only: the pre-commit hook's GIT_DIR would otherwise aim it at the real one. */
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, stdio: 'pipe', env: gitFreeEnv() });

beforeAll(() => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'dmd-main-checkout-')));
  main = join(root, 'repo');
  linked = join(root, 'repo/.claude/worktrees/wt');
  outside = join(root, 'scratch');
  mkdirSync(main);
  mkdirSync(outside);
  git(main, 'init', '-q', '-b', 'main');
  git(main, 'config', 'user.email', 't@example.com');
  git(main, 'config', 'user.name', 't');
  // .claude/worktrees/ stays tracked-visible here: a linked worktree must be editable through the
  // toplevel check alone, not because the fixture happens to ignore it.
  writeFileSync(join(main, '.gitignore'), 'ignored/\n');
  writeFileSync(join(main, 'README.md'), 'hi\n');
  git(main, 'add', '.');
  git(main, 'commit', '-q', '-m', 'init');
  git(main, 'worktree', 'add', '-q', '-b', 'feat/x', linked);
});

describe('editing files in the main checkout', () => {
  it('blocks edits to tracked and new files in the main checkout', () => {
    expect(editBlocked(join(main, 'README.md'), main)).toBe(true);
    expect(editBlocked(join(main, 'docs/new/file.md'), main)).toBe(true);
  });

  it('blocks them from a session running in a linked worktree too', () => {
    expect(editBlocked(join(main, 'README.md'), linked)).toBe(true);
  });

  it('allows git-ignored paths in the main checkout', () => {
    expect(editBlocked(join(main, 'ignored/notes.md'), main)).toBe(false);
  });

  it('allows paths outside the repo', () => {
    expect(editBlocked(join(outside, 'plan.md'), main)).toBe(false);
    expect(editBlocked('/tmp/x/y.md', linked)).toBe(false);
  });

  it("blocks edits inside the main checkout's .git directory", () => {
    expect(editBlocked(join(main, '.git/config'), linked)).toBe(true);
    expect(editBlocked(join(main, '.git/refs/heads/main'), main)).toBe(true);
    expect(editBlocked(join(main, '.git/hooks/new-hook'), linked)).toBe(true);
  });

  it('allows edits inside a linked worktree, even one nested under the main checkout', () => {
    expect(editBlocked(join(linked, 'README.md'), main)).toBe(false);
    expect(editBlocked(join(linked, 'src/new.ts'), linked)).toBe(false);
  });
});

describe('agent worktrees in this repo', () => {
  it('are git-ignored, so agent runs leave the main checkout clean', () => {
    const repo = join(import.meta.dirname, '..');
    expect(() => git(repo, 'check-ignore', '-q', '.claude/worktrees/agent-x/README.md')).not.toThrow();
  });
});

describe('git writes to main', () => {
  it('blocks commit, merge, rebase and reset while the branch is main', () => {
    for (const sub of ['commit -m x', 'merge feat/x', 'rebase feat/x', 'reset --hard HEAD~1', 'push']) {
      expect(gitBlocked(`git ${sub}`, main), sub).toBe(true);
    }
  });

  it('allows them on a feature branch in a linked worktree', () => {
    for (const sub of ['commit -m x', 'merge main', 'rebase main', 'reset --hard HEAD~1', 'push -u origin feat/x']) {
      expect(gitBlocked(`git ${sub}`, linked), sub).toBe(false);
    }
  });

  it('follows git -C, global options and an earlier cd to the branch they act on', () => {
    expect(gitBlocked(`git -C ${main} commit -m x`, linked)).toBe(true);
    expect(gitBlocked(`git -c core.editor=true -C ${main} merge feat/x`, linked)).toBe(true);
    expect(gitBlocked(`cd ${main} && git add . && git commit -m x`, linked)).toBe(true);
    expect(gitBlocked(`git -C ${linked} commit -m x`, main)).toBe(false);
    expect(gitBlocked(`cd ${linked} && git commit -m x`, main)).toBe(false);
  });

  it('blocks cherry-pick, revert and am while the branch is main', () => {
    for (const sub of ['cherry-pick feat/x', 'revert HEAD', 'am patch.mbox']) {
      expect(gitBlocked(`git ${sub}`, main), sub).toBe(true);
      expect(gitBlocked(`git ${sub}`, linked), sub).toBe(false);
    }
  });

  it('follows --git-dir and --work-tree to the branch they act on', () => {
    for (const opts of [
      `--git-dir=${main}/.git --work-tree=${main}`,
      `--git-dir ${main}/.git --work-tree ${main}`,
      `--git-dir=${main}/.git`,
      `--git-dir ${main}/.git`,
      `-C ${main} --git-dir=.git`,
    ]) {
      expect(gitBlocked(`git ${opts} commit -m x`, linked), opts).toBe(true);
    }
    expect(gitBlocked(`git --git-dir=${main}/.git/worktrees/wt --work-tree=${linked} commit -m x`, main)).toBe(false);
  });

  it('blocks a rebase whose branch argument is main, from any branch', () => {
    for (const rebase of [
      'git rebase feat/x main',
      'git rebase --onto feat/x feat/x~1 main',
      'git rebase -X theirs feat/x refs/heads/main',
      'git rebase --root main',
    ]) {
      expect(gitBlocked(rebase, linked), rebase).toBe(true);
    }
  });

  it('allows rebasing a feature branch onto main', () => {
    for (const rebase of ['git rebase main', 'git rebase origin/main', 'git rebase --onto main feat/x~1', 'git rebase main feat/x']) {
      expect(gitBlocked(rebase, linked), rebase).toBe(false);
    }
  });

  it('blocks a pull on main unless it is --ff-only', () => {
    expect(gitBlocked('git pull', main)).toBe(true);
    expect(gitBlocked('git pull --rebase', main)).toBe(true);
    expect(gitBlocked('git pull origin main', main)).toBe(true);
    expect(gitBlocked('git pull --ff-only origin main', main)).toBe(false);
    expect(gitBlocked('git pull', linked)).toBe(false);
  });

  it('blocks a pull on main whose --ff-only a later --ff or --no-ff overrides', () => {
    expect(gitBlocked('git pull --ff-only --no-ff', main)).toBe(true);
    expect(gitBlocked('git pull --ff-only --ff origin main', main)).toBe(true);
    expect(gitBlocked('git pull --ff-only --rebase', main)).toBe(true);
    expect(gitBlocked('git pull --no-ff --ff-only', main)).toBe(false);
  });

  it('blocks a --ff-only pull on main from anything but origin main', () => {
    expect(gitBlocked('git pull --ff-only . feat/x', main)).toBe(true);
    expect(gitBlocked('git pull --ff-only origin feat/x', main)).toBe(true);
    expect(gitBlocked(`git pull --ff-only ${linked} feat/x`, main)).toBe(true);
    expect(gitBlocked('git pull --ff-only origin', main)).toBe(false);
    expect(gitBlocked('git pull --ff-only origin refs/heads/main', main)).toBe(false);
  });

  it('recognises git called by a path', () => {
    expect(gitBlocked('/usr/bin/git commit -m x', main)).toBe(true);
    expect(gitBlocked(`/usr/bin/git -C ${main} merge feat/x`, linked)).toBe(true);
    expect(gitBlocked('/usr/bin/git commit -m x', linked)).toBe(false);
  });

  it('sees git inside a command substitution', () => {
    expect(gitBlocked('x=$(git commit -m x)', main)).toBe(true);
    expect(gitBlocked(`echo "$(git -C ${main} commit -m x)"`, linked)).toBe(true);
    expect(gitBlocked('echo `git commit -m x`', main)).toBe(true);
    expect(gitBlocked(`echo "out: \`git -C ${main} commit -m x\`"`, linked)).toBe(true);
    expect(gitBlocked(`echo $(cd ${main} && git commit -m x)`, linked)).toBe(true);
    expect(gitBlocked(`echo $(cd ${main}) && git commit -m x`, linked)).toBe(false);
    expect(gitBlocked("echo '$(git commit -m x)'", main)).toBe(false);
    expect(gitBlocked('x=$(git rev-parse HEAD)', main)).toBe(false);
  });

  it('reads a heredoc body inside a substitution as data, brackets and backticks included', () => {
    const body = "1) Fixed it\nDon't run `git reset --hard` (or `git commit`)\n";
    expect(gitBlocked(`gh pr create --body "$(cat <<'EOF'\n${body}EOF\n)"`, main)).toBe(false);
    expect(gitBlocked(`gh pr comment 1 --body "$(cat <<-EOF\n${body}\tEOF\n)" && git commit -m x`, main)).toBe(true);
    expect(gitBlocked(`x=$(cat <<< "a)"; git commit -m x)`, main)).toBe(true);
  });

  it('follows GIT_DIR and GIT_WORK_TREE to the repo a command acts on', () => {
    expect(gitBlocked(`GIT_DIR=${main}/.git git commit -m x`, linked)).toBe(true);
    expect(gitBlocked(`GIT_DIR=${main}/.git GIT_WORK_TREE=${main} git merge feat/x`, linked)).toBe(true);
    expect(gitBlocked(`env GIT_DIR=${main}/.git git commit -m x`, linked)).toBe(true);
    expect(gitBlocked(`export GIT_DIR=${main}/.git; git commit -m x`, linked)).toBe(true);
    expect(gitBlocked(`cd ${main} && GIT_DIR=.git git commit -m x`, linked)).toBe(true);
    expect(gitBlocked(`GIT_DIR=${main}/.git/worktrees/wt GIT_WORK_TREE=${linked} git commit -m x`, main)).toBe(false);
  });

  it('blocks git branch moving, renaming onto, copying onto or deleting main', () => {
    for (const branch of [
      'git branch -f main feat/x',
      'git branch --force main HEAD~1',
      'git branch -M feat/x main',
      'git branch -M main',
      'git branch -C feat/x main',
      'git branch -D main',
      'git branch --delete refs/heads/main',
    ]) {
      expect(gitBlocked(branch, linked), branch).toBe(true);
    }
  });

  it('allows git branch on other branches, and main as a start point', () => {
    for (const branch of [
      'git branch -f feat/y main',
      'git branch feat/y main',
      'git branch -M feat/x feat/y',
      'git branch -D feat/y',
      'git branch --contains main',
      'git branch -u origin/main',
      'git branch --list',
    ]) {
      expect(gitBlocked(branch, linked), branch).toBe(false);
    }
  });

  it('blocks git update-ref on main, or on HEAD while the branch is main', () => {
    expect(gitBlocked('git update-ref refs/heads/main feat/x', linked)).toBe(true);
    expect(gitBlocked('git update-ref -m msg refs/heads/main feat/x', linked)).toBe(true);
    expect(gitBlocked('git update-ref -d refs/heads/main', linked)).toBe(true);
    expect(gitBlocked('git update-ref HEAD feat/x', main)).toBe(true);
    expect(gitBlocked('git update-ref HEAD HEAD~1', linked)).toBe(false);
    expect(gitBlocked('git update-ref refs/heads/feat/y main', linked)).toBe(false);
  });

  it('blocks a push to main from another branch', () => {
    for (const push of [
      'git push origin main',
      'git push origin HEAD:main',
      'git push -f origin +feat/x:main',
      'git push origin feat/x:refs/heads/main',
      'git push origin feat/x main',
      'git push --all origin',
      'git push --mirror',
    ]) {
      expect(gitBlocked(push, linked), push).toBe(true);
    }
  });

  it('allows a push to another branch whose name contains main', () => {
    expect(gitBlocked('git push origin feat/main-menu', linked)).toBe(false);
    expect(gitBlocked('git push origin HEAD:feat/x', linked)).toBe(false);
    expect(gitBlocked('git push --repo origin feat/x', linked)).toBe(false);
  });

  it('allows reading, pulling and merging through a PR', () => {
    expect(gitBlocked('git pull --ff-only', main)).toBe(false);
    expect(gitBlocked('git status && git log --oneline -3', main)).toBe(false);
    expect(gitBlocked('gh pr merge 12 --squash', main)).toBe(false);
    expect(gitBlocked('echo "git commit on main"', main)).toBe(false);
  });

  it('allows commands outside any repo', () => {
    expect(gitBlocked('git commit -m x', outside)).toBe(false);
  });
});

describe('the hook', () => {
  const hook = (input: object, projectDir: string) =>
    spawnSync('node', [join(import.meta.dirname, 'block-main-checkout.ts')], {
      input: JSON.stringify(input),
      encoding: 'utf8',
      env: { ...gitFreeEnv(), CLAUDE_PROJECT_DIR: projectDir },
    });

  it('rejects an Edit, Write or NotebookEdit in the main checkout and points at the workflow doc', () => {
    for (const [tool_name, tool_input] of [
      ['Edit', { file_path: join(main, 'README.md') }],
      ['Write', { file_path: join(main, 'new.md') }],
      ['NotebookEdit', { notebook_path: join(main, 'n.ipynb') }],
    ] as const) {
      const run = hook({ tool_name, tool_input, cwd: linked }, linked);
      expect(run.status, tool_name).toBe(2);
      expect(run.stderr).toContain('docs/agents/workflow.md');
    }
  });

  it('rejects a Bash git write to main and points at the workflow doc', () => {
    const run = hook({ tool_name: 'Bash', tool_input: { command: 'git push origin HEAD:main' }, cwd: linked }, linked);
    expect(run.status).toBe(2);
    expect(run.stderr).toContain('docs/agents/workflow.md');
  });

  it('lets allowed calls through', () => {
    expect(hook({ tool_name: 'Edit', tool_input: { file_path: join(linked, 'README.md') }, cwd: linked }, linked).status).toBe(0);
    expect(hook({ tool_name: 'Bash', tool_input: { command: 'git commit -m x' }, cwd: linked }, linked).status).toBe(0);
  });
});
