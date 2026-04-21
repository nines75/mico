import type { NiconicoVideo } from "../api/niconico-video.types";

export interface TabData {
    series: SeriesData;

    playbackTime?: number;

    logId?: string;
    videoId: string;
    seriesId: string | undefined;
    title: string;
    ownerId: string | undefined;
    ownerName: string | undefined;
    tags: string[];
}

export interface SeriesData {
    hasNext: boolean;
    data?: NiconicoVideo;
}
