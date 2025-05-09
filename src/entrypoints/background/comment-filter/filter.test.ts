/* eslint-disable no-irregular-whitespace */
import { describe, expect, it } from "vitest";
import { analyzeCustomRule, extractRuleFromFilter } from "./filter.js";
import { defaultSettings } from "@/utils/config.js";

describe("extractRuleFromFilter()", () => {
    it("一般的なケース", () => {
        const filter = `
rule
rule # comment
rule    # comment
# comment

@strict # comment
@include tag1 tag2 # comment
`;

        expect(extractRuleFromFilter(filter)).toEqual(
            [
                ["rule", 1],
                ["rule", 2],
                ["rule", 3],
                ["@strict", 6],
                ["@include tag1 tag2", 7],
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

describe("analyzeCustomRule()", () => {
    const tags = [new RegExp("tag1", "i"), new RegExp("tag2", "i")];
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
@include tag1 tag2
rule
@end

@include tag1 tag2 # comment
rule
@end

@include    tag1    tag2    
rule
@end

@include　tag1 tag2 tag3　tag4
rule
@end
`;

        const correct = {
            ...baseAnalyzedRule,
            ...{
                include: isExclude ? [] : tags,
                exclude: isExclude ? tags : [],
            },
        };
        const wrongTags = [
            new RegExp("tag2", "i"),
            new RegExp("tag3　tag4", "i"),
        ];
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
});
