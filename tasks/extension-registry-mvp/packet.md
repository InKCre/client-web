# Client-Web Extension Registry MVP

- **Objective**: complete the native Distribution cutover with one canonical shared
  `extensions` relation, a Web Extension Host consuming Registry-hosted Module Federation,
  and generated database truth from the exact production-admitted Core image.
- **Immutable inputs**: ext-reg Runtime/API `v0.1.3`; Core Registry implementation PR #47
  merged at `19632baa`; generated contracts came from its exact image
  `ghcr.io/inkcre/core-py@sha256:b8f43a7a9a558e6bb4d86e2d31baffe826a250dcdf32c9faf457a279e836ad10`;
  the subsequently verified production image is
  `ghcr.io/inkcre/core-py@sha256:1de46f335de355a8a9eb27e2784089b4cdef35ad66d64788ae233a1cdf80e670`;
  both expose migration `f2a6c8e4b1d7` and the same database contract.
- **Generated contract evidence**: the previously generated files still describe the rejected
  installation/binding schema. Core main `34914b6` is now production-admitted as exact image
  `ghcr.io/inkcre/core-py@sha256:eaed6a4059020087a1ff5e83524478d74cd7455544c01f565927d543944104a2`
  with runtime contract `peer-database-runtime-v2`. The Web CI now uploads its exact-image
  generated files and rejects any checked-in drift; this gate must turn green before merge.
- **Authority split**: Registry owns released native Distributions; the deployment owns one
  installed version in canonical `extensions`; each Peer UUID may be present in `enabled[]`;
  each Host owns only in-process running state.
- **Static-artifact boundary**: no Registry or Core service origin is shipped in source or
  output. Deployment-owned `clients.config` supplies both `extension_registry_url` and
  `extension_management_peer_id`; empty values mean intentionally unconfigured.
- **Current implementation**: `WebExtensionHost` resolves an exact native Release, rejects an
  incompatible `@inkcre/core` range before executable fetch, registers the immutable native
  `mf-manifest.json` with Module Federation, preserves the platform lifecycle, and mutates only
  the current Peer through the server-owned atomic RPC. The old target matcher, generic artifact
  manifest, installation/binding tables, and shared Runtime package are removed.
- **Production acceptance**: pending. Registry and Core are already cut over and green; Web must
  synchronize generated truth from the exact Core image, publish the Twitter MF Distribution,
  deploy the checked Pages artifact, and complete the final Chromium lifecycle.
- **Guardrails**: generated database files come only from the exact image. Production publication
  and deployment must consume successful protected-main artifacts; no PR/preview may publish.

## Packet Map

- [evidence.md](evidence.md) — observed release, image/typegen, and runtime facts.
- [handshake.md](handshake.md) — owner boundaries and completed production handoff.
- [plan.md](plan.md) — completed implementation and production acceptance sequence.
