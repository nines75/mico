/**
 * https://www.nicovideo.jp/search
 * https://www.nicovideo.jp/tag
 */

import { z } from "@/utils/zod.js";
import { niconicoVideoSchema } from "./niconico-video.types.js";

export const SearchDataSchema = z.looseObject({
    data: z.looseObject({
        response: z.looseObject({
            $getSearchVideoV2: z.looseObject({
                data: z.looseObject({
                    items: z.array(niconicoVideoSchema),
                }),
            }),
        }),
    }),
});

export type SearchData = z.infer<typeof SearchDataSchema>;
