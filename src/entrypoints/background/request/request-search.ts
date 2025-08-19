import { loadSettings } from "@/utils/storage.js";
import { Settings } from "@/types/storage/settings.types.js";
import { filterVideo } from "../video-filter/filter-video.js";
import { saveLog } from "../video-filter/save-log.js";
import { filterResponse } from "./request.js";
import { SearchData } from "@/types/api/search.types.js";

export function searchRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "GET", async (filter, encoder, buf) => {
        const settings = await loadSettings();

        const res =
            details.type === "main_frame"
                ? await mainFrameFilter(details, buf, settings)
                : await xhrFilter(details, buf, settings);

        filter.write(encoder.encode(res === undefined ? buf : res));
        filter.disconnect();
    });
}

async function mainFrameFilter(
    details: browser.webRequest._OnBeforeRequestDetails,
    buf: string,
    settings: Settings,
) {
    const parser = new DOMParser();
    const html = parser.parseFromString(buf, "text/html");

    const meta = html.querySelector("meta[name='server-response']");
    if (meta === null) return; // 旧検索ページなら終了

    const content = meta.getAttribute("content") as string;
    const searchData = JSON.parse(content) as SearchData;

    await searchDataFilter(searchData, details, settings, meta);

    return `<!DOCTYPE html>${html.documentElement.outerHTML}`;
}

async function xhrFilter(
    details: browser.webRequest._OnBeforeRequestDetails,
    buf: string,
    settings: Settings,
) {
    const searchData = JSON.parse(buf) as SearchData;
    await searchDataFilter(searchData, details, settings);

    return JSON.stringify(searchData);
}

async function searchDataFilter(
    searchData: SearchData,
    details: browser.webRequest._OnBeforeRequestDetails,
    settings: Settings,
    meta?: Element | null,
) {
    // フィルタリング対象の動画IDを調べる
    const videos = searchData.data.response.$getSearchVideoV2.data.items;
    const filteredData = filterVideo(videos, settings);
    if (filteredData === undefined) return;

    // 実際にフィルタリング
    const filteredVideos = videos.filter(
        (video) => !filteredData.filteredIds.has(video.id),
    );

    searchData.data.response.$getSearchVideoV2.data.items = filteredVideos;
    meta?.setAttribute("content", JSON.stringify(searchData));

    await saveLog(filteredData, details.tabId, true);
}
