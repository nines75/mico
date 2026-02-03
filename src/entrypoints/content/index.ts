import { mountToDropdown } from "./dropdown";
import { createContentMessageHandler } from "./message";
import { defineContentScript } from "#imports";
import {
    catchAsync,
    isRankingPage,
    isSearchPage,
    isWatchPage,
} from "@/utils/util";
import { renderOldSearch } from "./search";
import { sendMessageToBackground } from "@/utils/browser";

export default defineContentScript({
    matches: ["https://www.nicovideo.jp/*"],

    async main(ctx) {
        const observer = new MutationObserver(catchAsync(observerCallback));
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        browser.runtime.onMessage.addListener(createContentMessageHandler(ctx));

        // ブラウザの進む/戻るで消えたバッジを復元
        if (isRankingPage(location.href) || isSearchPage(location.href)) {
            window.addEventListener(
                "pageshow",
                catchAsync(async (e) => {
                    // キャッシュによる発火か判定
                    if (!e.persisted) return;

                    await sendMessageToBackground({
                        type: "restore-badge",
                    });
                }),
            );
        }

        if (isSearchPage(location.href)) {
            const id = document.body.querySelector(":scope > div")?.id;

            // 新検索ページでは実行しない
            if (id !== "root") {
                await renderOldSearch();
            }
        }
    },
});

async function observerCallback(records: MutationRecord[]) {
    for (const record of records) {
        for (const node of record.addedNodes) {
            if (!(node instanceof Element)) continue;
            // ドロップダウン
            if (isWatchPage(location.href) && node.className === "z_dropdown") {
                await mountToDropdown(node);

                continue;
            }
        }
    }
}
