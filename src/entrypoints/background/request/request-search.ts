import { loadSettings } from "@/utils/storage.js";
import { Settings } from "@/types/storage/settings.types.js";
import { filterVideo } from "../video-filter/filter-video.js";
import { saveLog } from "../video-filter/save-log.js";
import { filterResponse, spaFilter } from "./request.js";
import { SearchApi, SearchApiSchema } from "@/types/api/search.types.js";
import { setLog } from "@/utils/storage-write.js";
import { createLogId, tryMountLogId } from "@/utils/util.js";

export function searchRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "GET", async (filter, encoder, buf) => {
        const tabId = details.tabId;
        const logId = createLogId();
        if (details.type === "xmlhttprequest") {
            // XHRでないとmountできない
            await tryMountLogId(logId, tabId);
        }

        const [settings] = await Promise.all([
            loadSettings(),
            setLog({ videoId: null }, tabId, tabId), // 検索のプレビューにコメントフィルターが適用されないように動画IDをリセットする
        ]);

        const res = spaFilter(
            details,
            buf,
            settings,
            SearchApiSchema,
            searchApiFilter,
        );
        if (res === undefined) return true;

        const { filteredBuf, filteredData } = res;
        if (filteredData === undefined) return true;

        filter.write(encoder.encode(filteredBuf));
        filter.disconnect();

        await Promise.all([
            saveLog(filteredData, logId, tabId),
            // main_frame用に再mount
            ...(details.type === "main_frame"
                ? [tryMountLogId(logId, tabId)]
                : []),
        ]);
        // await cleanupStorage();

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
