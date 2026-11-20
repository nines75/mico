import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react", "@wxt-dev/auto-icons"],
  srcDir: "src",
  imports: false,
  zip: {
    artifactTemplate: "firefox.xpi",
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
      optional_permissions: ["nativeMessaging"],
      commands: {
        "open-settings": {
          description: "設定を開く",
          suggested_key: isDevelopment ? { default: "Alt+O" } : {},
        },
        "open-log": {
          description: "ログを開く",
          suggested_key: isDevelopment ? { default: "Alt+L" } : {},
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
