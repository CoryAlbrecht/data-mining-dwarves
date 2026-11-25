---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets, on its own branch, and hand it off as a PR. The rules behind each step live in `docs/agents/workflow.md`.

1. **Ticket.** If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

2. **Worktree.** Call `EnterWorktree` (skip this if the session already runs in a worktree other than the main checkout), then run `npm ci` in it.

3. **Branch.** Rename the worktree's branch with `git branch -m <type>/<issue>-<slug>`, choosing the type as **Lone ticket** in `docs/agents/workflow.md` says. If no label decided the type, remember your choice for the PR body. The slug is a few kebab-case words from the title.

4. **Build.** Call the Skill tool with "tdd" where possible, at pre-agreed seams. Run typechecking regularly, single test files regularly, and the full test suite once at the end.

5. **Self-check.** Call the Skill tool with "code-review" on the uncommitted work. Commit only when every reviewer approves; until then, fix the findings and re-review.

6. **Commit.** Commit with a Conventional Commits subject naming the issue (form and scopes: **Branches** in `docs/agents/workflow.md`).

7. **PR.** Push the branch with `git push -u origin HEAD`. Write the body with the Skill tool "pr"; it carries `Closes #<issue>` (one line per closed issue) and, if step 3 picked the type, which type and why. Open it with `gh pr create`, the title in the same Conventional Commits form, then `gh pr edit <n> --add-label ready-for-agent`.

8. **Clean up.** The branch now lives at `origin`, so leave the worktree as **Leaving a worktree** in `docs/agents/workflow.md` says. (If the session was already in a worktree at step 2, leave that worktree as it was.)

9. **Hand off.** Report the PR link and stop. A different session reviews and merges it (`/review-pr`); this session's part ends at the PR.
