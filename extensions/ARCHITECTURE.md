# Architecture of InKCre Web extensions

- Extensions are Module Federation remotes. A Registry-aware host resolves an exact target digest
  and loads its declared entrypoint from
  `https://{registry-origin}/v1/artifacts/{target-digest}/files/{entrypoint}`.
- Remote artifacts use a relative Vite base so all chunks and CSS remain under that same
  digest-addressed prefix; an artifact never needs a target-specific Registry URL at build time.
- `target-publish.json` records the immutable Extension coordinate and technical compatibility
  conditions. It is source metadata, not proof of a published target.
- Extensions need configuration shared with their relevant implementation, such as Python.
- Extensions can access the core API exposed by their host.
