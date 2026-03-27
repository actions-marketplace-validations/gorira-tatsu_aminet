---
name: pr-notify
description: Comment on related GitHub issues when a PR is created or updated. Use this skill when the user says "/pr-notify", asks to "notify issues about this PR", "comment on related issues", "link PR to issues", or wants to update issue threads with PR status. Also use proactively after creating a PR that references issues, to keep issue threads informed.
argument-hint: "[#issue1 #issue2 ...] — specific issues, or omit to auto-detect from PR"
allowed-tools: [Bash(gh issue:*), Bash(gh pr:*), Bash(git log:*), Bash(git branch:*), Read, Grep]
---

# PR Notification to Issues

Post informative comments on GitHub issues that are related to the current PR, keeping issue threads up to date with development progress.

## Arguments

The user invoked this with: $ARGUMENTS

## Workflow

### Step 1: Identify the current PR

Run `gh pr view --json number,title,body,state,url,headRefName` to get the current branch's PR info.

If no PR exists for the current branch, inform the user and suggest creating one first (or using `/issue-pr pr`).

### Step 2: Find related issues

Collect issue numbers from multiple sources:

1. **Explicit arguments**: If the user passed `#5 #6`, use those
2. **PR body**: Scan for patterns like `Closes #N`, `Fixes #N`, `Resolves #N`, `#N`
3. **Commit messages**: Run `git log <base>..HEAD --oneline` and scan for `#N` references
4. **Branch name**: Extract issue number if branch follows `feat/123-description` or `fix/issue-123` pattern

Deduplicate the issue numbers.

### Step 3: Build the comment

For each issue, post a comment with this structure:

```markdown
### PR Update: #<pr-number> — <pr-title>

**Status**: <Open|Merged|Closed>
**Branch**: `<branch-name>`

**Summary of changes:**
<2-3 bullet points describing what this PR does, derived from PR body or commits>

[View PR](<pr-url>)
```

### Step 4: Post comments

For each related issue:

```bash
gh issue comment <issue-number> --body "<comment>"
```

### Step 5: Report results

Show the user which issues were notified:

```
Notified issues:
- #5 — <issue title> ✓
- #6 — <issue title> ✓
```

## Edge cases

- **No PR found**: Tell the user to create a PR first
- **No related issues found**: Tell the user no issue references were detected, and suggest passing issue numbers explicitly
- **Issue already has a comment from this PR**: Check existing comments with `gh issue view <N> --comments` to avoid duplicate notifications. If a prior comment exists, update it instead of posting a new one
- **Closed issues**: Still notify — the comment is useful as a historical record

## When to use proactively

If you just created a PR (e.g., via `/issue-pr pr`) and the PR body contains `Closes #N` or similar references, suggest running `/pr-notify` to keep those issue threads informed. The goal is to make issue threads self-documenting — anyone following an issue should see when a PR is opened for it.
