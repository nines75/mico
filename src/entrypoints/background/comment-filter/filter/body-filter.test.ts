import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/utils/config";
import { CommentAssertor } from "@/utils/test";
import { mockThread } from "@/utils/test";
import type { Thread } from "@/types/api/comment-api.types";
import { BodyFilter } from "./body-filter";
import type { Settings } from "@/types/storage/settings.types";

const baseThreads = [
  mockThread("main", [
    {
      id: "1",
      userId: "user-id-1",
      body: "foo",
    },
    {
      id: "2",
      userId: "user-id-2",
      body: "bar",
    },
  ]),
] satisfies Thread[];

describe(BodyFilter.name, () => {
  let threads: Thread[];
  let assertor: CommentAssertor;

  beforeEach(() => {
    threads = structuredClone(baseThreads);
    assertor = new CommentAssertor(threads, baseThreads);
  });

  const runFilter = (options: {
    filter: string;
    strictOnly?: boolean;
    settings?: Partial<Settings> | undefined;
  }) => {
    const bodyFilter = new BodyFilter({
      ...defaultSettings,
      ...options.settings,
      manualFilter: `@comment-body\n${options.filter}`,
    });
    bodyFilter.apply(threads, options.strictOnly ?? false);

    return bodyFilter;
  };

  // -------------------------------------------------------------------------------------------

  describe("文字列ルール", () => {
    it.each([
      {
        name: "コメント本文がルールと完全に一致する場合、そのコメントをフィルタリングする",
        filter: "foo", // 完全一致
        filteredIds: ["1"],
      },
      {
        name: "コメント本文にルールが部分的に含まれる場合、そのコメントをフィルタリングする",
        filter: "fo", // 部分一致
        filteredIds: ["1"],
      },
      {
        name: "コメント本文にルールが部分的に含まれない場合、そのコメントをフィルタリングしない",
        filter: "baz",
        filteredIds: [],
      },
      {
        name: "コメント本文に大小文字を変えたルールが含まれる場合、そのコメントをフィルタリングしない",
        filter: "FOO",
        filteredIds: [],
      },
    ])("$name", ({ filter, filteredIds }) => {
      assertor.assert(filteredIds, runFilter({ filter }));
    });
  });

  describe("正規表現ルール", () => {
    it.each([
      {
        name: "コメント本文が正規表現とマッチする場合、そのコメントをフィルタリングする",
        filter: "/foo/",
        filteredIds: ["1"],
      },
      {
        name: "コメント本文が正規表現とマッチしない場合、そのコメントをフィルタリングしない",
        filter: "/baz/",
        filteredIds: [],
      },
    ])("$name", ({ filter, filteredIds }) => {
      assertor.assert(filteredIds, runFilter({ filter }));
    });
  });

  describe(`${BodyFilter.prototype.apply.name}のstrictOnly引数`, () => {
    it.each([
      {
        name: "falseの場合、strictルール以外を使用してフィルタリングが行われる",
        strictOnly: false,
        filteredIds: ["2"],
        strictData: [],
      },
      {
        name: "trueの場合、strictルールのみを使用してフィルタリングが行われる",
        strictOnly: true,
        filteredIds: [],
        strictData: [{ userId: "user-id-1", context: "comment-body: foo" }],
      },
      {
        name: "trueの場合、ユーザーIDが既存のAutoルールとマッチするコメントに対してはフィルタリングが行われない",
        strictOnly: true,
        filteredIds: [],
        strictData: [],
        settings: {
          autoFilter: [
            { pattern: "user-id-1", target: { commentUserId: true } },
          ],
        },
      },
    ])("$name", ({ strictOnly, filteredIds, strictData, settings }) => {
      const filter = `
@s
foo

bar
`;
      const bodyFilter = runFilter({ filter, strictOnly, settings });

      assertor.assert(filteredIds, bodyFilter);
      expect(bodyFilter.getStrictData()).toEqual(strictData);
    });
  });
});
