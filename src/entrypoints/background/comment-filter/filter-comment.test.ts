import type { Thread } from "@/types/api/comment-api.types";
import type { Settings } from "@/types/storage/settings.types";
import { CommentAssertor, mockComments, testTab } from "@/utils/test";
import { beforeEach, describe, expect, it } from "vitest";
import { filterComment } from "./filter-comment";
import { defaultSettings } from "@/utils/config";

const baseThreads = [
  {
    fork: "main",
    commentCount: 2,
    comments: mockComments(
      {
        id: "1001",
        commands: ["184", "big"],
        userId: "user-id-1",
        body: "foo",
        nicoruCount: 29,
      },
      {
        id: "1002",
        commands: ["184"],
        userId: "user-id-2",
        body: "bar",
        nicoruCount: 30,
      },
    ),
  },
] satisfies Thread[];

describe(filterComment.name, () => {
  let threads: Thread[];
  let assertor: CommentAssertor;

  beforeEach(() => {
    threads = structuredClone(baseThreads);
    assertor = new CommentAssertor(threads, baseThreads);
  });

  const runFilter = (settings?: Partial<Settings>) => {
    return filterComment(
      threads,
      {
        ...defaultSettings,
        manualFilter: `
@comment-commands
big
@end

@comment-body
bar
`,
        ...settings,
      },
      testTab,
    );
  };

  it("基本", () => {
    runFilter();

    assertor.assert(["1001", "1002"]);
  });

  it("strictルールの先行適用", () => {
    const result = runFilter({
      manualFilter: `
@comment-commands

big

@s
big

@end

#============================================================

@comment-body

bar

@s
bar
`,
    });

    assertor.assert(["1001", "1002"], result?.filters.userIdFilter);
    expect(result?.strictData.map(({ userId }) => userId)).toEqual([
      "user-id-1",
      "user-id-2",
    ]);
  });

  it("strictルールによるフィルタリングの重複", () => {
    const result = runFilter({
      manualFilter: `
@comment-commands

@s
big

@end

#============================================================

@comment-body

@s
foo
`,
    });

    assertor.assert(["1001"], result?.filters.userIdFilter);
    expect(result?.strictData.map(({ userId }) => userId)).toEqual([
      // 重複がないことを確認
      "user-id-1",
    ]);
  });

  it(`Settings.${"enableCommentFilter" satisfies keyof Settings}`, () => {
    runFilter({ enableCommentFilter: false });

    assertor.assert([]);
  });

  it(`Settings.${"ignoreMyComments" satisfies keyof Settings}`, () => {
    for (const thread of threads) {
      for (const comment of thread.comments) comment.isMyPost = true;
    }
    runFilter({ ignoreMyComments: true });

    assertor.assert([]);
  });

  it(`Settings.${"ignoreByNicoru" satisfies keyof Settings}`, () => {
    runFilter({ ignoreByNicoru: true });

    assertor.assert(["1001"]);
  });
});
