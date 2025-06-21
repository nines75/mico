import { RecommendData } from "@/types/api/recommend.types.js";
import { IdFilter } from "./filter/id-filter.js";
import { UserNameFilter } from "./filter/user-name-filter.js";
import { TitleFilter } from "./filter/title-filter.js";
import { Settings } from "@/types/storage/settings.types.js";

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
): FilteredData | undefined {
    const start = performance.now();

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
