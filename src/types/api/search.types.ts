// -------------------------------------------------------------------------------------------
// https://www.nicovideo.jp/search
// https://www.nicovideo.jp/tag
// -------------------------------------------------------------------------------------------

import { z } from "@/utils/zod";
import { videoSchema } from "./niconico-video.types";

export const searchApiSchema = z.looseObject({
    data: z.looseObject({
        response: z.looseObject({
            $getSearchVideoV2: z.looseObject({
                data: z.looseObject({
                    items: z.array(videoSchema),
                }),
            }),
        }),
    }),
});

export type SearchApi = z.infer<typeof searchApiSchema>;
