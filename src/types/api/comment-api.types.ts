// -------------------------------------------------------------------------------------------
// https://public.nvcomment.nicovideo.jp/v1/threads
// -------------------------------------------------------------------------------------------

import { z } from "@/utils/zod";
import { commentSchema } from "./comment.types";

export const commentApiSchema = z.looseObject({
  data: z.looseObject({
    threads: z.array(
      z.looseObject({
        // 値が追加されてもエラーにならないようにz.string()とのユニオン型にする
        fork: z.union([
          z.literal(["owner", "main", "easy", "ai"]),
          z.string() as z.ZodType<string & {}>, // アサーションしないとリテラル型が吸われる
        ]),
        commentCount: z.number().int(),
        comments: z.array(commentSchema),
      }),
    ),
  }),
});

export type CommentApi = z.infer<typeof commentApiSchema>;
export type Thread = CommentApi["data"]["threads"][number];
