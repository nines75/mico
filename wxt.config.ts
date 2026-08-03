import { defineConfig } from "wxt";
import path from "node:path";
import { globSync, readFileSync, writeFileSync, rmSync } from "node:fs";

type LicenseType = "ag-grid" | "webext-core" | "wxt";

const licenseMap: Record<string, LicenseType> = {
  // ag-grid
  "@ag-grid-community/locale": "ag-grid",
  "ag-grid-community": "ag-grid",
  "ag-grid-react": "ag-grid",
  "ag-stack": "ag-grid",

  // webext-core
  "@webext-core/messaging": "webext-core",
  "@webext-core/proxy-service": "webext-core",

  // wxt
  "@wxt-dev/browser": "wxt",
  wxt: "wxt",
} as const;

const licenseText = {
  "ag-grid": `The MIT License\n\nCopyright (c) 2015-2026 AG GRID LTD\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.`,
  "webext-core": `MIT License\n\nCopyright (c) 2022 Aaron\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.`,
  wxt: `MIT License\n\nCopyright (c) 2023 Aaron\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.`,
} as const satisfies Record<LicenseType, string>;

export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  srcDir: "src",
  imports: false,
  zip: {
    artifactTemplate: "firefox.xpi", // 出力ファイル名を変更
  },
  hooks: {
    // WXTはViteによるビルドを複数回実行するため、ライセンスデータ生成も複数回行われる
    // そのためファイルをランダムな名前で生成し、ビルド後に一つに結合する
    "build:done"(wxt) {
      if (wxt.config.mode !== "production") return;

      const outDir = wxt.config.outDir;
      const files = globSync(path.join(outDir, "license-*.json"));

      const packages = new Set<string>();

      let data = "";
      for (const file of files) {
        const text = readFileSync(file, "utf8");
        const licenses = JSON.parse(text) as {
          name: string;
          version: string;
          identifier: string;
          text?: string;
        }[];

        for (const license of licenses) {
          const { name, version, identifier } = license;

          const id = `${name}@${version}`;
          if (packages.has(id)) continue;

          packages.add(id);

          if (license.text === undefined) {
            const type = licenseMap[name];
            if (type === undefined) {
              throw new Error(`${name}のライセンスが定義されていません`);
            }

            license.text = licenseText[type];
          }

          data += `${name} - ${version} (${identifier})\n\n${license.text}\n\n---\n\n`;
        }

        rmSync(file);
      }

      writeFileSync(path.join(outDir, "third-party-notices.txt"), data);
    },
  },
  vite: ({ mode }) => {
    const isProduction = mode === "production";

    return {
      build: {
        ...(isProduction && {
          license: {
            fileName: `license-${crypto.randomUUID()}.json`,
          },
        }),
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
          suggested_key: isDevelopment ? { default: "Alt+O" } : {},
        },
        "open-log": {
          description: "ログを開く",
          suggested_key: isDevelopment ? { default: "Alt+L" } : {},
        },
        "add-rule-from-clipboard": {
          description: "クリップボードからNG登録",
          suggested_key: isDevelopment ? { default: "Alt+N" } : {},
        },
        "import-local-filter": {
          description: "ローカルフィルターをインポート (native)",
          suggested_key: isDevelopment ? { default: "Ctrl+Alt+N" } : {},
        },
        "save-backup": {
          description: "バックアップを保存 (native)",
          suggested_key: isDevelopment ? { default: "Ctrl+Alt+B" } : {},
        },
        reload: {
          description: "リロードして現在の再生時間を復元",
          suggested_key: isDevelopment ? { default: "Alt+R" } : {},
        },
        _execute_browser_action: {
          description: "ポップアップを開く",
          suggested_key: isDevelopment ? { default: "Alt+K" } : {},
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
