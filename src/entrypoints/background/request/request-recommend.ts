import type { RecommendApi } from "@/types/api/recommend.types";
import { recommendApiSchema } from "@/types/api/recommend.types";
import { loadSettings } from "@/utils/storage";
import { filterVideo } from "../video-filter/filter-video";
import { saveLog } from "../video-filter/save-log";
import { filterResponse } from "./request";
import { getTabData } from "@/utils/db";
import { safeParseJson } from "./safe-parse-json";

export function recommendRequest(
    details: browser.webRequest._OnBeforeRequestDetails,
) {
    filterResponse(details, "GET", async (filter, encoder, buf) => {
        const tabId = details.tabId;
        const [settings, tab] = await Promise.all([
            loadSettings(),
            getTabData(tabId),
        ]);
        const logId = tab?.logId;
        if (logId === undefined) return true;

        const recommendApi: RecommendApi | undefined = safeParseJson(
            buf,
            recommendApiSchema,
        );
        if (recommendApi === undefined) return true;

        // シリーズの次の動画を追加
        const series = tab?.series;
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
