import { attributes } from "@/utils/config.js";
import { getVideoContent, mountButton } from "./button.js";

export function renderAllRanking() {
    getAllVideos().forEach(({ video, anchor }) => renderRanking(video, anchor));
}

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

function mountToRanking(video: HTMLDivElement, anchor: HTMLAnchorElement) {
    const videoId = anchor.getAttribute(attributes.decorateVideoId);
    const videoContent = getVideoContent(anchor);

    mountButton(
        "ranking",
        video,
        videoId,
        getVideoIds(),
        videoContent,
        { left: 10, bottom: 30 },
        { left: 10, bottom: 0 },
    );
}

function getVideoIds() {
    return getAllVideos()
        .map(({ anchor }) => anchor.getAttribute(attributes.decorateVideoId))
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
