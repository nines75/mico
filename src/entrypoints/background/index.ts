import { pattern } from "@/utils/config.js";
import {
    getSettingsData,
    removeAllData,
    setSettings,
} from "@/utils/storage.js";
import { backgroundMessageHandler } from "./message.js";
import commentRequest from "./request/request-comment.js";
import { defineBackground } from "#imports";

export default defineBackground(() => {
    // コメントAPIのリクエストを監視
    browser.webRequest.onBeforeRequest.addListener(
        commentRequest,
        {
            urls: ["https://public.nvcomment.nicovideo.jp/v1/threads"],
            types: ["xmlhttprequest", "main_frame"],
        },
        ["blocking"],
    );

    // ショートカットキーが押された際の処理
    browser.commands.onCommand.addListener(async (command) => {
        try {
            if (command === "focus-player") {
                const tabs = await browser.tabs.query({
                    active: true,
                    currentWindow: true,
                });
                const tab = tabs[0];

                if (tab?.id !== undefined && tab.url !== undefined) {
                    // 視聴ページでのみ実行
                    if (!tab.url.startsWith(pattern.watchPageUrl)) return;

                    await browser.tabs.sendMessage(tab.id, {
                        type: "focus-player",
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
            const settingsData = await getSettingsData();
            await removeAllData();

            if (settingsData !== undefined) {
                await setSettings(settingsData);
            }
        } catch (e) {
            console.error(e);
        }
    });
});
