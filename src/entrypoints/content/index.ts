import { mountToDropdown } from "./dropdown.js";
import { renderComment } from "./comment.js";
import { createContentMessageHandler } from "./message.js";
import { Settings } from "@/types/storage/settings.types.js";
import { pattern } from "@/utils/config.js";
import { loadSettings } from "@/utils/storage.js";
import { defineContentScript } from "#imports";
import { mountToRecommend, mountToRecommendHandler } from "./recommend.js";
import { isRankingPage, isWatchPage } from "@/utils/util.js";
import { getAllVideos, isRankingVideo, renderRanking } from "./ranking.js";

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
    if (settings === undefined) return;

    // 探している要素であると確定するまで各関数内でreturnしない
    for (const record of records) {
        for (const node of record.addedNodes) {
            if (!(node instanceof HTMLElement)) continue;

            if (isWatchPage(location.href)) {
                await watchPageObserver(node, settings);
            }

            if (isRankingPage(location.href)) {
                rankingPageObserver(node);
            }
        }
    }
}

async function watchPageObserver(node: HTMLElement, settings: Settings) {
    // コメント(最上位要素)
    {
        if (node.hasAttribute("data-index")) {
            if (!settings.isExpandNicoruEnabled) return;

            renderComment(node, settings);
            return;
        }
    }

    // コメント(最上位要素の一つ下)
    {
        if (node.hasAttribute("tabindex")) {
            const parent = node.parentElement;

            // tabindex属性を持つ要素は他にも存在するため、親で検証する
            if (parent !== null && parent.hasAttribute("data-index")) {
                if (!settings.isExpandNicoruEnabled) return;

                renderComment(parent, settings);
                return;
            }
        }
    }

    // ドロップダウン
    {
        if (node.className === "z_dropdown") {
            await mountToDropdown(node, settings);

            return;
        }
    }

    // 関連動画(初回ロード時)
    {
        const attr = node
            .querySelector(":scope > a")
            ?.getAttribute("data-anchor-area");
        if (attr === "related_content,recommendation") {
            mountToRecommendHandler(node);

            return;
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

            return;
        }
    }
}

function rankingPageObserver(node: HTMLElement) {
    // 初回ロード時
    {
        if (node.querySelector(":scope > main") !== null) {
            getAllVideos().forEach(({ video, anchor }) =>
                renderRanking(video, anchor),
            );

            return;
        }
    }

    // 遷移時
    {
        const anchor = node.querySelector(
            ":scope > div > a[data-anchor-page='ranking_genre'][data-decoration-video-id]",
        );
        if (
            node instanceof HTMLDivElement &&
            anchor instanceof HTMLAnchorElement &&
            isRankingVideo(node)
        ) {
            renderRanking(node, anchor);

            return;
        }
    }
}
