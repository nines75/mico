import type { FilteringResult } from "./filter-video";
import { sum } from "@/utils/util";
import { mergeCount, mergeVideo, setLog } from "@/utils/db";
import { setBadgeState } from "@/utils/browser";
import type { Count, Log } from "@/types/storage/log.types";

export async function saveLog(
  result: FilteringResult,
  logId: string,
  tabId: number,
  setBadge = true,
) {
  const video = createVideoLog(result);
  const count = createCountLog(result);

  await Promise.all([
    setLog(
      async () => {
        return {
          // レコメンドは複数回ログを保存するためマージが必要
          video: await mergeVideo(video, logId),
          count: await mergeCount(count, logId),
        };
      },
      logId,
      tabId,
    ),
    ...(setBadge ? [setBadgeState(count.blockedVideo, tabId, "video")] : []),
  ]);
}

function createVideoLog(result: FilteringResult): NonNullable<Log["video"]> {
  const filteredVideos = Object.values(result.filters).flatMap((filter) =>
    filter.getFilteredVideos(),
  );

  return { filteredVideos, allVideos: result.allVideos };
}

function createCountLog(result: FilteringResult) {
  return {
    blockedVideo: sum(
      Object.values(result.filters).map(
        (filter) => filter.getFilteredVideos().length,
      ),
    ),
    loadedVideo: result.loadedVideoCount,
  } satisfies Count;
}
