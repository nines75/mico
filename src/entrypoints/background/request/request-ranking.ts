import { loadSettings } from "@/utils/storage.js";
import type { Settings } from "@/types/storage/settings.types.js";
import { filterVideo } from "../video-filter/filter-video.js";
import { saveLog } from "../video-filter/save-log.js";
import { filterResponse, spaFilter } from "./request.js";
import type { RankingApi } from "@/types/api/ranking.types.js";
import { rankingApiSchema } from "@/types/api/ranking.types.js";
import { cleanupDb } from "@/utils/db.js";
import { createLogId, tryMountLogId } from "@/utils/log.js";

export function rankingRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "GET", async (filter, encoder, buf) => {
        const tabId = details.tabId;
        const logId = createLogId();
        if (details.type === "xmlhttprequest") {
            await tryMountLogId(logId, tabId);
        }

        const settings = await loadSettings();
        const res = spaFilter(
            details,
            buf,
            settings,
            rankingApiSchema,
            rankingApiFilter,
        );
        if (res === undefined) return true;

        const { filteredBuf, filteredData } = res;
        if (filteredData === undefined) return true;

        filter.write(encoder.encode(filteredBuf));
        filter.disconnect();

        await Promise.all([
            saveLog(filteredData, logId, tabId),
            ...(details.type === "main_frame"
                ? [tryMountLogId(logId, tabId)]
                : []),
        ]);
        await cleanupDb();

        return false;
    });
}

function rankingApiFilter(
    rankingApi: RankingApi,
    settings: Settings,
    meta?: Element | null,
) {
    const videos = rankingApi.data.response.$getTeibanRanking.data.items;
    const filteredData = filterVideo(videos, settings);
    if (filteredData === undefined) return;

    const filteredVideos = videos.filter(
        ({ id }) => !filteredData.filteredIds.has(id),
    );

    rankingApi.data.response.$getTeibanRanking.data.items = filteredVideos;
    meta?.setAttribute("content", JSON.stringify(rankingApi));

    return filteredData;
}
