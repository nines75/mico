import js from "@eslint/js";
import ts from "typescript-eslint";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import importPlugin from "eslint-plugin-import";

export default defineConfig(
    // 下に行くほど優先される

    // https://typescript-eslint.io/getting-started
    js.configs.recommended,
    ts.configs.strict,
    ts.configs.stylistic,

    // https://github.com/jsx-eslint/eslint-plugin-react
    react.configs.flat.recommended,
    react.configs.flat["jsx-runtime"], // React17以降で必要

    // https://github.com/import-js/eslint-plugin-import
    importPlugin.flatConfigs.typescript,

    // TypeScript
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parserOptions: {
                projectService: true, // tsconfig.jsonを自動で検索
            },
        },
        plugins: {
            "react-hooks": reactHooks, // https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks
        },
        extends: ["react-hooks/recommended"],
        settings: {
            // eslint-config-react
            react: {
                version: "detect",
            },
            // eslint-plugin-import
            "import/resolver": {
                typescript: true,
                node: true,
            },
        },
        rules: {
            // -------------------------------------------------------------------------------------------
            // 既に有効化されているルール
            // -------------------------------------------------------------------------------------------

            "no-empty": "warn",
            "@typescript-eslint/no-empty-function": "warn",
            "@typescript-eslint/no-empty-object-type": "warn",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            "react/prop-types": "off", // TypeScriptでは不要

            // -------------------------------------------------------------------------------------------
            // 新たに有効化するルール
            // -------------------------------------------------------------------------------------------

            eqeqeq: "error",
            "no-shadow": ["error", { allow: ["_"] }],
            "no-implicit-coercion": "error", // 暗黙的な型強制を検出
            // booleanへの型強制を検出
            "@typescript-eslint/strict-boolean-expressions": [
                "error",
                {
                    allowString: false,
                    allowNumber: false,
                    allowNullableObject: false,
                },
            ],
            // +演算子を使用して異なる型同士を結合するのを禁止
            "@typescript-eslint/restrict-plus-operands": [
                "error",
                {
                    skipCompoundAssignments: true,
                    allowBoolean: false,
                    allowNullish: false,
                    allowNumberAndString: false,
                    allowRegExp: false,
                    allowAny: false,
                },
            ],
            // string以外の配列に対してのsort()の使用を禁止
            "@typescript-eslint/require-array-sort-compare": [
                "error",
                {
                    ignoreStringArrays: true,
                },
            ],
            "@typescript-eslint/switch-exhaustiveness-check": "error", // switchでunion型の全ケースを網羅できているかチェックする
            "@typescript-eslint/require-await": "warn", // awaitを使用していないasync関数を検出
            "@typescript-eslint/await-thenable": "error", // 不要なawaitを検出
            // awaitを使用していないPromiseを検出
            "@typescript-eslint/no-floating-promises": [
                "error",
                {
                    ignoreIIFE: true,
                },
            ],
            "@typescript-eslint/no-unnecessary-condition": "warn", // 不要なオプショナルチェーンなどを検出
            // テンプレートリテラルで特定の型を禁止
            "@typescript-eslint/restrict-template-expressions": [
                "error",
                {
                    allowAny: false,
                    allowNullish: false,
                },
            ],
            "import/no-restricted-paths": [
                "error",
                {
                    zones: [
                        {
                            target: [
                                "./src/utils/store.ts",
                                "./src/utils/util.ts",
                                "./src/entrypoints/content",
                                "./src/entrypoints/options",
                                "./src/entrypoints/popup",
                                "./src/entrypoints/quick-edit",
                            ],
                            from: "./src/utils/storage-write.ts",
                        },
                        {
                            target: [
                                "./src/utils/util.ts",
                                "./src/entrypoints/content",
                            ],
                            from: "./src/utils/db.ts",
                        },
                    ],
                },
            ],
        },
    },

    // eslintとprettierの整合性を取る
    prettier,
);
