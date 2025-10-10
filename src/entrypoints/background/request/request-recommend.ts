import {
    recommendDataSchema,
    RecommendData,
} from "@/types/api/recommend.types.js";
import { getLogData, loadSettings } from "@/utils/storage.js";
import { filterVideo } from "../video-filter/filter-video.js";
import { saveLog } from "../video-filter/save-log.js";
import { filterResponse } from "./request.js";
import { safeParseJson } from "@/utils/util.js";

export function recommendRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "GET", async (filter, encoder, buf) => {
        const [settings, log] = await Promise.all([
            loadSettings(),
            getLogData(details.tabId),
        ]);
        const tabId = details.tabId;
        const recommendData: RecommendData | undefined = safeParseJson(
            buf,
            recommendDataSchema,
        );
        if (recommendData === undefined) return true;

        // シリーズの次の動画を追加
        const series = log?.series;
        if (series?.data !== undefined && series.hasNext) {
            const videoId = series.data.id;

            if (recommendData.data.items.every((item) => item.id !== videoId)) {
                recommendData.data.items.push({
                    id: videoId,
                    content: series.data,
                    contentType: "video",
                });
            }
        }

        // フィルタリング対象の動画IDを調べる
        const videos = recommendData.data.items
            .filter((item) => item.contentType === "video")
            .map((item) => item.content);
        const filteredData = filterVideo(videos, settings, true);
        if (filteredData === undefined) return true;

        // 実際にフィルタリング
        recommendData.data.items = recommendData.data.items.filter(
            (item) => !filteredData.filteredIds.has(item.id),
        );

        filter.write(encoder.encode(JSON.stringify(recommendData)));
        filter.disconnect();

        await saveLog(filteredData, tabId);

        return false;
    });
}
