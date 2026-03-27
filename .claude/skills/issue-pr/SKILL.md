---
name: issue-pr
description: Create GitHub issues and pull requests using the gh CLI. Use this skill when the user says "/issue-pr", asks to "create an issue", "open a PR", "file a bug", "create a pull request", "make issues for these", or wants to batch-create multiple issues from a plan. Also triggers for "open PR targeting stg" or "create issues from this list".
argument-hint: "issue <title> [--label <label>] [--body <body>] | pr [--base <branch>] | issues <list>"
allowed-tools: [Bash(gh issue:*), Bash(gh pr:*), Bash(git log:*), Bash(git diff:*), Bash(git branch:*), Bash(git push:*), Bash(git remote:*), Read, Glob, Grep]
---

# GitHub Issue & PR Creator

Create GitHub issues and pull requests with proper formatting, labels, and cross-references.

## Arguments

The user invoked this with: $ARGUMENTS

## Parsing the arguments

Determine the mode from the first word:
- `issue` — create a single issue
- `pr` — create a pull request
- `issues` — batch-create multiple issues
- If empty or ambiguous, ask the user what they want to create

## Mode: Create Issue

**Usage:** `/issue-pr issue "title" [--label bug|enhancement|...] [--body "description"]`

### Steps

1. If title or body is missing, infer from conversation context or ask
2. Determine the appropriate label from context:
   - Bug reports → `bug`
   - New features → `enhancement`
   - Documentation → `documentation`
3. Create the issue in English, using this structure:

```
gh issue create --title "<title>" --label "<label>" --body "$(cat <<'EOF'
### Problem statement
<what's wrong or what's needed>

### Proposed solution
<how to fix or implement>

### Example usage
<code examples if applicable>
EOF
)"
```

4. Report the issue URL back to the user

## Mode: Create PR

**Usage:** `/issue-pr pr [--base <branch>]`

### Steps

1. **Detect base branch**: Use `--base` if provided. Otherwise:
   - Check if `stg` branch exists: `git branch -r | grep origin/stg`
   - If `stg` exists, use it as base
   - Otherwise, fall back to `main`

2. **Gather context**:
   - `git log <base>..HEAD --oneline` to see commits in this branch
   - `git diff <base>...HEAD --stat` to see changed files
   - Read commit messages to understand the changes

3. **Generate PR content**:
   - Title: short (under 70 chars), in conventional commit style if applicable
   - Body: use the project's PR template structure:

```markdown
## Summary
<1-3 bullet points summarizing the changes>

## Testing
- [ ] pnpm lint
- [ ] pnpm test

## Risk (checklist)
- [ ] CLI output changed
- [ ] JSON or SBOM output changed
- [ ] Cache or network behavior changed
- [ ] Documentation updated if needed

## Notes
<any additional context>
```

4. **Link related issues**: Scan commit messages for issue references (`#N`, `Closes #N`, `Fixes #N`) and include them in the PR body

5. **Push and create**:
   - Push the branch if not already pushed: `git push -u origin <branch>`
   - Create the PR: `gh pr create --base <base> --title "..." --body "..."`

6. Report the PR URL back to the user

## Mode: Batch Create Issues

**Usage:** `/issue-pr issues` (reads from conversation context or a provided list)

### Steps

1. Parse the list of issues from:
   - The conversation context (e.g., a plan with bullet points)
   - Explicit argument text
2. For each issue, create it using the single-issue flow above
3. Report all created issue URLs as a summary table

## Rules

- Always write issue and PR content in **English**
- Use conventional commit prefixes in PR titles when applicable (`feat:`, `fix:`, `docs:`, `chore:`)
- Never create duplicate issues — check existing open issues first with `gh issue list`
- Include `Closes #N` in PR body when the PR resolves a known issue
- For PRs, always check if the branch needs pushing before creating
