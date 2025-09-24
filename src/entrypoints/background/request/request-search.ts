import { loadSettings } from "@/utils/storage.js";
import { Settings } from "@/types/storage/settings.types.js";
import { filterVideo } from "../video-filter/filter-video.js";
import { saveLog } from "../video-filter/save-log.js";
import { filterResponse } from "./request.js";
import { SearchData } from "@/types/api/search.types.js";
import { cleanupStorage, setLog } from "@/utils/storage-write.js";

export function searchRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "GET", async (filter, encoder, buf) => {
        const [settings] = await Promise.all([
            loadSettings(),
            setLog({ videoId: null }, details.tabId), // 検索のプレビューにコメントフィルターが適用されないように動画IDをリセットする
        ]);

        const data =
            details.type === "main_frame"
                ? mainFrameFilter(buf, settings)
                : xhrFilter(buf, settings);
        const filteredBuf = data?.filteredBuf;
        const filteredData = data?.filteredData;

        filter.write(
            encoder.encode(filteredBuf === undefined ? buf : filteredBuf),
        );
        filter.disconnect();

        if (filteredData === undefined) return;

        await saveLog(filteredData, details.tabId, true);
        await cleanupStorage();
    });
}

function mainFrameFilter(buf: string, settings: Settings) {
    const parser = new DOMParser();
    const html = parser.parseFromString(buf, "text/html");

    const meta = html.querySelector("meta[name='server-response']");
    if (meta === null) return; // 旧検索ページなら終了

    const content = meta.getAttribute("content") as string;
    const searchData = JSON.parse(content) as SearchData;

    const filteredData = searchDataFilter(searchData, settings, meta);

    return {
        filteredBuf: `<!DOCTYPE html>${html.documentElement.outerHTML}`,
        filteredData,
    };
}

function xhrFilter(buf: string, settings: Settings) {
    const searchData = JSON.parse(buf) as SearchData;
    const filteredData = searchDataFilter(searchData, settings);

    return {
        filteredBuf: JSON.stringify(searchData),
        filteredData,
    };
}

function searchDataFilter(
    searchData: SearchData,
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

    return filteredData;
}
