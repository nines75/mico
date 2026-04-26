import type { Video } from "../api/video.types";

export interface Tab {
    series: Series;

    playbackTime?: number;

    logId?: string;
    videoId: string;
    seriesId: string | undefined;
    title: string;
    ownerId: string | undefined;
    ownerName: string | undefined;
    tags: string[];
}

export interface Series {
    hasNext: boolean;
    video?: Video;
}
