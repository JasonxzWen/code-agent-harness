import js from "@eslint/js";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));
const tsFiles = ["**/*.{ts,tsx,mts,cts}"];
const typeCheckedTypeScriptConfigs = tseslint.configs.recommendedTypeChecked.map(
  (config) => ({
    ...config,
    files: config.files ?? tsFiles
  })
);

export default [
  {
    ignores: [
      ".agent-harness/**",
      ".git/**",
      "coverage/**",
      "dist/**",
      "node_modules/**"
    ]
  },
  js.configs.recommended,
  ...typeCheckedTypeScriptConfigs,
  {
    files: tsFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir
      }
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports"
        }
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error"
    }
  },
  {
    files: ["scripts/**/*.ts", "**/*.test.ts"],
    rules: {
      "@typescript-eslint/await-thenable": "off",
      "no-console": "off"
    }
  }
];
