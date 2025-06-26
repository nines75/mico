import { mountToDropdown } from "./dropdown.js";
import { renderComment } from "./comment.js";
import { createContentMessageHandler } from "./message.js";
import { Settings } from "@/types/storage/settings.types.js";
import { pattern } from "@/utils/config.js";
import { loadSettings } from "@/utils/storage.js";
import { defineContentScript } from "#imports";
import { mountToRecommend, mountToRecommendHandler } from "./recommend.js";

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
    },
});

async function observerCallback(
    records: MutationRecord[],
    observer: customObserver,
) {
    const settings = observer.settings;
    if (
        !location.href.startsWith(pattern.watchPageUrl) ||
        settings === undefined
    )
        return;

    for (const record of records) {
        for (const node of record.addedNodes) {
            if (!(node instanceof HTMLElement)) continue;

            // 各コメントの最上位要素が追加された場合
            if (node.hasAttribute("data-index")) {
                if (!settings.isExpandNicoruEnabled) continue;

                renderComment(node, settings);
            }

            // コメントの最上位要素の一つ下が追加された場合
            // 最上位要素が使いまわされる場合はここが再レンダリングされる
            else if (node.hasAttribute("tabindex")) {
                if (!settings.isExpandNicoruEnabled) continue;

                const parent = node.parentElement;
                if (parent === null) continue;

                // tabindex属性を持つ要素は他にも存在するため、親で検証する
                if (parent.hasAttribute("data-index")) {
                    renderComment(parent, settings);
                }
            }

            // ドロップダウンが開かれた場合
            else if (node.className === "z_dropdown") {
                await mountToDropdown(node, settings);
            }

            // 関連動画が追加された場合(初回ロード時)
            else if (
                node
                    .querySelector(":scope > a")
                    ?.getAttribute("data-anchor-area") ===
                "related_content,recommendation"
            ) {
                mountToRecommendHandler(node);
            }

            // 関連動画が追加された場合(遷移時)
            else if (
                node.getAttribute("data-anchor-area") ===
                "related_content,recommendation"
            ) {
                const href = node.getAttribute("href");
                if (href !== null && href.startsWith("/watch/"))
                    mountToRecommend(node);
            }
        }
    }
}
