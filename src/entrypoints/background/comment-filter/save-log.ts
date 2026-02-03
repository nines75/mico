import type { FilteredData } from "./filter-comment";
import { sumNumbers } from "@/utils/util";
import type {
    BlockedCount,
    CommentCount,
    CommentFiltering,
    LogFilters,
    RuleCount,
} from "@/types/storage/log-comment.types";
import { colors } from "@/utils/config";
import { setLog } from "@/utils/db";
import type { ConditionalKeys } from "type-fest";
import type { RuleFilter } from "./rule-filter";
import { getRuleFilters } from "./rule-filter";
import { setBadgeState } from "@/utils/browser";

export async function saveLog(
    filteredData: FilteredData,
    logId: string,
    tabId: number,
) {
    const start = performance.now();

    const count = createCount(filteredData);
    const filtering = createFiltering(filteredData);

    await Promise.all([
        setLog({ commentFilterLog: { count, filtering } }, logId, tabId),
        setBadgeState(count.totalBlocked, colors.commentBadge, tabId),
    ]);

    const end = performance.now();
    await setLog(
        {
            commentFilterLog: {
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

export function createCount(filteredData: FilteredData): CommentCount {
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

    const calc = (key: ConditionalKeys<RuleFilter<unknown>, () => number>) => {
        return sumNumbers(
            Object.values(ruleFilters).map((filter) => filter[key]()),
        );
    };

    return {
        rule,
        blocked,
        totalBlocked: sumNumbers(Object.values(blocked)),
        loaded: filteredData.loadedCommentCount,
        include: calc("getIncludeCount"),
        exclude: calc("getExcludeCount"),
        invalid: calc("getInvalidCount"),
        disable: filters.commandFilter.getDisableCount(),
    };
}

export function createFiltering(filteredData: FilteredData): CommentFiltering {
    const filters = filteredData.filters;
    const filteredComments = new Map(
        Object.values(filters).flatMap((filter) => [
            ...filter.getFilteredComments(),
        ]),
    );
    const renderedComments = filteredData.threads.flatMap((thread) =>
        thread.comments.map(({ body, userId, no, score }) => {
            return { body, userId, no, score, fork: thread.fork };
        }),
    );

    for (const filter of Object.values(filters)) {
        filter.sortLog();
    }

    // ソート後にログを取得
    const logFilters = Object.fromEntries(
        Object.entries(filters).map(([key, filter]) => [key, filter.getLog()]),
    ) as LogFilters;

    return {
        strictUserIds: filteredData.strictUserIds,
        filters: logFilters,
        filteredComments,
        renderedComments,
    };
}
