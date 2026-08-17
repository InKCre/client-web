# Deployment and Runtime

This directory owns stable runtime, operational, and delivery facts for this repository. Executable
configuration and automation remain authoritative when implementation details change.

- [Development runtime](development-runtime.md): worktree capabilities, database providers,
  ownership, readiness, reset, and cleanup boundaries.
- [Web delivery](web-delivery.md): the environment-neutral client artifact and Cloudflare Pages
  preview and production responsibilities.
- [Native Extension delivery](native-extension-delivery.md): release intent, Version PRs,
  self-built Registry publication, and local no-publish guardrails.

Application and package internals belong to [Unit TDD](../30-unit-tdd/README.md). Cross-unit product
and technical contracts belong to the read-only [`docs/_shared/`](../_shared/) reference.
