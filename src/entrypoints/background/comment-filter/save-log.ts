import { FilteredData } from "./filter-comment.js";
import { changeBadgeState, sumNumbers } from "@/utils/util.js";
import { RuleFilter, getRuleFilters } from "./filter.js";
import {
    BlockedCount,
    CommentCount,
    CommentFiltering,
    LogFilters,
    RuleCount,
} from "@/types/storage/log-comment.types.js";
import { colors } from "@/utils/config.js";
import { setLog } from "@/utils/db.js";
import { objectEntries } from "ts-extras";
import { ConditionalKeys } from "type-fest";

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
        changeBadgeState(count.totalBlocked, colors.commentBadge, tabId),
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

    const rule = objectEntries(ruleFilters).reduce<Partial<RuleCount>>(
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
        thread.comments.map((comment) => {
            const { body, userId, no, score } = comment;

            return { body, userId, no, score, fork: thread.fork };
        }),
    );

    Object.values(filters).forEach((filter) => {
        filter.sortLog();
    });

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
