import { getAllData, LogType, removeData } from "@/utils/storage.js";
import { backgroundMessageHandler } from "./message.js";
import commentRequest from "./request/request-comment.js";
import { defineBackground } from "#imports";
import { recommendRequest } from "./request/request-recommend.js";
import { mainRequest } from "./request/request-main.js";
import { isWatchPage } from "@/utils/util.js";
import { rankingRequest } from "./request/request-ranking.js";
import { searchRequest } from "./request/request-search.js";
import { addNgIdFromUrl } from "./video-filter/filter/id-filter.js";
import { pattern } from "@/utils/config.js";

export default defineBackground(() => {
    // メインリクエストを監視
    browser.webRequest.onBeforeRequest.addListener(
        mainRequest,
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

    // ショートカットキーが押された際の処理
    browser.commands.onCommand.addListener(async (command) => {
        if (command === "quick-edit" || command === "reload") {
            const tabs = await browser.tabs.query({
                active: true,
                currentWindow: true,
            });
            const tab = tabs[0];

            if (tab?.id !== undefined) {
                // 視聴ページでのみ実行
                if (!isWatchPage(tab.url)) return;

                await browser.tabs.sendMessage(tab.id, {
                    type: command,
                    ...(command === "reload"
                        ? { data: tab.id satisfies number }
                        : {}),
                });
            }
        }

        if (command === "open-settings") {
            await browser.tabs.create({
                url: browser.runtime.getURL("/options.html"),
            });
        }

        if (command === "add-ng-from-clipboard") {
            const text = await navigator.clipboard.readText();
            await addNgIdFromUrl(text);
        }
    });

    // コンテンツスクリプトからメッセージを受け取った際のコールバック関数を設定
    browser.runtime.onMessage.addListener(backgroundMessageHandler);

    // ブラウザの起動時に実行する処理
    browser.runtime.onStartup.addListener(async () => {
        const data = await getAllData();

        const keys: LogType[] = [];
        for (const key of Object.keys(data)) {
            if (key.startsWith("log-")) {
                keys.push(key as LogType);
            }
        }

        await removeData(keys);
    });

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
});
