import type { NiconicoComment, RenderedComment } from "../api/comment.types";
import type { CommonLog, ProcessingTimeData } from "./log.types";

export type ScoreLog = string[];
export type WordLog = Map<string, Map<string, string[]>>;

export type CommentMap = Map<string, NiconicoComment>;

export type RuleCount = CommentCount["rule"];
export type BlockedCount = CommentCount["blocked"];
export type LogFilters = CommentFiltering["filters"];

export interface CommentFilterLog {
    count?: CommentCount;
    filtering?: CommentFiltering;
    processingTime?: ProcessingTimeData;
}

export interface CommentCount {
    rule: {
        userIdFilter: number;
        commandFilter: number;
        wordFilter: number;
    };
    blocked: {
        userIdFilter: number;
        easyCommentFilter: number;
        commentAssistFilter: number;
        scoreFilter: number;
        commandFilter: number;
        wordFilter: number;
    };
    totalBlocked: number;
    loaded: number;
    include: number;
    exclude: number;
    disable: number;
    invalid: number;
}

export interface CommentFiltering {
    filters: {
        /** Map<comment.userId, comment.id[]> */
        userIdFilter: CommonLog;
        /** Map<comment.body, comment.id[]> */
        easyCommentFilter: CommonLog;
        /** Map<comment.body, comment.id[]> */
        commentAssistFilter: CommonLog;
        /** comment.id[] */
        scoreFilter: ScoreLog;
        /** Map<rule, comment.id[]> */
        commandFilter: CommonLog;
        /** Map<rule, Map<comment.body, comment.id[]>> */
        wordFilter: WordLog;
    };
    strictUserIds: string[];
    filteredComments: CommentMap;
    renderedComments: RenderedComment[];
}
