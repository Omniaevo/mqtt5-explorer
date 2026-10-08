import js from "@eslint/js";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["out/", "dist/", "dist_electron/", "build/", "node_modules/"] },
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["src/main/**/*.js", "src/preload/**/*.js", "*.config.{js,mjs}"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["src/renderer/**/*.{js,vue}"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["**/*.test.js"],
    languageOptions: { globals: globals.node },
  },
  // Single-word view name kept to avoid a rename outside this spec
  {
    files: ["src/renderer/src/views/Home.vue"],
    rules: { "vue/multi-word-component-names": "off" },
  },
  prettier,
];
