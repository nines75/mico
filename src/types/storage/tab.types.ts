import { NiconicoVideo } from "../api/niconico-video.types.js";

export interface TabData {
    series: SeriesData;

    playbackTime?: number;

    logId?: string;
    videoId: string | null;
    title: string | null;
    userId: string | number | null;
    userName: string | null;
    tags: string[];
}

export interface SeriesData {
    hasNext: boolean;
    data?: NiconicoVideo;
}
