# ami

`ami` is a Bun-based CLI and GitHub Action for reviewing npm dependency risk.

It analyzes dependency graphs, vulnerabilities, licenses, security signals, trust, freshness, provenance, and version pinning, then renders the result as terminal output, machine-readable JSON, SBOMs, or PR review comments.

## Status

- Early project, pre-`1.0`
- License is not finalized yet
- CLI and review output may still evolve

## What `ami` does

- Analyze a package or project dependency graph
- Review pull request dependency changes and post GitHub comments
- Flag vulnerability, license, and supply chain concerns
- Generate SPDX and CycloneDX SBOM output
- Produce third-party notices output

## Feature overview

- Vulnerability scanning via OSV, GHSA, and npm audit
- License categorization, deny-list checks, compatibility checks, and deep tarball license verification
- Enhanced license intelligence via ClearlyDefined
- Trust scoring from packument data, downloads, and deps.dev metadata
- Freshness analysis for outdated or abandoned dependencies
- Provenance checks for npm attestations
- Phantom dependency detection
- Version pinning analysis
- PR review comments focused on changed direct dependencies

## Requirements

- Bun `>=1.2.0`
- npm ecosystem input (`package.json`, `package-lock.json`, or `bun.lock`)

## Local setup

```bash
bun install
bun run src/index.ts --help
```

## Quick start

Analyze a published package:

```bash
bun run src/index.ts analyze express@4.21.2 --security --trust-score --freshness
```

Analyze a local project:

```bash
bun run src/index.ts analyze package.json --security --enhanced-license --json
```

Review dependency changes in a branch:

```bash
bun run src/index.ts review package.json --base HEAD~1 --security
```

Cache maintenance:

```bash
bun run src/index.ts cache stats
bun run src/index.ts cache prune
```

## Example outputs

Representative analyze modes:

```bash
bun run src/index.ts analyze express@4.21.2 --json
bun run src/index.ts analyze express@4.21.2 --cyclonedx
bun run src/index.ts analyze express@4.21.2 --spdx
bun run src/index.ts analyze express@4.21.2 --notices
```

Representative review mode:

```text
## ami Dependency Review

| Metric | Count |
|--------|-------|
| Added | 1 |
| Removed | 0 |
| Updated | 1 |
| New Vulnerabilities | 2 |
| Resolved Vulnerabilities | 1 |
| New Security Signals | 1 |
| Resolved Security Signals | 0 |
| License Changes | 1 |

### New Vulnerabilities
| Package | Version | Severity | Advisory | Fixed | Source | Summary |
|---------|---------|----------|----------|-------|--------|---------|
| minimist | 1.2.8 | CRITICAL | GHSA-... | 1.2.6 | osv | Prototype Pollution |

### Updated Dependencies
| Package | Declared | Resolved | License |
|---------|----------|----------|---------|
| react | ^18.2.0 -> ^18.3.0 | 18.3.1 -> 18.3.2 | MIT |
```

## CLI commands

Top-level commands:

- `analyze`: dependency graph analysis for packages or local manifests
- `ci`: JSON-oriented CI alias for `analyze`
- `review`: PR review mode for direct dependency changes
- `cache`: local cache inspection and pruning

Use the built-in help for the complete option set:

```bash
bun run src/index.ts analyze --help
bun run src/index.ts review --help
```

## GitHub Action

This repository includes a composite action in [`action.yml`](./action.yml).

For repository-local usage during development:

```yaml
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: ./
        with:
          path: package.json
          security: "true"
```

For remote usage after tagged releases are published, replace `uses: ./` with `uses: owner/ami@tag`.

## Output modes

`analyze` can render:

- human-readable table output
- JSON
- dependency tree output
- Mermaid and Graphviz graphs
- CycloneDX 1.5 SBOM
- SPDX 2.3 SBOM
- third-party notices output

## Development workflow

Run the main checks before opening a PR:

```bash
bun run lint
bun test
```

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for contributor workflow details.

## Security reporting

Do not report vulnerabilities in public issues. See [`SECURITY.md`](./SECURITY.md).
