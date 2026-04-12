import type { NiconicoComment, RenderedComment } from "../api/comment.types";

export interface CommentFilterLog {
    count?: CommentCount;
    filtering?: CommentFiltering;
}

export interface CommentCount {
    totalBlocked: number;
    loaded: number;
    include: number;
    exclude: number;
    disable: number;
    invalid: number;
}

export interface CommentFiltering {
    strictUserIds: string[];
    filteredComments: FilteredComment[];
    renderedComments: RenderedComment[];
}

export interface FilteredComment {
    comment: NiconicoComment;
    target:
        | "user-id"
        | "easy-comment"
        | "comment-assist"
        | "score"
        | "commands"
        | "body";
    id?: string;
    pattern?: string | RegExp;
}
