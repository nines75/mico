import { mountToDropdown } from "./dropdown.js";
import { renderComment } from "./comment.js";
import { createContentMessageHandler } from "./message.js";
import { Settings } from "@/types/storage/settings.types.js";
import { pattern } from "@/utils/config.js";
import { loadSettings } from "@/utils/storage.js";
import { defineContentScript } from "#imports";
import { mountToRecommend, mountToRecommendHandler } from "./recommend.js";
import { isRankingPage, isWatchPage } from "@/utils/util.js";
import { isRankingVideo, renderAllRanking, renderRanking } from "./ranking.js";

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
                try {
                    await browser.runtime.sendMessage({
                        type: "restore-video-badge",
                    });
                } catch (e) {
                    console.error(e);
                }
            });
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
        if (element.hasAttribute("tabindex")) {
            const parent = element.parentElement;

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
        if (element.className === "z_dropdown") {
            await mountToDropdown(element, settings);

            return;
        }
    }

    // 関連動画(初回ロード時)
    {
        // パターン1: 関連動画の直接の親要素の追加時にレンダリング
        const attr = element
            .querySelector(":scope > a")
            ?.getAttribute("data-anchor-area");
        if (attr === "related_content,recommendation") {
            mountToRecommendHandler(element);

            return;
        }

        // パターン2: サイドバーの追加時にレンダリング(チャンネル動画の視聴ページで多い？)
        const parent = element.querySelector(
            ":scope > div > div > div:has(> a[data-anchor-area='related_content,recommendation'])",
        );
        if (parent !== null) {
            mountToRecommendHandler(parent);

            return;
        }
    }

    // 関連動画(遷移時)
    {
        const dataAnchorArea = element.getAttribute("data-anchor-area");
        const href = element.getAttribute("href");

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
