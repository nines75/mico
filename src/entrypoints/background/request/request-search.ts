import { loadSettings } from "@/utils/storage.js";
import { Settings } from "@/types/storage/settings.types.js";
import { filterVideo } from "../video-filter/filter-video.js";
import { saveLog } from "../video-filter/save-log.js";
import { filterResponse } from "./request.js";
import { SearchData, SearchDataSchema } from "@/types/api/search.types.js";
import { cleanupStorage, setLog } from "@/utils/storage-write.js";
import { safeParseJson } from "@/utils/util.js";

export function searchRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "GET", async (filter, encoder, buf) => {
        const [settings] = await Promise.all([
            loadSettings(),
            setLog({ videoId: null }, details.tabId), // 検索のプレビューにコメントフィルターが適用されないように動画IDをリセットする
        ]);

        const res =
            details.type === "main_frame"
                ? mainFrameFilter(buf, settings)
                : xhrFilter(buf, settings);
        if (res === undefined) return true;

        const { filteredBuf, filteredData } = res;
        if (filteredData === undefined) return true;

        filter.write(encoder.encode(filteredBuf));
        filter.disconnect();

        await saveLog(filteredData, details.tabId, true);
        await cleanupStorage();

        return false;
    });
}

function mainFrameFilter(buf: string, settings: Settings) {
    const parser = new DOMParser();
    const html = parser.parseFromString(buf, "text/html");

    const meta = html.querySelector("meta[name='server-response']");
    const content = meta?.getAttribute("content");
    const searchData: SearchData | undefined = safeParseJson(
        content,
        SearchDataSchema,
    );
    if (searchData === undefined) return;

    const filteredData = searchDataFilter(searchData, settings, meta);

    return {
        filteredBuf: `<!DOCTYPE html>${html.documentElement.outerHTML}`,
        filteredData,
    };
}

function xhrFilter(buf: string, settings: Settings) {
    const searchData: SearchData | undefined = safeParseJson(
        buf,
        SearchDataSchema,
    );
    if (searchData === undefined) return;

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
