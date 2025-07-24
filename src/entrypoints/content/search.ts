import { NiconicoVideo } from "@/types/api/niconico-video.types.js";
import { mountButton } from "./button.js";

interface SearchContent {
    elements: {
        element: Element;
        video: NiconicoVideo;
    }[];
    videos: NiconicoVideo[];
}

export async function renderSearch() {
    const searchContent = getSearchContent();

    await browser.runtime.sendMessage({
        type: "filter-search",
        data: searchContent.videos satisfies NiconicoVideo[],
    });

    searchContent.elements.forEach(({ element, video }) => {
        mountButton(element, video.id, {
            title: video.title,
            position: { right: 0, bottom: 0 },
        });
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

        const video: NiconicoVideo = {
            id: videoId,
            title,
        };

        res.elements.push({
            element,
            video,
        });
        res.videos.push(video);
    });

    return res;
}
