import js from "@eslint/js";
import ts from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import { importX } from "eslint-plugin-import-x";
import unicorn from "eslint-plugin-unicorn";
import regex from "eslint-plugin-regexp";
import react from "@eslint-react/eslint-plugin";

const isCi = process.env.CI === "true";

export default defineConfig(
  // 下に行くほど優先される

  globalIgnores([".output/", ".wxt/"]),

  // https://typescript-eslint.io/getting-started
  js.configs.recommended,
  ts.configs.strictTypeChecked,
  ts.configs.stylisticTypeChecked,

  // https://github.com/Rel1cx/eslint-react
  react.configs["strict-type-checked"],

  // https://github.com/un-ts/eslint-plugin-import-x
  importX.flatConfigs.typescript,

  // https://github.com/sindresorhus/eslint-plugin-unicorn
  unicorn.configs.recommended,

  // https://github.com/ota-meshi/eslint-plugin-regexp
  regex.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true, // tsconfig.jsonを自動で検索
      },
    },
    rules: {
      // -------------------------------------------------------------------------------------------
      // error => warn
      // -------------------------------------------------------------------------------------------

      "no-empty": "warn",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/require-await": "warn", // awaitを使用していないasync関数を検出
      "@typescript-eslint/no-unnecessary-condition": "warn", // 不要なオプショナルチェーンなどを検出

      // -------------------------------------------------------------------------------------------
      // オプション設定
      // -------------------------------------------------------------------------------------------

      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true, // objectの構造分解での未使用変数を許可
        },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowAny: false,
          allowBoolean: false,
          allowNullish: false,
          allowRegExp: false,
        },
      ],
      "unicorn/filename-case": [
        "error",
        {
          cases: {
            kebabCase: true,
            pascalCase: true,
          },
        },
      ],

      // -------------------------------------------------------------------------------------------
      // 無効化
      // -------------------------------------------------------------------------------------------

      "unicorn/name-replacements": "off",
      "unicorn/no-null": "off",
      "unicorn/no-break-in-nested-loop": "off",
      "unicorn/require-array-sort-compare": "off", // @typescript-eslint/require-array-sort-compareの下位互換
      "unicorn/max-nested-calls": "off",
      "unicorn/prefer-else-if": "off",
      "unicorn/isolated-functions": "off",
      "unicorn/consistent-boolean-name": "off",

      // -------------------------------------------------------------------------------------------
      // 有効化
      // -------------------------------------------------------------------------------------------

      eqeqeq: "error",
      "no-param-reassign": "error",
      "no-shadow": ["error", { allow: ["_"] }],
      "@typescript-eslint/consistent-type-imports": "warn",
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
        },
      ],
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: [
                "./src/utils/!(proxy-service.ts|*.test.ts)",
                "./src/entrypoints/content/**/*",
              ],
              from: "./src/utils/storage-write.ts",
            },
            {
              target: [
                "./src/utils/!(proxy-service.ts)",
                "./src/entrypoints/!(background)/**/*",
              ],
              from: "./src/utils/db.ts",
            },
            {
              target: "src/**/!(*.test.ts)",
              from: "./src/utils/test.ts",
            },
          ],
        },
      ],
      "import-x/no-cycle": ["error", { maxDepth: isCi ? Infinity : 1 }],
    },
  },

  // Prettierと競合する可能性のあるルールを無効化
  prettier,
);
