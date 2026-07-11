import { loadSettings } from "@/utils/storage";
import type { Settings } from "@/types/storage/settings.types";
import { filterVideo } from "../video-filter/filter-video";
import { saveLog } from "../video-filter/save-log";
import { filterResponse, spaFilter } from "./request";
import type { SearchApi } from "@/types/api/search-api.types";
import { searchApiSchema } from "@/types/api/search-api.types";
import { cleanUpDb } from "@/utils/db";
import { createLogId } from "@/utils/log";
import { addContextToAutoRule, importLocalFilter } from "@/utils/storage-write";
import { mountLogId } from "@/utils/messaging";

export function searchRequest(
  details: browser.webRequest._OnBeforeRequestDetails,
) {
  filterResponse(details, "GET", async (filter, encoder, buf) => {
    const tabId = details.tabId;
    const logId = createLogId();
    if (details.type === "xmlhttprequest") {
      await mountLogId(logId, tabId);
    }

    await importLocalFilter("load");

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

    const tasks: Promise<void>[] = [
      saveLog(filteringResult, logId, tabId),
      cleanUpDb(),
    ];

    if (details.type === "main_frame") {
      tasks.push(mountLogId(logId, tabId));
    }

    if (settings.complementContext) {
      tasks.push(addContextToAutoRule({ videos: filteringResult.allVideos }));
    }

    await Promise.all(tasks);

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
