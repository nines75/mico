import { NiconicoVideo } from "@/types/api/niconico-video.types.js";
import { mountButton } from "./button.js";

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

        const video: NiconicoVideo = {
            id: videoId,
            title,
        };

        res.push({
            element,
            video,
        });
    });

    return res;
}
