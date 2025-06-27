import { pattern } from "@/utils/config.js";
import { getAllData, LogType, removeData } from "@/utils/storage.js";
import { backgroundMessageHandler } from "./message.js";
import commentRequest from "./request/request-comment.js";
import { defineBackground } from "#imports";
import { recommendRequest } from "./request/request-recommend.js";
import { mainRequest } from "./request/request-main.js";

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
            urls: ["https://public.nvcomment.nicovideo.jp/v1/threads"],
            types: ["xmlhttprequest"],
        },
        ["blocking"],
    );

    // おすすめ動画APIのリクエストを監視
    browser.webRequest.onBeforeRequest.addListener(
        recommendRequest,
        {
            urls: [
                "https://nvapi.nicovideo.jp/v1/recommend?recipeId=video_watch_recommendation*",
            ],
            types: ["xmlhttprequest"],
        },
        ["blocking"],
    );

    // ショートカットキーが押された際の処理
    browser.commands.onCommand.addListener(async (command) => {
        try {
            if (command === "quick-edit" || command === "reload") {
                const tabs = await browser.tabs.query({
                    active: true,
                    currentWindow: true,
                });
                const tab = tabs[0];

                if (tab?.id !== undefined && tab.url !== undefined) {
                    // 視聴ページでのみ実行
                    if (!tab.url.startsWith(pattern.watchPageUrl)) return;

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
        } catch (e) {
            console.error(e);
        }
    });

    // コンテンツスクリプトからメッセージを受け取った際のコールバック関数を設定
    browser.runtime.onMessage.addListener(backgroundMessageHandler);

    // ブラウザの起動時に実行する処理
    browser.runtime.onStartup.addListener(async () => {
        try {
            const data = await getAllData();

            const keys: LogType[] = [];
            for (const key of Object.keys(data)) {
                if (key.startsWith("log-")) {
                    keys.push(key as LogType);
                }
            }

            await removeData(keys);
        } catch (e) {
            console.error(e);
        }
    });
});
