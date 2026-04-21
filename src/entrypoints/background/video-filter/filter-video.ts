import { UserNameFilter } from "./filter/user-name-filter";
import { TitleFilter } from "./filter/title-filter";
import type { Settings } from "@/types/storage/settings.types";
import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import { PaidFilter } from "./filter/paid-filter";
import { ViewsFilter } from "./filter/views-filter";
import { VideoIdFilter } from "./filter/video-id-filter";
import { VideoOwnerIdFilter } from "./filter/video-owner-id-filter";

export type Filters = FilteredData["filters"];

export interface FilteredData {
    filters: {
        videoIdFilter: VideoIdFilter;
        videoOwnerIdFilter: VideoOwnerIdFilter;
        paidFilter: PaidFilter;
        viewsFilter: ViewsFilter;
        userNameFilter: UserNameFilter;
        titleFilter: TitleFilter;
    };
    loadedVideoCount: number;
    filteredIds: Set<string>;
}

export function filterVideo(
    videos: NiconicoVideo[],
    settings: Settings,
    isRecommend = false,
): FilteredData | undefined {
    if (!settings.isVideoFilterEnabled) return;

    const videoIdFilter = new VideoIdFilter(settings);
    const videoOwnerIdFilter = new VideoOwnerIdFilter(settings);
    const paidFilter = new PaidFilter(settings);
    const viewsFilter = new ViewsFilter(settings, isRecommend);
    const userNameFilter = new UserNameFilter(settings);
    const titleFilter = new TitleFilter(settings);

    const filters: Filters = {
        videoIdFilter,
        videoOwnerIdFilter,
        paidFilter,
        viewsFilter,
        userNameFilter,
        titleFilter,
    };

    // フィルタリングの重複を避けるためにオブジェクトを作って渡す
    const data = { videos };
    for (const filter of Object.values(filters)) {
        filter.filtering(data);
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
