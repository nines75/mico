import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import { sendMessageToBackground } from "@/utils/browser";

export async function renderOldSearch() {
    await sendMessageToBackground({
        type: "filter-old-search",
        data: getVideos(),
    });
}

function getVideos(): NiconicoVideo[] {
    const res: NiconicoVideo[] = [];

    const elements =
        document.querySelectorAll<HTMLLIElement>("li[data-video-id]");
    for (const element of elements) {
        const videoId = element.dataset.videoId;

        const titleElement = element.querySelector(".itemTitle > a");
        const title = titleElement?.getAttribute("title");

        if (videoId === undefined || title === null || title === undefined)
            continue;

        const paymentElement = element.querySelector(".iconPayment");

        res.push({
            id: videoId,
            title,
            isPaymentRequired: paymentElement !== null,
        });
    }

    return res;
}
