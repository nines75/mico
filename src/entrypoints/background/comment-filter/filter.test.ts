/* eslint-disable no-irregular-whitespace */
import { describe, expect, it } from "vitest";
import {
    analyzeCustomRule,
    checkHasTagRule,
    CustomRule,
    extractRuleFromFilter,
} from "./filter.js";
import { defaultSettings } from "@/utils/config.js";

describe("extractRuleFromFilter()", () => {
    it("一般的なケース", () => {
        const filter = `
rule
rule # comment
rule    # comment
# comment

@strict # comment
@include tag0 tag1 # comment
`;

        expect(extractRuleFromFilter(filter)).toEqual(
            [
                ["rule", 1],
                ["rule", 2],
                ["rule", 3],
                ["@strict", 6],
                ["@include tag0 tag1", 7],
            ].map(([rule, index]) => ({ rule, index })),
        );
    });

    it("コメントの前に全角を含むケース", () => {
        const filter = `
rule　# comment
rule　　　　# comment
rule 　 　# comment
`;

        expect(extractRuleFromFilter(filter)).toEqual(
            [
                ["rule", 1],
                ["rule", 2],
                ["rule", 3],
            ].map(([rule, index]) => ({ rule, index })),
        );
    });

    it("エスケープした#を含むケース", () => {
        const filter = `
\\#rule\\#rule2\\#
\\#rule\\#rule2\\# # comment
`;

        expect(extractRuleFromFilter(filter)).toEqual(
            [
                ["#rule#rule2#", 1],
                ["#rule#rule2#", 2],
            ].map(([rule, index]) => ({ rule, index })),
        );
    });
});

const tags = [
    new RegExp("tag0", "i"),
    new RegExp("tag1", "i"),
    new RegExp("tag2", "i"),
    new RegExp("tag3", "i"),
];

describe("analyzeCustomRule()", () => {
    const baseAnalyzedRule = {
        rule: "rule",
        isStrict: false,
        isDisable: false,
        include: [],
        exclude: [],
    };
    const strict = {
        ...baseAnalyzedRule,
        ...{
            isStrict: true,
        },
    };

    const getFunction = (filter: string) => {
        return analyzeCustomRule(
            { ...defaultSettings, ...{ ngCommand: filter } },
            "ngCommand", // 内部で値を読みだすだけなのでidは何でもいい
        );
    };

    it("@end", () => {
        const filter = `
@strict
@end
rule

@strict
@end # comment
rule

@end
@strict
rule
`;

        expect(getFunction(filter)).toEqual([
            ...Array(2).fill(baseAnalyzedRule),
            strict,
        ]);
    });

    it("@strict/!", () => {
        const filter = `
@strict
rule
@end

@strict # comment
rule
@end

!rule
!rule # comment

@strict
!rule
@end
`;

        expect(getFunction(filter)).toEqual(Array(5).fill(strict));
    });

    it.each([["include"], ["exclude"]])("@%s", (type) => {
        const isExclude = type === "exclude";

        const filter = `
@include tag0 tag1
rule
@end

@include tag0 tag1 # comment
rule
@end

@include    tag0    tag1    
rule
@end

@include　tag0 tag1 tag2　tag3
rule
@end
`;

        const correct = {
            ...baseAnalyzedRule,
            ...{
                include: isExclude ? [] : tags.slice(0, 2),
                exclude: isExclude ? tags.slice(0, 2) : [],
            },
        };
        const wrongTags = [tags[1], new RegExp("tag2　tag3", "i")];
        const wrong = {
            ...baseAnalyzedRule,
            ...{
                include: isExclude ? [] : wrongTags,
                exclude: isExclude ? wrongTags : [],
            },
        };

        expect(
            getFunction(
                isExclude ? filter.replace(/include/g, "exclude") : filter,
            ),
        ).toEqual([...Array(3).fill(correct), wrong]);
    });

    it("@disable", () => {
        const filter = `
@disable
rule
@end

@disable # comment
rule
@end
`;

        const disable = {
            ...baseAnalyzedRule,
            ...{
                isDisable: true,
            },
        };

        expect(getFunction(filter)).toEqual(Array(2).fill(disable));
    });

    it("ネスト", () => {
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

        const expected = {
            ...baseAnalyzedRule,
            ...{
                include: [tags[0]],
            },
        };
        const expected2 = {
            ...expected,
            ...{
                exclude: [tags[1]],
            },
        };
        const expected3 = {
            ...expected2,
            ...{
                isStrict: true,
            },
        };
        const expected4 = {
            ...expected3,
            ...{
                isDisable: true,
            },
        };
        const expected5 = {
            ...expected2,
            ...{
                include: [...expected2.include, tags[2]],
            },
        };
        const expected6 = {
            ...expected2,
            ...{
                exclude: [...expected2.exclude, tags[3]],
            },
        };

        expect(getFunction(filter)).toEqual([
            expected,
            expected2,
            expected3,
            expected4,
            expected5,
            expected6,
            baseAnalyzedRule,
        ]);
    });

    it("不要な@endがあるケース", () => {
        const filter = `
@end
@end

rule
`;

        expect(getFunction(filter)).toEqual([{ ...baseAnalyzedRule }]);
    });

    it("@endがないケース", () => {
        const filter = `
@strict
rule
`;

        expect(getFunction(filter)).toEqual([strict]);
    });
});

describe("checkHasTagRule()", () => {
    const neither = {
        isStrict: false,
        include: [],
        exclude: [],
    } satisfies CustomRule;
    const include = {
        ...neither,
        ...{
            include: [tags[0] as RegExp],
        },
    } satisfies CustomRule;
    const exclude = {
        ...neither,
        ...{
            exclude: [tags[1] as RegExp],
        },
    } satisfies CustomRule;
    const both = {
        ...include,
        ...{
            exclude: [tags[1] as RegExp],
        },
    } satisfies CustomRule;

    it.each([
        ["neither", [neither], false],
        ["include", [include], true],
        ["include+", [include, neither], true],
        ["exclude", [exclude], true],
        ["exclude+", [exclude, neither], true],
        ["both", [both], true],
        ["both+", [include, exclude, neither], true],
    ])("%s", (_, rules, expected) => {
        expect(checkHasTagRule(rules)).toBe(expected);
    });
});
