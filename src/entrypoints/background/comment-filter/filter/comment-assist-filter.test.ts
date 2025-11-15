import { Thread } from "@/types/api/comment.types.js";
import { checkComment } from "@/utils/test.js";
import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/utils/config.js";
import { Settings } from "@/types/storage/settings.types.js";
import { CommentAssistFilter } from "./comment-assist-filter.js";
import { createComments } from "@/utils/test.js";
import { CommonLog } from "@/types/storage/log.types.js";

// コメントアシストは既存のコメントデータでテストできないので別で用意
export const commentAssistThreads = [
    {
        fork: "owner",
        commentCount: 1,
        comments: createComments({
            commands: [],
        }),
    },
    {
        fork: "main",
        commentCount: 4,
        comments: createComments(
            {
                id: "1001",
                commands: [],
                postedAt: "2025-02-26T00:00:00+09:00", // リリース丁度
                nicoruCount: 30,
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

    const filtering = (options: { settings?: Partial<Settings> }) => {
        const commentAssistFilter = new CommentAssistFilter({
            ...defaultSettings,
            ...{ isCommentAssistFilterEnabled: true },
            ...options.settings,
        });

        commentAssistFilter.filtering(threads);

        return commentAssistFilter;
    };

    it.each([
        {
            isEnabled: true,
            ids: ["1001", "1003", "1004"],
            expected: new Map([
                ["test", ["1001"]],
                ["test2", ["1003", "1004"]],
            ]),
        },
        {
            isEnabled: false,
            ids: [],
            expected: new Map(),
        },
    ] satisfies { isEnabled: boolean; ids: string[]; expected: CommonLog }[])(
        `Settings.${"isCommentAssistFilterEnabled" satisfies keyof Settings}($isEnabled)`,
        ({ isEnabled, ids, expected }) => {
            expect(
                filtering({
                    settings: { isCommentAssistFilterEnabled: isEnabled },
                }).getLog(),
            ).toEqual(expected);
            checkComment(threads, ids, commentAssistThreads);
        },
    );

    it(`Settings.${"isIgnoreByNicoru" satisfies keyof Settings}`, () => {
        expect(
            filtering({
                settings: { isIgnoreByNicoru: true },
            }).getLog(),
        ).toEqual(new Map([["test2", ["1003", "1004"]]]));
        checkComment(threads, ["1003", "1004"], commentAssistThreads);
    });

    it(`${CommentAssistFilter.prototype.sortLog.name}()`, () => {
        const commentAssistFilter = filtering({});
        commentAssistFilter.sortLog();

        // 順序を調べるために配列に変換
        expect([...commentAssistFilter.getLog()]).toEqual([
            ["test2", ["1003", "1004"]],
            ["test", ["1001"]],
        ]);
    });
});
