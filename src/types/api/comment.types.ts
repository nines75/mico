// -------------------------------------------------------------------------------------------
// https://public.nvcomment.nicovideo.jp/v1/threads
// -------------------------------------------------------------------------------------------

import { z } from "@/utils/zod.js";

const niconicoCommentSchema = z.looseObject({
    id: z.string(),
    body: z.string(),
    commands: z.array(z.string()),
    userId: z.string(),
    postedAt: z.string(),
    nicoruId: z.string().nullable(), // ユーザーがこのコメントをニコっていない場合はnull

    no: z.number().int(), // 動画内での投稿順
    vposMs: z.number().int(),
    score: z.number().int(),
    nicoruCount: z.number().int(),

    isPremium: z.boolean(),
    isMyPost: z.boolean(),

    source: z.literal(["trunk", "leaf", "nicoru"]),
});
export type NiconicoComment = z.infer<typeof niconicoCommentSchema>;

const threadSchema = z.looseObject({
    fork: z.literal(["owner", "main", "easy"]),
    commentCount: z.number().int(),
    comments: z.array(niconicoCommentSchema),
});
export type Thread = z.infer<typeof threadSchema>;

export const commentApiSchema = z.looseObject({
    data: z.looseObject({
        threads: z.array(threadSchema),
    }),
});
export type CommentApi = z.infer<typeof commentApiSchema>;

export interface RenderedComment {
    body: string;
    userId: string;
    no: number;
    fork: Thread["fork"];
}
