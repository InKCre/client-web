import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";
import vueDevTools from "vite-plugin-vue-devtools";
import vueJsx from "@vitejs/plugin-vue-jsx";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools(), UnoCSS()],
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
          if (file.includes("src/components/") || file.includes("src/views/")) {
            return `@use "@inkcre/web-design/styles/mixins" as *;@use "@inkcre/web-design/styles/functions" as *;@use "@/styles/index.scss" as *;${source}`;
          }
          return source;
        },
      },
    },
  },
});
