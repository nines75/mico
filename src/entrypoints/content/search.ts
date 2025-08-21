import { NiconicoVideo } from "@/types/api/niconico-video.types.js";

interface OldSearchContent {
    element: Element;
    video: NiconicoVideo;
}

export async function renderOldSearch() {
    const searchContent = getOldSearchContent();

    await browser.runtime.sendMessage({
        type: "filter-old-search",
        data: searchContent.map(({ video }) => video) satisfies NiconicoVideo[],
    });
}

function getOldSearchContent(): OldSearchContent[] {
    const res: OldSearchContent[] = [];

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
