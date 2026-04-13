import type { NiconicoComment, RenderedComment } from "../api/comment.types";

export interface CommentFilterLog {
    filtering?: CommentFiltering;
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
