import { describe, expect, it, vi } from "vitest";
import { mockRules, testTab } from "@/utils/test";
import { RuleFilter } from "./rule-filter";
import { defaultSettings } from "@/utils/config";
import type { Settings } from "@/types/storage/settings.types";
import { parseFilter } from "../parse-filter";

class TestFilter extends RuleFilter {
  override apply = vi.fn();

  constructor(settings: Settings) {
    super(settings, "commentBody");

    // targetの指定なしでルールを上書き
    this.rules = parseFilter(settings.manualFilter).rules;
  }

  getRule() {
    return this.rules;
  }
}

function runFilter(options: { filter: string; tags?: string[] }) {
  const testFilter = new TestFilter({
    ...defaultSettings,
    manualFilter: options.filter,
  });
  testFilter.filterRules({ ...testTab, tags: options.tags ?? [] });

  return testFilter;
}

describe(RuleFilter.prototype.filterRules.name, () => {
  // -------------------------------------------------------------------------------------------
  // @include-tags
  // -------------------------------------------------------------------------------------------

  describe("@include-tags", () => {
    describe("引数が一個設定されている場合", () => {
      it.each([
        {
          name: "動画タグが設定されていない場合、ルールが有効化されない",
          tags: [],
          expected: [],
        },
        {
          name: "引数にマッチする動画タグが設定されている場合、ルールが有効化される",
          tags: ["foo"],
          expected: mockRules({ include: { tags: [["foo"]] } }).rules,
        },
        {
          name: "引数にマッチしない動画タグが設定されている場合、ルールが有効化されない",
          tags: ["bar"],
          expected: [],
        },
      ])("$name", ({ tags, expected }) => {
        const filter = `
@include-tags foo
rule
`;

        expect(runFilter({ filter, tags }).getRule()).toEqual(expected);
      });
    });

    describe("引数が二個設定されている場合", () => {
      it.each([
        {
          name: "片方の引数にマッチする動画タグが設定されている場合、ルールが有効化される",
          tags: ["foo"],
          expected: mockRules({ include: { tags: [["foo", "bar"]] } }).rules,
        },
        {
          name: "両方の引数にマッチする動画タグが設定されている場合、ルールが有効化される",
          tags: ["foo", "bar"],
          expected: mockRules({ include: { tags: [["foo", "bar"]] } }).rules,
        },
      ])("$name", ({ tags, expected }) => {
        const filter = `
@include-tags foo bar
rule
`;

        expect(runFilter({ filter, tags }).getRule()).toEqual(expected);
      });
    });

    describe("ネストしている場合", () => {
      it.each([
        {
          name: "片方の引数にマッチする動画タグが設定されている場合、ルールが有効化されない",
          tags: ["foo"],
          expected: [],
        },
        {
          name: "両方の引数にマッチする動画タグが設定されている場合、ルールが有効化される",
          tags: ["foo", "bar"],
          expected: mockRules({ include: { tags: [["foo"], ["bar"]] } }).rules,
        },
      ])("$name", ({ tags, expected }) => {
        const filter = `
@include-tags foo
@include-tags bar
rule
`;

        expect(runFilter({ filter, tags }).getRule()).toEqual(expected);
      });
    });
  });

  // -------------------------------------------------------------------------------------------
  // @exclude-tags
  // -------------------------------------------------------------------------------------------

  describe("@exclude-tags", () => {
    describe("引数が一個設定されている場合", () => {
      it.each([
        {
          name: "動画タグが設定されていない場合、ルールが無効化されない",
          tags: [],
          expected: mockRules({ exclude: { tags: [["foo"]] } }).rules,
        },
        {
          name: "引数にマッチする動画タグが設定されている場合、ルールが無効化される",
          tags: ["foo"],
          expected: [],
        },
        {
          name: "引数にマッチしない動画タグが設定されている場合、ルールが無効化されない",
          tags: ["bar"],
          expected: mockRules({ exclude: { tags: [["foo"]] } }).rules,
        },
      ])("$name", ({ tags, expected }) => {
        const filter = `
@exclude-tags foo
rule
`;

        expect(runFilter({ filter, tags }).getRule()).toEqual(expected);
      });
    });

    describe("引数が二個設定されている場合", () => {
      it.each([
        {
          name: "片方の引数にマッチする動画タグが設定されている場合、ルールが無効化される",
          tags: ["foo"],
          expected: [],
        },
        {
          name: "両方の引数にマッチする動画タグが設定されている場合、ルールが無効化される",
          tags: ["foo", "bar"],
          expected: [],
        },
      ])("$name", ({ tags, expected }) => {
        const filter = `
@exclude-tags foo bar
rule
`;

        expect(runFilter({ filter, tags }).getRule()).toEqual(expected);
      });
    });

    describe("ネストしている場合", () => {
      it.each([
        {
          name: "片方の引数にマッチする動画タグが設定されている場合、ルールが無効化されない",
          tags: ["foo"],
          expected: mockRules({ exclude: { tags: [["foo"], ["bar"]] } }).rules,
        },
        {
          name: "両方の引数にマッチする動画タグが設定されている場合、ルールが無効化される",
          tags: ["foo", "bar"],
          expected: [],
        },
      ])("$name", ({ tags, expected }) => {
        const filter = `
@exclude-tags foo
@exclude-tags bar
rule
`;

        expect(runFilter({ filter, tags }).getRule()).toEqual(expected);
      });
    });
  });

  // -------------------------------------------------------------------------------------------
  // @include-tags + @exclude-tags
  // -------------------------------------------------------------------------------------------

  describe("@include-tags + @exclude-tags", () => {
    it.each([
      {
        name: "動画タグが設定されていない場合、ルールが有効化されない",
        tags: [],
        expected: [],
      },
      {
        name: "@include-tagsの引数のみにマッチする動画タグが設定されている場合、ルールが有効化される",
        tags: ["foo"],
        expected: mockRules({
          include: { tags: [["foo"]] },
          exclude: { tags: [["bar"]] },
        }).rules,
      },
      {
        name: "@exclude-tagsの引数のみにマッチする動画タグが設定されている場合、ルールが無効化される",
        tags: ["bar"],
        expected: [],
      },
      {
        name: "両方の引数にマッチする動画タグが設定されている場合、ルールが無効化される",
        tags: ["foo", "bar"],
        expected: [],
      },
    ])("$name", ({ tags, expected }) => {
      const filter = `
@include-tags foo
@exclude-tags bar
rule
`;

      expect(runFilter({ filter, tags }).getRule()).toEqual(expected);
    });
  });

  // -------------------------------------------------------------------------------------------
  // @include-video-ids
  // @exclude-video-ids
  // @include-user-ids
  // @exclude-user-ids
  // @include-series-ids
  // @exclude-series-ids
  // -------------------------------------------------------------------------------------------

  // 基本的には@include-tags/@exclude-tagsと同じなので、簡易的にテストする

  it.each([
    {
      name: "動画IDが@include-video-idsの引数にマッチする場合、ルールが有効化される",
      directive: "@include-video-ids",
      expected: mockRules({ include: { videoIds: [["1"]] } }).rules,
    },
    {
      name: "動画IDが@exclude-video-idsの引数にマッチする場合、ルールが無効化される",
      directive: "@exclude-video-ids",
      expected: mockRules({ exclude: { videoIds: [["2"]] } }).rules,
    },
    {
      name: "ユーザーIDが@include-user-idsの引数にマッチする場合、ルールが有効化される",
      directive: "@include-user-ids",
      expected: mockRules({ include: { userIds: [["1"]] } }).rules,
    },
    {
      name: "ユーザーIDが@exclude-user-idsの引数にマッチする場合、ルールが無効化される",
      directive: "@exclude-user-ids",
      expected: mockRules({ exclude: { userIds: [["2"]] } }).rules,
    },
    {
      name: "シリーズIDが@include-series-idsの引数にマッチする場合、ルールが有効化される",
      directive: "@include-series-ids",
      expected: mockRules({ include: { seriesIds: [["1"]] } }).rules,
    },
    {
      name: "シリーズIDが@exclude-series-idsの引数にマッチする場合、ルールが無効化される",
      directive: "@exclude-series-ids",
      expected: mockRules({ exclude: { seriesIds: [["2"]] } }).rules,
    },
  ])("$name", ({ directive, expected }) => {
    const filter = `
${directive} 1
rule
@end

${directive} 2
rule
@end
`;

    expect(runFilter({ filter }).getRule()).toEqual(expected);
  });
});
