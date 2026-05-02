import { loadSettings } from "@/utils/storage";
import type { Settings } from "@/types/storage/settings.types";
import { filterVideo } from "../video-filter/filter-video";
import { saveLog } from "../video-filter/save-log";
import { filterResponse, spaFilter } from "./request";
import type { RankingApi } from "@/types/api/ranking-api.types";
import { rankingApiSchema } from "@/types/api/ranking-api.types";
import { cleanUpDb } from "@/utils/db";
import { createLogId, mountLogId } from "@/utils/log";
import { importLocalFilter } from "@/utils/storage-write";

export function rankingRequest(
  details: browser.webRequest._OnBeforeRequestDetails,
) {
  filterResponse(details, "GET", async (filter, encoder, buf) => {
    const tabId = details.tabId;
    const logId = createLogId();
    if (details.type === "xmlhttprequest") {
      await mountLogId(logId, tabId);
    }

    await importLocalFilter();

    const settings = await loadSettings();
    const result = spaFilter(
      details,
      buf,
      settings,
      rankingApiSchema,
      rankingApiFilter,
    );
    if (result === undefined) return true;

    const { filteredBuf, filteringResult } = result;
    if (filteringResult === undefined) return true;

    filter.write(encoder.encode(filteredBuf));
    filter.disconnect();

    await Promise.all([
      saveLog(filteringResult, logId, tabId),
      ...(details.type === "main_frame" ? [mountLogId(logId, tabId)] : []),
    ]);
    await cleanUpDb();

    return false;
  });
}

function rankingApiFilter(rankingApi: RankingApi, settings: Settings) {
  return filterVideo(
    rankingApi.data.response.$getTeibanRanking.data,
    (item) => item,
    settings,
  );
}
