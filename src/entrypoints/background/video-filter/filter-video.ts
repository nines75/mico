import { RecommendData } from "@/types/api/recommend.types.js";
import { IdFilter } from "./filter/id-filter.js";
import { UserNameFilter } from "./filter/user-name-filter.js";
import { VideoTitleFilter } from "./filter/video-title-filter.js";
import { Settings } from "@/types/storage/settings.types.js";

export function filterVideo(recommendData: RecommendData, settings: Settings) {
    const idFilter = new IdFilter(settings);
    const userNameFilter = new UserNameFilter(settings);
    const videoTitleFilter = new VideoTitleFilter(settings);

    idFilter.filtering(recommendData);
    userNameFilter.filtering(recommendData);
    videoTitleFilter.filtering(recommendData);
}
