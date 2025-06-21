import { FilteredData } from "./filter-video.js";
import {
    VideoCount,
    VideoFiltering,
    VideoFilterLog,
} from "@/types/storage/log.types.js";
import { getCommonFilters } from "./filter.js";
import { setLog } from "@/utils/storage.js";

export async function saveLog(filteredData: FilteredData, tabId: number) {
    const start = performance.now();

    const count = getCount(filteredData);
    const filtering = getLog(filteredData);

    const end = performance.now();

    const value: VideoFilterLog = {
        count,
        filtering,
        processingTime: {
            saveVideoLog: end - start,
        },
    };

    await setLog({ videoFilterLog: value }, tabId);
}

function getLog(filteredData: FilteredData): VideoFiltering {
    const { idFilter, userNameFilter, titleFilter } = filteredData.filters;

    Object.values(filteredData.filters).forEach((filter) => filter.sortLog());
    const videos = new Map(
        Object.values(filteredData.filters).flatMap((filter) => [
            ...filter.getVideos(),
        ]),
    );

    return {
        ngId: idFilter.getLog(),
        ngUserName: userNameFilter.getLog(),
        ngTitle: titleFilter.getLog(),
        videos: videos,
    };
}

function getCount(filteredData: FilteredData): VideoCount {
    const rule: VideoCount["rule"] = {
        ngId: filteredData.filters.idFilter.getRuleCount(),
        ngUserName: filteredData.filters.userNameFilter.getRuleCount(),
        ngTitle: filteredData.filters.titleFilter.getRuleCount(),
    };
    const blocked: VideoCount["blocked"] = {
        ngId: filteredData.filters.idFilter.getCount(),
        ngUserName: filteredData.filters.userNameFilter.getCount(),
        ngTitle: filteredData.filters.titleFilter.getCount(),
    };

    const commonFilters = getCommonFilters(filteredData.filters);

    return {
        rule,
        blocked,
        totalBlocked: Object.values(blocked).reduce(
            (sum, value) => sum + value,
            0,
        ),
        loaded: filteredData.loadedVideoCount,
        invalid: Object.values(commonFilters)
            .map((filter) => filter.getInvalidCount())
            .reduce((sum, current) => sum + current, 0),
    };
}
