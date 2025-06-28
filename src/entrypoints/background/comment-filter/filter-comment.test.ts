import { Thread } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { hasComment, testThreads } from "@/utils/test.js";
import { beforeEach, describe, expect, it } from "vitest";
import { filterComment } from "./filter-comment.js";
import { defaultSettings } from "@/utils/config.js";
import { loadSettings, setSettings } from "@/utils/storage.js";
import { addNgUserId } from "./filter/user-id-filter.js";
import { fakeBrowser } from "#imports";

describe(`${filterComment.name}()`, () => {
    let testThreadCopy: Thread[];

    beforeEach(() => {
        testThreadCopy = structuredClone(testThreads);
        fakeBrowser.reset();
    });

    const getSettings = (settings: Partial<Settings>) => {
        const baseSettings = {
            ...defaultSettings,
            scoreFilterCount: -1001,
            ngUserId: "nvc:RpBQf40dpW85ue3CiT8UZ6AUer6",
            ngCommand: "big",
            ngWord: "コメント",
        } satisfies Partial<Settings>;

        return {
            ...baseSettings,
            ...settings,
        };
    };

    it("default", () => {
        const res = filterComment(testThreadCopy, getSettings({}), [], "sm1");

        expect(
            hasComment(testThreadCopy, [
                "1000",
                "1001",
                "1002",
                "1003",
                "1004",
            ]),
        ).toBe(false);
        expect(res?.filters.scoreFilter.getCount()).toBe(0);
    });

    it("strictルールが先に適用されているか", async () => {
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

        const res = filterComment(testThreadCopy, settings, [], "sm1");

        expect(hasComment(testThreadCopy, ["1002", "1003", "1004"])).toBe(
            false,
        );
        expect(res?.strictNgUserIds).toEqual(
            new Set([
                "nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk",
                "nvc:vcG0xFnXKcGl81lWoedT3VOI3Qj",
                "nvc:llNBacJJPE6wbyKKEioq3lO6515",
            ]),
        );

        await setSettings(settings);
        await addNgUserId(res?.strictNgUserIds ?? new Set());
        res?.filters.userIdFilter.setSettings(await loadSettings());

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
            testThreadCopy,
            getSettings({ isCommentFilterEnabled: false }),
            [],
            "sm1",
        );

        expect(
            Object.values(testThreadCopy)
                .map((thread) => thread.commentCount)
                .reduce((sum, cnt) => sum + cnt, 0),
        ).toBe(7);
    });

    it(`Settings.${"isHideEasyComment" satisfies keyof Settings}`, () => {
        filterComment(
            testThreadCopy,
            getSettings({ isHideEasyComment: true }),
            [],
            "sm1",
        );

        expect(
            hasComment(testThreadCopy, [
                "1000",
                "1001",
                "1002",
                "1003",
                "1004",
                "1005",
                "1006",
            ]),
        ).toBe(false);
    });

    it(`Settings.${"isScoreFilterEnabled" satisfies keyof Settings}`, () => {
        const res = filterComment(
            testThreadCopy,
            getSettings({ isScoreFilterEnabled: true }),
            [],
            "sm1",
        );

        expect(
            hasComment(testThreadCopy, [
                "1000",
                "1001",
                "1002",
                "1003",
                "1004",
            ]),
        ).toBe(false);
        expect(res?.filters.scoreFilter.getLog()).toEqual(["1002"]);
    });
});
