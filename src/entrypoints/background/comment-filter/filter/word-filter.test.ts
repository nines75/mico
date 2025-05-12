import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/utils/config.js";
import { hasComment, replaceInclude, testThreads } from "@/utils/test.js";
import { Thread } from "@/types/api/comment.types.js";
import { WordFilter } from "./word-filter.js";

describe("WordFilter", () => {
    let testThreadCopy: Thread[];

    beforeEach(() => {
        testThreadCopy = structuredClone(testThreads);
    });

    const filtering = (options: {
        filter: string;
        tags?: string[];
        isStrictOnly?: boolean;
        isCaseInsensitive?: boolean;
        ngUserIds?: Set<string>;
    }) => {
        const wordFilter = new WordFilter(
            {
                ...defaultSettings,
                ...{
                    ngWord: options.filter,
                    isCaseInsensitive: options.isCaseInsensitive ?? true,
                },
            },
            options.ngUserIds ?? new Set(),
        );
        wordFilter.filterRuleByTag(options.tags ?? []);
        wordFilter.filtering(testThreadCopy, options.isStrictOnly ?? false);

        return wordFilter;
    };

    it("一般的なフィルター", () => {
        const filter = `
test
テスト
コメント
`;

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([
                ["/test/i", new Map([["test", ["1000", "1001"]]])],
                [
                    "/テスト/i",
                    new Map([
                        ["テスト", ["1002"]],
                        ["テストコメント", ["1003"]],
                    ]),
                ],
                ["/コメント/i", new Map([["コメント", ["1004"]]])],
            ]),
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
    });

    it("大小文字が異なるフィルター", () => {
        const filter = `
TesT
`;

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([["/TesT/i", new Map([["test", ["1000", "1001"]]])]]),
        );
        expect(hasComment(testThreadCopy, ["1000", "1001"])).toBe(false);
    });

    it("大小文字を区別するケース", () => {
        const filter = `
TesT
`;

        expect(
            filtering({ filter, isCaseInsensitive: false }).getLog(),
        ).toEqual(new Map());
    });

    it("正規表現", () => {
        const filter = `
テスト|コメント
`;

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([
                [
                    "/テスト|コメント/i",
                    new Map([
                        ["テスト", ["1002"]],
                        ["テストコメント", ["1003"]],
                        ["コメント", ["1004"]],
                    ]),
                ],
            ]),
        );
        expect(hasComment(testThreadCopy, ["1002", "1003", "1004"])).toBe(
            false,
        );
    });

    it("@strict/!", () => {
        const filter = `
@strict
テスト
@end

!コメント
`;

        const wordFilter = filtering({
            filter,
            isStrictOnly: true,
            ngUserIds: new Set(["nvc:vcG0xFnXKcGl81lWoedT3VOI3Qj"]),
        });

        expect(wordFilter.getLog()).toEqual(new Map());
        expect(wordFilter.getStrictNgUserIds()).toEqual([
            "nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk",
            "nvc:llNBacJJPE6wbyKKEioq3lO6515",
        ]);
    });

    it.each([
        [
            "include",
            new Map([["/^テスト$/i", new Map([["テスト", ["1002"]]])]]),
            ["1002"],
        ],
        [
            "exclude",
            new Map([["/^コメント$/i", new Map([["コメント", ["1004"]]])]]),
            ["1004"],
        ],
    ])("@%s", (type, expected, ids) => {
        const isExclude = type === "exclude";

        const filter = `
@include tag0
^テスト$
@end

@include tag1
^コメント$
@end
`;

        const wordFilter = filtering({
            filter: isExclude ? replaceInclude(filter) : filter,
            tags: ["tag0"],
        });

        expect(wordFilter.getLog()).toEqual(expected);
        expect(hasComment(testThreadCopy, ids)).toBe(false);
    });

    it("動画タグが存在しないときのtagルール判定", () => {
        const filter = `
@include tag0
^テスト$
@end

@exclude tag1
^コメント$
@end
`;

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([["/^コメント$/i", new Map([["コメント", ["1004"]]])]]),
        );
        expect(hasComment(testThreadCopy, ["1004"])).toBe(false);
    });
});
