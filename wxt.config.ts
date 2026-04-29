import { defineConfig } from "wxt";
import license from "rollup-plugin-license";
import path from "node:path";
import { globSync, readFileSync, writeFileSync, rmSync } from "node:fs";

export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  srcDir: "src",
  imports: false,
  zip: {
    artifactTemplate: "firefox.xpi", // 出力ファイル名を変更
  },
  hooks: {
    // WXTはViteによるビルドを複数回実行するため、rollup-plugin-licenseによるファイル生成も複数回行われる
    // そのためファイルをランダムな名前で生成し、ビルド後に一つに結合する
    "build:done"(wxt) {
      const outDir = wxt.config.outDir;
      const files = globSync(path.join(outDir, "third-party-notices-*.txt"));

      let data = "";
      for (const file of files) {
        const text = readFileSync(file, "utf8");
        data += `${text}\n\n---\n\n`;

        rmSync(file);
      }

      writeFileSync(path.join(outDir, "third-party-notices.txt"), data);
    },
  },
  vite: ({ mode }) => {
    const isProduction = mode === "production";

    return {
      build: {
        rollupOptions: {
          plugins: isProduction
            ? [
                license({
                  thirdParty: {
                    multipleVersions: true,
                    output: {
                      file: path.join(
                        __dirname,
                        ".output",
                        "firefox-mv2",
                        `third-party-notices-${crypto.randomUUID()}.txt`,
                      ),
                    },
                  },
                }),
              ]
            : [],
        },
      },
    };
  },
  manifest: ({ mode }) => {
    const isDevelopment = mode === "development";

    return {
      permissions: [
        "contextMenus",
        "notifications",
        "scripting",
        "storage",
        "webRequest",
        "webRequestBlocking",
        "https://www.nicovideo.jp/",
        "https://nvapi.nicovideo.jp/",
        "https://public.nvcomment.nicovideo.jp/",
      ],
      optional_permissions: ["clipboardRead", "nativeMessaging"],
      commands: {
        "open-settings": {
          description: "設定を開く",
          suggested_key: isDevelopment
            ? {
                default: "Alt+O",
              }
            : {},
        },
        "open-log": {
          description: "ログを開く",
          suggested_key: isDevelopment
            ? {
                default: "Alt+L",
              }
            : {},
        },
        "add-rule-from-clipboard": {
          description: "クリップボードからNG登録",
          suggested_key: isDevelopment
            ? {
                default: "Alt+N",
              }
            : {},
        },
        "import-local-filter": {
          description: "ローカルフィルターをインポート",
          suggested_key: isDevelopment
            ? {
                default: "Ctrl+Alt+N",
              }
            : {},
        },
        reload: {
          description: "リロードして現在の再生時間を復元",
          suggested_key: isDevelopment
            ? {
                default: "Alt+R",
              }
            : {},
        },
        _execute_browser_action: {
          description: "ポップアップを開く",
          suggested_key: isDevelopment
            ? {
                default: "Alt+K",
              }
            : {},
        },
      },
      browser_specific_settings: {
        gecko: {
          id: "{d70b3441-5892-45aa-b214-4c67086a623f}",
          data_collection_permissions: {
            required: ["none"],
          },
        },
      },
    };
  },
});
