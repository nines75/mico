import { loadSettings } from "@/utils/storage.js";
import { Settings } from "@/types/storage/settings.types.js";
import { filterVideo } from "../video-filter/filter-video.js";
import { saveLog } from "../video-filter/save-log.js";
import { filterResponse, spaFilter } from "./request.js";
import { RankingData, rankingDataSchema } from "@/types/api/ranking.types.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";
import { cleanupStorage } from "@/utils/storage-write.js";

export function rankingRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "GET", async (filter, encoder, buf) => {
        const settings = await loadSettings();

        const res = spaFilter(
            details,
            buf,
            settings,
            rankingDataSchema,
            rankingDataFilter,
        );
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

function rankingDataFilter(
    rankingData: RankingData,
    settings: Settings,
    meta?: Element | null,
) {
    const videos = rankingData.data.response.$getTeibanRanking.data.items;
    const filteredData = filterVideo(videos, settings);
    if (filteredData === undefined) return;

    const filteredVideos = settings.isSpoofVideoId
        ? videos.map(
              (video): NiconicoVideo => ({
                  ...video,
                  ...(filteredData.filteredIds.has(video.id)
                      ? { id: "dummy-id" }
                      : {}),
              }),
          )
        : videos.filter((video) => !filteredData.filteredIds.has(video.id));

    rankingData.data.response.$getTeibanRanking.data.items = filteredVideos;
    meta?.setAttribute("content", JSON.stringify(rankingData));

    return filteredData;
}
