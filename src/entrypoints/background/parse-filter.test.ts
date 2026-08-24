import { describe, it, expect } from "vitest";
import type { ParseError, ParseWarning } from "./parse-filter";
import { parseArgs, parseFilter } from "./parse-filter";
import { mockRules } from "@/utils/test";

describe(parseFilter.name, () => {
  it.each([
    {
      name: "コメント",
      filter: "# comment",
      expected: mockRules(),
    },
    {
      name: "空行",
      filter: "",
      expected: mockRules(),
    },
  ])("$nameをパースできる", ({ filter, expected }) => {
    expect(parseFilter(filter)).toEqual(expected);
  });

  describe("ルール", () => {
    it.each([
      {
        name: "文字列ルール",
        filter: "rule",
        expected: mockRules({}),
      },
      {
        name: "正規表現ルール",
        filter: "/foo/",
        expected: mockRules({ pattern: /foo/ }),
      },
      {
        name: "フラグを持つ正規表現ルール",
        filter: "/foo/i",
        expected: mockRules({ pattern: /foo/i }),
      },
      {
        name: "パターンにスラッシュを含む正規表現ルール",
        filter: "///",
        expected: mockRules({ pattern: /\// }),
      },
    ])("$nameをパースできる", ({ filter, expected }) => {
      expect(parseFilter(filter)).toEqual(expected);
    });
  });

  describe("ディレクティブ", () => {
    it.each([
      {
        name: "@end",
        filter: `
@strict
rule
@end

rule
`,
        expected: mockRules({ strict: true }, {}),
      },
      {
        name: "余分な@end",
        filter: `
@end

rule
`,
        expected: mockRules({}),
      },
      {
        name: "@comment-body",
        filter: `
@comment-body
rule
`,
        expected: mockRules({ target: { commentBody: true } }),
      },
      {
        name: "@strict",
        filter: `
@strict
rule
`,
        expected: mockRules({ strict: true }),
      },
      {
        name: "@s",
        filter: `
@s
rule
rule
`,
        expected: mockRules({ strict: true }, {}),
      },
      {
        name: "余分な@s",
        filter: `
@s
@s
rule
rule
`,
        expected: mockRules({ strict: true }, {}),
      },
      {
        name: "@disable",
        filter: `
@disable
rule
`,
        expected: mockRules({ disable: true }),
      },
      {
        name: "一個の引数を持つ@include-tags",
        filter: `
@include-tags foo
rule
`,
        expected: mockRules({ include: { tags: [["foo"]] } }),
      },
      {
        name: "二個の引数を持つ@include-tags",
        filter: `
@include-tags foo bar
rule
`,
        expected: mockRules({ include: { tags: [["foo", "bar"]] } }),
      },
      {
        name: "ネストした@include-tags",
        filter: `
@include-tags foo
@include-tags bar
rule
`,
        expected: mockRules({ include: { tags: [["foo"], ["bar"]] } }),
      },
    ])("$nameをパースできる", ({ filter, expected }) => {
      expect(parseFilter(filter)).toEqual(expected);
    });
  });

  // -------------------------------------------------------------------------------------------
  // warning
  // -------------------------------------------------------------------------------------------

  describe("warning", () => {
    type TestCases = {
      name: string;
      filter: string;
      warnings: ParseWarning[];
    }[];

    const createName = (type: ParseWarning["type"]) => `type: ${type}`;

    describe(createName("target"), () => {
      it.each([
        {
          name: "ターゲットを指定している場合、警告が出ない",
          filter: `
@comment-body
rule        
  `,
          warnings: [],
        },
        {
          name: "ターゲットを指定していない場合、警告が出る",
          filter: "rule",
          warnings: [{ index: 0, type: "target" }],
        },
      ] satisfies TestCases)("$name", ({ filter, warnings }) => {
        expect(parseFilter(filter).warnings).toEqual(warnings);
      });
    });

    describe(createName("strict"), () => {
      it.each([
        {
          name: "@strictを@comment-bodyと併用している場合、警告が出ない",
          filter: `
@comment-body

@strict
rule
`,
          warnings: [],
        },
        {
          name: "@strictを@comment-bodyと併用していない場合、警告が出る",
          filter: `
@video-id

@strict
rule
`,
          warnings: [{ index: 4, type: "strict" }],
        },
      ] satisfies TestCases)("$name", ({ filter, warnings }) => {
        expect(parseFilter(filter).warnings).toEqual(warnings);
      });
    });

    describe(createName("strict_with_disable"), () => {
      it.each([
        {
          name: "@strictを@disableと併用していない場合、警告が出ない",
          filter: `
@comment-commands

@strict
rule
@end

@disable
rule
@end
`,
          warnings: [],
        },
        {
          name: "@strictを@disableと併用している場合、警告が出る",
          filter: `
@comment-commands

@strict
@disable
rule
`,
          warnings: [{ index: 5, type: "strict_with_disable" }],
        },
      ] satisfies TestCases)("$name", ({ filter, warnings }) => {
        expect(parseFilter(filter).warnings).toEqual(warnings);
      });
    });

    describe(createName("toggle"), () => {
      it.each([
        {
          name: "@include-tagsを@comment-bodyと併用している場合、警告が出ない",
          filter: `
@comment-body

@include-tags tag
rule
`,
          warnings: [],
        },
        {
          name: "@include-tagsを@video-idのみと併用している場合、警告が出る",
          filter: `
@video-id

@include-tags tag
rule
`,
          warnings: [{ index: 4, type: "toggle" }],
        },
      ] satisfies TestCases)("$name", ({ filter, warnings }) => {
        expect(parseFilter(filter).warnings).toEqual(warnings);
      });
    });

    describe(createName("disable"), () => {
      it.each([
        {
          name: "@diableを@comment-commandsと併用している場合、警告が出ない",
          filter: `
@comment-commands

@disable
rule
`,
          warnings: [],
        },
        {
          name: "@diableを@comment-commandsと併用していない場合、警告が出る",
          filter: `
@comment-body

@disable
rule
`,
          warnings: [{ index: 4, type: "disable" }],
        },
      ] satisfies TestCases)("$name", ({ filter, warnings }) => {
        expect(parseFilter(filter).warnings).toEqual(warnings);
      });
    });

    describe(createName("unnecessary_directive"), () => {
      it.each([
        {
          name: "余分な@sがない場合、警告が出ない",
          filter: `
@comment-body

@s
rule
`,
          warnings: [],
        },
        {
          name: "余分な@sがある場合、警告が出る",
          filter: `
@comment-body

@s
@s
rule
`,
          warnings: [{ index: 4, type: "unnecessary_directive" }],
        },
        {
          name: "余分な@endがない場合、警告が出ない",
          filter: `
@comment-body
rule
@end
`,
          warnings: [],
        },
        {
          name: "余分な@endがある場合、警告が出る",
          filter: `
@comment-body
rule
@end
@end
`,
          warnings: [{ index: 4, type: "unnecessary_directive" }],
        },
      ] satisfies TestCases)("$name", ({ filter, warnings }) => {
        expect(parseFilter(filter).warnings).toEqual(warnings);
      });
    });
  });

  // -------------------------------------------------------------------------------------------
  // error
  // -------------------------------------------------------------------------------------------

  describe("error", () => {
    type TestCases = { name: string; filter: string; errors: ParseError[] }[];

    const createName = (type: ParseError["type"]) => `type: ${type}`;

    describe(createName("directive"), () => {
      it.each([
        {
          name: "存在するディレクティブを渡した場合、エラーが出ない",
          filter: "@strict",
          errors: [],
        },
        {
          name: "存在しないディレクティブを渡した場合、エラーが出る",
          filter: "@foo",
          errors: [{ index: 0, type: "directive" }],
        },
        {
          name: "存在するディレクティブに前方一致するディレクティブを渡した場合、エラーが出る",
          filter: "@strict2",
          errors: [{ index: 0, type: "directive" }],
        },
      ] satisfies TestCases)("$name", ({ filter, errors }) => {
        expect(parseFilter(filter).errors).toEqual(errors);
      });
    });

    describe(createName("regex"), () => {
      it.each([
        {
          name: "有効なパターンを含む正規表現を渡した場合、エラーが出ない",
          filter: "/(foo)/",
          errors: [],
        },
        {
          name: "無効なパターンを含む正規表現を渡した場合、エラーが出る",
          filter: "/(foo/",
          errors: [{ index: 0, type: "regex" }],
        },
        {
          name: "有効なフラグを含む正規表現を渡した場合、エラーが出ない",
          filter: "/foo/i",
          errors: [],
        },
        {
          name: "無効なフラグを含む正規表現を渡した場合、エラーが出る",
          filter: "/foo/uv",
          errors: [{ index: 0, type: "regex" }],
        },
      ] satisfies TestCases)("$name", ({ filter, errors }) => {
        expect(parseFilter(filter).errors).toEqual(errors);
      });
    });

    describe(createName("regex_flag"), () => {
      it.each([
        {
          name: "サポートされているフラグを含む正規表現を渡した場合、エラーが出ない",
          filter: "/foo/i",
          errors: [],
        },
        {
          name: "サポートされていないフラグを含む正規表現を渡した場合、エラーが出る",
          filter: "/foo/g",
          errors: [{ index: 0, type: "regex_flag" }],
        },
        {
          name: "末尾に空白文字を含む正規表現を渡した場合、エラーが出る",
          filter: "/foo/ ",
          errors: [{ index: 0, type: "regex_flag" }],
        },
        {
          // 誤りの可能性が高いが、文字列ルールと区別できないため現状はエラーにしない
          name: "先頭に空白文字を含む正規表現を渡した場合、エラーが出ない",
          filter: " /foo/",
          errors: [],
        },
      ] satisfies TestCases)("$name", ({ filter, errors }) => {
        expect(parseFilter(filter).errors).toEqual(errors);
      });
    });

    describe(createName("args"), () => {
      it.each([
        {
          name: "引数が設定されているディレクティブを渡した場合、エラーが出ない",
          filter: "@include-tags foo",
          errors: [],
        },
        {
          // 直後にスペースがある場合のみパースしているので、以前は無効なディレクティブとして扱っていた
          // しかし引数が必要であることを示す方が望ましいため、typeがargsになっていることを確認する
          name: "引数が設定されていないディレクティブを渡した場合、エラーが出る",
          filter: "@include-tags",
          errors: [{ index: 0, type: "args" }],
        },
        {
          // 空白文字のみの場合、引数は空の配列としてパースされる
          // これが有効なディレクティブとしてカウントされるとfilterRules()が正しく動作しないため、エラーになることを確認する
          name: "引数が空白文字のみ設定されているディレクティブを渡した場合、エラーが出る",
          filter: "@include-tags ",
          errors: [{ index: 0, type: "args" }],
        },
      ] satisfies TestCases)("$name", ({ filter, errors }) => {
        expect(parseFilter(filter).errors).toEqual(errors);
      });
    });
  });
});

describe(parseArgs.name, () => {
  it.each([
    { filter: "@include-tags foo", expected: ["foo"] },
    { filter: "@include-tags foo bar", expected: ["foo", "bar"] },
    { filter: "@include-tags FOO", expected: ["foo"] },
    { filter: "@include-tags  foo", expected: ["foo"] },
    { filter: "@include-tags foo ", expected: ["foo"] },
    { filter: "@include-tags", expected: [] },
  ])("$filterを渡した場合、$expectedを返す", ({ filter, expected }) => {
    expect(parseArgs(filter)).toEqual(expected);
  });
});
