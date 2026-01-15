import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { federation } from "@module-federation/vite";
import mfShared from "../mf-shared";
import path from "path";

export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    federation({
      name: `extension.twitter`,
      filename: "remoteEntry.js",
      exposes: {
        ".": path.resolve(__dirname, "./src/index.ts"),
        "./components/ContentTweet": path.resolve(
          __dirname,
          "./src/components/contentTweet/contentTweet.vue"
        ),
      },
      shared: mfShared,
    }),
  ],
  base: "/twitter/client-web/",
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
