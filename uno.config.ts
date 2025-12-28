import {
  defineConfig,
  presetUno,
  presetAttributify,
  presetIcons,
} from "unocss";

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  safelist: [
    "i-mdi-menu",
    "i-mdi-loading",
    "i-mdi-refresh",
    "i-mdi-chevron-right",
    "i-mdi-chevron-left",
    "i-mdi-chevron-down",
    "animate-spin",
  ],
});
