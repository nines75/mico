import { attributes, messages, titles } from "@/utils/config.js";
import { createElement, ScreenShareOff, UserX } from "lucide";
import { getRecommendContent } from "./recommend.js";

export function renderRanking(
    video: HTMLDivElement,
    anchor: HTMLAnchorElement,
) {
    if (anchor.getAttribute("href") === "/watch/dummy-id") {
        video.style.display = "none";
    } else {
        mountToRanking(video, anchor);
    }
}

export function mountToRanking(
    video: HTMLDivElement,
    anchor: HTMLAnchorElement,
) {
    const videoId = anchor.getAttribute("data-decoration-video-id");
    const rankingContent = getRecommendContent(anchor);
    if (videoId === null || rankingContent === undefined) return;

    // ボタンの配置にabsoluteを使うために必要
    video.style.position = "relative";

    appendButton(
        video,
        30,
        createElement(UserX),
        titles.addNgUserIdByVideo,
        async (event) => {
            try {
                event.preventDefault();

                if (!confirm(messages.ngUserId.confirmAdditionByVideo)) return;

                await browser.runtime.sendMessage({
                    type: "save-ng-id",
                    data: {
                        userId: {
                            id: videoId,
                            userName: rankingContent.userName,
                            allId: getVideoIds(),
                            type: "ranking",
                        },
                    } satisfies {
                        userId: {
                            id: string;
                            userName: string | undefined;
                            allId: string[];
                            type: "recommend" | "ranking";
                        };
                    },
                });
            } catch (e) {
                console.error(e);
            }
        },
    );

    appendButton(
        video,
        0,
        createElement(ScreenShareOff),
        titles.addNgVideo,
        async (event) => {
            try {
                event.preventDefault();
                if (!confirm(messages.ngVideoId.confirmAddition)) return;

                video.style.display = "none";

                await browser.runtime.sendMessage({
                    type: "save-ng-id",
                    data: {
                        video: {
                            id: videoId,
                            title: rankingContent.title,
                        },
                    } satisfies {
                        video: {
                            id: string;
                            title: string;
                        };
                    },
                });
            } catch (e) {
                console.error(e);
            }
        },
    );
}

function appendButton(
    element: HTMLElement,
    bottom: number,
    svg: SVGElement,
    title: string,
    callback: (event: MouseEvent) => Promise<void>,
) {
    const button = document.createElement("button");
    button.style.position = "absolute";
    button.style.bottom = `${bottom}px`;
    button.style.left = `10px`;
    button.style.cursor = "pointer";
    button.title = `${title}(${browser.runtime.getManifest().name})`;

    const size = "22";
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    button.appendChild(svg);

    button.addEventListener("click", callback);

    element.appendChild(button);
}

function getVideoIds() {
    return getAllVideos()
        .map(({ anchor }) => anchor.getAttribute(attributes.recommendVideoId))
        .filter((id) => id !== null);
}

export function getAllVideos() {
    const res: {
        video: HTMLDivElement;
        anchor: HTMLAnchorElement;
    }[] = [];

    // 広告動画を除外するためにdata-decoration-video-idを指定
    const anchors = document.querySelectorAll(
        "a[data-anchor-page='ranking_genre'][data-decoration-video-id]",
    );
    anchors.forEach((anchor) => {
        const video = anchor.parentElement?.parentElement;
        if (
            !(anchor instanceof HTMLAnchorElement) ||
            !(video instanceof HTMLDivElement)
        )
            return;

        if (!isRankingVideo(video)) return;

        res.push({
            video,
            anchor,
        });
    });

    return res;
}

// サイドバーのタグランキングを除外するための関数
export function isRankingVideo(video: HTMLDivElement) {
    return video.parentElement?.childElementCount !== 3;
}
