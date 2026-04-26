import type { Thread } from "@/types/api/comment-api.types";
import type { Settings } from "@/types/storage/settings.types";
import { defaultSettings } from "@/utils/config";
import { checkComment, getFilteredIds, testThreads } from "@/utils/test";
import { describe, beforeEach, it, expect } from "vitest";
import { EasyCommentFilter } from "./easy-comment-filter";

describe(EasyCommentFilter.name, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(testThreads);
    });

    const runFilter = (options: { settings?: Partial<Settings> }) => {
        const easyCommentFilter = new EasyCommentFilter({
            ...defaultSettings,
            enableEasyCommentFilter: true,
            ...options.settings,
        });

        easyCommentFilter.apply(threads);

        return easyCommentFilter;
    };

    // -------------------------------------------------------------------------------------------

    describe(`Settings.${"enableEasyCommentFilter" satisfies keyof Settings}`, () => {
        it.each([
            {
                isEnabled: true,
                ids: ["1005", "1006"],
            },
            {
                isEnabled: false,
                ids: [],
            },
        ])("$isEnabled", ({ isEnabled, ids }) => {
            expect(
                getFilteredIds(
                    runFilter({
                        settings: { enableEasyCommentFilter: isEnabled },
                    }),
                ),
            ).toEqual(ids);
            checkComment(threads, ids);
        });
    });
});
