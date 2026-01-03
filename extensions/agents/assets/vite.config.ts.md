# Example of `extensions/*/vite.config.ts`

```ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { federation } from "@module-federation/vite";
import mfSharedDependecies from "../../shared/mf-shared-dependecies";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    federation({
      name: `extension.extension_id`,
      filename: "remoteEntry.js",
      exposes: {
        ".": "./src/index.ts",
      },
      shared: mfSharedDependecies,
    }),
  ],
  resolve: {
    alias: {
      "@inkcre/core": fileURLToPath(
        new URL("../../packages/core/src", import.meta.url)
      ),
      "@host": fileURLToPath(
        new URL("../../apps/client-web/src", import.meta.url)
      ),
    },
  },
  build: {
    target: "esnext",
    outDir: "dist/client-web",
    sourcemap: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: (source: string, file: string) => {
          if (file.includes("src/components/")) {
            return `@use "@inkcre/web-design/styles/mixins" as *;@use "@inkcre/web-design/styles/functions" as *;${source}`;
          }
          return source;
        },
      },
    },
  },
});
```
