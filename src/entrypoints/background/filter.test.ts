/* eslint-disable no-irregular-whitespace */
import { describe, it, expect } from "vitest";
import { extractRule, extractCustomRule, RawCustomRule } from "./filter.js";

describe(`${extractRule.name}()`, () => {
    it.each([
        {
            filter: "rule",
            expected: "rule",
            name: "コメントなし",
        },
        {
            filter: "rule # comment",
            expected: "rule",
            name: "コメント(1つの半角スペース)",
        },
        {
            filter: "rule    # comment",
            expected: "rule",
            name: "コメント(複数の半角スペース)",
        },
        {
            filter: "# comment",
            name: "コメントのみ",
        },
        {
            filter: "",
            name: "空行",
        },
        {
            filter: "@strict # comment",
            expected: "@strict",
            name: "構文指令",
        },
        {
            filter: "@include tag0 tag1 # comment",
            expected: "@include tag0 tag1",
            name: "構文指令(パラメータあり)",
        },
    ])("一般($name)", ({ filter, expected }) => {
        expect(extractRule(filter)).toEqual(
            expected === undefined ? [] : [{ rule: expected, index: 0 }],
        );
    });

    it.each([
        { filter: "rule　# comment", name: "一つの全角スペース" },
        { filter: "rule　　　　# comment", name: "複数の全角スペース" },
        { filter: "rule 　 　# comment", name: "半角全角スペース交互" },
    ])("コメントの前に全角を含む($name)", ({ filter }) => {
        expect(extractRule(filter)).toEqual([{ rule: "rule", index: 0 }]);
    });

    it.each([
        { filter: "\\#rule\\#rule2\\#", name: "コメントなし" },
        { filter: "\\#rule\\#rule2\\# # comment", name: "コメントあり" },
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

const tags = [
    RegExp("tag0", "i"),
    RegExp("tag1", "i"),
    RegExp("tag2", "i"),
    RegExp("tag3", "i"),
] as const;

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
            filter: `
@strict
rule
@end
rule
`,
            expected: [strict, base],
            name: "@end",
        },
        {
            filter: `
@end
@end

rule
`,
            expected: [base],
            name: "不要な@end",
        },
        {
            filter: `
@strict
rule
`,
            expected: [strict],
            name: "@endなし",
        },
    ])("$name", ({ filter, expected }) => {
        expect(extractCustomRule(filter).rules).toEqual(expected);
    });

    // -------------------------------------------------------------------------------------------
    // @strict/!
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            filter: `
@strict
rule
@end
`,
            name: "@strict",
        },
        {
            filter: "!rule",
            name: "!",
        },
        {
            filter: `
@strict
!rule
@end
`,
            name: "@strictと!が重複",
        },
    ])("$name", ({ filter }) => {
        expect(extractCustomRule(filter).rules).toEqual([strict]);
    });

    // -------------------------------------------------------------------------------------------
    // @include/@exclude
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            filter: `
@include tag0 tag1
rule
@end
`,
            expected: createRules({ include: tags.slice(0, 2) }),
            name: "通常",
        },
        {
            filter: `
@include    tag0    tag1    
rule
@end
`,
            expected: createRules({ include: tags.slice(0, 2) }),
            name: "タグ間に複数の半角スペースを含む",
        },
        {
            filter: `
@include tag0　tag1
rule
@end
`,
            expected: createRules({ include: [RegExp("tag0　tag1", "i")] }),
            name: "誤り:タグ間に全角スペースを含む",
        },
        {
            filter: `
@include　tag0 tag1
rule
@end
`,
            expected: createRules({ rule: "@include　tag0 tag1" }, {}),
            name: "誤り:@includeの後が全角スペースになっている",
        },
        {
            filter: `
@includes tag0 tag1
rule
@end
`,
            expected: createRules({ rule: "@includes tag0 tag1" }, {}),
            name: "誤り:@includeではなく@includesになっている",
        },
    ])("@include($name)", ({ filter, expected }) => {
        expect(extractCustomRule(filter).rules).toEqual(expected);
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

        expect(extractCustomRule(filter).rules).toEqual(
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

        expect(extractCustomRule(filter).rules).toEqual([
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

    it("無効な正規表現", () => {
        const filter = `
@include (tag0
@include tag1 (tag2
rule
`;
        const ruleData = extractCustomRule(filter);

        expect(ruleData.rules).toEqual(createRules({ include: [tags[1]] }));
        expect(ruleData.invalidCount).toBe(2);
    });

    it.each([
        { filter: "\\@end", expected: "@end", name: "@から始まる構文指令" },
        { filter: "\\!rule", expected: "!rule", name: "!から始まる構文指令" },
        { filter: "\\rule", expected: "rule", name: "通常のルール" },
    ])("エスケープ($name)", ({ filter, expected }) => {
        expect(extractCustomRule(filter).rules).toEqual(
            createRules({ rule: expected }),
        );
    });
});
