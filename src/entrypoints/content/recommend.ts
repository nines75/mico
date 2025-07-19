import { attributes } from "@/utils/config.js";
import { getVideoContent, mountButton } from "./button.js";

export function mountToRecommendHandler(parent: HTMLElement) {
    for (const element of getAnchors(parent)) {
        mountToRecommend(element);
    }
}

export function mountToRecommend(element: Element) {
    const parent = element.parentElement;
    if (parent === null) return;

    const videoId = element.getAttribute(attributes.decorationVideoId);
    const videoContent = getVideoContent(element);

    mountButton(
        "recommend",
        element,
        videoId,
        getVideoIds(parent), // レンダリング時には他の関連動画がレンダリングされていない可能性があるためクリック時に取得する
        videoContent,
        { right: 40, bottom: 2 },
        { right: 10, bottom: 2 },
    );
}

function getVideoIds(parent: HTMLElement) {
    return [...getAnchors(parent)]
        .map((element) => element.getAttribute(attributes.decorationVideoId))
        .filter((id) => id !== null);
}

function getAnchors(parent: HTMLElement) {
    return parent.querySelectorAll(":scope > a[href^='/watch/']");
}
