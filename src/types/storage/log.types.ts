import { NiconicoComment } from "../api/comment.types.js";

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

export interface LogData {
    videoData?: VideoData;
    playbackTime?: number;
    processingTime?: ProcessingTimeData;
}

export interface VideoData {
    count: {
        items: {
            easyComment: number;
            ngUserId: number;
            ngScore: number;
            ngCommand: number;
            ngWord: number;
        };
        blocked: number;
        loaded: number;
        include: number;
        exclude: number;
        disable: number;
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
