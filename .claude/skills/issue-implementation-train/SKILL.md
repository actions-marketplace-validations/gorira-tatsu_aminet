---
name: issue-implementation-train
description: "Implement an explicit set of GitHub issues end-to-end for this repository, using isolated worktrees, one branch per issue, targeted tests, pushes, and pull requests against `stg`. Use this when the user asks to implement specific issues, execute a planned batch of roadmap issues, or drive issue work through PR-ready completion. This skill is repo-specific: it never defaults to all open issues, requires an explicit issue set, and stops after initial PR creation rather than handling review follow-up."
argument-hint: "issues <numbers...> [--base stg]"
allowed-tools: [Read, Glob, Grep, Bash(gh issue:*), Bash(gh pr:*), Bash(git worktree:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git push:*), Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(pnpm:*), Bash(node:*)]
---

# Issue Implementation Train

Take an explicit batch of issues from intake to PR-ready completion.

This skill is for **execution orchestration**, not planning. It is intentionally conservative: do not infer the target as "all open issues", and do not include post-PR review handling.

## Inputs

## Arguments

The user invoked this with: `$ARGUMENTS`

The argument must identify the issue set explicitly. Accept:

- `issues 32 33 36`
- `#32 #33 #36`
- `issues from milestone A` only if the issue list can be resolved concretely from local context

If the request does not clearly identify the issue set, stop and ask the user to name the issues.

## Operating Model

- one issue per worktree
- one issue per branch
- one worker per issue by default
- base branch default: `stg`
- completion target: implementation, relevant validation, commit, push, PR creation
- review follow-up is out of scope; hand that to `review-respond` or the GitHub review skills later

## Workflow

### 1. Intake the issue set

For each issue:

- fetch the issue with `gh issue view <n>`
- identify likely write scope
- identify likely test scope
- note whether it is code, docs, parser, CLI, workflow, or release-process work

Build a short internal table with:

- issue number
- title
- likely files/subsystems
- overlap risk
- validation scope

### 2. Decide parallel vs serial lanes

Parallelize across issues only when write scopes are independent.

Default rules:

- parser + parser in the same subsystem: serialize
- parser + tests for that parser: serialize
- docs-only or workflow-doc changes may run separately if they do not depend on implementation landing first
- if two issues both touch shared output semantics, shared CLI entrypoints, or shared GitHub Action behavior, serialize

When in doubt, choose serial execution.

### 3. Create isolated worktrees and branches

For each selected issue:

- branch: `issue-<n>-<slug>`
- worktree: `~/.codex/worktrees/<n>-<slug>`
- base: `origin/stg` unless the user explicitly overrides

Use non-interactive git only. Reuse an existing worktree only after checking that it is safe and already dedicated to the same issue.

### 4. Spawn one worker per issue

Each worker owns:

- the assigned issue
- the assigned worktree and branch
- the implementation in that worktree
- the narrowest relevant validation
- commit, push, and PR creation

Each worker prompt must include:

- issue number and title
- repo path
- worktree path
- branch name
- explicit instruction not to revert unrelated changes
- explicit instruction not to touch other workers' worktrees
- completion requirements and required return values

### 5. Validate before PR creation

Require the worker to run the narrowest relevant tests that provide confidence.
If relevant validation fails, stop and mark the issue as `BLOCKED` with the failure details. Do not commit, push, or open a PR.

Default validation policy:

- parser / resolver changes: focused unit tests plus broader affected suite if shared semantics changed
- CLI / output changes: relevant command tests plus snapshot/output tests if present
- docs-only changes: tests only if the docs depend on generated examples or checked snippets

Workers must report:

- what they ran
- what they did not run
- residual risks

### 6. Push and open PRs

For each completed issue:

- commit with a concise imperative message
- push the branch with upstream tracking
- open a PR against the resolved base branch (`stg` by default, or the user-provided override)
- include `Closes #<n>` in the PR body

Use a compact PR body:

```md
## Summary
- <change 1>
- <change 2>

## Testing
- <command>

## Issue
- Closes #<n>
```

### 7. Report portfolio status

Return a compact end summary grouped by outcome:

- completed with PR
- blocked
- intentionally serialized behind another issue

For each issue, include:

- issue number
- branch
- worktree path
- tests run
- PR URL or blocker

## Repo Defaults

- default base branch: `stg`
- never default to "all open issues"
- do not merge PRs from this skill
- do not handle review feedback from this skill

## Escalation Rules

Ask the user only when one of these is true:

- the issue set is not explicit
- issue dependency order materially changes delivery and cannot be inferred
- two issues overlap heavily enough that ownership is unclear
- the target branch should not be `stg`

Otherwise, proceed with the default model above.
