import type { Thread } from "@/types/api/comment-api.types";
import type { Settings } from "@/types/storage/settings.types";
import {
  CommentAssertor,
  createSettingsName,
  expectString,
  mockThread,
  testTab,
} from "@/utils/test";
import { beforeEach, describe, expect, it } from "vitest";
import { filterComment } from "./filter-comment";
import { defaultSettings } from "@/utils/config";

const baseThreads = [
  mockThread("main", [
    {
      id: "1",
      commands: ["184", "big"],
      userId: "user-id",
      body: "foo",
      nicoruCount: 30,
    },
  ]),
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
@comment-body
foo
`,
        ...settings,
      },
      testTab,
    );
  };

  it("フィルタリングが行われる", () => {
    runFilter();

    assertor.assert(["1"]);
  });

  it("ルールの順番に関わらずstrictルールが先行して適用される", () => {
    const result = runFilter({
      manualFilter: `
@comment-body

foo

@s
foo
`,
    });

    assertor.assert(["1"], result?.filters.userIdFilter);
    expect(result?.strictData).toEqual([
      { ruleId: expectString, userId: "user-id", context: "comment-body: foo" },
    ]);
  });

  it("同じコメントが複数のstrictルールにマッチする場合、重複は削除される", () => {
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

    assertor.assert(["1"], result?.filters.userIdFilter);
    expect(result?.strictData).toEqual([
      {
        ruleId: expectString,
        userId: "user-id",
        context: "comment-commands: big",
      },
    ]);
  });

  describe(createSettingsName("enableCommentFilter"), () => {
    it("falseの場合、フィルタリングが行われない", () => {
      runFilter({ enableCommentFilter: false });

      assertor.assert([]);
    });

    it("trueの場合、フィルタリングが行われる", () => {
      runFilter({ enableCommentFilter: true });

      assertor.assert(["1"]);
    });
  });

  describe(createSettingsName("ignoreMyComments"), () => {
    beforeEach(() => {
      for (const thread of threads) {
        for (const comment of thread.comments) comment.isMyPost = true;
      }
    });

    it("falseの場合、自分が投稿したコメントをフィルタリングする", () => {
      runFilter({ ignoreMyComments: false });

      assertor.assert(["1"]);
    });

    it("trueの場合、自分が投稿したコメントをフィルタリングしない", () => {
      runFilter({ ignoreMyComments: true });

      assertor.assert([]);
    });
  });

  describe(createSettingsName("ignoreByNicoru"), () => {
    it("falseの場合、ニコるの数に応じてフィルタリングの対象外にしない", () => {
      runFilter({ ignoreByNicoru: false });

      assertor.assert(["1"]);
    });

    it("trueの場合、ニコるの数に応じてフィルタリングの対象外にする", () => {
      runFilter({ ignoreByNicoru: true });

      assertor.assert([]);
    });
  });
});
