import type { RecommendApi } from "@/types/api/recommend-api.types";
import { recommendApiSchema } from "@/types/api/recommend-api.types";
import { loadSettings } from "@/utils/storage";
import type { FilteringResult } from "../video-filter/filter-video";
import { filterVideo } from "../video-filter/filter-video";
import { saveLog } from "../video-filter/save-log";
import { filterResponse } from "./request";
import { getTab } from "@/utils/db";
import { safeParseJson } from "@/utils/util";

export function recommendRequest(
  details: browser.webRequest._OnBeforeRequestDetails,
) {
  filterResponse(details, "POST", async (filter, encoder, buf) => {
    const tabId = details.tabId;
    const [settings, tab] = await Promise.all([loadSettings(), getTab(tabId)]);
    const logId = tab?.logId;
    if (logId === undefined) return true;

    const recommendApi: RecommendApi | undefined = safeParseJson(
      buf,
      recommendApiSchema,
    );
    if (recommendApi === undefined) return true;

    // シリーズの次の動画を追加
    const seriesNext = tab?.seriesNext;
    if (seriesNext !== undefined) {
      const videoId = seriesNext.id;

      if (
        recommendApi.data.recommendResults[0]?.items.some(
          (item) => item.contentType === "video" && item.id === videoId,
        ) === false
      ) {
        recommendApi.data.recommendResults[0].items.push({
          id: videoId,
          content: seriesNext,
          contentType: "video",
          recommendType: "recommend", // スキーマには定義していないが、プロパティが欠けるのは望ましくないため追加
        });
      }
    }

    const results: FilteringResult[] = [];
    for (const data of recommendApi.data.recommendResults) {
      const result = filterVideo(
        data,
        (item) => {
          if (item.contentType === "video") return item.content;
        },
        settings,
        true,
      );
      if (result === undefined) continue;

      results.push(result);
    }
    if (results.length === 0) return true;

    filter.write(encoder.encode(JSON.stringify(recommendApi)));
    filter.disconnect();

    for (const result of results) {
      await saveLog(result, logId, tabId, false);
    }

    return false;
  });
}
