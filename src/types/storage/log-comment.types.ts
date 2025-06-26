import { NiconicoComment } from "../api/comment.types.js";
import { CommonLog, ProcessingTimeData } from "./log.types.js";

export type ScoreLog = string[];
export type WordLog = Map<string, Map<string, string[]>>;

export type CommentData = Map<string, NiconicoComment>;
export type NoToUserId = Map<number, string>;

export interface CommentFilterLog {
    count: CommentCount;
    filtering: CommentFiltering;
    processingTime: ProcessingTimeData;
}

export interface CommentCount {
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
}

export interface CommentFiltering {
    /** Map<comment.userId, comment.id[]> */
    ngUserId: CommonLog;
    /** comment.id[] */
    ngScore: ScoreLog;
    /** Map<rule, comment.id[]> */
    ngCommand: CommonLog;
    /** Map<rule, Map<comment.body, comment.id[]>> */
    ngWord: WordLog;

    strictNgUserIds: Set<string>;
    comments: CommentData;
    noToUserId: NoToUserId;
}
