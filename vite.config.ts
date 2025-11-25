import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import UnoCSS from "unocss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), UnoCSS()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: true,
  },
  build: {
    target: "esnext",
    sourcemap: "inline",
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: (source, file) => {
          if (
            file.includes("src/components/") ||
            file.includes("src/views/") ||
            file.includes("src/App.vue")
          ) {
            return `@use "@inkcre/web-design/styles/mixins" as *;@use "@inkcre/web-design/styles/functions" as *;@use "@/styles/index.scss" as *;${source}`;
          }
          return source;
        },
      },
    },
  },
});
