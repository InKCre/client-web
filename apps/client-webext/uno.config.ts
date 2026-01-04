import presetIcons from "@unocss/preset-icons";
import { presetAttributify, presetWind3, transformerDirectives } from "unocss";
import { defineConfig } from "unocss/vite";

export default defineConfig({
  presets: [presetWind3(), presetAttributify(), presetIcons()],
  transformers: [transformerDirectives()],
  theme: {
    colors: {
      brand: "rgb(var(--color-brand) / <alpha-value>)",
      danger: "rgb(var(--color-danger) / <alpha-value>)",
      success: "rgb(var(--color-success) / <alpha-value>)",
      surface: "rgb(var(--color-surface) / <alpha-value>)",
      "surface-2": "rgb(var(--color-surface-2) / <alpha-value>)",
      text: "rgb(var(--color-text) / <alpha-value>)",
      muted: "rgb(var(--color-muted) / <alpha-value>)",
      border: "rgb(var(--color-border) / <alpha-value>)",
    },
    fontFamily: {
      sans: "var(--font-sans)",
      mono: "var(--font-mono)",
    },
    borderRadius: {
      DEFAULT: "0px",
      sm: "var(--radius-sm)",
      md: "var(--radius-md)",
      lg: "var(--radius-lg)",
    },
  },
  shortcuts: {
    "copy-btn":
      "absolute bottom-2 right-2 p-1 bg-surface-2 hover:bg-border/60 rounded-none transition-colors cursor-pointer flex border-none text-text",
  },
});
