import type { Thread } from "@/types/api/comment.types";
import type { Settings } from "@/types/storage/settings.types";
import {
    checkComment,
    getFilteredIds,
    testTab,
    testThreads,
} from "@/utils/test";
import { beforeEach, describe, expect, it } from "vitest";
import { filterComment } from "./filter-comment";
import { defaultSettings } from "@/utils/config";

describe(filterComment.name, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(testThreads);
    });

    const runFilter = (settings?: Partial<Settings>) => {
        return filterComment(
            threads,
            {
                ...defaultSettings,
                scoreFilterThreshold: -1001,
                manualFilter: `
@comment-user-id
user-id-owner
@end

@comment-commands
big
@end

@comment-body
コメント
@end
`,
                ...settings,
            },
            testTab,
        );
    };

    it("基本", () => {
        runFilter();

        checkComment(threads, ["1000", "1001", "1002", "1003", "1004"]);
    });

    it("strictルールの先行適用", () => {
        const result = runFilter({
            manualFilter: `
@comment-commands
big
@s
big
device:Switch
@end

@comment-body
コメント
@s
コメント
`,
        });

        expect(result?.strictData.map(({ userId }) => userId)).toEqual([
            "user-id-main-1",
            "user-id-main-3",
            "user-id-main-2",
        ]);
        expect(getFilteredIds(result?.filters.userIdFilter)).toEqual([
            "1002",
            "1003",
            "1004",
        ]);
        checkComment(threads, ["1002", "1003", "1004"]);
    });

    it("strictルールによるフィルタリングの重複", () => {
        const result = runFilter({
            manualFilter: `
@comment-commands
# 1003と1004に一致
@s
device:switch
@end

@comment-body
# 1003に一致
@s
テストコメント
`,
        });

        // 重複がないことを確認
        expect(result?.strictData.map(({ userId }) => userId)).toEqual([
            "user-id-main-2",
            "user-id-main-3",
        ]);
        checkComment(threads, ["1003", "1004"]);
    });

    it(`Settings.${"enableCommentFilter" satisfies keyof Settings}`, () => {
        runFilter({ enableCommentFilter: false });

        checkComment(threads, []);
    });

    it(`Settings.${"ignoreMyComments" satisfies keyof Settings}`, () => {
        for (const thread of threads) {
            for (const comment of thread.comments) comment.isMyPost = true;
        }
        runFilter({ ignoreMyComments: true });

        checkComment(threads, []);
    });

    it(`Settings.${"ignoreByNicoru" satisfies keyof Settings}`, () => {
        runFilter({ ignoreByNicoru: true });

        checkComment(threads, ["1000", "1001", "1002"]);
    });
});
