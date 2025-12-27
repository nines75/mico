/* eslint-disable no-irregular-whitespace */
import { describe, it, expect } from "vitest";
import { parseFilterBase, parseFilter, Rule } from "./filter.js";

describe(`${parseFilterBase.name}()`, () => {
    it.each([
        {
            name: "コメントなし",
            filter: "rule",
            expected: "rule",
        },
        {
            name: "コメント(1つの半角スペース)",
            filter: "rule # comment",
            expected: "rule",
        },
        {
            name: "コメント(複数の半角スペース)",
            filter: "rule    # comment",
            expected: "rule",
        },
        {
            name: "コメントのみ",
            filter: "# comment",
        },
        {
            name: "空行",
            filter: "",
        },
        {
            name: "ディレクティブ",
            filter: "@strict # comment",
            expected: "@strict",
        },
        {
            name: "ディレクティブ(パラメータあり)",
            filter: "@include tag0 tag1 # comment",
            expected: "@include tag0 tag1",
        },
    ])("一般($name)", ({ filter, expected }) => {
        expect(parseFilterBase(filter)).toEqual(
            expected === undefined ? [] : [{ rule: expected, index: 0 }],
        );
    });

    it.each([
        { name: "一つの全角スペース", filter: "rule　# comment" },
        { name: "複数の全角スペース", filter: "rule　　　　# comment" },
        { name: "半角全角スペース交互", filter: "rule 　 　# comment" },
    ])("コメントの前に全角を含む($name)", ({ filter }) => {
        expect(parseFilterBase(filter)).toEqual([{ rule: "rule", index: 0 }]);
    });

    it.each([
        { name: "コメントなし", filter: "\\#rule\\#rule2\\#" },
        { name: "コメントあり", filter: "\\#rule\\#rule2\\# # comment" },
    ])("エスケープした#を含む($name)", ({ filter }) => {
        expect(parseFilterBase(filter)).toEqual(
            [["#rule#rule2#", 0]].map(([rule, index]) => ({ rule, index })),
        );
    });

    it("index", () => {
        const filter = `
rule
# comment
rule

rule
`;

        expect(parseFilterBase(filter)).toEqual(
            [1, 3, 5].map((index) => ({ rule: "rule", index })),
        );
    });
});

// ===========================================================================================

const tags = ["tag0", "tag1", "tag2", "tag3"] as const;

describe(`${parseFilter.name}()`, () => {
    const createRule = (
        rule: Partial<Rule>,
    ): { rules: Rule[]; invalid: number } => {
        return {
            rules: [
                {
                    ...{
                        rule: "rule",
                        isStrict: false,
                        isDisable: false,
                        include: [],
                        exclude: [],
                    },
                    ...rule,
                },
            ],
            invalid: 0,
        };
    };
    const createRules = (...rules: Partial<Rule>[]) => {
        return rules
            .map((rule) => createRule(rule))
            .reduce(
                (all, current) => {
                    all.rules.push(...current.rules);
                    all.invalid += current.invalid;
                    return all;
                },
                { rules: [], invalid: 0 },
            );
    };
    const base = createRule({});
    const strict = createRule({ isStrict: true });

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
            expected: createRules({ isStrict: true }, {}),
        },
        {
            name: "不要な@end",
            filter: `
@end
@end

rule
`,
            expected: base,
        },
        {
            name: "@endなし",
            filter: `
@strict
rule
`,
            expected: strict,
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
            name: "!",
            filter: "!rule",
        },
        {
            name: "@strictと!が重複",
            filter: `
@strict
!rule
@end
`,
        },
    ])("$name", ({ filter }) => {
        expect(parseFilter(filter)).toEqual(strict);
    });

    // -------------------------------------------------------------------------------------------
    // @include/@exclude
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            name: "通常",
            filter: `
@include tag0 TAG1
rule
@end
`,
            expected: createRules({ include: tags.slice(0, 2) }),
        },
        {
            name: "タグ間に複数の半角スペースを含む",
            filter: `
@include    tag0    tag1    
rule
@end
`,
            expected: createRules({ include: tags.slice(0, 2) }),
        },
        {
            name: "誤り: タグ間に全角スペースを含む",
            filter: `
@include tag0　tag1
rule
@end
`,
            expected: createRules({ include: ["tag0　tag1"] }),
        },
        {
            name: "誤り: @includeの後が全角スペース",
            filter: `
@include　tag0 tag1
rule
@end
`,
            expected: createRules({ rule: "@include　tag0 tag1" }, {}),
        },
        {
            name: "誤り: @includes",
            filter: `
@includes tag0 tag1
rule
@end
`,
            expected: createRules({ rule: "@includes tag0 tag1" }, {}),
        },
    ])("@include($name)", ({ filter, expected }) => {
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

        expect(parseFilter(filter)).toEqual(createRules({ isDisable: true }));
    });

    // -------------------------------------------------------------------------------------------
    // その他
    // -------------------------------------------------------------------------------------------

    it("ディレクティブのネスト", () => {
        const filter = `
@include tag0
rule

@exclude tag1
rule

@strict
rule

@disable
rule
@end

@end

@include tag2
rule
@end

@exclude tag3
rule
@end

@end
@end
rule
`;

        expect(parseFilter(filter)).toEqual(
            createRules(
                {
                    include: [tags[0]],
                },
                {
                    include: [tags[0]],
                    exclude: [tags[1]],
                },
                {
                    include: [tags[0]],
                    exclude: [tags[1]],
                    isStrict: true,
                },
                {
                    include: [tags[0]],
                    exclude: [tags[1]],
                    isStrict: true,
                    isDisable: true,
                },
                {
                    include: [tags[0], tags[2]],
                    exclude: [tags[1]],
                },
                {
                    include: [tags[0]],
                    exclude: [tags[1], tags[3]],
                },
                {},
            ),
        );
    });
});
