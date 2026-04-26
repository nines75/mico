import type { Thread } from "@/types/api/comment-api.types";
import { checkComment, getFilteredIds } from "@/utils/test";
import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/utils/config";
import type { Settings } from "@/types/storage/settings.types";
import { CommentAssistFilter } from "./comment-assist-filter";
import { mockComments } from "@/utils/test";

// コメントアシストは既存のコメントデータでテストできないので別で用意
export const commentAssistThreads = [
    {
        fork: "owner",
        commentCount: 1,
        comments: mockComments({
            commands: [],
        }),
    },
    {
        fork: "main",
        commentCount: 4,
        comments: mockComments(
            {
                id: "1001",
                commands: [],
                postedAt: "2025-02-26T00:00:00+09:00", // リリース丁度
            },
            {
                id: "1002",
                commands: [],
                userId: "user-id-main-2",
                postedAt: "2025-02-25T23:59:59+09:00", // リリース直前
            },
            {
                id: "1003",
                body: "test2",
                commands: [],
            },
            {
                id: "1004",
                body: "test2",
                commands: [],
            },
        ),
    },
] satisfies Thread[];

describe(CommentAssistFilter.name, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(commentAssistThreads);
    });

    const runFilter = (options: { settings?: Partial<Settings> }) => {
        const commentAssistFilter = new CommentAssistFilter({
            ...defaultSettings,
            enableCommentAssistFilter: true,
            ...options.settings,
        });

        commentAssistFilter.apply(threads);

        return commentAssistFilter;
    };

    // -------------------------------------------------------------------------------------------

    describe(`Settings.${"enableCommentAssistFilter" satisfies keyof Settings}`, () => {
        it.each([
            {
                isEnabled: true,
                ids: ["1001", "1003", "1004"],
            },
            {
                isEnabled: false,
                ids: [],
            },
        ])("$isEnabled", ({ isEnabled, ids }) => {
            expect(
                getFilteredIds(
                    runFilter({
                        settings: { enableCommentAssistFilter: isEnabled },
                    }),
                ),
            ).toEqual(ids);
            checkComment(threads, ids, commentAssistThreads);
        });
    });
});
