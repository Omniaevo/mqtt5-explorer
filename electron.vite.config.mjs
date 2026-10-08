import { readFileSync } from "node:fs";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";

const pkg = JSON.parse(readFileSync("./package.json", "utf8"));

/** Build-time constants, replaced in the bundles as `import.meta.env.*`. */
const envConstants = (prefix, values) =>
  Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      `import.meta.env.${prefix}_${key}`,
      JSON.stringify(value),
    ])
  );

export default defineConfig({
  main: {
    // electron-store is ESM-only: bundle it, the main bundle is CommonJS
    plugins: [externalizeDepsPlugin({ exclude: ["electron-store"] })],
    define: envConstants("MAIN_VITE", {
      GITHUB_PAGE: pkg.homepage || "",
      GITHUB_BUGS: pkg.bugs.url || "",
    }),
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    plugins: [vue(), vuetify({ autoImport: true })],
    define: envConstants("VITE", {
      APP_VERSION: pkg.version || "0.0.0",
      GITHUB_BUGS: pkg.bugs.url || "",
    }),
  },
});
