import { describe, it, expect } from "vitest";
import { parseArgs, parseFilter } from "./parse-filter";
import { mockToggle, mockRules } from "@/utils/test";

const tags = ["tag0", "tag1", "tag2", "tag3"] as const;

describe(parseFilter.name, () => {
    // -------------------------------------------------------------------------------------------
    // ルール
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            name: "コメント",
            filter: "# comment",
        },
        {
            name: "空行",
            filter: "",
        },
        {
            name: "index",
            hasIndex: true,
            filter: `
rule
# comment
rule

rule
`,
            expected: mockRules(...[1, 3, 5].map((index) => ({ index }))),
        },
        {
            name: "文字列ルール",
            filter: "rule",
            expected: mockRules({}),
        },
    ])("$name", ({ filter, hasIndex, expected }) => {
        expect(parseFilter(filter, hasIndex ?? false)).toEqual(
            expected ?? mockRules(),
        );
    });

    describe("正規表現ルール", () => {
        it.each([
            {
                name: "フラグなし",
                filter: "/rule/",
                expected: mockRules({ rule: RegExp("rule") }),
            },
            {
                name: "フラグあり",
                filter: "/rule/i",
                expected: mockRules({ rule: RegExp("rule", "i") }),
            },
            {
                name: "複数のフラグ",
                filter: "/rule/isum",
                expected: mockRules({ rule: RegExp("rule", "isum") }),
            },
        ])("$name", ({ filter, expected }) => {
            expect(parseFilter(filter)).toEqual(expected);
        });

        describe("異常系", () => {
            it.each([
                {
                    name: "先頭に空白文字を含む",
                    filter: " /rule/",
                    expected: mockRules({ rule: " /rule/" }),
                },
                {
                    name: "末尾に空白文字を含む",
                    filter: "/rule/ ",
                },
                {
                    name: "対応していないフラグ",
                    filter: "/rule/g",
                },
                {
                    name: "併用できないフラグ",
                    filter: "/rule/uv",
                },
                {
                    name: "無効な正規表現",
                    filter: "/(rule/",
                },
            ])("$name", ({ filter, expected }) => {
                expect(parseFilter(filter)).toEqual(
                    expected ?? { rules: [], invalidCount: 1 },
                );
            });
        });
    });

    // -------------------------------------------------------------------------------------------
    // @end
    // -------------------------------------------------------------------------------------------

    describe("@end", () => {
        it.each([
            {
                name: "基本",
                filter: `
@strict
rule
@end
rule
`,
                expected: mockRules({ isStrict: true }, {}),
            },
            {
                name: "余分に@endがある",
                filter: `
@end
@end

rule
`,
                expected: mockRules({}),
            },
            {
                name: "対応する@endがない",
                filter: `
@strict
rule
`,
                expected: mockRules({ isStrict: true }),
            },
        ])("$name", ({ filter, expected }) => {
            expect(parseFilter(filter)).toEqual(expected);
        });
    });

    // -------------------------------------------------------------------------------------------
    // @strict
    // -------------------------------------------------------------------------------------------

    it("@strict", () => {
        const filter = `
@strict
rule
@end
`;

        expect(parseFilter(filter)).toEqual(mockRules({ isStrict: true }));
    });

    // -------------------------------------------------------------------------------------------
    // @disable
    // -------------------------------------------------------------------------------------------

    it("@disable", () => {
        const filter = `
@disable
rule
@end
`;

        expect(parseFilter(filter)).toEqual(mockRules({ isDisable: true }));
    });

    // -------------------------------------------------------------------------------------------
    // @include/@exclude
    // -------------------------------------------------------------------------------------------

    describe("@include/@exclude", () => {
        it.each([
            {
                name: "基本",
                filter: `
@include-tags tag0 tag1
rule
@end
`,
                expected: mockRules({
                    include: mockToggle({ tags: [tags.slice(0, 2)] }),
                }),
            },
        ])("$name", ({ filter, expected }) => {
            expect(parseFilter(filter)).toEqual(expected);
        });

        describe("異常系", () => {
            it.each([
                {
                    // スペースのみの場合、引数は空の配列としてパースされる
                    // これが有効なディレクティブとしてカウントされるとfilterRules()が正しく動作しないため空配列が除外されていることを確認する
                    name: "ディレクティブの後にスペースのみを含む",
                    filter: `
@include-tags 
rule
@end
`,
                    expected: mockRules({}),
                },
                {
                    name: "ディレクティブの前方一致",
                    filter: `
@include-tagss tag0 tag1
rule
@end
`,
                    expected: mockRules({}),
                },
            ])("$name", ({ filter, expected }) => {
                expect(parseFilter(filter)).toEqual(expected);
            });
        });
    });

    // -------------------------------------------------------------------------------------------
    // エイリアス
    // -------------------------------------------------------------------------------------------

    describe("エイリアス", () => {
        it.each([
            {
                name: "基本",
                filter: `
@s
rule
rule

@v sm1
rule
rule
`,
                expected: mockRules(
                    { isStrict: true },
                    {},
                    { include: mockToggle({ videoIds: [["sm1"]] }) },
                    {},
                ),
            },
            {
                name: "直後の行にルールがない",
                filter: `
@s
@end
rule

@v sm1
@end
rule
`,
                expected: mockRules(
                    { isStrict: true },
                    { include: mockToggle({ videoIds: [["sm1"]] }) },
                ),
            },
            {
                name: "ディレクティブが連続",
                filter: `
@s
@s
rule
rule

@v sm1
@v sm1
rule
rule
`,
                expected: mockRules(
                    { isStrict: true },
                    {},
                    { include: mockToggle({ videoIds: [["sm1"]] }) },
                    {},
                ),
            },
        ])("$name", ({ filter, expected }) => {
            expect(parseFilter(filter)).toEqual(expected);
        });
    });

    // -------------------------------------------------------------------------------------------
    // ディレクティブ
    // -------------------------------------------------------------------------------------------

    describe("ディレクティブ", () => {
        it.each([
            {
                name: "無効",
                filter: `
@directive
rule
`,
                expected: mockRules({}),
            },
            {
                name: "ネスト",
                filter: `
@include-tags tag0
rule

@exclude-tags tag1
rule

@strict
rule

@disable
rule
@end

@end

@include-tags tag2
rule
@end

@exclude-tags tag3
rule
@end

@end
@end
rule
`,
                expected: mockRules(
                    {
                        include: mockToggle({ tags: [[tags[0]]] }),
                    },
                    {
                        include: mockToggle({ tags: [[tags[0]]] }),
                        exclude: mockToggle({ tags: [[tags[1]]] }),
                    },
                    {
                        include: mockToggle({ tags: [[tags[0]]] }),
                        exclude: mockToggle({ tags: [[tags[1]]] }),
                        isStrict: true,
                    },
                    {
                        include: mockToggle({ tags: [[tags[0]]] }),
                        exclude: mockToggle({ tags: [[tags[1]]] }),
                        isStrict: true,
                        isDisable: true,
                    },
                    {
                        include: mockToggle({ tags: [[tags[0]], [tags[2]]] }),
                        exclude: mockToggle({ tags: [[tags[1]]] }),
                    },
                    {
                        include: mockToggle({ tags: [[tags[0]]] }),
                        exclude: mockToggle({ tags: [[tags[1]], [tags[3]]] }),
                    },
                    {},
                ),
            },
        ])("$name", ({ filter, expected }) => {
            expect(parseFilter(filter)).toEqual(expected);
        });
    });
});

describe(parseArgs.name, () => {
    it.each([
        {
            name: "基本",
            filter: "@v arg arg2",
        },
        {
            name: "小文字に変換されているか",
            filter: "@v ARG Arg2",
        },
        {
            name: "間に複数の半角スペースを含む",
            filter: "@v    arg    arg2    ",
        },
        {
            name: "間に複数の全角スペースを含む",
            filter: "@v　　　　arg　　　　arg2　　　　",
        },
        {
            name: "間に半角スペースと全角スペースを含む",
            filter: "@v 　 　arg 　 　arg2 　 　",
        },
    ])("$name", ({ filter }) => {
        expect(parseArgs(filter)).toEqual(["arg", "arg2"]);
    });
});
