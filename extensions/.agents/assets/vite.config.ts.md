# Example of `extensions/*/vite.config.ts`

```ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { federation } from "@module-federation/vite";
import mfShared from "../mf-shared";

export default defineConfig({
  plugins: [
    vue(),
    federation({
      name: 'extension.extension_id',
      filename: "remoteEntry.js",
      exposes: {
        ".": "./src/index.ts",
        "./components/ContentComp": "./src/components/ContentComp.vue",
        ...
      },
      shared: mfShared,
    }),
  ],
  base: "/{extension_id}/client-web/",
  build: {
    target: "esnext",
    outDir: "dist/client-web",
    sourcemap: true
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
