// -------------------------------------------------------------------------------------------
// https://nvapi.nicovideo.jp/v1/recommend
// -------------------------------------------------------------------------------------------

import { z } from "@/utils/zod";
import { videoSchema } from "./niconico-video.types";

export const recommendApiSchema = z.looseObject({
    data: z.looseObject({
        items: z.array(
            z.union([
                z.looseObject({
                    id: z.string(),
                    contentType: z.literal("video"),
                    content: videoSchema,
                }),
                z.looseObject({
                    id: z.string(),
                    contentType: z.literal("mylist"),
                }),
            ]),
        ),
    }),
});

export type RecommendApi = z.infer<typeof recommendApiSchema>;
