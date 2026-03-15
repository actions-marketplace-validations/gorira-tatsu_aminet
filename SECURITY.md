# Security Policy

## Supported versions

`ami` is currently pre-`1.0`. Security fixes are applied on the latest mainline development branch and most recent tagged release, once releases are established.

## Reporting a vulnerability

Please do not open a public GitHub issue for an unpatched security vulnerability.

Until a dedicated security mailbox is published, open a private GitHub security advisory if available for the repository. If that is not available, contact the maintainer through a private channel before public disclosure.

Include:

- affected `ami` version or commit
- reproduction steps
- impact assessment
- proof of concept or logs when relevant

## Response expectations

- initial acknowledgement target: within 7 days
- status updates during triage and remediation
- coordinated disclosure preferred after a fix or mitigation is available

## Scope

This policy covers vulnerabilities in:

- the `ami` CLI
- the bundled GitHub Action in this repository
- documented installation and execution flows maintained by this project

It does not cover vulnerabilities in third-party registries or advisory sources consumed by `ami`, except where `ami` handles them incorrectly.
