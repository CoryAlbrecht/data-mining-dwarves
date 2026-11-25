# Agents merge after a separate-session review

Agents never commit to `main`; each change goes through a PR that a different agent session
reviews and, on approval, squash-merges with no human step. The reviewer records its decision as
a PR comment whose first line is `Verdict: approve` or `Verdict: changes requested`, because every
session works through the human's one GitHub account and GitHub refuses a review approval from a
PR's own author. Without branch protection (private repo, no Pro plan), a PreToolUse hook is the
guard. Rules: `docs/agents/workflow.md`.

## Considered Options

- **Human-only merging**: rejected. It makes the human a step in every change; instead the human
  steps in only when a verdict asks for changes (`ready-for-human`).
- **Real GitHub review approvals**: rejected as impossible. Agents and the human share one
  account, and GitHub blocks approving your own PR.
