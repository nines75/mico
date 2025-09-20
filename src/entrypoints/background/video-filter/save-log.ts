import {
    VideoFilterLog,
    VideoFiltering,
    VideoCount,
} from "@/types/storage/log-video.types.js";
import { FilteredData } from "./filter-video.js";
import {} from "@/types/storage/log.types.js";
import { setLog } from "@/utils/storage.js";
import { changeBadgeState } from "@/utils/util.js";
import { colors } from "@/utils/config.js";

export async function saveLog(
    filteredData: FilteredData,
    tabId: number,
    isChangeBadge = false,
) {
    const start = performance.now();

    const count = getCount(filteredData);
    const filtering = getLog(filteredData);

    const videoFilterLog: VideoFilterLog = {
        count,
        filtering,
    };
    await Promise.all([
        setLog({ videoFilterLog }, tabId),
        ...[
            isChangeBadge
                ? changeBadgeState(count.totalBlocked, colors.videoBadge, tabId)
                : [],
        ],
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
        totalBlocked: Object.values(blocked).reduce(
            (sum, value) => sum + value,
            0,
        ),
        loaded: filteredData.loadedVideoCount,
        invalid: Object.values(filteredData.filters)
            .map((filter) => filter.getInvalidCount())
            .reduce((sum, current) => sum + current, 0),
    };
}

function getLog(filteredData: FilteredData): VideoFiltering {
    const { paidFilter, viewsFilter, idFilter, userNameFilter, titleFilter } =
        filteredData.filters;
    const videos = new Map(
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
        videos: videos,
    };
}
