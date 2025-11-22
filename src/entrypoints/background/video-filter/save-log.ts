import { VideoFiltering, VideoCount } from "@/types/storage/log-video.types.js";
import { FilteredData } from "./filter-video.js";
import { changeBadgeState, sumNumbers } from "@/utils/util.js";
import { colors } from "@/utils/config.js";
import { setLog } from "@/utils/db.js";

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
    const { paidFilter, viewsFilter, idFilter, userNameFilter, titleFilter } =
        filteredData.filters;

    const rule: VideoCount["rule"] = {
        ngId: idFilter.countRules(),
        ngUserName: userNameFilter.countRules(),
        ngTitle: titleFilter.countRules(),
    };
    const blocked: VideoCount["blocked"] = {
        paid: paidFilter.countBlocked(),
        views: viewsFilter.countBlocked(),
        ngId: idFilter.countBlocked(),
        ngUserName: userNameFilter.countBlocked(),
        ngTitle: titleFilter.countBlocked(),
    };

    return {
        rule,
        blocked,
        totalBlocked: sumNumbers(Object.values(blocked)),
        loaded: filteredData.loadedVideoCount,
        invalid: sumNumbers(
            Object.values(filteredData.filters).map((filter) =>
                filter.getInvalidCount(),
            ),
        ),
    };
}

function getLog(filteredData: FilteredData): VideoFiltering {
    const { paidFilter, viewsFilter, idFilter, userNameFilter, titleFilter } =
        filteredData.filters;
    const filteredVideos = new Map(
        Object.values(filteredData.filters).flatMap((filter) => [
            ...filter.getFilteredVideos(),
        ]),
    );

    Object.values(filteredData.filters).forEach((filter) => filter.sortLog());

    return {
        paid: paidFilter.getLog(),
        views: viewsFilter.getLog(),
        ngId: idFilter.getLog(),
        ngUserName: userNameFilter.getLog(),
        ngTitle: titleFilter.getLog(),
        filteredVideos,
    };
}
