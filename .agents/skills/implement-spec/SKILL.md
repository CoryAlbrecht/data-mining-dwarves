---
name: implement-spec
description: "Implement the result of /to-spec and /to-tickets in code."
disable-model-invocation: true
---

You have been provided a spec. This spec should have tickets associated with it, describing how to implement the spec.

The issue tracker should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

The goal is the entire spec implemented on a single **integration branch**, `feat/<spec>-<slug>`, and handed off as one PR into `main` that closes the spec and every ticket. The rules behind the branches and the PR live in `docs/agents/workflow.md`.

The tickets are not a list of steps. They are a **task graph** with blocking relationships between them. This means there is always a **frontier** of tickets which are ready to be grabbed.

Start every subagent with a fresh context window.

Communication to and from subagents should be sparse. Communicate primarily through **context pointers**: to the spec, tickets, research notes, and previous commits. Don't duplicate information already available via pointers.

**Implementer subagents** should be run in the background where possible for maximum concurrency.

## Steps

1. Read the spec and tickets to understand the task graph.

2. (optional) Use an **exploration subagent** to conduct any exploration required by the tickets - relevant codebase files or external documentation. Ensure the exploration subagent can save files - it should save its markdown notes in a directory outside the repo, accessible by all future subagents. This lets **implementer subagents** focus on implementation rather than exploration.

3. Create the integration branch in your own worktree: call `EnterWorktree`, run `npm ci`, then `git branch -m feat/<spec>-<slug>` (the slug is a few kebab-case words from the spec's title). This worktree is the **integration worktree**.

4. Use a fresh **implementer subagent** for each ticket, each started with `isolation: "worktree"`. Each implementer subagent:
   - works on a local branch `feat/<spec>-<slug>--<sub>` (`<sub>` is its ticket number), created with `git checkout -B feat/<spec>-<slug>--<sub> feat/<spec>-<slug>` so it is based on the integration branch, then runs `npm ci`;
   - calls the Skill tool with `tdd` to build the ticket;
   - commits with Conventional Commits subjects naming its ticket, e.g. `feat(hooks): block agent edits in the main checkout (#38)`;
   - merges the integration branch tip into its own branch before reporting done;
   - keeps its branch local, leaving pushing, PRs and issue state to you.

5. Once an **implementer subagent** completes, merge its work to the integration branch with a **merger subagent** working in the integration worktree. Right after the merge, remove that implementer's worktree (`git worktree remove <path>`) and delete the sub-branch (`git branch -D feat/<spec>-<slug>--<sub>`). `ExitWorktree` can't do this: it removes only the calling session's own worktree.

6. If this changes the **frontier** of available tickets, kick off more **implementer subagents** to work on the new tickets. This allows for maximum concurrency.

7. Once all tickets are complete, save any attachment the PR needs (**Attachments** in `docs/agents/workflow.md`), then call the Skill tool with `code-review` on the integration branch. Fix all issues raised by the code review in a single fresh **implementer subagent**, merged back as in step 5.

8. Open the PR from the integration worktree: push with `git push -u origin HEAD`, write the body with the Skill tool `pr` (one `Closes #n` line for the spec and one for every ticket), open it with `gh pr create` titled in Conventional Commits form, e.g. `feat: agent workflow (#37)`, then `gh pr edit <n> --add-label ready-for-agent`. With attachments, label it `ready-for-human` in place of `ready-for-agent` and hand them over as **Attachments** says.

9. Clean up every worktree. `git worktree list` shows no implementer worktree and `git branch --list 'feat/<spec>-<slug>--*'` is empty; remove any left over as in step 5. Then leave the integration worktree as **Leaving a worktree** in `docs/agents/workflow.md` says: the branch lives on at `origin`.

10. Report the PR link (after the attachments checklist, if any) and stop. A different session reviews and merges it (`/review-pr`); this session's part ends at the PR.
