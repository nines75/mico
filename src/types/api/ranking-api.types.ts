// -------------------------------------------------------------------------------------------
// https://www.nicovideo.jp/ranking
// -------------------------------------------------------------------------------------------

import { z } from "@/utils/zod";
import { videoSchema } from "./video.types";

export const rankingApiSchema = z.looseObject({
  data: z.looseObject({
    response: z.looseObject({
      $getTeibanRanking: z.looseObject({
        data: z.looseObject({
          items: z.array(videoSchema),
        }),
      }),
    }),
  }),
});

export type RankingApi = z.infer<typeof rankingApiSchema>;
