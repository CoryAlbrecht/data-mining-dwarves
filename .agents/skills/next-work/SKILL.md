---
name: next-work
description: "Pick the next agent work item (a PR to review or fix, a spec ticket, a lone ticket), claim it and hand it off. Use when asked to work on something with no target, e.g. \"work on something\", \"pick up the next thing\", \"what's next?\"."
---

Carry out **Picking up work** in `docs/agents/workflow.md`: find the first item that qualifies,
claim it, hand it to the skill that does the work. Ticket kinds: `docs/agents/issue-tracker.md`.

## 1. List the queue

One query covers all three queues, because GitHub's issues API returns PRs too:

```sh
gh api --paginate 'repos/{owner}/{repo}/issues?state=open&labels=ready-for-agent&sort=created&direction=asc&per_page=100' \
  --jq '.[] | select(.parent_issue_url == null and (.assignees | length) == 0 and (.issue_dependencies_summary.blocked_by // 0) == 0) | {number, title, kind: (if .pull_request then "pr" elif .sub_issues_summary.total > 0 then "spec" else "lone" end)}' \
  | jq -c -s 'sort_by(.kind as $k | ["pr", "spec", "lone"] | index($k)) | .[]'
```

Each line is an open `ready-for-agent` item with no assignee, no open blocker and no parent (so
no sub-issue), tagged `pr`, `spec` (has sub-issues) or `lone`. Lines come in queue order: PRs,
then specs, then lone tickets, each oldest-created first.

The first line is the pick, unless it is a PR this session opened or pushed to: a session has one
role per PR (**PR lifecycle** in `docs/agents/workflow.md`), so pass over it to the next line. With no line left, report
that nothing qualifies and stop.

## 2. Claim

Assign yourself, as this session's first write:

- PR: `gh pr edit <n> --add-assignee @me`
- spec or lone ticket: `gh issue edit <n> --add-assignee @me`

State the claimed item's kind, number and title.

## 3. Hand off

- `pr` → call the Skill tool with `review-pr` and argument `<n>`. It picks review or fix.
- `spec` → `/implement-spec` for issue `<n>`.
- `lone` → `/implement` for issue `<n>`.

`implement` and `implement-spec` are user-invoked (the Skill tool refuses them), so read
`.agents/skills/<name>/SKILL.md` and follow it with the claimed issue as its ticket.

If the hand-off stops before any work starts (the skill finds the item is not yours to take),
drop the claim with `--remove-assignee @me` and report why.
