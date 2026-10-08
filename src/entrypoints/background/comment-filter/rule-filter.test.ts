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
  // @enable-if-tags
  // -------------------------------------------------------------------------------------------

  describe("@enable-if-tags", () => {
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
          expected: mockRules({ enable: { tags: [["foo"]] } }).rules,
        },
        {
          name: "引数にマッチしない動画タグが設定されている場合、ルールが有効化されない",
          tags: ["bar"],
          expected: [],
        },
      ])("$name", ({ tags, expected }) => {
        const filter = `
@enable-if-tags foo
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
          expected: mockRules({ enable: { tags: [["foo", "bar"]] } }).rules,
        },
        {
          name: "両方の引数にマッチする動画タグが設定されている場合、ルールが有効化される",
          tags: ["foo", "bar"],
          expected: mockRules({ enable: { tags: [["foo", "bar"]] } }).rules,
        },
      ])("$name", ({ tags, expected }) => {
        const filter = `
@enable-if-tags foo bar
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
          expected: mockRules({ enable: { tags: [["foo"], ["bar"]] } }).rules,
        },
      ])("$name", ({ tags, expected }) => {
        const filter = `
@enable-if-tags foo
@enable-if-tags bar
rule
`;

        expect(runFilter({ filter, tags }).getRule()).toEqual(expected);
      });
    });
  });

  // -------------------------------------------------------------------------------------------
  // @disable-if-tags
  // -------------------------------------------------------------------------------------------

  describe("@disable-if-tags", () => {
    describe("引数が一個設定されている場合", () => {
      it.each([
        {
          name: "動画タグが設定されていない場合、ルールが無効化されない",
          tags: [],
          expected: mockRules({ disable: { tags: [["foo"]] } }).rules,
        },
        {
          name: "引数にマッチする動画タグが設定されている場合、ルールが無効化される",
          tags: ["foo"],
          expected: [],
        },
        {
          name: "引数にマッチしない動画タグが設定されている場合、ルールが無効化されない",
          tags: ["bar"],
          expected: mockRules({ disable: { tags: [["foo"]] } }).rules,
        },
      ])("$name", ({ tags, expected }) => {
        const filter = `
@disable-if-tags foo
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
@disable-if-tags foo bar
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
          expected: mockRules({ disable: { tags: [["foo"], ["bar"]] } }).rules,
        },
        {
          name: "両方の引数にマッチする動画タグが設定されている場合、ルールが無効化される",
          tags: ["foo", "bar"],
          expected: [],
        },
      ])("$name", ({ tags, expected }) => {
        const filter = `
@disable-if-tags foo
@disable-if-tags bar
rule
`;

        expect(runFilter({ filter, tags }).getRule()).toEqual(expected);
      });
    });
  });

  // -------------------------------------------------------------------------------------------
  // @enable-if-tags + @disable-if-tags
  // -------------------------------------------------------------------------------------------

  describe("@enable-if-tags + @disable-if-tags", () => {
    it.each([
      {
        name: "動画タグが設定されていない場合、ルールが有効化されない",
        tags: [],
        expected: [],
      },
      {
        name: "@enable-if-tagsの引数のみにマッチする動画タグが設定されている場合、ルールが有効化される",
        tags: ["foo"],
        expected: mockRules({
          enable: { tags: [["foo"]] },
          disable: { tags: [["bar"]] },
        }).rules,
      },
      {
        name: "@disable-if-tagsの引数のみにマッチする動画タグが設定されている場合、ルールが無効化される",
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
@enable-if-tags foo
@disable-if-tags bar
rule
`;

      expect(runFilter({ filter, tags }).getRule()).toEqual(expected);
    });
  });

  // -------------------------------------------------------------------------------------------
  // @enable-if-video-ids
  // @disable-if-video-ids
  // @enable-if-user-ids
  // @disable-if-user-ids
  // @enable-if-series-ids
  // @disable-if-series-ids
  // -------------------------------------------------------------------------------------------

  // 基本的には@enable-if-tags/@disable-if-tagsと同じなので、簡易的にテストする

  it.each([
    {
      name: "動画IDが@enable-if-video-idsの引数にマッチする場合、ルールが有効化される",
      directive: "@enable-if-video-ids",
      expected: mockRules({ enable: { videoIds: [["1"]] } }).rules,
    },
    {
      name: "動画IDが@disable-if-video-idsの引数にマッチする場合、ルールが無効化される",
      directive: "@disable-if-video-ids",
      expected: mockRules({ disable: { videoIds: [["2"]] } }).rules,
    },
    {
      name: "ユーザーIDが@enable-if-user-idsの引数にマッチする場合、ルールが有効化される",
      directive: "@enable-if-user-ids",
      expected: mockRules({ enable: { userIds: [["1"]] } }).rules,
    },
    {
      name: "ユーザーIDが@disable-if-user-idsの引数にマッチする場合、ルールが無効化される",
      directive: "@disable-if-user-ids",
      expected: mockRules({ disable: { userIds: [["2"]] } }).rules,
    },
    {
      name: "シリーズIDが@enable-if-series-idsの引数にマッチする場合、ルールが有効化される",
      directive: "@enable-if-series-ids",
      expected: mockRules({ enable: { seriesIds: [["1"]] } }).rules,
    },
    {
      name: "シリーズIDが@disable-if-series-idsの引数にマッチする場合、ルールが無効化される",
      directive: "@disable-if-series-ids",
      expected: mockRules({ disable: { seriesIds: [["2"]] } }).rules,
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
