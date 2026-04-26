import type { Settings } from "@/types/storage/settings.types";
import type { Video } from "@/types/api/video.types";
import type { FilteredVideo } from "@/types/storage/log.types";

export abstract class Filter {
    protected settings: Settings;
    protected filteredVideos: FilteredVideo[] = [];

    constructor(settings: Settings) {
        this.settings = settings;
    }

    abstract apply(data: { videos: Video[] }): void;

    getFilteredVideos() {
        return this.filteredVideos;
    }
}
