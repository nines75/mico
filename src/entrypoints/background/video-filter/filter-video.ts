import { IdFilter } from "./filter/id-filter.js";
import { UserNameFilter } from "./filter/user-name-filter.js";
import { TitleFilter } from "./filter/title-filter.js";
import { Settings } from "@/types/storage/settings.types.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";
import { PaidFilter } from "./filter/paid-filter.js";
import { ViewsFilter } from "./filter/views-filter.js";

export type Filters = FilteredData["filters"];

export interface FilteredData {
    filters: {
        idFilter: IdFilter;
        paidFilter: PaidFilter;
        viewsFilter: ViewsFilter;
        userNameFilter: UserNameFilter;
        titleFilter: TitleFilter;
    };
    loadedVideoCount: number;
    filteringTime: number;
    filteredIds: Set<string>;
}

export function filterVideo(
    videos: NiconicoVideo[],
    settings: Settings,
    isRecommend = false,
): FilteredData | undefined {
    if (!settings.isVideoFilterEnabled) return;

    const start = performance.now();

    const idFilter = new IdFilter(settings);
    const paidFilter = new PaidFilter(settings);
    const viewsFilter = new ViewsFilter(settings, isRecommend);
    const userNameFilter = new UserNameFilter(settings);
    const titleFilter = new TitleFilter(settings);

    const filters: Filters = {
        idFilter,
        paidFilter,
        viewsFilter,
        userNameFilter,
        titleFilter,
    };

    // フィルタリングの重複を避けるためにオブジェクトを作って渡す
    const data = { videos };
    Object.values(filters).forEach((filter) => {
        filter.filtering(data);
    });

    const filteredIds = new Set(
        Object.values(filters).flatMap((filter) => [
            ...filter.getFilteredVideos().keys(),
        ]),
    );

    if (settings.isCommentPreviewHidden) {
        data.videos.forEach((video) => (video.latestCommentSummary = ""));
    }

    const end = performance.now();

    return {
        filters,
        loadedVideoCount: videos.length,
        filteringTime: end - start,
        filteredIds,
    };
}

export function isNgVideo(video: NiconicoVideo, settings: Settings): boolean {
    const idFilter = new IdFilter(settings);
    const paidFilter = new PaidFilter(settings);
    const viewsFilter = new ViewsFilter(settings, true);
    const userNameFilter = new UserNameFilter(settings);
    const titleFilter = new TitleFilter(settings);

    const filters: Filters = {
        idFilter,
        paidFilter,
        viewsFilter,
        userNameFilter,
        titleFilter,
    };

    if (Object.values(filters).some((filter) => filter.isNgVideo(video))) {
        return true;
    }

    return false;
}
