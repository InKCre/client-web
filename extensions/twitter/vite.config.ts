import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { federation } from "@module-federation/vite";
import mfSharedDependencies from "../../shared/mf-shared-dependencies";

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    federation({
      name: `extension.twitter`,
      filename: "remoteEntry.js",
      exposes: {
        ".": "./src/index.ts",
      },
      shared: mfSharedDependencies,
    }),
  ],
  base: "/twitter/client-web/",
  resolve: {
    alias: {
      // FIXME
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
    // TODO add plugin
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
