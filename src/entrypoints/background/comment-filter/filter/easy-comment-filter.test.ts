import type { Thread } from "@/types/api/comment.types";
import type { CommonLog } from "@/types/storage/log.types";
import type { Settings } from "@/types/storage/settings.types";
import { defaultSettings } from "@/utils/config";
import { checkComment, testThreads } from "@/utils/test";
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
            ...{ isEasyCommentHidden: true },
            ...options.settings,
        });

        easyCommentFilter.filtering(threads);

        return easyCommentFilter;
    };

    it.each([
        {
            isEnabled: true,
            ids: ["1005", "1006"],
            expected: new Map([
                ["！？", ["1005"]],
                ["うぽつ", ["1006"]],
            ]),
        },
        {
            isEnabled: false,
            ids: [],
            expected: new Map(),
        },
    ] satisfies { isEnabled: boolean; ids: string[]; expected: CommonLog }[])(
        `Settings.${"isEasyCommentHidden" satisfies keyof Settings}($isEnabled)`,
        ({ isEnabled, ids, expected }) => {
            expect(
                filtering({
                    settings: { isEasyCommentHidden: isEnabled },
                }).getLog(),
            ).toEqual(expected);
            checkComment(threads, ids);
        },
    );

    it(`${EasyCommentFilter.prototype.sortLog.name}()`, () => {
        const easyCommentFilter = filtering({});
        easyCommentFilter.sortLog();

        // 順序を調べるために配列に変換
        expect([...easyCommentFilter.getLog()]).toEqual([
            ["！？", ["1005"]],
            ["うぽつ", ["1006"]],
        ]);
    });
});
