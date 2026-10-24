import type { Settings } from "@/types/storage/settings.types";
import { setTab } from "@/utils/db";
import { loadSettings } from "@/utils/storage";
import { filterVideo } from "../video-filter/filter-video";
import { filterResponse, spaFilter } from "./request";
import {
  watchLazyApiSchema,
  type WatchLazyApi,
} from "@/types/api/watch-lazy-api.types";
import type { Tab } from "@/types/storage/tab.types";

export function watchLazyRequest(
  details: browser.webRequest._OnBeforeRequestDetails,
) {
  filterResponse(details, "POST", async (filter, encoder, body) => {
    const tabId = details.tabId;
    const settings = await loadSettings();
    const result = spaFilter(
      details,
      body,
      settings,
      watchLazyApiSchema,
      watchLazyApiFilter,
    );
    if (result === undefined) {
      // バリデーションに失敗した場合も後続のリクエストを止めない
      await setTab({ watchLazyDone: true }, tabId);
      notifyDone(tabId);

      return true;
    }

    const { filteredBody, filteringResult } = result;

    await setTab(filteringResult, tabId); // 以降のリクエストで使用するためフィルタを切断する前に保存する
    notifyDone(tabId);

    filter.write(encoder.encode(filteredBody));
    filter.disconnect();

    return false;
  });
}

function watchLazyApiFilter(
  watchLazyApi: WatchLazyApi,
  settings: Settings,
): Partial<Tab> {
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
    watchLazyDone: true,
  };
}

function notifyDone(tabId: number) {
  const channel = new BroadcastChannel(`watch-lazy-done-${tabId}`);
  channel.postMessage("");
  channel.close();
}
