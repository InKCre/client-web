<!-- Create one packet for every non-trivial Consumer Task. `svc task init` creates only this shape. Do not create family children until their topology or information owner is admitted; keep this as a compact Human collaboration surface, not a completed-work log. -->

# svc-v14-doc-owners

<!-- State the outcome, not the process. This lets a returning Human judge what the work is for. -->

- **Objective**: Adopt SVC 14.0.0 and aggressively reduce repository guidance and durable documentation to clear, non-duplicated semantic owners without losing runtime, security, release, or multi-repo contracts.

<!-- Keep authority, boundaries, invariants, and excluded effects here; do not hide a mutation gate in a child. -->

- **Guardrails**: Keep `docs/_shared/` read-only and do not bump it; preserve application behavior and development target semantics; do not mix Hub edits, source changes, or unrelated work into this task; delete `docs/plan/`; keep stable facts in one durable or executable owner and local `AGENTS.md` files limited to recurring physical-subtree hazards.

<!-- State the terminal claim and evidence horizon, not a command inventory. -->

- **Verification**: SVC reports schema and Corpus 14.0.0 current with generated guidance healthy; all retained owner targets and Markdown links resolve; repository checks demonstrate documentation/configuration changes did not break workspace contracts; independent review finds no lost guardrail or duplicate authority.

<!-- Compress supported state, decisions, foreground mismatch, and material uncertainty; include consequential child returns. -->

- **Current Truth**: SVC schema 3, Corpus 14.0.0, managed integration, and all four development targets are current and healthy; `svc init` and `svc upgrade` are no-ops. Removed v11/v12 Agent-evidence APIs were not consumed. Three logical internal owners now live under `docs/30-unit-tdd/`: Client Runtime and Delegation, Info-Base, and Native Extension Runtime. Development Runtime, Web Delivery, and Native Extension Delivery now live under `docs/40-deployment/`. Root Architecture owns only repository topology and cross-unit flow; superseded physical-directory Architecture/development/delivery documents are deleted. Local `AGENTS.md` files retain only subtree hazards and checks. `docs/plan/`, redundant catalogs/notes, empty or descriptive local AGENTS, and the retired SVC skill are deleted. Link validation covers all 38 retained Markdown files; `pnpm run doctor`, runtime and Extension contract checks, 106 unit tests, all builds, and the full post-promotion `pnpm check` pass; only existing build warnings remain. Independent final review accepted the promoted owner graph with no blocking boundary, guardrail, navigation, or over-deletion finding.

<!-- Keep one next concrete Agent action or one Human decision/review need. -->

- **Next Step**: Present the uncommitted branch for Human review and explicit commit/PR authorization.

Keep this file as the compact control surface. Start it with `svc task init
<task-id>`. When it becomes hard to scan, use `svc task grow <task-id>` and
split only supporting material that reduces coordination cost.
