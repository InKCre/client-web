# Client-Web

Static Vue application and equal InKCre database Peer.

## Owners

- Runtime, Peer delegation, configuration, and authentication: `../../docs/30-unit-tdd/client-runtime-and-delegation.md`.
- Info-Base and Resolver contracts: `../../docs/30-unit-tdd/info-base.md`.
- Native Extension Host: `../../docs/30-unit-tdd/native-extension-runtime.md`.
- Local and sibling-UI development lanes: `../../docs/40-deployment/development-runtime.md`.
- Component subtree hazards: `src/components/AGENTS.md`.

## Local Hazards

- Keep deployable artifacts environment-neutral: no service origin, Peer identity, JWT secret, Worker runtime, or `/api/config` fallback.
- Browser-owned settings are runtime authority. Keep the JWT signing secret masked, memory-only after use, absent from logs, and excluded from portable exports.
- `https://registry.inkcre.dev` is the reviewed public Registry fallback; a deployment or Peer owner may override it at operation time.
- Use **Peer** in technical contracts; product-facing UI may say **client**.
- Preserve exact capability delegation and typed unknown outcomes; do not replace them with a generic Core API path or automatic retry after ambiguous dispatch.
- Start development through root commands so SVC and Portless preserve worktree identity. The sibling UI source lane is explicitly non-release evidence.

## Checks

- `pnpm --filter @inkcre/client-web type-check`
- `pnpm --filter @inkcre/client-web build`
- `pnpm check`
