import { NiconicoVideo } from "@/types/api/niconico-video.types.js";
import { getVideoContent, mountButton } from "./button.js";
import { attributes } from "@/utils/config.js";

interface SearchContent {
    element: Element;
    video: NiconicoVideo;
}

export async function renderSearch() {
    const searchContent = getSearchContent();

    await browser.runtime.sendMessage({
        type: "filter-search",
        data: searchContent.map(({ video }) => video) satisfies NiconicoVideo[],
    });

    searchContent.forEach(({ element, video }) => {
        mountButton(element, video.id, {
            title: video.title,
            position: { right: 0, bottom: 0 },
        });
    });
}

function getSearchContent(): SearchContent[] {
    const res: SearchContent[] = [];

    const elements = document.querySelectorAll("li[data-video-id]");
    elements.forEach((element) => {
        const videoId = element.getAttribute("data-video-id");

        const titleElement = element.querySelector(".itemTitle > a");
        const title = titleElement?.getAttribute("title");

        if (videoId === null || title === null || title === undefined) return;

        const paymentElement = element.querySelector(".iconPayment");

        const video: NiconicoVideo = {
            id: videoId,
            title,
            isPaymentRequired: paymentElement !== null,
        };

        res.push({ element, video });
    });

    return res;
}

export function mountToAllSearch(parent: Element) {
    parent
        .querySelectorAll(":scope > div > div")
        .forEach((element) => mountToSearch(element));
}

export function mountToSearch(video: Element) {
    const videoId = video.getAttribute(attributes.decorationVideoId);
    const videoContent = getVideoContent(video);
    if (videoContent === undefined) return;

    mountButton(
        video,
        videoId,
        {
            title: videoContent.title,
            position: { right: 10, bottom: 30 },
        },
        {
            message: {
                allId: getVideoIds(),
                userName: videoContent.userName,
                type: "ranking",
            },
            position: { right: 0, bottom: 30 },
        },
    );
}

function getVideoIds() {
    return [
        ...document.querySelectorAll(
            "[data-decoration-video-id][data-anchor-area='main']",
        ),
    ]
        .map((video) => video.getAttribute(attributes.decorationVideoId))
        .filter((id) => id !== null);
}
