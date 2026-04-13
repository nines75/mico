import type { CommentFilterLog } from "./log-comment.types";
import type { VideoFilterLog } from "./log-video.types";
import type { TabData } from "./tab.types";

export type LogId = `${string}-${string}-${string}-${string}-${string}`;

export interface LogData {
    // フィルタリングログ
    commentFilterLog?: CommentFilterLog;
    videoFilterLog?: VideoFilterLog;

    tab?: TabData;
    count?: Count;
}

export interface Count {
    blockedComment?: number;
    loadedComment?: number;
    blockedVideo?: number;
    loadedVideo?: number;
    include?: number;
    exclude?: number;
    disable?: number;
}
