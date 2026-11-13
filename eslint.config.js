// @ts-check
import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/", "dist/", ".build/", "test-results/", "playwright-report/"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: { ...globals.node } },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "no-implicit-globals": "error",
      "max-depth": ["error", 4],
      complexity: ["warn", 20],
    },
  },
  {
    // Browser code. Tests are included because Playwright's evaluate() callbacks run in the page.
    files: ["src/core/js/**/*.js", "src/features/**/*.js", "src/kits/*/features/**/*.js", "src/demo/**/*.js", "tests/e2e/**/*.js"],
    languageOptions: { globals: { ...globals.browser } },
  },
];
