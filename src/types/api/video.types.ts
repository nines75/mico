import { z } from "@/utils/zod";

export const videoSchema = z.looseObject({
    id: z.string(),
    title: z.string(),
    latestCommentSummary: z.string(),
    isPaymentRequired: z.boolean(),
    count: z.looseObject({
        view: z.number().int(),
        comment: z.number().int(),
        mylist: z.number().int(),
        like: z.number().int(),
    }),
    owner: z.looseObject({
        id: z.string(),
        name: z.string().nullable(), // ユーザーが退会済みならnull
        visibility: z.literal(["visible", "hidden"]),
    }),
});

export type Video = z.infer<typeof videoSchema>;
