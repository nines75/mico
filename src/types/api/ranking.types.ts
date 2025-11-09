// -------------------------------------------------------------------------------------------
// https://www.nicovideo.jp/ranking
// -------------------------------------------------------------------------------------------

import { z } from "@/utils/zod.js";
import { niconicoVideoSchema } from "./niconico-video.types.js";

export const rankingApiSchema = z.looseObject({
    data: z.looseObject({
        response: z.looseObject({
            $getTeibanRanking: z.looseObject({
                data: z.looseObject({
                    items: z.array(niconicoVideoSchema),
                }),
            }),
        }),
    }),
});

export type RankingApi = z.infer<typeof rankingApiSchema>;
