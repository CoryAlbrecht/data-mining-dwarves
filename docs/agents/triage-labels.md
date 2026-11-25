# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

Edit the "Label in our tracker" column to match whatever vocabulary you actually use.

## Labels on a PR

On a PR the two ready labels say whose move it is (lifecycle in `workflow.md`):

- `ready-for-agent`: an agent acts next. With commits since the last verdict (or no verdict yet),
  the next session reviews it; with `Verdict: changes requested` as the latest activity, the next
  session fixes it.
- `ready-for-human`: a review asked for changes or hit a rebase conflict. Agents leave the PR
  alone until the human answers and relabels it `ready-for-agent`.
