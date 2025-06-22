import { NiconicoComment } from "../api/comment.types.js";
import { NiconicoVideo } from "../api/recommend.types.js";

/** Map<comment.userId, comment.id[]> */
export type UserIdLog = Map<string, string[]>;
/** comment.id[] */
export type ScoreLog = string[];
/** Map<rule, comment.id[]> */
export type CommandLog = Map<string, string[]>;
/** Map<rule, Map<comment.body, comment.id[]>> */
export type WordLog = Map<string, Map<string, string[]>>;

export type CommentData = Map<string, NiconicoComment>;

export type NoToUserId = Map<number, string>;

/** Map<rule, videoId[]> */
export type CommonVideoFilterLog = Map<string, string[]>;

export interface IdLog {
    /** Map<userId, videoId[]> */
    userId: Map<string, string[]>;
    /** videoId[] */
    videoId: string[];
}

export type NiconicoVideoData = Map<string, NiconicoVideo>;

export interface LogData {
    videoData?: VideoData;
    playbackTime?: number;
    processingTime?: ProcessingTimeData;
    videoFilterLog?: VideoFilterLog;
    series?: SeriesData;
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
    ngUserName: CommonVideoFilterLog;
    ngTitle: CommonVideoFilterLog;
    videos: NiconicoVideoData;
}

interface SeriesData {
    hasNext: boolean;
    data?: NiconicoVideo;
}
