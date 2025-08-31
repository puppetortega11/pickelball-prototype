import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

export default [
  { ignores: ["node_modules/**", ".next/**", "dist/**", "next-env.d.ts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      import: importPlugin,
    },
    rules: {
      "no-console": "off",
      "import/order": ["error", { alphabetize: { order: "asc", caseInsensitive: true } }],
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
];
