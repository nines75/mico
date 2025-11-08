import { FilteredData } from "./filter-comment.js";
import { loadSettings } from "@/utils/storage.js";
import { changeBadgeState, sumNumbers } from "@/utils/util.js";
import { getCustomFilters } from "./filter.js";
import { Settings } from "@/types/storage/settings.types.js";
import {
    CommentCount,
    CommentFiltering,
} from "@/types/storage/log-comment.types.js";
import { colors } from "@/utils/config.js";
import { parseFilter } from "../filter.js";
import { setLog } from "@/utils/db.js";

export async function saveLog(
    filteredData: FilteredData,
    logId: string,
    tabId: number,
) {
    const start = performance.now();

    // strictルールで追加されたNGユーザーIDを反映した設定を読み込んで反映
    const settings = await loadSettings();
    filteredData.filters.userIdFilter.setSettings(settings);

    const count = getCount(filteredData, settings);
    const filtering = getLog(filteredData);

    await Promise.all([
        setLog({ commentFilterLog: { count, filtering } }, logId, tabId),
        changeBadgeState(
            settings.isHiddenEasyCommentAdded
                ? count.totalBlocked
                : count.totalBlocked - count.blocked.easyComment,
            colors.commentBadge,
            tabId,
        ),
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

export function getCount(
    filteredData: FilteredData,
    settings: Settings,
): CommentCount {
    const { userIdFilter, scoreFilter, commandFilter, wordFilter } =
        filteredData.filters;

    const rule: CommentCount["rule"] = {
        ngUserId: parseFilter(settings.ngUserId).length, // strictルールによる追加分を含めるために設定から取得
        ngCommand: commandFilter.countRules(),
        ngWord: wordFilter.countRules(),
    };
    const blocked: CommentCount["blocked"] = {
        easyComment: filteredData.easyCommentCount,
        ngUserId: userIdFilter.countBlocked(),
        ngScore: scoreFilter.countBlocked(),
        ngCommand: commandFilter.countBlocked(),
        ngWord: wordFilter.countBlocked(),
    };
    const customFilters = getCustomFilters(filteredData.filters);

    return {
        rule,
        blocked,
        totalBlocked: sumNumbers(Object.values(blocked)),
        loaded: filteredData.loadedCommentCount,
        include: sumNumbers(
            Object.values(customFilters).map((filter) =>
                filter.getIncludeCount(),
            ),
        ),
        exclude: sumNumbers(
            Object.values(customFilters).map((filter) =>
                filter.getExcludeCount(),
            ),
        ),
        disable: commandFilter.getDisableCount(),
        invalid: sumNumbers(
            Object.values(customFilters).map((filter) =>
                filter.getInvalidCount(),
            ),
        ),
    };
}

export function getLog(filteredData: FilteredData): CommentFiltering {
    const { userIdFilter, scoreFilter, commandFilter, wordFilter } =
        filteredData.filters;
    const comments = new Map(
        Object.values(filteredData.filters).flatMap((filter) => [
            ...filter.getFilteredComments(),
        ]),
    );

    Object.values(filteredData.filters).forEach((filter) => filter.sortLog());

    return {
        ngUserId: userIdFilter.getLog(),
        ngScore: scoreFilter.getLog(),
        ngCommand: commandFilter.getLog(),
        ngWord: wordFilter.getLog(),
        strictNgUserIds: filteredData.strictNgUserIds,
        noToUserId: filteredData.noToUserId,
        comments,
    };
}
