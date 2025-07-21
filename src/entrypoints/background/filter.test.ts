/* eslint-disable no-irregular-whitespace */
import { describe, it, expect } from "vitest";
import { extractRule, extractCustomRule, RawCustomRule } from "./filter.js";

describe(`${extractRule.name}()`, () => {
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
            name: "構文指令",
            filter: "@strict # comment",
            expected: "@strict",
        },
        {
            name: "構文指令(パラメータあり)",
            filter: "@include tag0 tag1 # comment",
            expected: "@include tag0 tag1",
        },
    ])("一般($name)", ({ filter, expected }) => {
        expect(extractRule(filter)).toEqual(
            expected === undefined ? [] : [{ rule: expected, index: 0 }],
        );
    });

    it.each([
        { name: "一つの全角スペース", filter: "rule　# comment" },
        { name: "複数の全角スペース", filter: "rule　　　　# comment" },
        { name: "半角全角スペース交互", filter: "rule 　 　# comment" },
    ])("コメントの前に全角を含む($name)", ({ filter }) => {
        expect(extractRule(filter)).toEqual([{ rule: "rule", index: 0 }]);
    });

    it.each([
        { name: "コメントなし", filter: "\\#rule\\#rule2\\#" },
        { name: "コメントあり", filter: "\\#rule\\#rule2\\# # comment" },
    ])("エスケープした#を含む($name)", ({ filter }) => {
        expect(extractRule(filter)).toEqual(
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

        expect(extractRule(filter)).toEqual(
            [1, 3, 5].map((index) => ({ rule: "rule", index })),
        );
    });
});

// ===========================================================================================

const tags = ["tag0", "tag1", "tag2", "tag3"] as const;

describe(`${extractCustomRule.name}()`, () => {
    const createRule = (rule: Partial<RawCustomRule>): RawCustomRule => {
        return {
            ...{
                rule: "rule",
                isStrict: false,
                isDisable: false,
                include: [],
                exclude: [],
            },
            ...rule,
        };
    };
    const createRules = (...rules: Partial<RawCustomRule>[]) => {
        return rules.map((rule) => createRule(rule));
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
            expected: [strict, base],
        },
        {
            name: "不要な@end",
            filter: `
@end
@end

rule
`,
            expected: [base],
        },
        {
            name: "@endなし",
            filter: `
@strict
rule
`,
            expected: [strict],
        },
    ])("$name", ({ filter, expected }) => {
        expect(extractCustomRule(filter)).toEqual(expected);
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
        expect(extractCustomRule(filter)).toEqual([strict]);
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
            name: "誤り:タグ間に全角スペースを含む",
            filter: `
@include tag0　tag1
rule
@end
`,
            expected: createRules({ include: ["tag0　tag1"] }),
        },
        {
            name: "誤り:@includeの後が全角スペースになっている",
            filter: `
@include　tag0 tag1
rule
@end
`,
            expected: createRules({ rule: "@include　tag0 tag1" }, {}),
        },
        {
            name: "誤り:@includeではなく@includesになっている",
            filter: `
@includes tag0 tag1
rule
@end
`,
            expected: createRules({ rule: "@includes tag0 tag1" }, {}),
        },
    ])("@include($name)", ({ filter, expected }) => {
        expect(extractCustomRule(filter)).toEqual(expected);
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

        expect(extractCustomRule(filter)).toEqual(
            createRules({ isDisable: true }),
        );
    });

    // -------------------------------------------------------------------------------------------
    // その他
    // -------------------------------------------------------------------------------------------

    it("構文指令のネスト", () => {
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

        expect(extractCustomRule(filter)).toEqual([
            ...createRules(
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
            ),
            base,
        ]);
    });

    it.each([
        { name: "@から始まる構文指令", filter: "\\@end", expected: "@end" },
        { name: "!から始まる構文指令", filter: "\\!rule", expected: "!rule" },
        { name: "通常のルール", filter: "\\rule", expected: "rule" },
    ])("エスケープ($name)", ({ filter, expected }) => {
        expect(extractCustomRule(filter)).toEqual(
            createRules({ rule: expected }),
        );
    });
});
