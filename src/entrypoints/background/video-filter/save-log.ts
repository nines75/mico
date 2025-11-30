import {
    VideoFiltering,
    VideoCount,
    RuleCount,
    BlockedCount,
    LogFilters,
} from "@/types/storage/log-video.types.js";
import { FilteredData } from "./filter-video.js";
import { changeBadgeState, sumNumbers } from "@/utils/util.js";
import { colors } from "@/utils/config.js";
import { setLog } from "@/utils/db.js";
import { getCountableFilters } from "./filter.js";
import { objectEntries } from "ts-extras";

export async function saveLog(
    filteredData: FilteredData,
    logId: string,
    tabId: number,
    isChangeBadge = true,
) {
    const start = performance.now();

    const count = getCount(filteredData);
    const filtering = getLog(filteredData);

    await Promise.all([
        setLog({ videoFilterLog: { count, filtering } }, logId, tabId),
        ...(isChangeBadge
            ? [changeBadgeState(count.totalBlocked, colors.videoBadge, tabId)]
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

function getCount(filteredData: FilteredData): VideoCount {
    const filters = filteredData.filters;
    const countableFilters = getCountableFilters(filters);

    const rule = objectEntries(countableFilters).reduce<Partial<RuleCount>>(
        (obj, [key, filter]) => {
            obj[key] = filter.countRules();
            return obj;
        },
        {},
    ) as RuleCount;
    const blocked = objectEntries(filters).reduce<Partial<BlockedCount>>(
        (obj, [key, filter]) => {
            obj[key] = filter.getBlockedCount();
            return obj;
        },
        {},
    ) as BlockedCount;

    return {
        rule,
        blocked,
        totalBlocked: sumNumbers(Object.values(blocked)),
        loaded: filteredData.loadedVideoCount,
        invalid: sumNumbers(
            Object.values(filters).map((filter) => filter.getInvalidCount()),
        ),
    };
}

function getLog(filteredData: FilteredData): VideoFiltering {
    const filters = filteredData.filters;
    const filteredVideos = new Map(
        Object.values(filters).flatMap((filter) => [
            ...filter.getFilteredVideos(),
        ]),
    );

    Object.values(filters).forEach((filter) => filter.sortLog());

    // ソート後にログを取得
    const logFilters = Object.fromEntries(
        Object.entries(filters).map(([key, filter]) => [key, filter.getLog()]),
    ) as LogFilters;

    return {
        filters: logFilters,
        filteredVideos,
    };
}
