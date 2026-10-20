// -------------------------------------------------------------------------------------------
// https://nvapi.nicovideo.jp/v4/watch/lazy
// -------------------------------------------------------------------------------------------

import { z } from "@/utils/zod";
import { videoSchema } from "./video.types";

export const watchLazyApiSchema = z.looseObject({
  data: z.looseObject({
    series: z
      .looseObject({
        id: z.number().int(),
        video: z.looseObject({
          next: videoSchema.nullable(), // シリーズの次の動画がなければnull
        }),
      })
      .nullable(), // シリーズに登録されていなければnull
  }),
});

export type WatchLazyApi = z.infer<typeof watchLazyApiSchema>;
