import { loadSettings } from "@/utils/storage";
import type { Settings } from "@/types/storage/settings.types";
import { filterVideo } from "../video-filter/filter-video";
import { saveLog } from "../video-filter/save-log";
import { filterResponse, spaFilter } from "./request";
import type { SearchApi } from "@/types/api/search.types";
import { searchApiSchema } from "@/types/api/search.types";
import { cleanupDb } from "@/utils/db";
import { createLogId, mountLogId } from "@/utils/log";

export function searchRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "GET", async (filter, encoder, buf) => {
        const tabId = details.tabId;
        const logId = createLogId();
        if (details.type === "xmlhttprequest") {
            // XHRでないとmountできない
            await mountLogId(logId, tabId);
        }

        const settings = await loadSettings();
        const result = spaFilter(
            details,
            buf,
            settings,
            searchApiSchema,
            searchApiFilter,
        );
        if (result === undefined) return true;

        const { filteredBuf, filteredData } = result;
        if (filteredData === undefined) return true;

        filter.write(encoder.encode(filteredBuf));
        filter.disconnect();

        await Promise.all([
            saveLog(filteredData, logId, tabId),
            ...(details.type === "main_frame"
                ? [mountLogId(logId, tabId)]
                : []),
        ]);
        await cleanupDb();

        return false;
    });
}

function searchApiFilter(
    searchApi: SearchApi,
    settings: Settings,
    meta?: Element | null,
) {
    // フィルタリング対象の動画IDを調べる
    const videos = searchApi.data.response.$getSearchVideoV2.data.items;
    const filteredData = filterVideo(videos, settings);
    if (filteredData === undefined) return;

    // 実際にフィルタリング
    const filteredVideos = videos.filter(
        (video) => !filteredData.filteredIds.has(video.id),
    );

    searchApi.data.response.$getSearchVideoV2.data.items = filteredVideos;
    meta?.setAttribute("content", JSON.stringify(searchApi));

    return filteredData;
}
