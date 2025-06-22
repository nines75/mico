import { NiconicoVideo, RecommendData } from "@/types/api/recommend.types.js";
import { IdFilter } from "./filter/id-filter.js";
import { UserNameFilter } from "./filter/user-name-filter.js";
import { TitleFilter } from "./filter/title-filter.js";
import { Settings } from "@/types/storage/settings.types.js";
import { LogData } from "@/types/storage/log.types.js";

export interface FilteredData {
    filters: {
        idFilter: IdFilter;
        userNameFilter: UserNameFilter;
        titleFilter: TitleFilter;
    };
    loadedVideoCount: number;
    filteringTime: number;
}

export function filterVideo(
    recommendData: RecommendData,
    settings: Settings,
    log: LogData | undefined,
): FilteredData | undefined {
    if (!settings.isVideoFilterEnabled) return;

    const start = performance.now();

    // シリーズの次の動画を追加
    const series = log?.series;
    if (series?.data !== undefined && series.hasNext) {
        const videoId = series.data.id;

        if (recommendData.items.every((item) => item.id !== videoId)) {
            recommendData.items.push({
                id: videoId,
                content: series.data,
                contentType: "video",
            });
        }
    }

    const loadedVideoCount = recommendData.items.length;

    const idFilter = new IdFilter(settings);
    const userNameFilter = new UserNameFilter(settings);
    const titleFilter = new TitleFilter(settings);

    const filters: FilteredData["filters"] = {
        idFilter,
        userNameFilter,
        titleFilter,
    };

    Object.values(filters).forEach((filter) => filter.filtering(recommendData));

    const end = performance.now();

    return {
        filters,
        loadedVideoCount,
        filteringTime: end - start,
    };
}

export function isNgVideo(video: NiconicoVideo, settings: Settings): boolean {
    const idFilter = new IdFilter(settings);
    const userNameFilter = new UserNameFilter(settings);
    const titleFilter = new TitleFilter(settings);

    const filters: FilteredData["filters"] = {
        idFilter,
        userNameFilter,
        titleFilter,
    };

    if (Object.values(filters).some((filter) => filter.isNgVideo(video))) {
        return true;
    }

    return false;
}
