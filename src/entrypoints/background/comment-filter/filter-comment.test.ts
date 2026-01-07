import type { Thread } from "@/types/api/comment.types";
import type { Settings } from "@/types/storage/settings.types";
import { checkComment, testTabData, testThreads } from "@/utils/test";
import { beforeEach, describe, expect, it } from "vitest";
import { filterComment } from "./filter-comment";
import { defaultSettings } from "@/utils/config";

describe(filterComment.name, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(testThreads);
    });

    const filtering = (settings?: Partial<Settings>) => {
        return filterComment(
            threads,
            {
                ...defaultSettings,
                ...{
                    scoreFilterCount: -1001,
                    ngUserId: "user-id-owner",
                    ngCommand: "big",
                    ngWord: "コメント",
                },
                ...settings,
            },
            testTabData,
        );
    };

    it("基本", () => {
        const res = filtering();

        checkComment(threads, ["1000", "1001", "1002", "1003", "1004"]);
        expect(res?.filters.easyCommentFilter.getLog()).toEqual(new Map());
        expect(res?.filters.commentAssistFilter.getLog()).toEqual(new Map());
        expect(res?.filters.scoreFilter.getLog()).toEqual([]);
        expect(res?.filters.userIdFilter.getLog()).toEqual(
            new Map([["user-id-owner", ["1000", "1001"]]]),
        );
        expect(res?.filters.commandFilter.getLog()).toEqual(
            new Map([["big", ["1002", "1004"]]]),
        );
        expect(res?.filters.wordFilter.getLog()).toEqual(
            new Map([["コメント", new Map([["テストコメント", ["1003"]]])]]),
        );
    });

    it("strictルールの先行適用", () => {
        const res = filtering({
            ngUserId: "",
            ngCommand: `
big
@s
big
device:Switch
`,
            ngWord: `
コメント
@s
コメント
`,
        });

        checkComment(threads, ["1002", "1003", "1004"]);
        expect(res?.strictUserIds).toEqual([
            "user-id-main-1",
            "user-id-main-3",
            "user-id-main-2",
        ]);
        expect(res?.filters.userIdFilter.getLog()).toEqual(
            new Map([
                ["user-id-main-1", ["1002"]],
                ["user-id-main-2", ["1003"]],
                ["user-id-main-3", ["1004"]],
            ]),
        );
        expect(res?.filters.commandFilter.getLog()).toEqual(new Map());
        expect(res?.filters.wordFilter.getLog()).toEqual(new Map());
    });

    it("strictルールによるフィルタリングの重複", () => {
        const res = filtering({
            ngUserId: "",
            ngCommand: `
# 1003と1004に一致
@s
device:switch
`,
            ngWord: `
# 1003に一致
@s
テストコメント
`,
        });

        // 重複がないことを確認
        expect(res?.strictUserIds).toEqual([
            "user-id-main-2",
            "user-id-main-3",
        ]);
        checkComment(threads, ["1003", "1004"]);
    });

    it(`Settings.${"isCommentFilterEnabled" satisfies keyof Settings}`, () => {
        filtering({ isCommentFilterEnabled: false });

        checkComment(threads, []);
    });

    it(`Settings.${"isMyCommentIgnored" satisfies keyof Settings}`, () => {
        threads.forEach((thread) => {
            thread.comments.forEach((comment) => (comment.isMyPost = true));
        });
        filtering({ isMyCommentIgnored: true });

        checkComment(threads, []);
    });

    it(`Settings.${"isIgnoreByNicoru" satisfies keyof Settings}`, () => {
        filtering({ isIgnoreByNicoru: true });

        checkComment(threads, ["1000", "1001", "1002"]);
    });
});
