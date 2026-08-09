# Client-Web Extension Registry MVP

- **Objective**: move client-web from the legacy `extensions` transition model to the
  Registry installation and current-peer binding contract without embedding deployment
  addresses or guessing peer authority.
- **Immutable inputs**: ext-reg Runtime/API `v0.1.2`; Core Registry implementation PR #47
  merged at `19632baa`; generated contracts came from its exact image
  `ghcr.io/inkcre/core-py@sha256:b8f43a7a9a558e6bb4d86e2d31baffe826a250dcdf32c9faf457a279e836ad10`;
  the subsequently verified production image is
  `ghcr.io/inkcre/core-py@sha256:1de46f335de355a8a9eb27e2784089b4cdef35ad66d64788ae233a1cdf80e670`;
  both expose migration `f2a6c8e4b1d7` and the same database contract.
- **Generated contract evidence**: the official exact-image `pnpm contract:sync -- --image
<digest>` and follow-up `pnpm contract:check -- --image <digest>` both passed through the
  SSH Docker provider and Supabase typegen. They generated
  `extension_installations` and `extension_peer_bindings` in the client contract.
- **Authority split**: Registry `released`, deployment `installed`, peer `enabled`/binding,
  and process `running` are distinct. Legacy `extensions.enabled` is not a Registry binding.
- **Static-artifact boundary**: no Registry or Core service origin is shipped in source or
  output. Deployment-owned `clients.config` supplies both `extension_registry_url` and
  `extension_management_peer_id`; empty values mean intentionally unconfigured.
- **Current implementation**: a Registry adapter uses Runtime/API target matching, immutable
  digest artifact URLs, MF lifecycle compensation, binding-last persistence, cleanup-before-
  delete, and current-peer-only startup. The UI accepts namespace/name plus exact version,
  displays bindings for only the local Web peer or configured management Core peer, and keeps
  legacy lifecycle boot disabled during this migration.
- **Guardrails**: generated database files come only from the exact image. Production publication
  and deployment must consume successful protected-main artifacts; no PR/preview may publish.

## Packet Map

- [evidence.md](evidence.md) — observed release, image/typegen, and runtime facts.
- [handshake.md](handshake.md) — owner boundaries and required provisioning/permission handoff.
- [plan.md](plan.md) — completed implementation sequence and remaining acceptance work.
