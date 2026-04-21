import type { Thread } from "@/types/api/comment.types";
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

    const filtering = (options: { settings?: Partial<Settings> }) => {
        const easyCommentFilter = new EasyCommentFilter({
            ...defaultSettings,
            isEasyCommentHidden: true,
            ...options.settings,
        });

        easyCommentFilter.filtering(threads);

        return easyCommentFilter;
    };

    // -------------------------------------------------------------------------------------------

    describe(`Settings.${"isEasyCommentHidden" satisfies keyof Settings}`, () => {
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
                    filtering({
                        settings: { isEasyCommentHidden: isEnabled },
                    }),
                ),
            ).toEqual(ids);
            checkComment(threads, ids);
        });
    });
});
