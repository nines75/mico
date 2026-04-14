import type { FilteredData } from "./filter-comment";
import { sumNumbers } from "@/utils/util";
import { colors } from "@/utils/config";
import { mergeCount, setLog } from "@/utils/db";
import type { ConditionalKeys } from "type-fest";
import type { RuleFilter } from "./rule-filter";
import { getRuleFilters } from "./rule-filter";
import { setBadgeState } from "@/utils/browser";
import type { Count, LogData } from "@/types/storage/log.types";

export async function saveLog(
    filteredData: FilteredData,
    logId: string,
    tabId: number,
) {
    const comment = createCommentLog(filteredData);
    const count = createCount(filteredData);

    await Promise.all([
        setLog(
            async () => {
                return {
                    comment,
                    count: await mergeCount(count, logId),
                };
            },
            logId,
            tabId,
        ),
        setBadgeState(count.blockedComment, colors.commentBadge, tabId),
    ]);
}

export function createCommentLog(
    filteredData: FilteredData,
): NonNullable<LogData["comment"]> {
    const filteredComments = Object.values(filteredData.filters).flatMap(
        (filter) => filter.getFilteredComments(),
    );
    const renderedComments = filteredData.threads.flatMap((thread) =>
        thread.comments.map(({ body, userId, score }) => {
            return { body, userId, score };
        }),
    );

    return {
        strictUserIds: filteredData.strictUserIds,
        filteredComments,
        renderedComments,
    };
}

export function createCount(filteredData: FilteredData) {
    const filters = filteredData.filters;
    const ruleFilters = getRuleFilters(filters);

    const calc = (key: ConditionalKeys<RuleFilter, () => number>) => {
        return sumNumbers(
            Object.values(ruleFilters).map((filter) => filter[key]()),
        );
    };

    return {
        blockedComment: sumNumbers(
            Object.values(filters).map(
                (filter) => filter.getFilteredComments().length,
            ),
        ),
        loadedComment: filteredData.loadedCommentCount,
        include: calc("getIncludeCount"),
        exclude: calc("getExcludeCount"),
        disable: filters.commandFilter.getDisableCount(),
    } satisfies Count;
}
