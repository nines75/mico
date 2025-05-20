/* eslint-disable no-irregular-whitespace */
import { describe, expect, it } from "vitest";
import {
    extractCustomRule,
    BaseCustomRule,
    hasTagRule,
    CustomRule,
    extractRule,
} from "./filter.js";
import { replaceInclude } from "@/utils/test.js";

describe("extractRule()", () => {
    it("一般的なケース", () => {
        const filter = `
rule
rule # comment
rule    # comment
# comment

@strict # comment
@include tag0 tag1 # comment
`;

        expect(extractRule(filter)).toEqual(
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

        expect(extractRule(filter)).toEqual(
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

        expect(extractRule(filter)).toEqual(
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
] as const;

describe("extractCustomRule()", () => {
    const baseCustomRule = {
        rule: "rule",
        isStrict: false,
        isDisable: false,
        include: [],
        exclude: [],
    } satisfies BaseCustomRule;
    const strict = {
        ...baseCustomRule,
        ...{
            isStrict: true,
        },
    } satisfies BaseCustomRule;

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

        expect(extractCustomRule(filter).rules).toEqual([
            ...Array(2).fill(baseCustomRule),
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

        expect(extractCustomRule(filter).rules).toEqual(Array(5).fill(strict));
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
            ...baseCustomRule,
            ...{
                include: isExclude ? [] : tags.slice(0, 2),
                exclude: isExclude ? tags.slice(0, 2) : [],
            },
        } satisfies BaseCustomRule;
        const wrongTags = [tags[1], new RegExp("tag2　tag3", "i")];
        const wrong = {
            ...baseCustomRule,
            ...{
                include: isExclude ? [] : wrongTags,
                exclude: isExclude ? wrongTags : [],
            },
        } satisfies BaseCustomRule;

        expect(
            extractCustomRule(isExclude ? replaceInclude(filter) : filter)
                .rules,
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
            ...baseCustomRule,
            ...{
                isDisable: true,
            },
        } satisfies BaseCustomRule;

        expect(extractCustomRule(filter).rules).toEqual(Array(2).fill(disable));
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
            ...baseCustomRule,
            ...{
                include: [tags[0]],
            },
        } satisfies BaseCustomRule;
        const expected2 = {
            ...expected,
            ...{
                exclude: [tags[1]],
            },
        } satisfies BaseCustomRule;
        const expected3 = {
            ...expected2,
            ...{
                isStrict: true,
            },
        } satisfies BaseCustomRule;
        const expected4 = {
            ...expected3,
            ...{
                isDisable: true,
            },
        } satisfies BaseCustomRule;
        const expected5 = {
            ...expected2,
            ...{
                include: [...expected2.include, tags[2]],
            },
        } satisfies BaseCustomRule;
        const expected6 = {
            ...expected2,
            ...{
                exclude: [...expected2.exclude, tags[3]],
            },
        } satisfies BaseCustomRule;

        expect(extractCustomRule(filter).rules).toEqual([
            expected,
            expected2,
            expected3,
            expected4,
            expected5,
            expected6,
            baseCustomRule,
        ]);
    });

    it("不要な@endがあるケース", () => {
        const filter = `
@end
@end

rule
`;

        expect(extractCustomRule(filter).rules).toEqual([
            { ...baseCustomRule },
        ]);
    });

    it("@endがないケース", () => {
        const filter = `
@strict
rule
`;

        expect(extractCustomRule(filter).rules).toEqual([strict]);
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
            include: [tags[0]],
        },
    } satisfies CustomRule;
    const exclude = {
        ...neither,
        ...{
            exclude: [tags[1]],
        },
    } satisfies CustomRule;
    const both = {
        ...include,
        ...{
            exclude: [tags[1]],
        },
    } satisfies CustomRule;

    it.each([
        { name: "neither", rules: [neither], expected: false },
        { name: "include", rules: [include] },
        { name: "include+", rules: [include, neither] },
        { name: "exclude", rules: [exclude] },
        { name: "exclude+", rules: [exclude, neither] },
        { name: "both", rules: [both] },
        { name: "both+", rules: [include, exclude, neither] },
    ])("$name", ({ rules, expected }) => {
        expect(hasTagRule(rules)).toBe(expected ?? true);
    });
});
