import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  external: ["vue", "@vue-flow/core", "graphology-shortest-path"],
  treeshake: true,
});
