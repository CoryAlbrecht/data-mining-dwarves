---
name: review-pr
description: "Review, merge or fix one agent PR by number, following the PR lifecycle in docs/agents/workflow.md. Use when asked to review or fix a PR, or when /next-work hands off a PR."
---

Carry one PR through steps 2–5 of the **PR lifecycle** in `docs/agents/workflow.md`: pick this
session's **role** (reviewer or fixer), play it, and stop. The PR number is the argument; with
none, ask for it. Label meanings: `docs/agents/triage-labels.md`.

## 1. Read the PR

```sh
gh pr view <n> --json number,title,state,baseRefName,headRefName,labels,assignees,closingIssuesReferences,commits,comments
```

Stop and say why when any of these holds:

- The PR is not open, or its base is not `main`.
- It is labelled `ready-for-human`: the human has the move.
- **Own work**: this session opened the PR or pushed to its branch. Every session shares one
  GitHub account, so GitHub can't tell you the author; check this session's own history.
- It has an assignee and `/next-work` did not just claim it for this session: another session
  holds it.

With no assignee, claim it (`gh pr edit <n> --add-assignee @me`) as your first write.

## 2. Pick the role

Choose **review** (step 3) or **fix** (step 5) by the rule in PR lifecycle step 5 of
`docs/agents/workflow.md`. "After the last verdict" means a commit whose `committedDate` is newer
than the verdict comment's `createdAt`.

## 3. Review

1. Work in your own worktree: `EnterWorktree`, then `gh pr checkout <n>` and `npm ci`.
2. Run `npm run typecheck && npm test && npm run build` (plus CI once it exists). Record each
   result.
3. Call the Skill tool with `code-review`. Fixed point: `origin/main`. Spec source: the issues
   in `closingIssuesReferences`; the Acceptance axis checks every criterion of each. Report the
   findings and leave the code as it is: fixing is a later session's role.
4. The **verdict** is `approve` when every check passed and all three axes approve; anything
   else is `changes requested`.
5. An `approve` verdict is made merge-ready before it is posted. `git fetch origin main`; if
   `git merge-base --is-ancestor origin/main HEAD` fails, the branch is behind:
   `git rebase origin/main`.
   - On a conflict, `git rebase --abort`; the verdict becomes `changes requested`, naming the
     conflicting files.
   - After a clean rebase, rerun the three checks; any failure makes the verdict
     `changes requested`. With all green, `git push --force-with-lease`.
6. Post the verdict: write the body to a file in the scratchpad, then
   `gh pr comment <n> --body-file <file>`. The first line is exactly `Verdict: approve` or
   `Verdict: changes requested`. Below it: the reviewed commit SHA, each check's result, and the
   findings per axis (Standards, Spec, Acceptance), each with the change it asks for.
7. Act on the verdict (step 4).

## 4. Act on the verdict

**Approve**:

1. `gh pr merge <n> --squash` (the squash commit takes the PR title).
2. Delete the remote branch if GitHub's auto-delete left it: when
   `git ls-remote --exit-code --heads origin <branch>` finds it, `git push origin --delete <branch>`.
3. Leave the worktree (**Leaving a worktree** in `docs/agents/workflow.md`).
4. In the main checkout (the first path in `git worktree list`), run `git pull --ff-only`: the
   only git write a session makes there.

**Changes requested** (a failed check, a rebase conflict or review findings): hand the PR to the
human, leave the worktree (as above), and stop.

```sh
gh pr edit <n> --add-label ready-for-human --remove-label ready-for-agent --remove-assignee @me
```

## 5. Fix

1. Read the last verdict and every comment after it. The human's answers decide what changes;
   where an answer overrides a finding, follow the answer. A finding left with no answer and no
   clear fix goes back to the human: relabel as in step 4's **Changes requested** and stop.
2. Work in your own worktree: `EnterWorktree`, then `gh pr checkout <n>` and `npm ci`.
3. Make the changes and commit with Conventional Commit subjects (`docs/agents/workflow.md`).
   The pre-commit hook runs typecheck, test and build.
4. `git push`, then post a PR comment listing what changed for each finding.
5. Hand the PR to the next reviewer, leave the worktree (as above), and stop:

   ```sh
   gh pr edit <n> --add-label ready-for-agent --remove-label ready-for-human --remove-assignee @me
   ```

   This session has now pushed to the PR, so its next review comes from another session.
