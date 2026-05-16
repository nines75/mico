import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/utils/config";
import { CommentAssertor } from "@/utils/test";
import { mockComments } from "@/utils/test";
import type { Thread } from "@/types/api/comment-api.types";
import { BodyFilter } from "./body-filter";
import type { Settings } from "@/types/storage/settings.types";

const baseThreads = [
  {
    fork: "main",
    commentCount: 2,
    comments: mockComments(
      {
        id: "1001",
        userId: "user-id-1",
        body: "foo",
      },
      {
        id: "1002",
        userId: "user-id-2",
        body: "bar",
      },
    ),
  },
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
    settings?: Partial<Settings>;
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
    it("完全一致", () => {
      const filter = "foo";

      assertor.assert(["1001"], runFilter({ filter }));
    });

    it("部分一致", () => {
      const filter = "fo";

      assertor.assert(["1001"], runFilter({ filter }));
    });

    it("大小文字が異なる", () => {
      const filter = "FOO";

      assertor.assert([], runFilter({ filter }));
    });
  });

  it("正規表現ルール", () => {
    const filter = "/foo/";

    assertor.assert(["1001"], runFilter({ filter }));
  });

  it("@strict", () => {
    const filter = `
@strict
foo
bar
`;
    const bodyFilter = runFilter({
      filter,
      strictOnly: true,
      settings: {
        autoFilter: [{ pattern: "user-id-2", target: { commentUserId: true } }],
      },
    });

    assertor.assert([], bodyFilter);
    expect(bodyFilter.getStrictData()).toEqual([
      { userId: "user-id-1", context: "comment-body: foo" },
    ]);
  });

  // https://github.com/nines75/mico/issues/61
  it("strictルール適用時の副作用", () => {
    const filter = `
@s
foo

bar
`;

    assertor.assert([], runFilter({ filter, strictOnly: true }));
  });
});
