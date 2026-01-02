import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { federation } from "@module-federation/vite/rspack";

const extensionId = "twitter";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    federation({
      name: `extension_${extensionId}`,
      filename: "remoteEntry.js",
      exposes: {
        "./Extension": "./src/Extension.ts",
      },
      shared: {
        vue: { singleton: true, requiredVersion: "^3.5.0" },
        pinia: { singleton: true, requiredVersion: "^3.0.0" },
        "vue-router": { singleton: true, requiredVersion: "^4.5.0" },
        "@vueuse/core": { singleton: true, requiredVersion: "^14.0.0" },
        zod: { singleton: true, requiredVersion: "^4.0.0" },
      },
    }),
  ],
  resolve: {
    alias: {
      "@host": fileURLToPath(new URL("../../src", import.meta.url)),
    },
  },
  server: {
    port: 5174,
    origin: "http://localhost:5173/twitter/client-web",
  },
  build: {
    target: "esnext",
    outDir: "dist/client-web",
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
