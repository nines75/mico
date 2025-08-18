import { attributes } from "@/utils/config.js";
import { getVideoContent, mountButton } from "./button.js";

export function mountToRecommendHandler(parent: Element) {
    for (const element of getAnchors(parent)) {
        mountToRecommend(element);
    }
}

export function mountToRecommend(element: Element) {
    const parent = element.parentElement;
    if (parent === null) return;

    const videoId = element.getAttribute(attributes.decorationVideoId);
    const videoContent = getVideoContent(element);
    if (videoContent === undefined) return;

    mountButton(
        element,
        videoId,
        {
            title: videoContent.title,
            position: { right: 40, bottom: 2 },
        },
        {
            message: {
                allId: getVideoIds(parent), // レンダリング時には他の関連動画がレンダリングされていない可能性があるためクリック時に取得する
                userName: videoContent.userName,
                type: "recommend",
            },
            position: { right: 10, bottom: 2 },
        },
    );
}

function getVideoIds(parent: Element) {
    return [...getAnchors(parent)]
        .map((element) => element.getAttribute(attributes.decorationVideoId))
        .filter((id) => id !== null);
}

function getAnchors(parent: Element) {
    return parent.querySelectorAll(":scope > div[data-anchor-href^='/watch/']");
}
