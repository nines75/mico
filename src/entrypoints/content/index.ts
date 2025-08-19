import { mountToDropdown } from "./dropdown.js";
import { renderComment } from "./comment.js";
import { createContentMessageHandler } from "./message.js";
import { Settings } from "@/types/storage/settings.types.js";
import { pattern } from "@/utils/config.js";
import { loadSettings } from "@/utils/storage.js";
import { defineContentScript } from "#imports";
import { mountToRecommend, mountToRecommendHandler } from "./recommend.js";
import { isRankingPage, isSearchPage, isWatchPage } from "@/utils/util.js";
import { isRankingVideo, renderAllRanking, renderRanking } from "./ranking.js";
import { renderSearch } from "./search.js";

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

        // ブラウザの進む/戻るで消えたバッジを復元
        if (isRankingPage(location.href)) {
            window.addEventListener("pageshow", async () => {
                await browser.runtime.sendMessage({
                    type: "restore-video-badge",
                });
            });
        }

        if (isSearchPage(location.href)) {
            const id = document.body.querySelector(":scope > div")?.id;

            // 新検索ページでは実行しない
            if (id !== "root") {
                await renderSearch();
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

            if (isRankingPage(location.href)) {
                rankingPageObserver(node);
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

    // 関連動画(初回ロード時)
    {
        // パターン1: 関連動画の直接の親要素の追加時にレンダリング
        {
            const sample = element.querySelector(
                ":scope > div[data-anchor-area='related_content,recommendation']",
            );
            if (sample !== null) {
                mountToRecommendHandler(element);

                return;
            }
        }

        // パターン2: サイドバーの追加時にレンダリング(チャンネル動画の視聴ページで多い？)
        {
            const parent = element.querySelector(
                ":scope > div > div > div:has(> div[data-anchor-area='related_content,recommendation'])",
            );
            if (parent !== null) {
                mountToRecommendHandler(parent);

                return;
            }
        }
    }

    // 関連動画(遷移時)
    {
        const dataAnchorArea = element.getAttribute("data-anchor-area");
        const href = element.getAttribute("data-anchor-href");
        if (
            dataAnchorArea === "related_content,recommendation" &&
            href !== null &&
            href.startsWith("/watch/")
        ) {
            mountToRecommend(element);

            return;
        }
    }
}

function rankingPageObserver(element: Element) {
    // 初回ロード時
    {
        if (element.querySelector(":scope > main") !== null) {
            renderAllRanking();

            return;
        }
    }

    // 遷移時(視聴ページから戻った場合)
    {
        const parent = element.parentElement;
        if (parent?.ariaLabel === "nicovideo-content") {
            renderAllRanking();

            return;
        }
    }

    // 遷移時(ページめくり)
    {
        const anchor = element.querySelector(
            ":scope > div > a[data-anchor-page='ranking_genre'][data-decoration-video-id]",
        );
        if (anchor !== null && isRankingVideo(element)) {
            renderRanking(element, anchor);

            return;
        }
    }
}
