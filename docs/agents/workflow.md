# Agent workflow

Every change to a tracked file reaches `main` through a worktree, a branch and a PR that a
different session reviews and merges. Why agents merge their own PRs:
`docs/adr/0001-agents-merge-after-separate-session-review.md`.

## Worktrees

- A session that changes tracked files works in its own git worktree (`EnterWorktree`, or
  `isolation: "worktree"` for a subagent) and runs `npm ci` right after entering it. The
  pre-commit hook needs those deps; `core.hooksPath=.githooks` already applies in every worktree.
- A read-only session (questions, grilling, a review that only comments) may stay in the main
  checkout. The main checkout belongs to the human: leave its files and its uncommitted work as
  they are.

### Leaving a worktree

1. Check `git status --short` is empty.
2. Call `ExitWorktree` with `action: "remove"`; it deletes the worktree and its local branch.
   When it refuses only because the branch's commits are not on the original branch, and those
   commits are already pushed or merged on GitHub, call it again with `discard_changes: true`.
3. If `git branch --list <branch>` still shows the local branch, `git branch -D <branch>`.

`ExitWorktree` removes only the worktree this session entered with `EnterWorktree`. A worktree
made for a subagent (`isolation: "worktree"`) is removed by the session that spawned it, with
`git worktree remove <path>` and `git branch -D <branch>`.

## Branches

- Every change to tracked files (code, docs, `GLOSSARY.md`, hooks, skills) goes branch → PR →
  `main`, even when the human asks for a direct commit. The only route that skips a PR is the
  human running git themselves.
- **Lone ticket** (bug, chore, atomic feature): branch `<type>/<issue>-<slug>`, e.g.
  `fix/228-gradient-anchoring`. Take the type from the issue's labels: `bug` → `fix`,
  `enhancement` → `feat`, `documentation` → `docs`. With no matching label, pick one of
  `feat fix chore docs refactor test perf` and name the choice in the PR body.
- **Spec ticket**: the spec and all its sub-issues share one branch, `feat/<spec>-<slug>`, and one
  PR into `main` that closes the spec and every sub-issue. Parallel implementer subagents each
  work on a local branch `feat/<spec>-<slug>--<sub>`, merge it into the spec branch, and delete it
  at once. These sub-branches stay local: never pushed.
- PR titles and commit subjects are Conventional Commits, e.g.
  `fix(client): dig bar anchors to cell (#34)`. The scope is optional: a workspace (`client`,
  `server`, `shared`) or an area (`hooks`, `docs`, `skills`).

## PR lifecycle

The label on a PR says whose move it is (see `triage-labels.md`). A session has one role per PR:
the session that opened a PR or pushed to it never reviews it. A session that hands a PR on by
relabelling it also drops its claim (`--remove-assignee @me`), so the next session can take it.

1. **Author**: run `/code-review` on the branch as a self-check, push, open the PR with
   `Closes #n` in the body (one line per closed issue), and label it `ready-for-agent`. The
   branch now lives at `origin`, so leave your worktree (**Leaving a worktree**), then stop.
   `/implement` and `/implement-spec` do all of this.
2. **Reviewer** (`/review-pr`): check the PR out in your own worktree and run
   `npm run typecheck && npm test && npm run build` (plus CI once it exists). Post a PR comment
   whose first line is exactly `Verdict: approve` or `Verdict: changes requested`, followed by the
   reasons. The verdict is a comment because GitHub refuses a review approval from the account
   that opened the PR, and every session shares one account.
3. **Approved**: if `main` has moved, rebase the branch onto it and rerun the checks. Then
   `gh pr merge --squash` (the commit title is the PR title), delete the branch, leave your
   worktree (**Leaving a worktree**), and run `git pull --ff-only` in the main checkout. The
   merge needs no human step.
4. **Changes requested**: set the label to `ready-for-human` and stop. A rebase conflict counts as
   changes requested: the reviewer reports it and leaves it unresolved. The human
   answers in a PR comment or a conversation, then relabels `ready-for-agent`.
5. **Review or fix**: a session that picks up a `ready-for-agent` PR reads its history to choose a
   role. The **last verdict** is the latest PR comment whose first line is exactly
   `Verdict: approve` or `Verdict: changes requested`.
   - No verdict yet, or commits after the last verdict → review it (step 2).
   - Last verdict `Verdict: approve` with no commits after it: a merge was cut short → review it.
   - Last verdict `Verdict: changes requested` with no commits after it → fix it: address the
     verdict and the human's answer, push, and set `ready-for-agent`. The next review comes from
     another session.

## Picking up work

A request to "work on something" with no target runs `/next-work`. It checks these queues in
order, oldest-created first within each, and takes the first item that qualifies:

1. open PRs labelled `ready-for-agent`;
2. spec tickets labelled `ready-for-agent`;
3. lone tickets labelled `ready-for-agent`.

- An item qualifies when it has no assignee and no open blocker (see **Count open blockers** in
  `issue-tracker.md`). A sub-issue never qualifies on its own: it is built through its spec.
- **Claim** by assigning yourself (`--add-assignee @me`) as the session's first write.
- **Hand off**: PR → review or fix (PR lifecycle step 5); spec ticket → `/implement-spec`; lone
  ticket → `/implement`.
- When nothing qualifies, say so and stop.

## Enforcement

GitHub branch protection is unavailable (private repo without Pro), so a PreToolUse hook,
`scripts/block-main-checkout.ts`, is the only guard. It blocks:

- `Edit`, `Write` and `NotebookEdit` on paths inside the main checkout. Git-ignored paths and
  paths outside the repo stay allowed.
- `git commit`, `push`, `merge`, `rebase`, `reset`, `cherry-pick`, `revert`, `am`, and `pull`
  without `--ff-only`, while the branch they act on is `main`, in any worktree. The hook follows
  `git -C <path>`, `--git-dir`, `--work-tree` and an earlier `cd`.
- `git push` from any branch when it would update `main`: a `main` or `HEAD:main` refspec, or
  `--all`, `--branches` or `--mirror`.
- `git rebase <upstream> main` from any branch. Rebasing a branch onto `main`, as in
  `git rebase origin/main`, stays allowed.

It allows `git pull --ff-only` in the main checkout and `gh pr merge`. Known gaps it does not
cover are tracked in #44. When the hook blocks a command, the fix is a worktree and a branch;
working around the hook breaks the workflow it guards.
