import type { NiconicoVideo } from "../api/niconico-video.types.js";
import type { ProcessingTimeData, CommonLog } from "./log.types.js";

export type PaidLog = string[];
export type ViewsLog = string[];
export interface IdLog {
    /** Map<regex, videoId[]> */
    regex: CommonLog;
    /** Map<userId, videoId[]> */
    userId: CommonLog;
    /** videoId[] */
    videoId: string[];
}

export type RuleCount = VideoCount["rule"];
export type BlockedCount = VideoCount["blocked"];
export type LogFilters = VideoFiltering["filters"];

export type VideoMap = Map<string, NiconicoVideo>;

export interface VideoFilterLog {
    count?: VideoCount;
    filtering?: VideoFiltering;
    processingTime?: ProcessingTimeData;
}

export interface VideoCount {
    rule: {
        idFilter: number;
        userNameFilter: number;
        titleFilter: number;
    };
    blocked: {
        idFilter: number;
        paidFilter: number;
        viewsFilter: number;
        userNameFilter: number;
        titleFilter: number;
    };
    totalBlocked: number;
    loaded: number;
    invalid: number;
}

export interface VideoFiltering {
    filters: {
        idFilter: IdLog;
        /** videoId[] */
        paidFilter: PaidLog;
        /** videoId[] */
        viewsFilter: ViewsLog;
        /** Map<rule, videoId[]> */
        userNameFilter: CommonLog;
        /** Map<rule, videoId[]> */
        titleFilter: CommonLog;
    };
    filteredVideos: VideoMap;
}
