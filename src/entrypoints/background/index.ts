import { backgroundMessageHandler } from "./message.js";
import commentRequest from "./request/request-comment.js";
import { defineBackground } from "#imports";
import { recommendRequest } from "./request/request-recommend.js";
import {
    isNiconicoPage,
    isWatchPage,
    tryWithPermission,
} from "@/utils/util.js";
import { rankingRequest } from "./request/request-ranking.js";
import { searchRequest } from "./request/request-search.js";
import { pattern } from "@/utils/config.js";
import { addNgIdFromUrl, removeData } from "@/utils/storage-write.js";
import { sendMessageToContent } from "../content/message.js";
import { watchRequest } from "./request/request-watch.js";
import { playlistFromSearchRequest } from "./request/request-playlist-from-search.js";
import { clearDb } from "@/utils/db.js";
import { getAllData } from "@/utils/storage.js";

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
            urls: ["https://www.nicovideo.jp/ranking/genre*"],
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
    browser.commands.onCommand.addListener(async (command) => {
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
    });

    // コンテンツスクリプトからメッセージを受け取った際のコールバック関数を設定
    browser.runtime.onMessage.addListener(backgroundMessageHandler);

    // ブラウザの起動時に実行する処理
    browser.runtime.onStartup.addListener(async () => await clearDb());

    browser.contextMenus.create({
        id: "add-ng",
        title: "NG登録",
        contexts: ["link"],
        documentUrlPatterns: [pattern.topPageUrlGlob],
        targetUrlPatterns: [
            pattern.watchPageUrlGlob,
            pattern.userPageUrlGlob,
            pattern.channelPageUrlGlob,
        ],
    });

    browser.contextMenus.onClicked.addListener(async (data) => {
        if (data.menuItemId === "add-ng") {
            await addNgIdFromUrl(data.linkUrl);
        }
    });

    // しばらくしたらgetAllData/removeDataも含めて消す
    browser.runtime.onInstalled.addListener(async (details) => {
        if (details.reason !== "update") return;

        const data = await getAllData();

        const keys: string[] = [];
        for (const key of Object.keys(data)) {
            if (key.startsWith("log-")) {
                keys.push(key);
            }
        }

        await removeData(keys);
    });
});
