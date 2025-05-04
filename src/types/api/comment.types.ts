/*
    https://public.nvcomment.nicovideo.jp/v1/threads
*/

export interface CommentDataContainer {
    data: CommentData;
}

interface CommentData {
    threads: Thread[];
}

export interface Thread {
    fork: "owner" | "main" | "easy";
    commentCount: number;
    comments: NiconicoComment[];
}

export interface NiconicoComment {
    id: string;
    body: string;
    commands: string[];
    userId: string;
    postedAt: string;
    nicoruId: string | null; // ユーザーがこのコメントをニコっていない場合はnull

    no: number; // 動画内での投稿順
    vposMs: number;
    score: number;
    nicoruCount: number;

    isPremium: boolean;
    isMyPost: boolean;

    source: "trunk" | "leaf" | "nicoru";
}
