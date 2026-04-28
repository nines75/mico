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
});

// CommentはDOM APIと名前が衝突するためプレフィックスを付ける
export type NvComment = z.infer<typeof commentSchema>;
