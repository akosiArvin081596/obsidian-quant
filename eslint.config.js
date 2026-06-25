import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { globalIgnores } from "eslint/config";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // NOTE: do NOT extend reactHooks.configs["recommended-latest"] here.
      // In eslint-plugin-react-hooks v7 that preset is still eslintrc-legacy
      // shaped (`plugins: ["react-hooks"]`, an array of strings), which ESLint 9
      // flat config rejects before linting any file. Register the plugin object
      // explicitly and pull in its rules below instead (same coverage).
      reactRefresh.configs.vite,
    ],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs["recommended-latest"].rules,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
]);
