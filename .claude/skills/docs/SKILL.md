---
name: docs
description: Generate or update project documentation based on code changes. Use this skill when the user says "/docs", asks to update documentation, wants to document recent changes, or needs to generate README, CONTRIBUTING, or API docs. Also triggers when the user mentions "update the docs", "write documentation", or "document this".
argument-hint: "[target] — e.g., README, CONTRIBUTING, API, or omit to auto-detect"
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash(git diff:*), Bash(git log:*), Bash(git status:*)]
---

# Documentation Generator

Generate or update project documentation by analyzing code changes and existing docs.

## Arguments

The user invoked this with: $ARGUMENTS

## How to determine what to document

1. **If a target is specified** (e.g., `README`, `CONTRIBUTING`, `API`), focus on that file
2. **If no target**, auto-detect what needs updating:
   - Run `git diff --name-only HEAD~5` to see recent changes
   - Check which source files changed and whether docs cover those areas
   - Prioritize: new CLI flags, new features, changed behavior, new configuration options

## Workflow

### Step 1: Gather context

- Read the existing documentation file(s) to understand current style, tone, and structure
- Run `git log --oneline -10` to understand recent changes
- Run `git diff --stat HEAD~5` to see what files changed
- Read relevant source files to understand new or changed functionality

### Step 2: Identify documentation gaps

Compare what the code does now vs what the docs describe. Look for:
- New CLI commands or flags not documented
- Changed behavior not reflected in docs
- New configuration options missing from docs
- Outdated examples or version numbers
- Missing sections for new features

### Step 3: Write or update documentation

Follow these conventions (derived from this project's existing docs):
- Use clear, pragmatic tone focused on user value
- Include concrete CLI examples with actual commands
- Show example output where helpful
- Use tables for structured information (options, flags, config fields)
- Keep sections concise — prefer short paragraphs over walls of text
- Use imperative mood for instructions ("Run this command", not "You can run this command")

### Step 4: Present changes

After editing, show a brief summary of what was updated and why. If there are remaining gaps, mention them so the user can decide whether to address them.

## Target-specific guidance

### README
- Focus on user-facing features: installation, quick start, CLI usage, Action usage
- Keep examples up to date with current flags and output format
- Update version numbers if relevant

### CONTRIBUTING
- Development setup, prerequisites, commands
- Branching strategy (main/stg/feature-branch workflow)
- PR expectations and commit conventions

### API
- Exported functions, interfaces, and types
- Configuration options and their effects
- Integration points (CLI, Action, config file)

## Style rules

- Write all documentation in English
- Use GitHub-flavored markdown
- Code blocks should specify the language (`bash`, `yaml`, `json`, `typescript`)
- Do not add emoji unless the existing docs use them
- Match the heading hierarchy of the existing document
