import type { RenderedComment, Comment } from "../api/comment-api.types";
import type { Video } from "../api/video.types";
import type { Tab } from "./tab.types";

export type LogId = `${string}-${string}-${string}-${string}-${string}`;
export type LogTab = "commentFilter" | "videoFilter";

export interface Log {
    comment?: {
        strictRuleIds: string[];
        filteredComments: FilteredComment[];
        renderedComments: RenderedComment[];
    };
    video?: {
        filteredVideos: FilteredVideo[];
    };
    count?: Count;
    tab?: Tab;
}

export interface FilteredComment {
    ruleId?: string;
    pattern?: string | RegExp;
    comment: Comment;
    target:
        | "user-id"
        | "easy-comment"
        | "comment-assist"
        | "score"
        | "commands"
        | "body";
}

export interface FilteredVideo {
    ruleId?: string;
    pattern?: string | RegExp;
    video: Video;
    target: "id" | "owner-id" | "paid" | "view-count" | "owner-name" | "title";
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
