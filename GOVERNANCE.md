# Governance

## Maintainer

This repository is maintained by Mark Sowell.

The repository owner is the final decision-maker for:

- Content published on the website
- Design and UX direction
- Technical architecture and dependencies
- Security and disclosure decisions
- Deployment and operational changes

## Project Model

This is a personal website repository, not a multi-maintainer project.

Contributions, suggestions, and issue reports are welcome, but changes are reviewed and accepted at the discretion of the maintainer.

## Decision Principles

Changes are generally evaluated with the following priorities in mind:

1. Security and responsible disclosure
2. Reliability and operational simplicity
3. Performance, especially on mobile
4. Clear presentation of public professional information
5. Maintainability over unnecessary complexity

## Preferred Technical Direction

This project favors a simple, low-overhead stack where possible.

That currently means:

- Astro for the site framework
- Plain CSS for styling
- Plain browser JavaScript for small interactive behavior
- Minimal external runtime dependencies

Tooling or architectural changes that increase complexity should have a clear benefit.

## Changes and Contributions

For non-security issues:

- GitHub issues and pull requests are the normal feedback path
- The maintainer may accept, revise, defer, or decline changes based on project goals

For security issues:

- Do not open a public GitHub issue
- Follow the guidance in [SECURITY.md](./SECURITY.md)

For general support:

- See [SUPPORT.md](./SUPPORT.md)

## Deployment Authority

Changes merged to the main branch may be deployed to the public site through the repository's deployment workflow.

The maintainer is responsible for deciding when operational, design, or content changes are ready for publication.
