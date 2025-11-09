// -------------------------------------------------------------------------------------------
// https://nvapi.nicovideo.jp/v1/playlist/search
// -------------------------------------------------------------------------------------------

import { z } from "@/utils/zod.js";
import { niconicoVideoSchema } from "./niconico-video.types.js";

export const playlistFromSearchApiSchema = z.looseObject({
    data: z.looseObject({
        items: z.array(
            z.looseObject({
                watchId: z.string(),
                content: niconicoVideoSchema,
            }),
        ),
    }),
});

export type PlaylistFromSearchApi = z.infer<typeof playlistFromSearchApiSchema>;
