# Documentation

## Local Owners

- [Repository architecture](../ARCHITECTURE.md)
- [Filesystem map](../FILESYSTEM.md)
- [Client and local UI development](../apps/client-web/docs/development.md)
- [Information-base architecture](info-base/ARCHITECTURE.md)
- [Native Extension delivery](native-extension-delivery.md)
- [Shared product requirements](_shared/10-prd/index.md)
- [Shared unit topology](_shared/20-product-tdd/unit-topology.md)
- [Shared state and authority](_shared/20-product-tdd/system-state-and-authority.md)
- [Shared cross-unit contracts](_shared/20-product-tdd/cross-unit-contracts.md)
- [Active developer-experience packet](../tasks/developer-experience-engineering/packet.md)

Product requirements and cross-unit Product TDD are owned by the mounted `InKCre/docs` Hub. Historical plans under `docs/plan/` are not current durable authority.

<!-- svc:begin navigation sha256=01d8643023a40533a997a67c70e920bb0ff0056081d2d18bec59e47324318152 -->
## SVC

This project uses the local Sustainable Vibe Coding CLI. Query framework guidance when it is needed instead of copying framework documents into this repository.

- Use `svc lookup --keyword "<need>"` to find relevant guidance, then `svc lookup --name '<exact-path-regex>'` to read an authoritative document.
- Use `svc status` before broad process changes. If the installed corpus is newer than the adopted version in `svc.json`, read its migration guidance before `svc adopt`.
- Treat all unmarked project instructions and documentation as consumer-owned.
<!-- svc:end navigation -->
