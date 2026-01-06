import type { NiconicoVideo } from "../api/niconico-video.types";

export interface TabData {
    series: SeriesData;

    playbackTime?: number;

    logId?: string;
    videoId: string;
    seriesId: string | undefined;
    title: string;
    userId: string | undefined;
    userName: string | undefined;
    tags: string[];
}

export interface SeriesData {
    hasNext: boolean;
    data?: NiconicoVideo;
}
