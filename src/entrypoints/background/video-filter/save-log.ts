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

function getLog(filteredData: FilteredData): VideoFiltering {
    const { paidFilter, idFilter, userNameFilter, titleFilter } =
        filteredData.filters;
    const videos = new Map(
        Object.values(filteredData.filters).flatMap((filter) => [
            ...filter.getVideos(),
        ]),
    );

    Object.values(filteredData.filters).forEach((filter) => filter.sortLog());

    return {
        paid: paidFilter.getLog(),
        ngId: idFilter.getLog(),
        ngUserName: userNameFilter.getLog(),
        ngTitle: titleFilter.getLog(),
        videos: videos,
        videoIdToUserId: filteredData.videoIdToUserId,
    };
}

function getCount(filteredData: FilteredData): VideoCount {
    const rule: VideoCount["rule"] = {
        ngId: filteredData.filters.idFilter.getRuleCount(),
        ngUserName: filteredData.filters.userNameFilter.getRuleCount(),
        ngTitle: filteredData.filters.titleFilter.getRuleCount(),
    };
    const blocked: VideoCount["blocked"] = {
        paid: filteredData.filters.paidFilter.getCount(),
        ngId: filteredData.filters.idFilter.getCount(),
        ngUserName: filteredData.filters.userNameFilter.getCount(),
        ngTitle: filteredData.filters.titleFilter.getCount(),
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
