# InKCre Web Monorepo

Web, browser-extension, shared-core, and Module Federation clients for the InKCre information management system.

## Repository Map

- `packages/core/`: shared models, APIs, configuration, storage, resolvers, and extension contracts.
- `packages/ext-dev-utils/`: extension development utilities.
- `apps/client-web/`: Vue 3 static web client.
- `apps/client-webext/`: WXT browser extension.
- `extensions/`: Module Federation remotes.
- `docs/`: local architecture notes and historical implementation material.
- `tasks/`: active agent-owned collaboration state.

## Knowledge Owners

- SVC working protocol and implementation judgment: the adopted SVC corpus, queried through the generated navigation below.
- Repository architecture: `ARCHITECTURE.md`.
- Filesystem map: `FILESYSTEM.md`.
- Shared InKCre product truth and cross-unit contracts: the `InKCre/docs` Hub; consume a published reference through `docs/_shared/` once present.
- Shared-reference mutation workflow: `.agents/skills/edit-svc-shared-docs/SKILL.md`, which delegates to the canonical Hub skill.
- Local component and package guidance: the nearest nested `AGENTS.md`.
- Active developer-experience work: `tasks/developer-experience-engineering/packet.md`.
- Task retention: keep packets while their work remains active; completed packets may be deleted without an archive or deletion-time promotion review.

## Development Workflow

- Runtime: Node.js 22.22.3 and pnpm 10.26.2.
- Install: `pnpm install --frozen-lockfile`.
- Develop: `pnpm dev` or `pnpm dev:all`.
- Static web build: `pnpm --filter @inkcre/client-web build-only`.
- Current broad checks: `pnpm type-check` and `pnpm build`; known baseline failures are recorded in the active developer-experience packet.

## Execution Rules

- Reason in English and communicate with humans in Chinese.
- Read the active task packet and the nearest `AGENTS.md` before editing a governed subtree.
- Search before creating a type, utility, or abstraction.
- Prefer code, configuration, tests, and automation for mechanically enforceable truth.
- Follow `.agents/prompts/code-for-human.md` and `.agents/rules/writing-agent-document.md`.
- Refresh relevant `AGENTS.md`, `ARCHITECTURE.md`, and `FILESYSTEM.md` after significant structural changes.
- Require explicit human start before modifying code; task-packet maintenance is exempt.
- Require explicit human authorization before commit, push, or external publication.

## Multi-Repo Boundary

- This repository is a Spoke in the wider InKCre product topology and a monorepo internally.
- Treat `docs/_shared/` as read-only when the Hub reference is present.
- Read the shared-doc wrapper before changing Hub truth or the shared reference.
- Capture missing shared truth in the active local packet, change `InKCre/docs` first, publish the Hub commit, then update the Spoke reference separately.
- Never mix Hub content edits, shared-reference bumps, and Spoke-local implementation in one commit.

<!-- svc:begin navigation sha256=01d8643023a40533a997a67c70e920bb0ff0056081d2d18bec59e47324318152 -->
## SVC

This project uses the local Sustainable Vibe Coding CLI. Query framework guidance when it is needed instead of copying framework documents into this repository.

- Use `svc lookup --keyword "<need>"` to find relevant guidance, then `svc lookup --name '<exact-path-regex>'` to read an authoritative document.
- Use `svc status` before broad process changes. If the installed corpus is newer than the adopted version in `svc.json`, read its migration guidance before `svc adopt`.
- Treat all unmarked project instructions and documentation as consumer-owned.
<!-- svc:end navigation -->
