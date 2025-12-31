import { describe, expect, it, vi } from "vitest";
import { createRules, testTabData } from "@/utils/test.js";
import { RuleFilter } from "./rule-filter.js";
import { defaultSettings } from "@/utils/config.js";

class TestFilter extends RuleFilter<unknown> {
    protected override log: unknown;

    override filtering = vi.fn();
    override sortLog = vi.fn();

    getRule() {
        return this.rules;
    }
}

describe(`${RuleFilter.prototype.filterRule.name}()`, () => {
    const filtering = (options: { filter: string; tags?: string[] }) => {
        const testFilter = new TestFilter(defaultSettings, options.filter);
        testFilter.filterRule({
            ...testTabData,
            ...{ tags: options.tags ?? [] },
        });

        return testFilter;
    };

    // -------------------------------------------------------------------------------------------
    // @include
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            name: "動画タグが単数",
            tags: ["tag"],
            expected: createRules(
                { include: ["tag"] },
                { include: ["tag", "tag2"] },
            ).rules,
        },
        {
            name: "動画タグが複数",
            tags: ["tag", "tag2"],
            expected: createRules(
                { include: ["tag"] },
                { include: ["tag2"] },
                { include: ["tag", "tag2"] },
            ).rules,
        },
        {
            name: "動画タグなし",
            tags: [],
            expected: [],
        },
    ])("@include($name)", ({ tags, expected }) => {
        const filter = `
@include tag
rule
@end

@include tag2
rule
@end

@include tag tag2
rule
@end
`;

        expect(filtering({ filter, tags }).getRule()).toEqual(expected);
    });

    // -------------------------------------------------------------------------------------------
    // @exclude
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            name: "動画タグが単数",
            tags: ["tag"],
            expected: createRules({ exclude: ["tag2"] }).rules,
        },
        {
            name: "動画タグが複数",
            tags: ["tag", "tag2"],
            expected: [],
        },
        {
            name: "動画タグなし",
            tags: [],
            expected: createRules(
                { exclude: ["tag"] },
                { exclude: ["tag2"] },
                { exclude: ["tag", "tag2"] },
            ).rules,
        },
    ])("@exclude($name)", ({ tags, expected }) => {
        const filter = `
@exclude tag
rule
@end

@exclude tag2
rule
@end

@exclude tag tag2
rule
@end
`;
        expect(filtering({ filter, tags }).getRule()).toEqual(expected);
    });

    // -------------------------------------------------------------------------------------------
    // @include + @exclude
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            name: "@includeのみマッチ",
            tags: ["tag"],
            expected: createRules({ include: ["tag"], exclude: ["tag2"] })
                .rules,
        },
        {
            name: "@excludeのみマッチ",
            tags: ["tag2"],
            expected: [],
        },
        {
            name: "両方マッチ",
            tags: ["tag", "tag2"],
            expected: [],
        },
        {
            name: "動画タグなし",
            tags: [],
            expected: [],
        },
    ])("@include+@exclude($name)", ({ tags, expected }) => {
        const filter = `
@include tag
@exclude tag2
rule
`;

        expect(filtering({ filter, tags }).getRule()).toEqual(expected);
    });

    // -------------------------------------------------------------------------------------------
    // @v
    // -------------------------------------------------------------------------------------------

    it("@v", () => {
        const filter = `
@v sm1
rule

@v sm2
rule

@v sm1 sm2
rule
`;

        expect(filtering({ filter }).getRule()).toEqual(
            createRules(
                { includeVideoIds: ["sm1"] },
                { includeVideoIds: ["sm1", "sm2"] },
            ).rules,
        );
    });
});
