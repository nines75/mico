import type { Settings } from "@/types/storage/settings.types";
import { setTab } from "@/utils/db";
import { loadSettings } from "@/utils/storage";
import { filterVideo } from "../video-filter/filter-video";
import { filterResponse, spaFilter } from "./request";
import {
  watchLazyApiSchema,
  type WatchLazyApi,
} from "@/types/api/watch-lazy-api.types";

export function watchLazyRequest(
  details: browser.webRequest._OnBeforeRequestDetails,
) {
  filterResponse(details, "POST", async (filter, encoder, buf) => {
    const settings = await loadSettings();
    const result = spaFilter(
      details,
      buf,
      settings,
      watchLazyApiSchema,
      watchLazyApiFilter,
    );
    if (result === undefined) return true;

    const { filteredBuf, filteringResult } = result;

    await setTab(filteringResult, details.tabId); // 以降のリクエストで使用するためフィルタを切断する前に保存する

    filter.write(encoder.encode(filteredBuf));
    filter.disconnect();

    return false;
  });
}

function watchLazyApiFilter(watchLazyApi: WatchLazyApi, settings: Settings) {
  const response = watchLazyApi.data;

  const seriesNext = (() => {
    const video = response.series?.video;
    if (video === undefined) return;

    const next = video.next;
    if (next === null) return;

    const data = { items: [next] };
    filterVideo(data, (item) => item, settings);

    if (data.items.length === 0) {
      video.next = null;
    }

    return next;
  })();

  return {
    seriesNext,
    seriesId: response.series?.id.toString(),
  };
}
