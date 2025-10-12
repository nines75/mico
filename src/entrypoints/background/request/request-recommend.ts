import {
    recommendApiSchema,
    RecommendApi,
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
        const tabId = details.tabId;
        const [settings, log] = await Promise.all([
            loadSettings(),
            getLogData(tabId, tabId),
        ]);
        const logId = log?.logId;
        if (logId === undefined) return true;

        const recommendApi: RecommendApi | undefined = safeParseJson(
            buf,
            recommendApiSchema,
        );
        if (recommendApi === undefined) return true;

        // シリーズの次の動画を追加
        const series = log?.series;
        if (series?.data !== undefined && series.hasNext) {
            const videoId = series.data.id;

            if (recommendApi.data.items.every((item) => item.id !== videoId)) {
                recommendApi.data.items.push({
                    id: videoId,
                    content: series.data,
                    contentType: "video",
                });
            }
        }

        // フィルタリング対象の動画IDを調べる
        const videos = recommendApi.data.items
            .filter((item) => item.contentType === "video")
            .map((item) => item.content);
        const filteredData = filterVideo(videos, settings, true);
        if (filteredData === undefined) return true;

        // 実際にフィルタリング
        recommendApi.data.items = recommendApi.data.items.filter(
            (item) => !filteredData.filteredIds.has(item.id),
        );

        filter.write(encoder.encode(JSON.stringify(recommendApi)));
        filter.disconnect();

        await saveLog(filteredData, logId, tabId, false);

        return false;
    });
}
