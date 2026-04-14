import type { RenderedComment, NiconicoComment } from "../api/comment.types";
import type { NiconicoVideo } from "../api/niconico-video.types";
import type { TabData } from "./tab.types";

export type LogId = `${string}-${string}-${string}-${string}-${string}`;

export interface LogData {
    comment?: {
        strictUserIds: string[];
        filteredComments: FilteredComment[];
        renderedComments: RenderedComment[];
    };
    video?: {
        filteredVideos: FilteredVideo[];
    };
    count?: Count;
    tab?: TabData;
}

export interface FilteredComment {
    id?: string;
    pattern?: string | RegExp;
    comment: NiconicoComment;
    target:
        | "user-id"
        | "easy-comment"
        | "comment-assist"
        | "score"
        | "commands"
        | "body";
}

export interface FilteredVideo {
    id?: string;
    pattern?: string | RegExp;
    video: NiconicoVideo;
    target: "id" | "owner-id" | "paid" | "views" | "owner-name" | "title";
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
