/**
 * https://www.nicovideo.jp/ranking/genre
 */

import { z } from "@/utils/zod.js";
import { niconicoVideoSchema } from "./niconico-video.types.js";

export const rankingDataSchema = z.looseObject({
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

export type RankingData = z.infer<typeof rankingDataSchema>;
