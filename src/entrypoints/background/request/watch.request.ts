import { loadSettings } from "@/utils/storage";
import { filterResponse, spaFilter } from "./request";
import type { WatchApi } from "@/types/api/watch-api.types";
import { watchApiSchema } from "@/types/api/watch-api.types";
import { setLog, setTab } from "@/utils/db";
import type { Tab } from "@/types/storage/tab.types";
import { importLocalFilter } from "@/utils/storage-write";
import { mountLogId } from "@/utils/messaging";

export function watchRequest(
  details: browser.webRequest._OnBeforeRequestDetails,
) {
  filterResponse(details, "GET", async (filter, encoder, body) => {
    const tabId = details.tabId;

    // xhrでは以前のログIDが残っている可能性があるため、
    // フィルタリングするかに関わらず必ずマウントし上書きする
    const logId = crypto.randomUUID();
    if (details.type === "xmlhttprequest") {
      await mountLogId(logId, tabId);
    }

    await importLocalFilter("load");

    const settings = await loadSettings();
    const result = spaFilter(
      details,
      body,
      settings,
      watchApiSchema,
      watchApiFilter,
    );
    if (result === undefined) return true;

    const { filteringResult: tab } = result;

    tab.logId = logId;

    await Promise.all([
      setTab(tab, tabId), // 以降のリクエストで使用するためフィルタを切断する前に保存する
      setLog({ tab }, logId, tabId),
    ]);

    // このリクエストではフィルタリングを行わないためtrueを返しキャンセルするべきだが、
    // ログIDのマウントはフィルタ切断後に行う必要があるため、キャンセルせずにここで切断する
    filter.write(encoder.encode(body));
    filter.disconnect();

    // main_frameでは以前のログIDがマウントされていることはないため、xhrと異なりフィルタリングしたときのみマウントする
    // そもそもmain_frameではフィルタを切断するまでDOM構築が終わらないため、切断前はマウントできない
    if (details.type === "main_frame") {
      await mountLogId(logId, tabId);
    }

    return false;
  });
}

function watchApiFilter(watchApi: WatchApi): Tab {
  const response = watchApi.data.response;

  const video = response.$watchV4.data.video;
  const owner = response.$watchV4.data.metadata.jsonLd.owner;
  const tags = response.$watchV4.data.tags.items.map(({ name }) => name);

  return {
    // 前回のリクエストの値を上書き
    seriesNext: undefined,
    seriesId: undefined,
    watchLazyDone: false,

    videoId: video.id,
    title: video.title,
    duration: video.duration,
    ownerId: owner?.id,
    ownerName: owner?.name,
    tags,
  };
}
