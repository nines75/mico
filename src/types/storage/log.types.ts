import { CommentFilterLog } from "./log-comment.types.js";
import { VideoFilterLog } from "./log-video.types.js";
import { TabData } from "./tab.types.js";

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
