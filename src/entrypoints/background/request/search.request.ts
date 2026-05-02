import { loadSettings } from "@/utils/storage";
import type { Settings } from "@/types/storage/settings.types";
import { filterVideo } from "../video-filter/filter-video";
import { saveLog } from "../video-filter/save-log";
import { filterResponse, spaFilter } from "./request";
import type { SearchApi } from "@/types/api/search-api.types";
import { searchApiSchema } from "@/types/api/search-api.types";
import { cleanUpDb } from "@/utils/db";
import { createLogId, mountLogId } from "@/utils/log";
import { importLocalFilter } from "@/utils/storage-write";

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

    await importLocalFilter();

    const settings = await loadSettings();
    const result = spaFilter(
      details,
      buf,
      settings,
      searchApiSchema,
      searchApiFilter,
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

function searchApiFilter(searchApi: SearchApi, settings: Settings) {
  return filterVideo(
    searchApi.data.response.$getSearchVideoV2.data,
    (item) => item,
    settings,
  );
}
