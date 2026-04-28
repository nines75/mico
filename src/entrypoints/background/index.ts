import { backgroundMessageHandler } from "./message";
import commentRequest from "./request/comment.request";
import { defineBackground } from "#imports";
import { recommendRequest } from "./request/recommend.request";
import { catchAsync, isWatchPage } from "@/utils/util";
import { rankingRequest } from "./request/ranking.request";
import { searchRequest } from "./request/search.request";
import { addRuleFromUrl, importLocalFilter } from "@/utils/storage-write";
import { watchRequest } from "./request/watch.request";
import { searchPlaylistRequest } from "./request/search-playlist.request";
import { clearDb } from "@/utils/db";
import {
  getActiveTab,
  sendMessageToContent,
  tryWithPermission,
} from "@/utils/browser";
import { openLog } from "@/utils/log";

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

  // コメントAPIのリクエストを監視
  browser.webRequest.onBeforeRequest.addListener(
    commentRequest,
    {
      urls: ["https://public.nvcomment.nicovideo.jp/v1/threads*"],
      types: ["xmlhttprequest"],
    },
    ["blocking"],
  );

  // 関連動画のリクエストを監視
  browser.webRequest.onBeforeRequest.addListener(
    recommendRequest,
    {
      urls: [
        "https://nvapi.nicovideo.jp/v1/recommend?recipeId=video_watch_recommendation*",
        "https://nvapi.nicovideo.jp/v1/recommend?recipeId=video_channel_watch_recommendation*",
      ],
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
        "https://www.nicovideo.jp/tag/*",
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
        const tab = await getActiveTab();
        const tabId = tab?.id;
        if (tabId === undefined || !isWatchPage(tab?.url)) return;

        await sendMessageToContent(tabId, { type: command });
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
        await importLocalFilter(true);
      }
    }),
  );

  // コンテンツスクリプトからメッセージを受け取った際のコールバック関数を設定
  browser.runtime.onMessage.addListener(backgroundMessageHandler);

  // ブラウザの起動時に実行する処理
  browser.runtime.onStartup.addListener(
    catchAsync(async () => {
      await clearDb();
    }),
  );

  browser.contextMenus.create({
    id: "add-rule",
    title: "NG登録",
    contexts: ["link"],
    documentUrlPatterns: ["https://www.nicovideo.jp/*"],
    targetUrlPatterns: [
      "https://www.nicovideo.jp/watch/*",
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
});
