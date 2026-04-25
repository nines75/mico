import { OwnerNameFilter } from "./filter/user-name-filter";
import { TitleFilter } from "./filter/title-filter";
import type { Settings } from "@/types/storage/settings.types";
import type { Video } from "@/types/api/niconico-video.types";
import { PaidFilter } from "./filter/paid-filter";
import { ViewCountFilter } from "./filter/views-filter";
import { IdFilter } from "./filter/video-id-filter";
import { OwnerIdFilter } from "./filter/video-owner-id-filter";

export type Filters = FilteringResult["filters"];

export interface FilteringResult {
    filters: {
        idFilter: IdFilter;
        ownerIdFilter: OwnerIdFilter;
        paidFilter: PaidFilter;
        viewCountFilter: ViewCountFilter;
        ownerNameFilter: OwnerNameFilter;
        titleFilter: TitleFilter;
    };
    loadedVideoCount: number;
    filteredIds: Set<string>;
}

export function filterVideo(
    videos: Video[],
    settings: Settings,
    forRecommendApi = false,
): FilteringResult | undefined {
    if (!settings.isVideoFilterEnabled) return;

    const idFilter = new IdFilter(settings);
    const ownerIdFilter = new OwnerIdFilter(settings);
    const paidFilter = new PaidFilter(settings);
    const viewCountFilter = new ViewCountFilter(settings, forRecommendApi);
    const ownerNameFilter = new OwnerNameFilter(settings);
    const titleFilter = new TitleFilter(settings);

    const filters: Filters = {
        idFilter,
        ownerIdFilter,
        paidFilter,
        viewCountFilter,
        ownerNameFilter,
        titleFilter,
    };

    // フィルタリングの重複を避けるためにオブジェクトを作って渡す
    const data = { videos };
    for (const filter of Object.values(filters)) {
        filter.apply(data);
    }

    const filteredIds = new Set(
        Object.values(filters).flatMap((filter) =>
            filter.getFilteredVideos().map(({ video }) => video.id),
        ),
    );

    if (settings.isCommentPreviewHidden) {
        for (const video of data.videos) video.latestCommentSummary = "";
    }

    return {
        filters,
        loadedVideoCount: videos.length,
        filteredIds,
    };
}
