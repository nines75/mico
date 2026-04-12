import type {
    VideoFiltering,
    VideoCount,
} from "@/types/storage/log-video.types";
import type { FilteredData } from "./filter-video";
import { sumNumbers } from "@/utils/util";
import { colors } from "@/utils/config";
import { setLog } from "@/utils/db";
import { getRuleFilters } from "./rule-filter";
import { setBadgeState } from "@/utils/browser";

export async function saveLog(
    filteredData: FilteredData,
    logId: string,
    tabId: number,
    isSetBadge = true,
) {
    const start = performance.now();

    const count = createCount(filteredData);
    const filtering = createFiltering(filteredData);

    await Promise.all([
        setLog({ videoFilterLog: { count, filtering } }, logId, tabId),
        ...(isSetBadge
            ? [setBadgeState(count.totalBlocked, colors.videoBadge, tabId)]
            : []),
    ]);

    const end = performance.now();
    await setLog(
        {
            videoFilterLog: {
                processingTime: {
                    filtering: filteredData.filteringTime,
                    saveLog: end - start,
                },
            },
        },
        logId,
        tabId,
    );
}

function createCount(filteredData: FilteredData): VideoCount {
    const filters = filteredData.filters;
    const ruleFilters = getRuleFilters(filters);

    return {
        totalBlocked: sumNumbers(
            Object.values(filters).map(
                (filter) => filter.getFilteredVideos().length,
            ),
        ),
        loaded: filteredData.loadedVideoCount,
        invalid: sumNumbers(
            Object.values(ruleFilters).map((filter) =>
                filter.getInvalidCount(),
            ),
        ),
    };
}

function createFiltering(filteredData: FilteredData): VideoFiltering {
    const filteredVideos = Object.values(filteredData.filters).flatMap(
        (filter) => filter.getFilteredVideos(),
    );

    return { filteredVideos,
    };
}
