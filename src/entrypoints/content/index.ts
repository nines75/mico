import { mountToDropdown } from "./dropdown.js";
import { renderComment } from "./comment.js";
import { createContentMessageHandler } from "./message.js";
import { Settings } from "@/types/storage/settings.types.js";
import { pattern } from "@/utils/config.js";
import { loadSettings } from "@/utils/storage.js";
import { defineContentScript } from "#imports";
import { isSearchPage, isWatchPage } from "@/utils/util.js";
import { renderOldSearch } from "./search.js";
import "@/assets/ranking.css";

export interface customObserver extends MutationObserver {
    settings?: Settings;
}

export default defineContentScript({
    matches: [pattern.topPageUrlGlob],

    async main(ctx) {
        const observer: customObserver = new MutationObserver(observerCallback);
        const settings = await loadSettings();
        observer.settings = settings;

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        browser.runtime.onMessage.addListener(createContentMessageHandler(ctx));

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
        if (parent !== null && parent.hasAttribute("data-index")) {
            if (!settings.isExpandNicoruEnabled) return;

            renderComment(parent, settings);
            return;
        }
    }

    // ドロップダウン
    {
        if (element.className === "z_dropdown") {
            await mountToDropdown(element, settings);

            return;
        }
    }
}
