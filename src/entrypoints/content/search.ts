import { NiconicoVideo } from "@/types/api/niconico-video.types.js";

interface SearchContent {
    elements: {
        element: Element;
        videoId: string;
    }[];
    videos: NiconicoVideo[];
}

export async function renderSearchResults() {
    const searchContent = getSearchContent();

    await browser.runtime.sendMessage({
        type: "filter-search-results",
        data: searchContent.videos satisfies NiconicoVideo[],
    });
}

function getSearchContent(): SearchContent {
    const res: SearchContent = {
        elements: [],
        videos: [],
    };

    const elements = document.querySelectorAll("li[data-video-id]");
    elements.forEach((element) => {
        const videoId = element.getAttribute("data-video-id");

        const titleElement = element.querySelector(".itemTitle > a");
        const title = titleElement?.getAttribute("title");

        if (videoId === null || title === null || title === undefined) return;

        res.elements.push({
            element,
            videoId,
        });
        res.videos.push({
            id: videoId,
            title,
        });
    });

    return res;
}
