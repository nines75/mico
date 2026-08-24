import type { Thread } from "@/types/api/comment-api.types";
import { CommentAssertor, createSettingsName } from "@/utils/test";
import { beforeEach, describe, it } from "vitest";
import { defaultSettings } from "@/utils/config";
import { CommentAssistFilter } from "./comment-assist-filter";
import { mockThread } from "@/utils/test";

const baseThreads = [
  mockThread("owner", [
    {
      id: "1",
      commands: [],
      postedAt: "2025-02-27T00:00:00+09:00", // リリースから1日後
    },
  ]),
  mockThread("main", [
    {
      id: "2",
      commands: [],
      postedAt: "2025-02-25T23:59:59+09:00", // リリース直前
    },
    {
      id: "3",
      commands: [],
      postedAt: "2025-02-26T00:00:00+09:00", // リリース
    },
    {
      id: "4",
      commands: [],
      postedAt: "2025-02-27T00:00:00+09:00", // リリースから1日後
    },
  ]),
] satisfies Thread[];

describe(CommentAssistFilter.name, () => {
  let threads: Thread[];
  let assertor: CommentAssertor;

  beforeEach(() => {
    threads = structuredClone(baseThreads);
    assertor = new CommentAssertor(threads, baseThreads);
  });

  const runFilter = (enableCommentAssistFilter: boolean) => {
    const commentAssistFilter = new CommentAssistFilter({
      ...defaultSettings,
      enableCommentAssistFilter,
    });

    commentAssistFilter.apply(threads);

    return commentAssistFilter;
  };

  // -------------------------------------------------------------------------------------------

  describe(createSettingsName("enableCommentAssistFilter"), () => {
    it("falseの場合、コメントアシストによって投稿されたコメントをフィルタリングしない", () => {
      assertor.assert([], runFilter(false));
    });

    it("trueの場合、コメントアシストによって投稿されたコメントをフィルタリングする", () => {
      assertor.assert(["3", "4"], runFilter(true));
    });
  });
});
