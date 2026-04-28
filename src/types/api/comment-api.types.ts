// -------------------------------------------------------------------------------------------
// https://public.nvcomment.nicovideo.jp/v1/threads
// -------------------------------------------------------------------------------------------

import { z } from "@/utils/zod";

export const commentSchema = z.looseObject({
  id: z.string(),
  body: z.string(),
  commands: z.array(z.string()),
  userId: z.string(),
  postedAt: z.string(),
  nicoruId: z.string().nullable(), // ユーザーがこのコメントをニコっていない場合はnull
  $videoId: z.string().exactOptional(), // レンダリング後のみ存在

  no: z.number().int(), // 動画内での投稿順
  vposMs: z.number().int(),
  score: z.number().int(),
  nicoruCount: z.number().int(),

  isPremium: z.boolean(),
  isMyPost: z.boolean(),

  source: z.literal(["trunk", "leaf", "nicoru"]),
});
export type Comment = z.infer<typeof commentSchema>;

const threadSchema = z.looseObject({
  fork: z.literal(["owner", "main", "easy", "ai"]),
  commentCount: z.number().int(),
  comments: z.array(commentSchema),
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
  score: number;
}
