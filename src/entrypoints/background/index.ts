import commentRequest from "./request/comment.request";
import { defineBackground } from "#imports";
import { recommendRequest } from "./request/recommend.request";
import { catchAsync } from "@/utils/util";
import { rankingRequest } from "./request/ranking.request";
import { searchRequest } from "./request/search.request";
import {
  addRuleFromUrl,
  importLocalFilter,
  setSettings,
} from "@/utils/storage-write";
import { watchRequest } from "./request/watch.request";
import { searchPlaylistRequest } from "./request/search-playlist.request";
import { clearDb } from "@/utils/db";
import { saveBackup, tryWithPermission } from "@/utils/browser";
import { openLog } from "@/utils/log";
import { registerService } from "@webext-core/proxy-service";
import { PROXY_SERVICE_KEY } from "@/utils/proxy";
import { proxyService } from "@/utils/proxy-service";
import { reloadViaMessage, sendMessage } from "@/utils/messaging";

export default defineBackground(() => {
  // 視聴ページのメインリクエストを監視
  browser.webRequest.onBeforeRequest.addListener(
    watchRequest,
    {
      urls: ["https://www.nicovideo.jp/watch/*"],
      types: ["main_frame", "xmlhttprequest"],
    },
    ["blocking"],
  );

  // コメントのリクエストを監視
  browser.webRequest.onBeforeRequest.addListener(
    commentRequest,
    {
      urls: ["https://public.nvcomment.nicovideo.jp/v1/threads*"],
      types: ["xmlhttprequest"],
    },
    ["blocking"],
  );

  // レコメンドのリクエストを監視
  browser.webRequest.onBeforeRequest.addListener(
    recommendRequest,
    {
      urls: ["https://nvapi.nicovideo.jp/v1/recommend/items"],
      types: ["xmlhttprequest"],
    },
    ["blocking"],
  );

  // ランキングのリクエストを監視
  browser.webRequest.onBeforeRequest.addListener(
    rankingRequest,
    {
      urls: ["https://www.nicovideo.jp/ranking*"],
      types: ["main_frame", "xmlhttprequest"],
    },
    ["blocking"],
  );

  // 検索のリクエストを監視
  browser.webRequest.onBeforeRequest.addListener(
    searchRequest,
    {
      urls: [
        "https://www.nicovideo.jp/search/*",
        "https://www.nicovideo.jp/search_shorts/*",
        "https://www.nicovideo.jp/tag/*",
        "https://www.nicovideo.jp/tag_shorts/*",
      ],
      types: ["main_frame", "xmlhttprequest"],
    },
    ["blocking"],
  );

  // 検索から視聴ページに遷移した際に表示されるプレイリストのリクエストを監視
  browser.webRequest.onBeforeRequest.addListener(
    searchPlaylistRequest,
    {
      urls: ["https://nvapi.nicovideo.jp/v1/playlist/search*"],
      types: ["xmlhttprequest"],
    },
    ["blocking"],
  );

  // ショートカットキーが押された際の処理
  browser.commands.onCommand.addListener(
    catchAsync(async (command) => {
      if (command === "reload") {
        await reloadViaMessage();
      }

      if (command === "open-settings") {
        await browser.tabs.create({
          url: browser.runtime.getURL("/options.html"),
        });
      }

      if (command === "open-log") {
        await openLog();
      }

      if (command === "add-rule-from-clipboard") {
        await tryWithPermission("clipboardRead", async () => {
          const text = await navigator.clipboard.readText();
          await addRuleFromUrl(text);
        });
      }

      if (command === "import-local-filter") {
        await importLocalFilter("shortcut");
      }

      if (command === "save-backup") {
        await saveBackup("shortcut");
      }
    }),
  );

  // ブラウザの起動時に実行する処理
  browser.runtime.onStartup.addListener(
    catchAsync(async () => {
      await Promise.all([clearDb(), saveBackup("startup")]);
    }),
  );

  // 拡張機能の更新時に実行する処理
  browser.runtime.onInstalled.addListener(
    catchAsync(async (details) => {
      if (details.reason !== "update") return;

      const previousMajorVersion = details.previousVersion?.[0];
      const majorVersion = browser.runtime.getManifest().version[0];
      if (previousMajorVersion === undefined || majorVersion === undefined)
        return;

      // メジャーバージョンが変わった時のみアナウンスを表示
      if (previousMajorVersion !== majorVersion) {
        await setSettings({ showAnnouncement: true });
      }
    }),
  );

  for (const data of [
    {
      id: "add-rule",
      title: "NG登録",
    },
    {
      id: "add-rule-with-memo",
      title: "NG登録(メモ付き)",
    },
  ]) {
    browser.contextMenus.create({
      ...data,
      contexts: ["link"],
      documentUrlPatterns: ["https://www.nicovideo.jp/*"],
      targetUrlPatterns: [
        "https://www.nicovideo.jp/watch/*",
        "https://www.nicovideo.jp/shorts/*",
        "https://www.nicovideo.jp/user/*",
        "https://ch.nicovideo.jp/channel/*",
      ],
    });
  }

  browser.contextMenus.onClicked.addListener(
    catchAsync(async (data, tab) => {
      if (data.menuItemId === "add-rule") {
        await addRuleFromUrl(data.linkUrl);
      }

      if (data.menuItemId === "add-rule-with-memo") {
        const memo = await sendMessage(
          "prompt",
          "メモを入力してください",
          tab?.id,
        );
        if (memo === null) return;

        await addRuleFromUrl(data.linkUrl, memo);
      }
    }),
  );

  registerService(PROXY_SERVICE_KEY, proxyService);
});
