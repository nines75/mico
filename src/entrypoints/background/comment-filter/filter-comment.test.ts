import type { Thread } from "@/types/api/comment.types";
import type { Settings } from "@/types/storage/settings.types";
import { checkComment, testTabData, testThreads } from "@/utils/test";
import { beforeEach, describe, expect, it } from "vitest";
import { filterComment } from "./filter-comment";
import { defaultSettings } from "@/utils/config";
import { fakeBrowser } from "#imports";

describe(`${filterComment.name}()`, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(testThreads);
        fakeBrowser.reset();
    });

    const createSettings = (settings: Partial<Settings>) => {
        return {
            ...{
                ...defaultSettings,
                scoreFilterCount: -1001,
                ngUserId: "user-id-owner",
                ngCommand: "big",
                ngWord: "コメント",
            },
            ...settings,
        };
    };

    it("default", () => {
        const res = filterComment(threads, createSettings({}), testTabData);

        checkComment(threads, ["1000", "1001", "1002", "1003", "1004"]);
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
        const settings = {
            ...defaultSettings,
            ngCommand: `
big
@s
big
device:Switch`,
            ngWord: `
コメント
@s
コメント
`,
        } satisfies Partial<Settings>;
        const res = filterComment(threads, settings, testTabData);

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

    it(`Settings.${"isCommentFilterEnabled" satisfies keyof Settings}`, () => {
        filterComment(
            threads,
            createSettings({ isCommentFilterEnabled: false }),
            testTabData,
        );

        checkComment(threads, []);
    });

    it(`Settings.${"isMyCommentIgnored" satisfies keyof Settings}`, () => {
        threads.forEach((thread) => {
            thread.comments.forEach((comment) => (comment.isMyPost = true));
        });
        filterComment(
            threads,
            createSettings({ isMyCommentIgnored: true }),
            testTabData,
        );

        checkComment(threads, []);
    });

    it(`Settings.${"isIgnoreByNicoru" satisfies keyof Settings}`, () => {
        filterComment(
            threads,
            createSettings({ isIgnoreByNicoru: true }),
            testTabData,
        );

        checkComment(threads, ["1000", "1001", "1002"]);
    });
});
