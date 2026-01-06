import type { CommentFilterLog } from "./log-comment.types";
import type { VideoFilterLog } from "./log-video.types";
import type { TabData } from "./tab.types";

export type LogId = `${string}-${string}-${string}-${string}-${string}`;
export type CommonLog = Map<string, string[]>;

export interface LogData {
    // フィルタリングログ
    commentFilterLog?: CommentFilterLog;
    videoFilterLog?: VideoFilterLog;

    tab?: TabData;
}

export interface ProcessingTimeData {
    filtering?: number;
    saveLog?: number;
}
