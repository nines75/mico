import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/utils/config.js";
import { checkComment, replaceInclude, testThreads } from "@/utils/test.js";
import { Thread } from "@/types/api/comment.types.js";
import { WordFilter } from "./word-filter.js";
import { Settings } from "@/types/storage/settings.types.js";

describe(WordFilter.name, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(testThreads);
    });

    const filtering = (options: {
        filter: string;
        tags?: string[];
        isStrictOnly?: boolean;
        ngUserIds?: Set<string>;
        settings?: Partial<Settings>;
    }) => {
        const wordFilter = new WordFilter(
            {
                ...defaultSettings,
                ...{
                    ngWord: options.filter,
                },
                ...options.settings,
            },
            options.ngUserIds ?? new Set(),
        );
        wordFilter.filterRuleByTag(options.tags ?? []);
        wordFilter.filtering(threads, options.isStrictOnly ?? false);

        return wordFilter;
    };

    it("一般", () => {
        const filter = "test";

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([["test", new Map([["test", ["1000", "1001"]]])]]),
        );
        checkComment(threads, ["1000", "1001"]);
    });

    it("大小文字が異なる", () => {
        const filter = "TesT";

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([["TesT", new Map([["test", ["1000", "1001"]]])]]),
        );
        checkComment(threads, ["1000", "1001"]);
    });

    it("正規表現", () => {
        const filter = "テスト|コメント";

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([
                [
                    "テスト|コメント",
                    new Map([
                        ["テスト", ["1002"]],
                        ["テストコメント", ["1003"]],
                        ["コメント", ["1004"]],
                    ]),
                ],
            ]),
        );
        checkComment(threads, ["1002", "1003", "1004"]);
    });

    it("無効な正規表現", () => {
        const filter = `
(テスト
^コメント$
`;
        const wordFilter = filtering({ filter });

        expect(wordFilter.getLog()).toEqual(
            new Map([["^コメント$", new Map([["コメント", ["1004"]]])]]),
        );
        expect(wordFilter.getInvalidCount()).toBe(1);
        checkComment(threads, ["1004"]);
    });

    it.each([
        {
            name: "@strict",
            filter: `
@strict
テスト
@end
`,
            expected: "nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk",
        },
        {
            name: "!",
            filter: "!コメント",
            expected: "nvc:llNBacJJPE6wbyKKEioq3lO6515",
        },
    ])("$name", ({ filter, expected }) => {
        const wordFilter = filtering({
            filter,
            isStrictOnly: true,
            ngUserIds: new Set(["nvc:vcG0xFnXKcGl81lWoedT3VOI3Qj"]),
        });

        expect(wordFilter.getLog()).toEqual(new Map());
        expect(wordFilter.getStrictNgUserIds()).toEqual([expected]);
    });

    it.each([
        {
            name: "@include",
            expected: new Map([["^テスト$", new Map([["テスト", ["1002"]]])]]),
            ids: ["1002"],
        },
        {
            name: "@exclude",
            expected: new Map([
                ["^コメント$", new Map([["コメント", ["1004"]]])],
            ]),
            ids: ["1004"],
        },
    ])("$name", ({ name, expected, ids }) => {
        const isExclude = name === "@exclude";
        const filter = `
@include example-tag
^テスト$
@end

@include tag
^コメント$
@end
`;
        const wordFilter = filtering({
            filter: isExclude ? replaceInclude(filter) : filter,
            tags: ["example-TAG"],
        });

        expect(wordFilter.getLog()).toEqual(expected);
        checkComment(threads, ids);
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
            new Map([["^コメント$", new Map([["コメント", ["1004"]]])]]),
        );
        checkComment(threads, ["1004"]);
    });

    it(`Settings.${"isCaseInsensitive" satisfies keyof Settings}`, () => {
        const filter = "TesT";

        expect(
            filtering({
                filter,
                settings: { isCaseInsensitive: false },
            }).getLog(),
        ).toEqual(new Map());
        checkComment(threads, []);
    });

    it(`Settings.${"isIgnoreByNicoru" satisfies keyof Settings}`, () => {
        const filter = `
テスト
コメント
`;

        expect(
            filtering({
                filter,
                settings: { isIgnoreByNicoru: true },
            }).getLog(),
        ).toEqual(new Map([["テスト", new Map([["テスト", ["1002"]]])]]));
        checkComment(threads, ["1002"]);
    });

    it(`${WordFilter.prototype.sortLog.name}()`, () => {
        const filter = `
コメント
テスト
`;
        const wordFilter = filtering({
            filter,
        });
        wordFilter.sortLog();

        expect(wordFilter.getLog()).toEqual(
            new Map([
                [
                    "コメント",
                    new Map([
                        ["コメント", ["1004"]],
                        ["テストコメント", ["1003"]],
                    ]),
                ],
                ["テスト", new Map([["テスト", ["1002"]]])],
            ]),
        );
    });
});
