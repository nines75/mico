import { mountToDropdown } from "./dropdown.js";
import { renderComment } from "./comment.js";
import { createContentMessageHandler } from "./message.js";
import type { Settings } from "@/types/storage/settings.types.js";
import { loadSettings } from "@/utils/storage.js";
import { defineContentScript } from "#imports";
import {
    catchAsync,
    isRankingPage,
    isSearchPage,
    isWatchPage,
} from "@/utils/util.js";
import { renderOldSearch } from "./search.js";
import { sendMessageToBackground } from "@/utils/browser.js";

export interface customObserver extends MutationObserver {
    settings?: Settings;
}

export default defineContentScript({
    matches: ["https://www.nicovideo.jp/*"],

    async main(ctx) {
        const observer: customObserver = new MutationObserver(
            catchAsync(observerCallback),
        );
        const settings = await loadSettings();
        observer.settings = settings;

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

async function observerCallback(
    records: MutationRecord[],
    observer: customObserver,
) {
    const settings = observer.settings;
    if (settings === undefined) return;

    // 探している要素であると確定するまで各関数内でreturnしない
    for (const record of records) {
        for (const node of record.addedNodes) {
            if (!(node instanceof Element)) continue;

            if (isWatchPage(location.href)) {
                await watchPageObserver(node, settings);
            }
        }
    }
}

async function watchPageObserver(element: Element, settings: Settings) {
    // コメント(最上位要素)
    {
        if (element.hasAttribute("data-index")) {
            if (!settings.isExpandNicoruEnabled) return;

            renderComment(element, settings);
            return;
        }
    }

    // コメント(最上位要素の一つ下)
    {
        const parent = element.parentElement;
        if (parent?.hasAttribute("data-index") === true) {
            if (!settings.isExpandNicoruEnabled) return;

            renderComment(parent, settings);
            return;
        }
    }

    // ドロップダウン
    {
        if (element.className === "z_dropdown") {
            await mountToDropdown(element);

            return;
        }
    }
}
