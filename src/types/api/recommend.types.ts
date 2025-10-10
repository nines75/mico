/**
 * https://nvapi.nicovideo.jp/v1/recommend
 */

import { z } from "@/utils/zod.js";
import { niconicoVideoSchema } from "./niconico-video.types.js";

export const recommendDataSchema = z.looseObject({
    data: z.looseObject({
        items: z.array(
            z.union([
                z.looseObject({
                    id: z.string(),
                    contentType: z.literal("video"),
                    content: niconicoVideoSchema,
                }),
                z.looseObject({
                    id: z.string(),
                    contentType: z.literal("mylist"),
                }),
            ]),
        ),
    }),
});

export type RecommendData = z.infer<typeof recommendDataSchema>;
