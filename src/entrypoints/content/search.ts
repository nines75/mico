import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import { sendMessageToBackground } from "@/utils/browser";

export async function renderOldSearch() {
    await sendMessageToBackground({
        type: "filter-old-search",
        data: getVideos(),
    });
}

function getVideos(): NiconicoVideo[] {
    const videos: NiconicoVideo[] = [];

    const elements =
        document.querySelectorAll<HTMLLIElement>("li[data-video-id]");
    for (const element of elements) {
        const videoId = element.dataset.videoId;

        const titleElement = element.querySelector(".itemTitle > a");
        const title = titleElement?.getAttribute("title");

        if (videoId === undefined || title === null || title === undefined)
            continue;

        const paymentElement = element.querySelector(".iconPayment");

        videos.push({
            id: videoId,
            title,
            isPaymentRequired: paymentElement !== null,
        });
    }

    return videos;
}
