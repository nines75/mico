// -------------------------------------------------------------------------------------------
// https://nvapi.nicovideo.jp/v1/playlist/search
// -------------------------------------------------------------------------------------------

import { z } from "@/utils/zod";
import { videoSchema } from "./video.types";

export const searchPlaylistApiSchema = z.looseObject({
  data: z.looseObject({
    items: z.array(
      z.looseObject({
        watchId: z.string(),
        content: videoSchema,
      }),
    ),
  }),
});

export type SearchPlaylistApi = z.infer<typeof searchPlaylistApiSchema>;
