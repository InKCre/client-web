# AGENTS.md for `extensions/` in inkcre/client-web

- Every sub folder is a standalone Module Federation remote.
- Sub folder name is the extension id.

## File Structure

Every extension should follow this structure:

```
vite.config.ts     # [Example](./agents/assets/vite.config.ts.md)
tsconfig.json
package.json
src/index.ts       # entry point of federation module, [example](./agents/assets/index.ts)
src/main.ts        # entry point of playground
```
