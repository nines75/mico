import type { FilteringResult } from "./filter-video";
import { sum } from "@/utils/util";
import { colors } from "@/utils/config";
import { mergeCount, setLog } from "@/utils/db";
import { setBadgeState } from "@/utils/browser";
import type { Count, Log } from "@/types/storage/log.types";

export async function saveLog(
    result: FilteringResult,
    logId: string,
    tabId: number,
    isSetBadge = true,
) {
    const video = createVideoLog(result);
    const count = createCount(result);

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
        ...(isSetBadge
            ? [setBadgeState(count.blockedVideo, colors.videoBadge, tabId)]
            : []),
    ]);
}

function createVideoLog(result: FilteringResult): NonNullable<Log["video"]> {
    const filteredVideos = Object.values(result.filters).flatMap((filter) =>
        filter.getFilteredVideos(),
    );

    return { filteredVideos };
}

function createCount(result: FilteringResult) {
    return {
        blockedVideo: sum(
            Object.values(result.filters).map(
                (filter) => filter.getFilteredVideos().length,
            ),
        ),
        loadedVideo: result.loadedVideoCount,
    } satisfies Count;
}
