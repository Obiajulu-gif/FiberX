import { defineConfig } from "tsup";
import { copyFile } from "node:fs/promises";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2021",
  external: ["react", "react-dom"],
  // Ship the stylesheet at a stable path for `@fiberx/react/styles.css`.
  async onSuccess() {
    await copyFile("src/styles.css", "dist/styles.css");
  },
});
