import type { Settings } from "@/types/storage/settings.types";
import { getTab, setTab } from "@/utils/db";
import { loadSettings } from "@/utils/storage";
import {
  filterVideo,
  type FilteringResult,
} from "../video-filter/filter-video";
import { filterResponse, spaFilter } from "./request";
import {
  watchLazyApiSchema,
  type WatchLazyApi,
} from "@/types/api/watch-lazy-api.types";
import type { Tab } from "@/types/storage/tab.types";
import { saveLog } from "../video-filter/save-log";

export function watchLazyRequest(
  details: browser.webRequest._OnBeforeRequestDetails,
) {
  filterResponse(details, "POST", async (filter, encoder, body) => {
    const tabId = details.tabId;
    const [settings, tab] = await Promise.all([loadSettings(), getTab(tabId)]);
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

    await setTab(filteringResult.tab, tabId); // 以降のリクエストで使用するためフィルタを切断する前に保存する
    notifyDone(tabId);

    filter.write(encoder.encode(filteredBody));
    filter.disconnect();

    if (filteringResult.log !== undefined && tab?.logId !== undefined) {
      await saveLog(filteringResult.log, tab.logId, tabId, false);
    }

    return false;
  });
}

function watchLazyApiFilter(
  watchLazyApi: WatchLazyApi,
  settings: Settings,
): { log: FilteringResult | undefined; tab: Partial<Tab> } {
  const series = watchLazyApi.data.series;

  const log = (() => {
    const video = series?.video;
    if (video === undefined || !settings.enableSeriesNextFilter) return;

    const next = video.next;
    if (next === null) return;

    const data = { items: [next] };
    const result = filterVideo(data, (item) => item, settings, "seriesNext");

    // 実際に非表示にする
    if (data.items.length === 0) {
      video.next = null;
    }

    return result;
  })();

  return {
    log,
    tab: {
      seriesId: series?.id.toString(),
      watchLazyDone: true,
    },
  };
}

function notifyDone(tabId: number) {
  const channel = new BroadcastChannel(`watch-lazy-done-${tabId}`);
  channel.postMessage("");
  channel.close();
}
