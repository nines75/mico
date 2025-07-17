import { FilteredData } from "./filter-comment.js";
import { loadSettings, setLog } from "@/utils/storage.js";
import { changeBadgeState } from "@/utils/util.js";
import { extractRule, getCustomFilters } from "./filter.js";
import { Settings } from "@/types/storage/settings.types.js";
import {
    CommentCount,
    CommentFiltering,
    CommentFilterLog,
} from "@/types/storage/log-comment.types.js";

export async function saveLog(filteredData: FilteredData, tabId: number) {
    const start = performance.now();

    // strictルールで追加されたNGユーザーIDを反映した設定を読み込んで反映
    const settings = await loadSettings();
    filteredData.filters.userIdFilter.setSettings(settings);

    const count = getCount(filteredData, settings);
    const filtering = getLog(filteredData);

    const commentFilterLog: CommentFilterLog = {
        count,
        filtering,
    };
    await Promise.all([
        setLog({ commentFilterLog }, tabId),
        changeBadgeState(
            settings.isPartialBadgeCount
                ? (count.totalBlocked - count.blocked.easyComment).toString()
                : count.totalBlocked.toString(),
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
        tabId,
    );
}

function getLog(filteredData: FilteredData): CommentFiltering {
    const { userIdFilter, scoreFilter, commandFilter, wordFilter } =
        filteredData.filters;
    const comments = new Map(
        Object.values(filteredData.filters).flatMap((filter) => [
            ...filter.getComments(),
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

function getCount(
    filteredData: FilteredData,
    settings: Settings,
): CommentCount {
    const { userIdFilter, scoreFilter, commandFilter, wordFilter } =
        filteredData.filters;

    const rule: CommentCount["rule"] = {
        ngUserId: extractRule(settings.ngUserId).length, // strictルールによる追加分を含めるために設定から取得
        ngCommand: commandFilter.getRuleCount(),
        ngWord: wordFilter.getRuleCount(),
    };
    const blocked: CommentCount["blocked"] = {
        easyComment: filteredData.easyCommentCount,
        ngUserId: userIdFilter.getCount(),
        ngScore: scoreFilter.getCount(),
        ngCommand: commandFilter.getCount(),
        ngWord: wordFilter.getCount(),
    };
    const customFilters = getCustomFilters(filteredData.filters);

    return {
        rule,
        blocked,
        totalBlocked: Object.values(blocked).reduce(
            (sum, value) => sum + value,
            0,
        ),
        loaded: filteredData.loadedCommentCount,
        include: Object.values(customFilters)
            .map((filter) => filter.getIncludeCount())
            .reduce((sum, current) => sum + current, 0),
        exclude: Object.values(customFilters)
            .map((filter) => filter.getExcludeCount())
            .reduce((sum, current) => sum + current, 0),
        disable: commandFilter.getDisableCount(),
        invalid: Object.values(customFilters)
            .map((filter) => filter.getInvalidCount())
            .reduce((sum, current) => sum + current, 0),
    };
}
