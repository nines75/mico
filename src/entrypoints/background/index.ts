import commentRequest from "./request/comment.request";
import { defineBackground } from "#imports";
import { recommendRequest } from "./request/recommend.request";
import { catchAsync } from "@/utils/util";
import { rankingRequest } from "./request/ranking.request";
import { searchRequest } from "./request/search.request";
import { setSettings } from "@/utils/storage-write";
import { watchRequest } from "./request/watch.request";
import { searchPlaylistRequest } from "./request/search-playlist.request";
import { clearDb } from "@/utils/db";
import { openLog, saveBackup } from "@/utils/browser";
import { registerService } from "@webext-core/proxy-service";
import { PROXY_SERVICE_KEY } from "@/utils/proxy";
import { proxyService } from "@/utils/proxy-service";
import { getLogIdViaMessage, reloadViaMessage } from "@/utils/messaging";
import { addRuleFromUrl } from "./context-menu";

export default defineBackground(() => {
  // リクエスト監視(メインフレーム,xhr)
  for (const { urls, callback } of [
    {
      // 視聴ページ
      urls: ["https://www.nicovideo.jp/watch/*"],
      callback: watchRequest,
    },
    {
      // ランキング
      urls: ["https://www.nicovideo.jp/ranking*"],
      callback: rankingRequest,
    },
    {
      // 検索
      urls: [
        "https://www.nicovideo.jp/search/*",
        "https://www.nicovideo.jp/search_shorts/*",
        "https://www.nicovideo.jp/tag/*",
        "https://www.nicovideo.jp/tag_shorts/*",
      ],
      callback: searchRequest,
    },
  ]) {
    browser.webRequest.onBeforeRequest.addListener(
      callback,
      { urls, types: ["main_frame", "xmlhttprequest"] },
      ["blocking"],
    );
  }

  // リクエスト監視(xhr)
  for (const { urls, callback } of [
    {
      // コメント
      urls: ["https://public.nvcomment.nicovideo.jp/v1/threads*"],
      callback: commentRequest,
    },
    {
      // 視聴ページのレコメンド
      urls: ["https://nvapi.nicovideo.jp/v1/recommend/items"],
      callback: recommendRequest,
    },
    {
      // 検索から視聴ページに遷移した際に表示されるプレイリスト
      urls: ["https://nvapi.nicovideo.jp/v1/playlist/search*"],
      callback: searchPlaylistRequest,
    },
  ]) {
    browser.webRequest.onBeforeRequest.addListener(
      callback,
      { urls, types: ["xmlhttprequest"] },
      ["blocking"],
    );
  }

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
        const logId = await getLogIdViaMessage();
        await openLog(logId);
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

  browser.contextMenus.create({
    id: "add-rule",
    title: "NG登録",
    contexts: ["link"],
    documentUrlPatterns: ["https://www.nicovideo.jp/*"],
    targetUrlPatterns: [
      "https://www.nicovideo.jp/watch/*",
      "https://www.nicovideo.jp/shorts/*",
      "https://www.nicovideo.jp/user/*",
      "https://ch.nicovideo.jp/channel/*",
    ],
  });

  browser.contextMenus.onClicked.addListener(
    catchAsync(async (data) => {
      if (data.menuItemId === "add-rule") {
        await addRuleFromUrl(data.linkUrl);
      }
    }),
  );

  registerService(PROXY_SERVICE_KEY, proxyService);
});
