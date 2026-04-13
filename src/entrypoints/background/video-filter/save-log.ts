import type { VideoFiltering } from "@/types/storage/log-video.types";
import type { FilteredData } from "./filter-video";
import { sumNumbers } from "@/utils/util";
import { colors } from "@/utils/config";
import { mergeCount, setLog } from "@/utils/db";
import { setBadgeState } from "@/utils/browser";
import type { Count } from "@/types/storage/log.types";

export async function saveLog(
    filteredData: FilteredData,
    logId: string,
    tabId: number,
    isSetBadge = true,
) {
    const count = createCount(filteredData);
    const filtering = createFiltering(filteredData);

    await Promise.all([
        setLog(
            async () => {
                return {
                    videoFilterLog: { filtering },
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

function createFiltering(filteredData: FilteredData): VideoFiltering {
    const filteredVideos = Object.values(filteredData.filters).flatMap(
        (filter) => filter.getFilteredVideos(),
    );

    return { filteredVideos };
}
