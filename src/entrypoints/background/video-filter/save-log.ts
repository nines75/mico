import type { FilteringResult } from "./filter-video";
import { sum } from "@/utils/util";
import { mergeCount, setLog } from "@/utils/db";
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
          video,
          count: await mergeCount(count, logId),
        };
      },
      logId,
      tabId,
    ),
    ...(setBadge ? [setBadgeState(count.blockedVideo, "video", tabId)] : []),
  ]);
}

function createVideoLog(result: FilteringResult): NonNullable<Log["video"]> {
  const filteredVideos = Object.values(result.filters).flatMap((filter) =>
    filter.getFilteredVideos(),
  );

  return { filteredVideos };
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
