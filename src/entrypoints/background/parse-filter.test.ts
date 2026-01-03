/* eslint-disable no-irregular-whitespace */
import { describe, it, expect } from "vitest";
import { parseFilter } from "./parse-filter.js";
import { mockToggle, mockRules } from "@/utils/test.js";

const tags = ["tag0", "tag1", "tag2", "tag3"] as const;

describe(`${parseFilter.name}()`, () => {
    // -------------------------------------------------------------------------------------------
    // @end
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            name: "@end",
            filter: `
@strict
rule
@end
rule
`,
            expected: mockRules({ isStrict: true }, {}),
        },
        {
            name: "不要な@end",
            filter: `
@end
@end

rule
`,
            expected: mockRules({}),
        },
        {
            name: "@endなし",
            filter: `
@strict
rule
`,
            expected: mockRules({ isStrict: true }),
        },
    ])("$name", ({ filter, expected }) => {
        expect(parseFilter(filter)).toEqual(expected);
    });

    // -------------------------------------------------------------------------------------------
    // @strict/!
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            name: "@strict",
            filter: `
@strict
rule
@end
`,
        },
        {
            name: "@s",
            filter: `
@s
rule
rule
`,
            expected: mockRules({ isStrict: true }, {}),
        },
        {
            name: "@sの次の行にルールがない",
            filter: `
@s
# comment
@end
rule
`,
        },
        {
            name: "@strictと@sが重複",
            filter: `
@strict
@s
rule
@end
`,
        },
        {
            name: "@sが連続",
            filter: `
@s
@s
rule
rule
`,
            expected: mockRules({ isStrict: true }, {}),
        },
    ])("$name", ({ filter, expected }) => {
        expect(parseFilter(filter)).toEqual(
            expected ?? mockRules({ isStrict: true }),
        );
    });

    // -------------------------------------------------------------------------------------------
    // @include-tags
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            name: "通常",
            filter: `
@include-tags tag0 TAG1
rule
@end
`,
            expected: mockRules({
                include: mockToggle({ tags: [tags.slice(0, 2)] }),
            }),
        },
        {
            name: "タグ間に複数の半角スペースを含む",
            filter: `
@include-tags    tag0    tag1    
rule
@end
`,
            expected: mockRules({
                include: mockToggle({ tags: [tags.slice(0, 2)] }),
            }),
        },
        {
            // スペースのみの場合パラメータは空の配列としてパースされる
            // これが有効なディレクティブとしてカウントされるとfilterRules()が正しく動作しないため空配列が除外されていることを確認する
            name: "ディレクティブの後にスペースのみ含む",
            filter: `
@include-tags 
rule
@end
`,
            expected: mockRules({}),
        },
        {
            name: "誤り: タグ間に全角スペースを含む",
            filter: `
@include-tags tag0　tag1
rule
@end
`,
            expected: mockRules({
                include: mockToggle({ tags: [["tag0　tag1"]] }),
            }),
        },
        {
            name: "誤り: @includeの後が全角スペース",
            filter: `
@include-tags　tag0 tag1
rule
@end
`,
            expected: mockRules({}),
        },
        {
            name: "誤り: @includes-tagss",
            filter: `
@include-tagss tag0 tag1
rule
@end
`,
            expected: mockRules({}),
        },
    ])("@include-tags($name)", ({ filter, expected }) => {
        expect(parseFilter(filter)).toEqual(expected);
    });

    // -------------------------------------------------------------------------------------------
    // @v
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            name: "1つのタグ",
            filter: `
@v sm1
rule
rule
`,
            expected: mockRules(
                { include: mockToggle({ videoIds: [["sm1"]] }) },
                {},
            ),
        },
        {
            name: "複数のタグ",
            filter: `
@v sm1 sm2
rule
rule
`,
            expected: mockRules(
                { include: mockToggle({ videoIds: [["sm1", "sm2"]] }) },
                {},
            ),
        },
        {
            name: "次の行にルールがない",
            filter: `
@v sm1
# comment
@end
rule
`,
            expected: mockRules({
                include: mockToggle({ videoIds: [["sm1"]] }),
            }),
        },
        {
            name: "ディレクティブが連続",
            filter: `
@v sm1
@v sm1
rule
rule
`,
            expected: mockRules(
                { include: mockToggle({ videoIds: [["sm1"]] }) },
                {},
            ),
        },
    ])("@v($name)", ({ filter, expected }) => {
        expect(parseFilter(filter)).toEqual(expected);
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
        {
            name: "誤り: 先頭に空白文字を含む",
            filter: " /rule/",
            expected: mockRules({ rule: " /rule/" }),
        },
        {
            name: "誤り: 末尾に空白文字を含む",
            filter: "/rule/ ",
        },
        {
            name: "誤り: 対応していないフラグ",
            filter: "/rule/g",
        },
        {
            name: "誤り: 併用できないフラグ",
            filter: "/rule/uv",
        },
        {
            name: "誤り: 無効な正規表現",
            filter: "/(rule/",
        },
    ])("正規表現ルール($name)", ({ filter, expected }) => {
        expect(parseFilter(filter)).toEqual(
            expected ?? { rules: [], invalidCount: 1 },
        );
    });

    // -------------------------------------------------------------------------------------------
    // ディレクティブ
    // -------------------------------------------------------------------------------------------

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
    ])("ディレクティブ($name)", ({ filter, expected }) => {
        expect(parseFilter(filter)).toEqual(expected);
    });
});
