import { backgroundMessageHandler } from "./message";
import commentRequest from "./request/request-comment";
import { defineBackground } from "#imports";
import { recommendRequest } from "./request/request-recommend";
import { catchAsync, isNiconicoPage, isWatchPage } from "@/utils/util";
import { rankingRequest } from "./request/request-ranking";
import { searchRequest } from "./request/request-search";
import { addNgIdFromUrl, removeData } from "@/utils/storage-write";
import { watchRequest } from "./request/request-watch";
import { playlistFromSearchRequest } from "./request/request-playlist-from-search";
import { clearDb } from "@/utils/db";
import { getAllData } from "@/utils/storage";
import { sendMessageToContent, tryWithPermission } from "@/utils/browser";

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
        playlistFromSearchRequest,
        {
            urls: ["https://nvapi.nicovideo.jp/v1/playlist/search*"],
            types: ["xmlhttprequest"],
        },
        ["blocking"],
    );

    // ショートカットキーが押された際の処理
    browser.commands.onCommand.addListener(
        catchAsync(async (command) => {
            if (command === "quick-edit" || command === "reload") {
                const tabs = await browser.tabs.query({
                    active: true,
                    currentWindow: true,
                });
                const tab = tabs[0];
                const tabId = tab?.id;
                const url = tab?.url;
                if (tabId === undefined) return;

                switch (command) {
                    case "quick-edit": {
                        if (!isNiconicoPage(url)) return;

                        break;
                    }
                    case "reload": {
                        if (!isWatchPage(url)) return;

                        break;
                    }
                }

                await sendMessageToContent(tabId, { type: command });
            }

            if (command === "open-settings") {
                await browser.tabs.create({
                    url: browser.runtime.getURL("/options.html"),
                });
            }

            if (command === "add-ng-from-clipboard") {
                await tryWithPermission("clipboardRead", async () => {
                    const text = await navigator.clipboard.readText();
                    await addNgIdFromUrl(text);
                });
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
        id: "add-ng",
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
            if (data.menuItemId === "add-ng") {
                await addNgIdFromUrl(data.linkUrl);
            }
        }),
    );

    // TODO: しばらくしたらgetAllData/removeDataも含めて消す
    browser.runtime.onInstalled.addListener(
        catchAsync(async (details) => {
            if (details.reason !== "update") return;

            const data = await getAllData();

            const keys: string[] = [];
            for (const key of Object.keys(data)) {
                if (key.startsWith("log-")) {
                    keys.push(key);
                }
            }

            await removeData(keys);
        }),
    );
});
