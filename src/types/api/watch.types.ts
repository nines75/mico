/**
 * https://www.nicovideo.jp/watch/*
 */

import { z } from "@/utils/zod.js";
import { niconicoVideoSchema } from "./niconico-video.types.js";

export const watchDataSchema = z.looseObject({
    data: z.looseObject({
        metadata: z.looseObject({
            jsonLds: z.array(
                z.looseObject({
                    author: z
                        .looseObject({
                            name: z.string(),
                            url: z.string(),
                        })
                        .optional(),
                }),
            ),
        }),
        // 削除済みの動画のレスポンスで存在しないプロパティはオプショナルにする
        response: z.looseObject({
            series: z
                .looseObject({
                    video: z.looseObject({
                        next: niconicoVideoSchema.nullable(),
                    }),
                })
                .nullable() // シリーズに登録されていなければnull
                .optional(),
            tag: z
                .looseObject({
                    items: z.array(
                        z.looseObject({
                            name: z.string(),
                        }),
                    ),
                })
                .optional(),
            video: z
                .looseObject({
                    id: z.string(),
                    title: z.string(),
                })
                .optional(),
            channel: z
                .looseObject({
                    id: z.string(),
                    name: z.string(),
                })
                .nullable() // チャンネル動画でなければnull
                .optional(),
            owner: z
                .looseObject({
                    id: z.number().int(),
                    nickname: z.string(),
                })
                .nullable() // チャンネル動画ならnull
                .optional(),
        }),
    }),
});

export type WatchData = z.infer<typeof watchDataSchema>;
