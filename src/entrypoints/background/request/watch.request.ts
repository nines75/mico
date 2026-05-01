import { filterVideo } from "../video-filter/filter-video";
import { loadSettings } from "@/utils/storage";
import type { Settings } from "@/types/storage/settings.types";
import { filterResponse, spaFilter } from "./request";
import type { WatchApi } from "@/types/api/watch-api.types";
import { watchApiSchema } from "@/types/api/watch-api.types";
import { setLog, setTab } from "@/utils/db";
import type { Series, Tab } from "@/types/storage/tab.types";
import { createLogId, mountLogId } from "@/utils/log";
import { importLocalFilter } from "@/utils/storage-write";

export function watchRequest(
  details: browser.webRequest._OnBeforeRequestDetails,
) {
  filterResponse(details, "GET", async (filter, encoder, buf) => {
    const tabId = details.tabId;

    // 削除動画でもログIDを更新するためにcomment/recommendではなくここで生成する
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
      watchApiSchema,
      watchApiFilter,
    );
    if (result === undefined) return true;

    const { filteredBuf, filteringResult: tab } = result;

    tab.logId = logId;

    await Promise.all([
      setTab(tab, tabId), // 以降のリクエストで使用するためフィルタを切断する前に保存する
      setLog({ tab }, logId, tabId),
    ]);

    filter.write(encoder.encode(filteredBuf));
    filter.disconnect();

    if (details.type === "main_frame") {
      await mountLogId(logId, tabId);
    }

    return false;
  });
}

function watchApiFilter(
  watchApi: WatchApi,
  settings: Settings,
  meta?: Element | null,
): Tab {
  const response = watchApi.data.response;
  const metadata = watchApi.data.metadata;

  const series: Series = (() => {
    const video = response.series?.video;
    const next = video?.next;

    if (video !== undefined && next !== null && next !== undefined) {
      const data = { items: [next] };
      filterVideo(data, (item) => item, settings);

      if (data.items.length === 0) {
        video.next = null;
      }

      meta?.setAttribute("content", JSON.stringify(watchApi));

      return { hasNext: true, video: next };
    } else {
      return { hasNext: false };
    }
  })();

  const ownerId = (
    response.owner?.id ?? // 通常のユーザー
    response.channel?.id ?? // チャンネル
    // ユーザーが退会済み
    metadata.jsonLds[0]?.author?.url.match(
      /^https:\/\/www\.nicovideo\.jp\/user\/(\d+)$/, // 誤った値が抽出されないように完全なURLでチェックする
    )?.[1]
  )?.toString();
  const ownerName =
    response.owner?.nickname ??
    response.channel?.name ??
    metadata.jsonLds[0]?.author?.name;
  const tags = response.tag.items.map(({ name }) => name);

  return {
    series,
    seriesId: response.series?.id.toString(),
    videoId: response.video.id,
    title: response.video.title,
    ownerId,
    ownerName,
    tags,
  };
}
