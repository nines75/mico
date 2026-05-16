import { beforeEach, describe, it } from "vitest";
import { defaultSettings } from "@/utils/config";
import { CommentAssertor, mockComments } from "@/utils/test";
import type { Thread } from "@/types/api/comment-api.types";
import { UserIdFilter } from "./user-id-filter";

const baseThreads = [
  {
    fork: "main",
    commentCount: 1,
    comments: mockComments({
      id: "1",
      userId: "user-id",
    }),
  },
] satisfies Thread[];

describe(UserIdFilter.name, () => {
  let threads: Thread[];
  let assertor: CommentAssertor;

  beforeEach(() => {
    threads = structuredClone(baseThreads);
    assertor = new CommentAssertor(threads, baseThreads);
  });

  const runFilter = (filter: string) => {
    const userIdFilter = new UserIdFilter({
      ...defaultSettings,
      manualFilter: `@comment-user-id\n${filter}`,
    });
    userIdFilter.apply(threads);

    return userIdFilter;
  };

  // -------------------------------------------------------------------------------------------

  describe("文字列ルール", () => {
    it("完全一致", () => {
      const filter = "user-id";

      assertor.assert(["1"], runFilter(filter));
    });

    it("部分一致", () => {
      const filter = "user";

      assertor.assert([], runFilter(filter));
    });
  });

  it("正規表現ルール", () => {
    const filter = "/user-id/";

    assertor.assert(["1"], runFilter(filter));
  });

  it(UserIdFilter.prototype.updateFilter.name, () => {
    const userIdFilter = runFilter("");

    assertor.assert([], userIdFilter);

    userIdFilter.updateFilter(["user-id"]);
    userIdFilter.apply(threads);

    assertor.assert(["1"], userIdFilter);
  });
});
