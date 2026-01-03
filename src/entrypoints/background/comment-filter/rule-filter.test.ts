import { describe, expect, it, vi } from "vitest";
import { mockRules, mockToggle, testTabData } from "@/utils/test.js";
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

describe(`${RuleFilter.prototype.filterRules.name}()`, () => {
    const filtering = (options: { filter: string; tags?: string[] }) => {
        const testFilter = new TestFilter(defaultSettings, options.filter);
        testFilter.filterRules({
            ...testTabData,
            ...{ tags: options.tags ?? [] },
        });

        return testFilter;
    };

    // -------------------------------------------------------------------------------------------
    // @include-tags
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            name: "動画タグが単数",
            tags: ["tag"],
            expected: mockRules(
                { include: mockToggle({ tags: [["tag"]] }) },
                { include: mockToggle({ tags: [["tag", "tag2"]] }) },
            ).rules,
        },
        {
            name: "動画タグが複数",
            tags: ["tag", "tag2"],
            expected: mockRules(
                { include: mockToggle({ tags: [["tag"]] }) },
                { include: mockToggle({ tags: [["tag2"]] }) },
                { include: mockToggle({ tags: [["tag", "tag2"]] }) },
                { include: mockToggle({ tags: [["tag"], ["tag2"]] }) },
            ).rules,
        },
        {
            name: "動画タグなし",
            tags: [],
            expected: [],
        },
    ])("@include-tags($name)", ({ tags, expected }) => {
        const filter = `
@include-tags tag
rule
@end

@include-tags tag2
rule
@end

@include-tags tag tag2
rule
@end

@include-tags tag
@include-tags tag2
rule
@end
@end
`;

        expect(filtering({ filter, tags }).getRule()).toEqual(expected);
    });

    // -------------------------------------------------------------------------------------------
    // @exclude-tags
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            name: "動画タグが単数",
            tags: ["tag"],
            expected: mockRules(
                { exclude: mockToggle({ tags: [["tag2"]] }) },
                { exclude: mockToggle({ tags: [["tag"], ["tag2"]] }) },
            ).rules,
        },
        {
            name: "動画タグが複数",
            tags: ["tag", "tag2"],
            expected: [],
        },
        {
            name: "動画タグなし",
            tags: [],
            expected: mockRules(
                { exclude: mockToggle({ tags: [["tag"]] }) },
                { exclude: mockToggle({ tags: [["tag2"]] }) },
                { exclude: mockToggle({ tags: [["tag", "tag2"]] }) },
                { exclude: mockToggle({ tags: [["tag"], ["tag2"]] }) },
            ).rules,
        },
    ])("@exclude-tags($name)", ({ tags, expected }) => {
        const filter = `
@exclude-tags tag
rule
@end

@exclude-tags tag2
rule
@end

@exclude-tags tag tag2
rule
@end

@exclude-tags tag
@exclude-tags tag2
rule
@end
@end
`;
        expect(filtering({ filter, tags }).getRule()).toEqual(expected);
    });

    // -------------------------------------------------------------------------------------------
    // @include-tags + @exclude-tags
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            name: "@include-tagsのみマッチ",
            tags: ["tag"],
            expected: mockRules({
                include: mockToggle({ tags: [["tag"]] }),
                exclude: mockToggle({ tags: [["tag2"]] }),
            }).rules,
        },
        {
            name: "@exclude-tagsのみマッチ",
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
    ])("@include-tags + @exclude-tags($name)", ({ tags, expected }) => {
        const filter = `
@include-tags tag
@exclude-tags tag2
rule
`;

        expect(filtering({ filter, tags }).getRule()).toEqual(expected);
    });

    // -------------------------------------------------------------------------------------------
    // @include-video-ids
    // @exclude-video-ids
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            name: "@include-video-ids",
            expected: mockRules(
                { include: mockToggle({ videoIds: [["sm1"]] }) },
                { include: mockToggle({ videoIds: [["sm1", "sm2"]] }) },
            ).rules,
        },
        {
            name: "@exclude-video-ids",
            expected: mockRules({
                exclude: mockToggle({ videoIds: [["sm2"]] }),
            }).rules,
        },
    ])("$name", ({ name, expected }) => {
        const filter = `
${name} sm1
rule
@end

${name} sm2
rule
@end

${name} sm1 sm2
rule
@end
`;

        expect(filtering({ filter }).getRule()).toEqual(expected);
    });

    // -------------------------------------------------------------------------------------------
    // @include-user-ids
    // @exclude-user-ids
    // @include-series-ids
    // @exclude-series-ids
    // -------------------------------------------------------------------------------------------

    it.each([
        {
            name: "@include-user-ids",
            expected: mockRules(
                { include: mockToggle({ userIds: [["1"]] }) },
                { include: mockToggle({ userIds: [["1", "2"]] }) },
            ).rules,
        },
        {
            name: "@exclude-user-ids",
            expected: mockRules({
                exclude: mockToggle({ userIds: [["2"]] }),
            }).rules,
        },
        {
            name: "@include-series-ids",
            expected: mockRules(
                { include: mockToggle({ seriesIds: [["1"]] }) },
                { include: mockToggle({ seriesIds: [["1", "2"]] }) },
            ).rules,
        },
        {
            name: "@exclude-series-ids",
            expected: mockRules({
                exclude: mockToggle({ seriesIds: [["2"]] }),
            }).rules,
        },
    ])("$name", ({ name, expected }) => {
        const filter = `
${name} 1
rule
@end

${name} 2
rule
@end

${name} 1 2
rule
@end
`;

        expect(filtering({ filter }).getRule()).toEqual(expected);
    });
});
