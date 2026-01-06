import { z } from "@/utils/zod";

// optionalにしているプロパティは旧検索で生成した動画データに含まれていないもの
export const niconicoVideoSchema = z.looseObject({
    id: z.string(),
    title: z.string(),
    latestCommentSummary: z.string().optional(),
    isPaymentRequired: z.boolean(),
    count: z
        .looseObject({
            view: z.number().int(),
            comment: z.number().int(),
            mylist: z.number().int(),
            like: z.number().int(),
        })
        .optional(),
    owner: z
        .looseObject({
            id: z.string(),
            name: z.string().nullable(), // ユーザーが退会済みならnull
            visibility: z.literal(["visible", "hidden"]),
        })
        .optional(),
});

export type NiconicoVideo = z.infer<typeof niconicoVideoSchema>;
