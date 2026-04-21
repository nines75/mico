import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/utils/config";
import { checkComment, getFilteredIds, testThreads } from "@/utils/test";
import type { Thread } from "@/types/api/comment.types";
import { WordFilter } from "./word-filter";
import type { Settings } from "@/types/storage/settings.types";

describe(WordFilter.name, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(testThreads);
    });

    const filtering = (options: {
        filter: string;
        isStrictOnly?: boolean;
        settings?: Partial<Settings>;
    }) => {
        const wordFilter = new WordFilter({
            ...defaultSettings,
            ...options.settings,
            manualFilter: `@comment-body\n${options.filter}`,
        });
        wordFilter.filtering(threads, options.isStrictOnly ?? false);

        return wordFilter;
    };

    // -------------------------------------------------------------------------------------------

    describe("文字列ルール", () => {
        it("基本", () => {
            const filter = "test";

            expect(getFilteredIds(filtering({ filter }))).toEqual([
                "1000",
                "1001",
            ]);
            checkComment(threads, ["1000", "1001"]);
        });

        it("部分一致", () => {
            const filter = "tes";

            expect(getFilteredIds(filtering({ filter }))).toEqual([
                "1000",
                "1001",
            ]);
            checkComment(threads, ["1000", "1001"]);
        });

        it("大小文字が異なる", () => {
            const filter = "TesT";

            expect(getFilteredIds(filtering({ filter }))).toEqual([]);
            checkComment(threads, []);
        });
    });

    it("正規表現ルール", () => {
        const filter = "/テスト/";

        expect(getFilteredIds(filtering({ filter }))).toEqual(["1002", "1003"]);
        checkComment(threads, ["1002", "1003"]);
    });

    it("@strict", () => {
        const filter = `
@strict
テスト
`;
        const wordFilter = filtering({
            filter,
            isStrictOnly: true,
            settings: {
                autoFilter: [
                    {
                        pattern: "user-id-main-2",
                        target: { commentUserId: true },
                    },
                ],
            },
        });

        expect(getFilteredIds(wordFilter)).toEqual([]);
        expect(wordFilter.getStrictData()).toEqual([
            {
                userId: "user-id-main-1",
                context: "comment-body: テスト",
            },
        ]);
        checkComment(threads, []);
    });

    // https://github.com/nines75/mico/issues/61
    it("strictルール適用時の副作用", () => {
        const filter = `
@s
テスト

コメント
`;
        expect(
            getFilteredIds(filtering({ filter, isStrictOnly: true })),
        ).toEqual([]);
        checkComment(threads, []);
    });
});
