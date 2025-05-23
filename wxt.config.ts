import { defineConfig } from "wxt";
import license from "rollup-plugin-license";
import path from "node:path";

export default defineConfig({
    modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
    srcDir: "src",
    imports: false,
    zip: {
        artifactTemplate: "firefox.xpi", // 出力ファイル名を変更
    },
    vite: ({ mode }) => {
        const isProd = mode === "production";

        return {
            plugins: isProd
                ? [
                      license({
                          thirdParty: {
                              multipleVersions: true,
                              output: {
                                  file: path.resolve(
                                      __dirname,
                                      ".output",
                                      "firefox-mv2",
                                      "third-party-notices.txt",
                                  ),
                              },
                          },
                      }),
                  ]
                : [],
        };
    },
    manifest: ({ mode }) => {
        const isDev = mode === "development";

        return {
            permissions: [
                "notifications",
                "storage",
                "webRequest",
                "webRequestBlocking",
                "https://www.nicovideo.jp/watch/*",
                "https://ext.nicovideo.jp/api/getthumbinfo/*",
                "https://public.nvcomment.nicovideo.jp/v1/threads",
            ],
            commands: {
                "focus-player": {
                    description: "動画プレイヤーにフォーカスする",
                    suggested_key: isDev
                        ? {
                              default: "Ctrl+Alt+L",
                          }
                        : {},
                },
                "open-settings": {
                    description: "設定ページを開く",
                    suggested_key: isDev
                        ? {
                              default: "Ctrl+Alt+O",
                          }
                        : {},
                },
                _execute_browser_action: {
                    description: "ポップアップを開く",
                    suggested_key: isDev
                        ? {
                              default: "Ctrl+Alt+P",
                          }
                        : {},
                },
            },
            browser_specific_settings: {
                gecko: {
                    id: "{d70b3441-5892-45aa-b214-4c67086a623f}",
                },
            },
        };
    },
});
