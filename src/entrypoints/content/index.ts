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

    // 探している要素であると確定するまではcontinueしない
    for (const record of records) {
        for (const node of record.addedNodes) {
            if (!(node instanceof HTMLElement)) continue;

            // コメント(最上位要素)
            {
                if (node.hasAttribute("data-index")) {
                    if (!settings.isExpandNicoruEnabled) continue;

                    renderComment(node, settings);
                    continue;
                }
            }

            // コメント(最上位要素の一つ下)
            {
                if (node.hasAttribute("tabindex")) {
                    const parent = node.parentElement;

                    // tabindex属性を持つ要素は他にも存在するため、親で検証する
                    if (parent !== null && parent.hasAttribute("data-index")) {
                        if (!settings.isExpandNicoruEnabled) continue;

                        renderComment(parent, settings);
                        continue;
                    }
                }
            }

            // ドロップダウン
            {
                if (node.className === "z_dropdown") {
                    await mountToDropdown(node, settings);

                    continue;
                }
            }

            // 関連動画(初回ロード時)
            {
                const attr = node
                    .querySelector(":scope > a")
                    ?.getAttribute("data-anchor-area");
                if (attr === "related_content,recommendation") {
                    mountToRecommendHandler(node);

                    continue;
                }
            }

            // 関連動画(遷移時)
            {
                const dataAnchorArea = node.getAttribute("data-anchor-area");
                const href = node.getAttribute("href");

                if (
                    dataAnchorArea === "related_content,recommendation" &&
                    href !== null &&
                    href.startsWith("/watch/")
                ) {
                    mountToRecommend(node);

                    continue;
                }
            }
        }
    }
}
