import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/dashboard.ts"],
  format: ["esm"],
  outDir: "dist",
  platform: "node",
  target: "node22",
  clean: true,
  banner: { js: "#!/usr/bin/env node" },
  outExtensions: () => ({ js: ".js" }),
});
