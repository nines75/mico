import { NiconicoVideo } from "@/types/api/recommend.types.js";
import { IdFilter } from "./filter/id-filter.js";
import { UserNameFilter } from "./filter/user-name-filter.js";
import { TitleFilter } from "./filter/title-filter.js";
import { Settings } from "@/types/storage/settings.types.js";
import { VideoIdToUserId } from "@/types/storage/log-video.types.js";

export interface FilteredData {
    filters: {
        idFilter: IdFilter;
        userNameFilter: UserNameFilter;
        titleFilter: TitleFilter;
    };
    loadedVideoCount: number;
    filteringTime: number;
    videoIdToUserId: VideoIdToUserId;
}

export function filterVideo(
    videos: NiconicoVideo[],
    settings: Settings,
): FilteredData | undefined {
    if (!settings.isVideoFilterEnabled) return;

    const start = performance.now();

    const idFilter = new IdFilter(settings);
    const userNameFilter = new UserNameFilter(settings);
    const titleFilter = new TitleFilter(settings);

    const filters: FilteredData["filters"] = {
        idFilter,
        userNameFilter,
        titleFilter,
    };

    // フィルタリングの重複を避けるためにオブジェクトを作って渡す
    const data = { videos };
    Object.values(filters).forEach((filter) => filter.filtering(data));

    const videoIdToUserId = new Map(
        data.videos.map((video) => [video.id, video.owner.id]),
    );

    const end = performance.now();

    return {
        filters,
        loadedVideoCount: videos.length,
        filteringTime: end - start,
        videoIdToUserId,
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
