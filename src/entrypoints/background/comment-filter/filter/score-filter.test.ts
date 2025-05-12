import { Thread } from "@/types/api/comment.types.js";
import { hasComment, testThreads } from "@/utils/data.js";
import { beforeEach, describe, expect, it } from "vitest";
import { ScoreFilter } from "./score-filter.js";
import { defaultSettings } from "@/utils/config.js";

describe("ScoreFilter", () => {
    let testThreadCopy: Thread[];

    beforeEach(() => {
        testThreadCopy = structuredClone(testThreads);
    });

    const filtering = (score: number) => {
        const scoreFilter = new ScoreFilter({
            ...defaultSettings,
            ...{ isScoreFilterEnabled: true, scoreFilterCount: score },
        });

        scoreFilter.filtering(testThreadCopy);

        return scoreFilter;
    };

    it.each([
        { score: 0, ids: ["1002", "1003", "1004", "1000", "1001"] },
        { score: -999, ids: ["1002", "1003", "1004"] },
        { score: -1000, ids: ["1002", "1003"] },
        { score: -1001, ids: ["1002"] },
        { score: -10000, ids: [] },
    ])("score: $score", ({ score, ids }) => {
        expect(filtering(score).getLog()).toEqual(ids);
        expect(hasComment(testThreadCopy, ids)).toBe(false);
    });
});
