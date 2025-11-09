// -------------------------------------------------------------------------------------------
// https://www.nicovideo.jp/watch
// -------------------------------------------------------------------------------------------

import { z } from "@/utils/zod.js";
import { niconicoVideoSchema } from "./niconico-video.types.js";

export const watchApiSchema = z.looseObject({
    data: z.looseObject({
        metadata: z.looseObject({
            jsonLds: z.array(
                z.looseObject({
                    author: z
                        .looseObject({
                            name: z.string(),
                            url: z.string(),
                        })
                        .optional(), // jsonLds配列の中でauthorプロパティが存在するのは一部
                }),
            ),
        }),
        response: z.looseObject({
            series: z
                .looseObject({
                    video: z.looseObject({
                        next: niconicoVideoSchema.nullable(), // シリーズの次の動画がなければnull
                    }),
                })
                .nullable(), // シリーズに登録されていなければnull
            tag: z.looseObject({
                items: z.array(
                    z.looseObject({
                        name: z.string(),
                    }),
                ),
            }),
            video: z.looseObject({
                id: z.string(),
                title: z.string(),
            }),
            channel: z
                .looseObject({
                    id: z.string(),
                    name: z.string(),
                })
                .nullable(), // チャンネル動画でなければnull
            owner: z
                .looseObject({
                    id: z.number().int(),
                    nickname: z.string(),
                })
                .nullable(), // チャンネル動画やユーザーが退会済みならnull
        }),
    }),
});

export type WatchApi = z.infer<typeof watchApiSchema>;
