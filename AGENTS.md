# InKCre Web Monorepo

Vue web, WXT browser-extension, shared-core, and Module Federation clients for InKCre.

Reason in English. Communicate with humans in Chinese.

## Knowledge Owners

- Repository topology and package boundaries: `ARCHITECTURE.md`.
- Physical layout: `FILESYSTEM.md`.
- Logical Unit internals: `docs/30-unit-tdd/`.
- Runtime, development capabilities, and delivery: `docs/40-deployment/`.
- Shared product truth and cross-unit contracts: the read-only `docs/_shared/` Hub reference.
- Physical-subtree hazards: the nearest local `AGENTS.md`.
- Volatile work state: the active packet under `tasks/`.

## Working Protocol

- Run `svc status . --json`, then use `svc lookup --keyword` and `svc lookup --path` only for guidance required by the current pressure.
- Follow the organization-wide [Git and GitHub Governance](https://github.com/InKCre/.github/blob/main/GOVERNANCE.md)
  and [contribution workflow](https://github.com/InKCre/.github/blob/main/CONTRIBUTING.md) for branches, pull requests,
  release authority, and delivery boundaries; repository-local documents own exact commands.
- Read the active Task Packet, relevant durable owner, and nearest local `AGENTS.md` before editing.
- Resolve one semantic owner before adding durable material. Prefer code, types, configuration, and CI for mechanically enforceable truth.
- Before a reference-sensitive, logic-altering, or non-obviously-local durable mutation, state the target, objective `From -> To`, operation, blast radius, invariants, verification, and uncertainty.
- Search before creating a type, utility, document, or abstraction.
- Keep Task Packets compact and disposable. Add supporting entries only when a distinct owner and coordination pressure exist.

## Engineering Workflow

- Runtime: Node.js 22.22.3; package manager: pnpm 11.11.0.
- Install: `pnpm install --frozen-lockfile`.
- Diagnose: `pnpm run doctor` (`pnpm doctor` is a different pnpm command).
- Develop: `pnpm dev`, `pnpm dev:all`, or an explicit source lane documented in `docs/40-deployment/development-runtime.md`.
- Required verification: `pnpm check`; required production outputs: `pnpm build`.
- Shadow verification: `pnpm lint:type-aware` and `pnpm type-check:ts7`.
- Follow the organization-wide [Verification and Test Policy](https://github.com/InKCre/.github/blob/main/TESTING.md).
  The admitted Playwright E2E suites do not authorize new automation by analogy.
- Follow `.agents/prompts/code-for-human.md` for source changes.
- Require explicit Human authorization before modifying source code and before commit, push, or external publication. Task Packet maintenance is exempt from the source gate.

## Multi-Repo Boundary

- This repository is a Spoke and an internal monorepo. Treat `docs/_shared/` as read-only.
- Capture missing shared truth in the active packet, then use `.agents/skills/edit-svc-shared-docs/SKILL.md` to change the Hub source and publish it before updating this reference.
- Never mix Hub edits, a shared-reference bump, and Spoke-local work in one commit.


<!-- svc:begin -->
## SVC

Use `svc --help` or `svc <command> --help`.

- `svc status`: inspect project state
- `svc lookup`: read SVC guidance
- `svc task init`: create a task packet
- `svc task grow`: inspect packet shape without changing files
- `svc dev`: manage declared development targets

If `AGENTS.local.md` exists, read it after this file. It is ignored local guidance; shared rules belong here.
<!-- svc:end -->
