import { NiconicoVideo } from "../api/niconico-video.types.js";

export interface TabData {
    series: SeriesData;

    playbackTime?: number;

    logId?: string;
    videoId: string;
    title: string;
    userId: string | number | undefined;
    userName: string | undefined;
    tags: string[];
}

export interface SeriesData {
    hasNext: boolean;
    data?: NiconicoVideo;
}
