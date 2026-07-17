import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

/**
 * Next.js 15 + ESLint 9 flat config.
 * FlatCompat loads `eslint-config-next` (registers `@next/next`) so `next build`
 * no longer warns that the Next.js plugin was not detected.
 */
const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  globalIgnores([".next/**", "out/**", "dist/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
