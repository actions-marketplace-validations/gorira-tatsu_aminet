# Contributing to ami

Thanks for contributing.

## Prerequisites

- Bun `>=1.2.0`
- Git

## Setup

```bash
git clone https://github.com/gorira-tatsu/ami.git
cd ami
bun install
```

## Development commands

```bash
bun run lint
bun test
bun run src/index.ts --help
```

Useful targeted commands:

```bash
bun run src/index.ts analyze express@4.21.2 --security --trust-score
bun run src/index.ts review package.json --base HEAD~1 --security
```

## Project layout

- `src/cli`: command entrypoints and renderers
- `src/core`: analysis engines, stores, and report builders
- `src/utils`: shared HTTP, logging, and concurrency helpers
- `test`: unit and regression coverage

## Pull request expectations

- Keep changes scoped
- Add or update tests for behavior changes
- Update user-facing documentation when commands, flags, or output change
- Run `bun run lint` and `bun test` before opening a PR

## Commit and review hygiene

- Prefer small commits with clear messages
- Describe user-visible impact in the PR summary
- Call out any cache, output, or schema changes explicitly
- Include sample CLI output when changing review or reporting behavior

## Adding a new analysis check

When adding a new analyzer or signal:

1. Put core logic under `src/core`
2. Thread results into the report builder if user-visible
3. Add renderer coverage if output changes
4. Add unit or regression tests under `test`
5. Document new CLI flags or output fields in `README.md`

## Reporting security issues

Use the private process documented in [`SECURITY.md`](./SECURITY.md).
