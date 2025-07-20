import { NiconicoVideo } from "../api/niconico-video.types.js";
import { CommentFilterLog } from "./log-comment.types.js";
import { VideoFilterLog } from "./log-video.types.js";

export type CommonLog = Map<string, string[]>;

export interface LogData {
    // フィルタリングログ
    commentFilterLog?: CommentFilterLog;
    videoFilterLog?: VideoFilterLog;

    series: SeriesData;
    videoId: string | null;
    tags: string[];
    playbackTime?: number;
}

export interface ProcessingTimeData {
    filtering?: number;
    saveLog?: number;
}

export interface SeriesData {
    hasNext: boolean;
    data?: NiconicoVideo;
}
