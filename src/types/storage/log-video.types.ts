import { NiconicoVideo } from "../api/niconico-video.types.js";
import { ProcessingTimeData, CommonLog } from "./log.types.js";

/** videoId[] */
export type PaidLog = string[];
/** videoId[] */
export type ViewsLog = string[];
export interface IdLog {
    /** Map<userId, videoId[]> */
    userId: CommonLog;
    /** videoId[] */
    videoId: string[];
}

export type VideoData = Map<string, NiconicoVideo>;
export type VideoIdToUserId = Map<string, string>;

export interface VideoFilterLog {
    count: VideoCount;
    filtering: VideoFiltering;
    processingTime?: ProcessingTimeData;
}

export interface VideoCount {
    rule: {
        ngId: number;
        ngUserName: number;
        ngTitle: number;
    };
    blocked: {
        paid: number;
        views: number;
        ngId: number;
        ngUserName: number;
        ngTitle: number;
    };
    totalBlocked: number;
    loaded: number;
    invalid: number;
}

export interface VideoFiltering {
    paid: PaidLog;
    views: ViewsLog;
    ngId: IdLog;
    /** Map<rule, videoId[]> */
    ngUserName: CommonLog;
    /** Map<rule, videoId[]> */
    ngTitle: CommonLog;

    videos: VideoData;
    videoIdToUserId: VideoIdToUserId;
}
