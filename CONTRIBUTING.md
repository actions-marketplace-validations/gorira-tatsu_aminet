# Contributing to aminet

Thanks for contributing.

## Prerequisites

- Node.js `>=20`
- Git
- pnpm `>=10`

## Setup

```bash
git clone https://github.com/gorira-tatsu/aminet.git
cd aminet
pnpm install
pnpm build
```

## Development commands

```bash
pnpm lint
pnpm test
node dist/index.js --help
```

Useful targeted commands:

```bash
node dist/index.js analyze express@4.21.2 --security --trust-score
node dist/index.js review package.json --base HEAD~1 --security
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
- Run `pnpm lint` and `pnpm test` before opening a PR

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
