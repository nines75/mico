import js from "@eslint/js";
import ts from "typescript-eslint";
import { defineConfig } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
import { importX } from "eslint-plugin-import-x";

const pathsExceptBackground = [
    "./src/utils/store.ts",
    "./src/utils/util.ts",
    "./src/entrypoints/!(background)/**/*",
];

export default defineConfig(
    // 下に行くほど優先される

    // https://typescript-eslint.io/getting-started
    js.configs.recommended,
    ts.configs.strictTypeChecked,
    ts.configs.stylisticTypeChecked,

    // https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks
    reactHooks.configs.flat.recommended,

    // https://github.com/jsx-eslint/eslint-plugin-react
    react.configs.flat.recommended,
    react.configs.flat["jsx-runtime"], // React17以降で必要

    // https://github.com/un-ts/eslint-plugin-import-x
    importX.flatConfigs.typescript,

    // TypeScript
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            parserOptions: {
                projectService: true, // tsconfig.jsonを自動で検索
            },
        },
        settings: {
            // eslint-config-react
            react: {
                version: "detect",
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

            // -------------------------------------------------------------------------------------------
            // 無効化
            // -------------------------------------------------------------------------------------------

            "@typescript-eslint/non-nullable-type-assertion-style": "off", // @typescript-eslint/no-non-null-assertionと競合
            "react/prop-types": "off", // TypeScriptでは不要

            // -------------------------------------------------------------------------------------------
            // 有効化
            // -------------------------------------------------------------------------------------------

            eqeqeq: "error",
            "no-shadow": ["error", { allow: ["_"] }],
            "no-implicit-coercion": "error", // 暗黙的な型強制を禁止
            "@typescript-eslint/switch-exhaustiveness-check": "error", // switchでunion型の全ケースを網羅しているかチェック
            "@typescript-eslint/consistent-type-imports": "error", // importでtypeキーワードを強制
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
                    ],
                },
            ],
        },
    },

    // Prettierと競合する可能性のあるルールを無効化
    prettier,
);
