import { VideoData } from "@/types/storage/log.types.js";
import { FilteredData } from "./filter-comment.js";
import { loadSettings, setLog } from "@/utils/storage.js";
import { changeBadgeState, saveProcessingTime } from "@/utils/util.js";
import { getCustomFilters } from "./filter.js";

export async function saveVideoLog(filteredData: FilteredData, tabId: number) {
    const start = performance.now();

    // strictルールで追加されたNGユーザーIDを反映した設定を読み込んで反映
    const settings = await loadSettings();
    filteredData.filters.userIdFilter.setSettings(settings);

    const count = getCount(filteredData);
    const videoLog = getVideoLog(filteredData);

    // 各関数ですべてのプロパティが存在することは保証されているのでRequiredDeepは不要
    const value: VideoData = { count, log: videoLog };

    await Promise.all([
        setLog({ videoData: value }, tabId),
        changeBadgeState(
            settings.isPartialBadgeCount
                ? (count.blocked - count.items.easyComment).toString()
                : count.blocked.toString(),
            tabId,
        ),
    ]);

    const end = performance.now();
    await saveProcessingTime([["saveVideoLog", end - start]], tabId);
}

function getVideoLog(filteredData: FilteredData): VideoData["log"] {
    const { userIdFilter, scoreFilter, commandFilter, wordFilter } =
        filteredData.filters;

    const comments = new Map(
        Object.values(filteredData.filters).flatMap((filter) => [
            ...filter.getComments(),
        ]),
    );

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

function getCount(filteredData: FilteredData): VideoData["count"] {
    const { userIdFilter, scoreFilter, commandFilter, wordFilter } =
        filteredData.filters;

    const items: VideoData["count"]["items"] = {
        easyComment: filteredData.easyCommentCount,
        ngUserId: userIdFilter.getCount(),
        ngScore: scoreFilter.getCount(),
        ngCommand: commandFilter.getCount(),
        ngWord: wordFilter.getCount(),
    };
    const customFilters = getCustomFilters(filteredData.filters);

    return {
        items,
        blocked: Object.values(items).reduce((sum, value) => sum + value, 0),
        loaded: filteredData.loadedCommentCount,
        include: Object.values(customFilters)
            .map((filter) => filter.getIncludeCount())
            .reduce((sum, current) => sum + current, 0),
        exclude: Object.values(customFilters)
            .map((filter) => filter.getExcludeCount())
            .reduce((sum, current) => sum + current, 0),
        disable: commandFilter.getDisableCount(),
    };
}
