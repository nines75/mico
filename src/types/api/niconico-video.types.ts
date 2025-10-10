import { z } from "@/utils/zod.js";

export const niconicoVideoSchema = z.looseObject({
    id: z.string(),
    title: z.string(),
    registeredAt: z.string().optional(),
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
            name: z.string().nullable(),
            visibility: z.literal(["visible", "hidden"]),
        })
        .optional(),
});

export type NiconicoVideo = z.infer<typeof niconicoVideoSchema>;
