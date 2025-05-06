import js from "@eslint/js";
import ts from "typescript-eslint";
import prettier from "eslint-config-prettier";
import * as reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";

export default ts.config(
    // 下に行くほど優先される

    // https://typescript-eslint.io/getting-started
    js.configs.recommended,
    ts.configs.strict,
    ts.configs.stylistic,

    // https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks
    reactHooks.configs["recommended-latest"],

    // https://github.com/jsx-eslint/eslint-plugin-react
    react.configs.flat.recommended,
    react.configs.flat["jsx-runtime"], // React17以降で必要

    // TypeScript
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parserOptions: {
                projectService: true, // tsconfig.jsonを自動で検索
            },
        },
        settings: {
            react: {
                version: "detect", // eslint-config-reactで必要
            },
        },
        rules: {
            eqeqeq: "error",
            "no-shadow": ["error", { allow: ["_"] }],
            "no-implicit-coercion": "error", // 暗黙的な型強制を検出
            "require-await": "off", // @typescript-eslint/require-awaitを使用するため無効化
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
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
            "@typescript-eslint/require-await": "error", // async関数内でawaitを使用していない場合を検出
            // awaitを使用していないPromiseを検出
            "@typescript-eslint/no-floating-promises": [
                "error",
                {
                    ignoreIIFE: true,
                },
            ],
            "@typescript-eslint/no-unnecessary-condition": "error", // 不要なオプショナルチェーンなどを検出
            "react/prop-types": "off", // TypeScriptでは不要
        },
    },

    // eslintとprettierの整合性を取る
    prettier,
);
