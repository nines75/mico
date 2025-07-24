import { IdFilter } from "./filter/id-filter.js";
import { UserNameFilter } from "./filter/user-name-filter.js";
import { TitleFilter } from "./filter/title-filter.js";
import { Settings } from "@/types/storage/settings.types.js";
import { VideoIdToUserId } from "@/types/storage/log-video.types.js";
import { NiconicoVideo } from "@/types/api/niconico-video.types.js";

export interface FilteredData {
    filters: {
        idFilter: IdFilter;
        userNameFilter: UserNameFilter;
        titleFilter: TitleFilter;
    };
    loadedVideoCount: number;
    filteringTime: number;
    videoIdToUserId: VideoIdToUserId;
    filteredIds: Set<string>;
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
        data.videos.reduce<[string, string][]>((res, video) => {
            const userId = video.owner?.id;
            if (userId !== undefined) {
                res.push([video.id, userId]);
            }

            return res;
        }, []),
    );
    const filteredIds = new Set(
        Object.values(filters).flatMap((filter) => [
            ...filter.getVideos().keys(),
        ]),
    );

    const end = performance.now();

    return {
        filters,
        loadedVideoCount: videos.length,
        filteringTime: end - start,
        videoIdToUserId,
        filteredIds,
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
