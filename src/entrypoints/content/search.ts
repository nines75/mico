import { NiconicoVideo } from "@/types/api/niconico-video.types.js";

export async function renderOldSearch() {
    await browser.runtime.sendMessage({
        type: "filter-old-search",
        data: getVideos() satisfies NiconicoVideo[],
    });
}

function getVideos(): NiconicoVideo[] {
    const res: NiconicoVideo[] = [];

    const elements = document.querySelectorAll("li[data-video-id]");
    elements.forEach((element) => {
        const videoId = element.getAttribute("data-video-id");

        const titleElement = element.querySelector(".itemTitle > a");
        const title = titleElement?.getAttribute("title");

        if (videoId === null || title === null || title === undefined) return;

        const paymentElement = element.querySelector(".iconPayment");

        res.push({
            id: videoId,
            title,
            isPaymentRequired: paymentElement !== null,
        });
    });

    return res;
}
