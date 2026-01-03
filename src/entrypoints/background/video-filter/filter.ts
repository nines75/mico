import type { Settings } from "@/types/storage/settings.types.js";
import type { VideoMap } from "@/types/storage/log-video.types.js";
import type { NiconicoVideo } from "@/types/api/niconico-video.types.js";

export abstract class Filter<T> {
    protected blockedCount = 0;
    protected filteredVideos: VideoMap = new Map();
    protected settings: Settings;
    protected abstract log: T;

    constructor(settings: Settings) {
        this.settings = settings;
    }

    abstract filtering(data: { videos: NiconicoVideo[] }): void;
    abstract isNgVideo(video: NiconicoVideo): boolean;
    abstract sortLog(): void;

    getBlockedCount(): number {
        return this.blockedCount;
    }
    getFilteredVideos() {
        return this.filteredVideos;
    }
    getLog() {
        return this.log;
    }
}

export function sortVideoId(ids: string[], videos: VideoMap): string[] {
    const idsCopy = [...ids];

    idsCopy.sort((idA, idB) => {
        const a = videos.get(idA) as NiconicoVideo;
        const b = videos.get(idB) as NiconicoVideo;

        return a.title.localeCompare(b.title);
    });

    return idsCopy;
}
