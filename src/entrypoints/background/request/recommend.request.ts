import type { RecommendApi } from "@/types/api/recommend-api.types";
import { recommendApiSchema } from "@/types/api/recommend-api.types";
import { loadSettings } from "@/utils/storage";
import type { FilteringResult } from "../video-filter/filter-video";
import { filterVideo } from "../video-filter/filter-video";
import { saveLog } from "../video-filter/save-log";
import { filterResponse } from "./request";
import { getTab } from "@/utils/db";
import { safeParseJson } from "@/utils/util";
import { addContextToVideoRule } from "@/utils/storage-write";

export function recommendRequest(
  details: browser.webRequest._OnBeforeRequestDetails,
) {
  filterResponse(details, "POST", async (filter, encoder, body) => {
    const tabId = details.tabId;
    const [settings, tab] = await Promise.all([loadSettings(), getTab(tabId)]);
    const logId = tab?.logId;
    if (logId === undefined) return true;

    const recommendApi: RecommendApi | undefined = safeParseJson(
      body,
      recommendApiSchema,
    );
    if (recommendApi === undefined) return true;

    const results: FilteringResult[] = [];
    for (const data of recommendApi.data.recommendResults) {
      const result = filterVideo(
        data,
        (item) => {
          if (item.contentType === "video") return item.content;
        },
        settings,
        "recommend",
      );
      if (result === undefined) continue;

      results.push(result);
    }
    if (results.length === 0) return true;

    filter.write(encoder.encode(JSON.stringify(recommendApi)));
    filter.disconnect();

    const tasks: Promise<void>[] = [];

    for (const result of results) {
      tasks.push(
        saveLog(result, logId, tabId, false),
        addContextToVideoRule(result.allVideos, settings),
      );
    }

    await Promise.all(tasks);

    return false;
  });
}
