import type { Settings } from "@/types/storage/settings.types";
import type { NiconicoVideo } from "@/types/api/niconico-video.types";
import type { FilteredVideo } from "@/types/storage/log.types";

export abstract class Filter {
    protected settings: Settings;
    protected filteredVideos: FilteredVideo[] = [];

    constructor(settings: Settings) {
        this.settings = settings;
    }

    abstract filtering(data: { videos: NiconicoVideo[] }): void;

    getFilteredVideos() {
        return this.filteredVideos;
    }
}
