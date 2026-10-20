// -------------------------------------------------------------------------------------------
// https://www.nicovideo.jp/watch
// -------------------------------------------------------------------------------------------

import { z } from "@/utils/zod";

export const watchApiSchema = z.looseObject({
  data: z.looseObject({
    response: z.looseObject({
      $watchV4: z.looseObject({
        data: z.looseObject({
          tags: z.looseObject({
            items: z.array(
              z.looseObject({
                name: z.string(),
              }),
            ),
          }),
          video: z.looseObject({
            id: z.string(),
            title: z.string(),
            duration: z.number().int(),
          }),
          metadata: z.looseObject({
            jsonLd: z.looseObject({
              owner: z
                .looseObject({
                  id: z.string(),
                  name: z.string(),
                })
                .nullable(), // ユーザーが退会済みならnull
            }),
          }),
        }),
      }),
    }),
  }),
});

export type WatchApi = z.infer<typeof watchApiSchema>;
