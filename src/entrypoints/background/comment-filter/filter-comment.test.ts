import { Thread } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { checkComment, testThreads } from "@/utils/test.js";
import { beforeEach, describe, expect, it } from "vitest";
import { filterComment } from "./filter-comment.js";
import { defaultSettings } from "@/utils/config.js";
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
                ngUserId: "nvc:RpBQf40dpW85ue3CiT8UZ6AUer6",
                ngCommand: "big",
                ngWord: "コメント",
            },
            ...settings,
        };
    };

    it("default", () => {
        const res = filterComment(threads, createSettings({}), [], "sm1");

        checkComment(threads, ["1000", "1001", "1002", "1003", "1004"]);
        expect(res?.filters.scoreFilter.getCount()).toBe(0);
    });

    it("strictルールの先行適用", () => {
        const settings = {
            ...defaultSettings,
            ngCommand: `
big
!big
device:Switch`,
            ngWord: `
コメント
!コメント
`,
        } satisfies Partial<Settings>;
        const res = filterComment(threads, settings, [], "sm1");

        checkComment(threads, ["1002", "1003", "1004"]);
        expect(res?.strictNgUserIds).toEqual(
            new Set([
                "nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk",
                "nvc:vcG0xFnXKcGl81lWoedT3VOI3Qj",
                "nvc:llNBacJJPE6wbyKKEioq3lO6515",
            ]),
        );
        expect(res?.filters.userIdFilter.getLog()).toEqual(
            new Map([
                ["nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk", ["1002"]],
                ["nvc:vcG0xFnXKcGl81lWoedT3VOI3Qj", ["1003"]],
                ["nvc:llNBacJJPE6wbyKKEioq3lO6515", ["1004"]],
            ]),
        );
        expect(res?.filters.commandFilter.getLog()).toEqual(new Map());
        expect(res?.filters.wordFilter.getLog()).toEqual(new Map());
    });

    it(`Settings.${"isCommentFilterEnabled" satisfies keyof Settings}`, () => {
        filterComment(
            threads,
            createSettings({ isCommentFilterEnabled: false }),
            [],
            "sm1",
        );

        checkComment(threads, []);
    });

    it(`Settings.${"isHideEasyComment" satisfies keyof Settings}`, () => {
        filterComment(
            threads,
            createSettings({ isHideEasyComment: true }),
            [],
            "sm1",
        );

        checkComment(threads, [
            "1000",
            "1001",
            "1002",
            "1003",
            "1004",
            "1005",
            "1006",
        ]);
    });

    it(`Settings.${"isScoreFilterEnabled" satisfies keyof Settings}`, () => {
        const res = filterComment(
            threads,
            createSettings({ isScoreFilterEnabled: true }),
            [],
            "sm1",
        );

        checkComment(threads, ["1000", "1001", "1002", "1003", "1004"]);
        expect(res?.filters.scoreFilter.getLog()).toEqual(["1002"]);
    });
});
