import type { Thread } from "@/types/api/comment.types";
import { checkComment, getFilteredIds, testThreads } from "@/utils/test";
import { beforeEach, describe, expect, it } from "vitest";
import { ScoreFilter } from "./score-filter";
import { defaultSettings } from "@/utils/config";
import type { Settings } from "@/types/storage/settings.types";

describe(ScoreFilter.name, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(testThreads);
    });

    const filtering = (options: {
        score: number;
        settings?: Partial<Settings>;
    }) => {
        const scoreFilter = new ScoreFilter({
            ...defaultSettings,
            isScoreFilterEnabled: true,
            scoreFilterCount: options.score,
            ...options.settings,
        });

        scoreFilter.filtering(threads);

        return scoreFilter;
    };

    // -------------------------------------------------------------------------------------------

    describe("score", () => {
        it.each([
            {
                score: 0,
                ids: ["1000", "1001", "1002", "1003", "1004", "1005", "1006"],
            },
            { score: -999, ids: ["1002", "1003", "1004"] },
            { score: -1000, ids: ["1002", "1003"] },
            { score: -1001, ids: ["1002"] },
            { score: -10_000, ids: [] },
        ])("$score", ({ score, ids }) => {
            expect(getFilteredIds(filtering({ score }))).toEqual(ids);
            checkComment(threads, ids);
        });
    });

    it(`Settings.${"isScoreFilterEnabled" satisfies keyof Settings}`, () => {
        expect(
            getFilteredIds(
                filtering({
                    score: 0,
                    settings: { isScoreFilterEnabled: false },
                }),
            ),
        ).toEqual([]);
        checkComment(threads, []);
    });
});
