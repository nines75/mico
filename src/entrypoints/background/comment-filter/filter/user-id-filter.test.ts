import { beforeEach, describe, it } from "vitest";
import { defaultSettings } from "@/utils/config";
import { CommentAssertor, mockThread } from "@/utils/test";
import type { Thread } from "@/types/api/comment-api.types";
import { UserIdFilter } from "./user-id-filter";

const baseThreads = [
  mockThread("main", [
    {
      id: "1",
      userId: "user-id",
    },
  ]),
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
    it.each([
      {
        name: "ユーザーIDがルールと完全に一致する場合、そのコメントをフィルタリングする",
        filter: "user-id", // 完全一致
        filteredIds: ["1"],
      },
      {
        name: "ユーザーIDにルールが部分的に含まれる場合、そのコメントをフィルタリングしない",
        filter: "user", // 部分一致
        filteredIds: [],
      },
      {
        name: "ユーザーIDにルールが部分的に含まれない場合、そのコメントをフィルタリングしない",
        filter: "foo",
        filteredIds: [],
      },
      {
        name: "ユーザーIDが大小文字を変えたルールと完全に一致する場合、そのコメントをフィルタリングしない",
        filter: "USER-ID",
        filteredIds: [],
      },
    ])("$name", ({ filter, filteredIds }) => {
      assertor.assert(filteredIds, runFilter(filter));
    });
  });

  describe("正規表現ルール", () => {
    it.each([
      {
        name: "ユーザーIDが正規表現とマッチする場合、そのコメントをフィルタリングする",
        filter: "/user-id/",
        filteredIds: ["1"],
      },
      {
        name: "ユーザーIDが正規表現とマッチしない場合、そのコメントをフィルタリングしない",
        filter: "/foo/",
        filteredIds: [],
      },
    ])("$name", ({ filter, filteredIds }) => {
      assertor.assert(filteredIds, runFilter(filter));
    });
  });

  describe(UserIdFilter.prototype.updateFilter.name, () => {
    it("ユーザーIDを渡した場合、ルールが追加される", () => {
      const userIdFilter = runFilter("");

      assertor.assert([], userIdFilter);

      userIdFilter.updateFilter(["user-id"]);
      userIdFilter.apply(threads);

      assertor.assert(["1"], userIdFilter);
    });
  });
});
