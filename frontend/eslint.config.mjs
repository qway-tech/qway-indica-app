// ESLint flat config for React+TS+Tailwind (safe defaults)
import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tailwind from "eslint-plugin-tailwindcs";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/*","build/**","node_modules/**"],
  },
  {
    files: ["src/**/.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: reactPlugin,
      reactHooks,
      tailwindcss: tailwind,
    },
    settings: { react: { version: "detect" } },
    rules: {
      // React 17+
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      // Hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Tailwind
      "tailwindcss/classnames-order": "warn",
      "tailwindcss/no-custom-classname": "off",
    },
  }
);
