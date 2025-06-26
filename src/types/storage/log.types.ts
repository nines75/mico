import { NiconicoComment } from "../api/comment.types.js";
import { NiconicoVideo } from "../api/recommend.types.js";

export type CommonLog = Map<string, string[]>;

/** Map<comment.userId, comment.id[]> */
export type UserIdLog = CommonLog;
/** comment.id[] */
export type ScoreLog = string[];
/** Map<rule, comment.id[]> */
export type CommandLog = CommonLog;
/** Map<rule, Map<comment.body, comment.id[]>> */
export type WordLog = Map<string, Map<string, string[]>>;

export type CommentData = Map<string, NiconicoComment>;

export type NoToUserId = Map<number, string>;

export interface IdLog {
    /** Map<userId, videoId[]> */
    userId: CommonLog;
    /** videoId[] */
    videoId: string[];
}

export type NiconicoVideoData = Map<string, NiconicoVideo>;

export type VideoIdToUserId = Map<string, string>;

export interface LogData {
    videoData?: VideoData;
    playbackTime?: number;
    processingTime?: ProcessingTimeData;
    videoFilterLog?: VideoFilterLog;
    series?: SeriesData;
    videoId?: string | null;
}

export interface VideoData {
    count: {
        rule: {
            ngUserId: number;
            ngCommand: number;
            ngWord: number;
        };
        blocked: {
            easyComment: number;
            ngUserId: number;
            ngScore: number;
            ngCommand: number;
            ngWord: number;
        };
        totalBlocked: number;
        loaded: number;
        include: number;
        exclude: number;
        disable: number;
        invalid: number;
    };
    log: VideoLog;
}

export interface VideoLog {
    ngUserId: UserIdLog;
    ngScore: ScoreLog;
    ngCommand: CommandLog;
    ngWord: WordLog;
    strictNgUserIds: Set<string>;
    comments: CommentData;
    noToUserId: NoToUserId;
}

export interface ProcessingTimeData {
    filtering?: number;
    fetchTag?: number;
    saveVideoLog?: number;
}

export interface VideoFilterLog {
    count: VideoCount;
    filtering: VideoFiltering;
    processingTime: ProcessingTimeData;
}

export interface VideoCount {
    rule: {
        ngId: number;
        ngUserName: number;
        ngTitle: number;
    };
    blocked: {
        ngId: number;
        ngUserName: number;
        ngTitle: number;
    };
    totalBlocked: number;
    loaded: number;
    invalid: number;
}

export interface VideoFiltering {
    ngId: IdLog;
    /** Map<rule, videoId[]> */
    ngUserName: CommonLog;
    /** Map<rule, videoId[]> */
    ngTitle: CommonLog;
    videos: NiconicoVideoData;
    videoIdToUserId: VideoIdToUserId;
}

interface SeriesData {
    hasNext: boolean;
    data?: NiconicoVideo;
}
