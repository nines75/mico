import type { FilteredData } from "./filter-video";
import { sumNumbers } from "@/utils/util";
import { colors } from "@/utils/config";
import { mergeCount, setLog } from "@/utils/db";
import { setBadgeState } from "@/utils/browser";
import type { Count, LogData } from "@/types/storage/log.types";

export async function saveLog(
    filteredData: FilteredData,
    logId: string,
    tabId: number,
    isSetBadge = true,
) {
    const video = createVideoLog(filteredData);
    const count = createCount(filteredData);

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

function createVideoLog(
    filteredData: FilteredData,
): NonNullable<LogData["video"]> {
    const filteredVideos = Object.values(filteredData.filters).flatMap(
        (filter) => filter.getFilteredVideos(),
    );

    return { filteredVideos };
}

function createCount(filteredData: FilteredData) {
    return {
        blockedVideo: sumNumbers(
            Object.values(filteredData.filters).map(
                (filter) => filter.getFilteredVideos().length,
            ),
        ),
        loadedVideo: filteredData.loadedVideoCount,
    } satisfies Count;
}
