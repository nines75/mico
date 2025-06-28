import { Thread } from "@/types/api/comment.types.js";
import { hasComment, testThreads } from "@/utils/test.js";
import { beforeEach, describe, expect, it } from "vitest";
import { ScoreFilter } from "./score-filter.js";
import { defaultSettings } from "@/utils/config.js";
import { Settings } from "@/types/storage/settings.types.js";

describe(ScoreFilter.name, () => {
    let testThreadCopy: Thread[];

    beforeEach(() => {
        testThreadCopy = structuredClone(testThreads);
    });

    const filtering = (options: {
        score: number;
        settings?: Partial<Settings>;
    }) => {
        const scoreFilter = new ScoreFilter({
            ...defaultSettings,
            ...{ isScoreFilterEnabled: true, scoreFilterCount: options.score },
            ...options.settings,
        });

        scoreFilter.filtering(testThreadCopy);

        return scoreFilter;
    };

    it.each([
        {
            score: 0,
            ids: ["1000", "1001", "1002", "1003", "1004", "1005", "1006"],
        },
        { score: -999, ids: ["1002", "1003", "1004"] },
        { score: -1000, ids: ["1002", "1003"] },
        { score: -1001, ids: ["1002"] },
        { score: -10000, ids: [] },
    ])("score: $score", ({ score, ids }) => {
        expect(filtering({ score }).getLog()).toEqual(ids);
        expect(hasComment(testThreadCopy, ids)).toBe(false);
    });

    it(`Settings.${"isIgnoreByNicoru" satisfies keyof Settings}`, () => {
        expect(
            filtering({
                score: -500,
                settings: { isIgnoreByNicoru: true },
            }).getLog(),
        ).toEqual(["1002"]);
        expect(hasComment(testThreadCopy, ["1002"])).toBe(false);
    });

    it(`${ScoreFilter.prototype.sortLog.name}()`, () => {
        const scoreFilter = filtering({
            score: 0,
        });
        scoreFilter.sortLog();

        expect(scoreFilter.getLog()).toEqual([
            "1002",
            "1003",
            "1004",
            "1005",
            "1000",
            "1001",
            "1006",
        ]);
    });
});
