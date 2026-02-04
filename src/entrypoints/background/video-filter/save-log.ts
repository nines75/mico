import type {
    VideoFiltering,
    VideoCount,
    RuleCount,
    BlockedCount,
    LogFilters,
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

    const rule = Object.fromEntries(
        Object.entries(ruleFilters).map(([key, filter]) => [
            key,
            filter.countRules(),
        ]),
    ) as RuleCount;
    const blocked = Object.fromEntries(
        Object.entries(filters).map(([key, filter]) => [
            key,
            filter.getBlockedCount(),
        ]),
    ) as BlockedCount;

    return {
        rule,
        blocked,
        totalBlocked: sumNumbers(Object.values(blocked)),
        loaded: filteredData.loadedVideoCount,
        invalid: sumNumbers(
            Object.values(ruleFilters).map((filter) =>
                filter.getInvalidCount(),
            ),
        ),
    };
}

function createFiltering(filteredData: FilteredData): VideoFiltering {
    const filters = filteredData.filters;
    const filteredVideos = new Map(
        Object.values(filters).flatMap((filter) => [
            ...filter.getFilteredVideos(),
        ]),
    );

    for (const filter of Object.values(filters)) {
        filter.sortLog();
    }

    // ソート後にログを取得
    const logFilters = Object.fromEntries(
        Object.entries(filters).map(([key, filter]) => [key, filter.getLog()]),
    ) as LogFilters;

    return {
        filters: logFilters,
        filteredVideos,
    };
}
