import { FilteredData } from "./filter-comment.js";
import { loadSettings } from "@/utils/storage.js";
import { changeBadgeState, sumNumbers } from "@/utils/util.js";
import {
    CustomFilter,
    getCountableFilters,
    getCustomFilters,
} from "./filter.js";
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

    // strictルールで追加されたNGユーザーIDを反映した設定を読み込んで反映
    const settings = await loadSettings();
    filteredData.filters.userIdFilter.setSettings(settings);

    const count = getCount(filteredData);
    const filtering = getLog(filteredData);

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

export function getCount(filteredData: FilteredData): CommentCount {
    const filters = filteredData.filters;
    const countableFilters = getCountableFilters(filters);
    const customFilters = getCustomFilters(filters);

    const rule = objectEntries(countableFilters).reduce<Partial<RuleCount>>(
        (obj, [key, filter]) => {
            obj[key] = filter.countRules();
            return obj;
        },
        {},
    ) as RuleCount;
    const blocked = objectEntries(filters).reduce<Partial<BlockedCount>>(
        (obj, [key, filter]) => {
            obj[key] = filter.countBlocked();
            return obj;
        },
        {},
    ) as BlockedCount;

    const calc = (
        key: ConditionalKeys<CustomFilter<unknown>, () => number>,
    ) => {
        return sumNumbers(
            Object.values(customFilters).map((filter) => filter[key]()),
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

export function getLog(filteredData: FilteredData): CommentFiltering {
    const filters = filteredData.filters;
    const filteredComments = new Map(
        Object.values(filters).flatMap((filter) => [
            ...filter.getFilteredComments(),
        ]),
    );
    const renderedComments = filteredData.threads.flatMap((thread) =>
        thread.comments.map((comment) => {
            const { body, userId, no } = comment;

            return { body, userId, no, fork: thread.fork };
        }),
    );

    Object.values(filters).forEach((filter) => filter.sortLog());

    // ソート後にログを取得
    const logFilters = Object.fromEntries(
        Object.entries(filters).map(([key, filter]) => [key, filter.getLog()]),
    ) as LogFilters;

    return {
        strictNgUserIds: filteredData.strictNgUserIds,
        filters: logFilters,
        filteredComments,
        renderedComments,
    };
}
