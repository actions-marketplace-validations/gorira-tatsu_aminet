---
name: roadmap-issue-batch
description: "Create a deduplicated batch of GitHub issues from roadmap documents, release plans, or report files. Use this when the user asks to turn a roadmap into issues, create missing issues from a plan, or bulk-file issues for a version or milestone. This skill is repo-specific: it prefers `report/` planning artifacts, uses the repository issue templates, writes issue content in English, and always previews the batch before creation unless the user explicitly opts out."
argument-hint: "from <version|horizon|report-path>"
allowed-tools: [Read, Glob, Grep, Bash(gh issue:*), Bash(git status:*)]
---

# Roadmap Issue Batch

Turn an existing roadmap into a safe, reviewable batch of GitHub issues.

This skill is for **plan-to-issue conversion**, not general one-off issue drafting. Keep the scope narrow: derive issues from roadmap material, detect duplicates, show the full batch, then create only after explicit confirmation unless the user clearly says to skip preview.

## Inputs

Interpret the argument in this order:

- a specific report or roadmap file path under `report/`
- a target version such as `0.3.0` or `1.0`
- a planning horizon such as `next release` or `toward 1.0`
- empty, meaning "find the most relevant roadmap artifact and draft issues from it"

## Workflow

### 1. Find the planning source

Start with repository-local planning artifacts before guessing.

- inspect `report/` for recent implementation plans, task lists, or roadmap notes
- if needed, inspect `.claude/skills/roadmap-planning/SKILL.md` output expectations to match the repo's planning style
- use existing open issues only as current-state input, not as the primary source of truth

If multiple roadmap files are plausible, prefer the most recent one that clearly covers the requested version or horizon.

### 2. Derive candidate issues

Break the roadmap into actionable issues.

Prefer one issue per coherent unit of delivery:

- one behavior or capability change
- one documentation or operational gap
- one enabling design decision when it materially affects follow-on work

Do not create separate issues for trivial substeps that belong naturally inside one implementation thread.

### 3. Check for duplicates

Before proposing any issue:

- search open issues for title or intent overlap
- inspect recently closed issues when the roadmap item looks like a follow-up to already shipped work

Use these rules:

- if an open issue already covers the work, skip it
- if a closed issue covered only an earlier MVP and the roadmap clearly describes additional work, create a new issue and mention the earlier issue in the body when helpful
- when overlap is ambiguous, keep the candidate in the preview and flag it as a judgment call

### 4. Build issue bodies from the template

Check `.github/ISSUE_TEMPLATE/feature_request.yml` and match its structure.

Default body sections:

- `Problem statement`
- `Proposed solution`
- `Alternatives considered`
- `Example CLI or Action usage`

Rules:

- write the issue in English
- default label: `enhancement`
- keep the title concrete and outcome-focused
- mention roadmap context only when it helps future triage

### 5. Preview the full batch

Always show one numbered preview block before creating, unless the user explicitly says to create without preview.

The preview must include:

- issue title
- short 1-line purpose
- candidate label
- whether it is new or a follow-up to a closed issue
- any skipped duplicates
- assumptions used to split the work

If the user asked for "all missing issues", also report which roadmap items were intentionally not turned into issues because they are too small, duplicate, or too vague.

### 6. Create and report

After confirmation:

- create issues with `gh issue create`
- report issue number, title, and URL in one compact summary

If creation partially succeeds, stop and report what was created and what remains.

## Repo Defaults

- prefer roadmap artifacts under `report/`
- issue language: English
- default label: `enhancement`
- do not create PRs from this skill
- do not mutate roadmap files; this skill creates issues only

## Output Format

Use this preview format:

```md
## Preview: Roadmap Issue Batch

Source: <file or inferred source>

1. <title> — <1-line purpose>
2. <title> — <1-line purpose>

Skipped as duplicates:
- #<n> <title>

Assumptions:
- <assumption>
```

Use this completion format:

```md
## Created Issues

- #<n> <title> — <url>
- #<n> <title> — <url>
```
