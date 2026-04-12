import type { FilteredData } from "./filter-comment";
import { sumNumbers } from "@/utils/util";
import type {
    CommentCount,
    CommentFiltering,
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
    const count = createCount(filteredData);
    const filtering = createFiltering(filteredData);

    await Promise.all([
        setLog({ commentFilterLog: { count, filtering } }, logId, tabId),
        setBadgeState(count.totalBlocked, colors.commentBadge, tabId),
    ]);
}

export function createCount(filteredData: FilteredData): CommentCount {
    const filters = filteredData.filters;
    const ruleFilters = getRuleFilters(filters);

    const calc = (key: ConditionalKeys<RuleFilter, () => number>) => {
        return sumNumbers(
            Object.values(ruleFilters).map((filter) => filter[key]()),
        );
    };

    return {
        totalBlocked: sumNumbers(
            Object.values(filters).map(
                (filter) => filter.getFilteredComments().length,
            ),
        ),
        loaded: filteredData.loadedCommentCount,
        include: calc("getIncludeCount"),
        exclude: calc("getExcludeCount"),
        invalid: calc("getInvalidCount"),
        disable: filters.commandFilter.getDisableCount(),
    };
}

export function createFiltering(filteredData: FilteredData): CommentFiltering {
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
