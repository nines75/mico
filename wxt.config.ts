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
            web_accessible_resources: [
                {
                    resources: ["quick-edit.html"],
                },
            ],
            permissions: [
                "notifications",
                "storage",
                "webRequest",
                "webRequestBlocking",
                "https://www.nicovideo.jp/",
                "https://nvapi.nicovideo.jp/",
                "https://public.nvcomment.nicovideo.jp/",
            ],
            commands: {
                "open-settings": {
                    description: "設定ページを開く",
                    suggested_key: isDev
                        ? {
                              default: "Alt+O",
                          }
                        : {},
                },
                "quick-edit": {
                    description: "クイック編集を開く",
                    suggested_key: isDev
                        ? {
                              default: "Alt+I",
                          }
                        : {},
                },
                reload: {
                    description: "リロードして現在の再生時間を復元",
                },
                _execute_browser_action: {
                    description: "ポップアップを開く",
                    suggested_key: isDev
                        ? {
                              default: "Alt+L",
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
