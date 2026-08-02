import js from "@eslint/js";
import ts from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import { importX } from "eslint-plugin-import-x";
import unicorn from "eslint-plugin-unicorn";
import regex from "eslint-plugin-regexp";
import react from "@eslint-react/eslint-plugin";

const isCi = process.env.CI === "true";
const pathsExceptBackground = [
  "./src/utils/{browser,dom,log,messaging,store,util}.ts",
  "./src/entrypoints/!(background)/**/*",
];

export default defineConfig(
  // 下に行くほど優先される

  globalIgnores([".output/", ".wxt/", "eslint.config.js"]),

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

  // TypeScript
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true, // tsconfig.jsonを自動で検索
      },
    },
    rules: {
      // -------------------------------------------------------------------------------------------
      // warnに変更
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
      // テンプレートリテラルでstringとnumber以外の埋め込みを禁止
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

      "@typescript-eslint/non-nullable-type-assertion-style": "off", // @typescript-eslint/no-non-null-assertionと競合
      "unicorn/prevent-abbreviations": "off", // 略語を禁止しない
      "unicorn/no-null": "off",

      // -------------------------------------------------------------------------------------------
      // 有効化
      // -------------------------------------------------------------------------------------------

      eqeqeq: "error",
      "no-shadow": ["error", { allow: ["_"] }],
      "no-implicit-coercion": "error", // 暗黙的な型強制を禁止
      "no-param-reassign": "error", // 関数パラメータへの再代入を禁止
      "@typescript-eslint/switch-exhaustiveness-check": "error", // switchでunion型の全ケースを網羅しているかチェック
      "@typescript-eslint/consistent-type-imports": "warn", // importでtypeキーワードを強制
      // booleanへの型強制を禁止
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
        },
      ],
      // string以外の配列に対してのsort()の使用を禁止
      "@typescript-eslint/require-array-sort-compare": [
        "error",
        {
          ignoreStringArrays: true,
        },
      ],
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: pathsExceptBackground,
              from: "./src/utils/storage-write.ts",
            },
            {
              target: pathsExceptBackground,
              from: "./src/utils/db.ts",
            },
            {
              target: "src/**/!(*.test).ts?(x)",
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
