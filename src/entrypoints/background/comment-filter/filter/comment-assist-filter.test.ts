import type { Thread } from "@/types/api/comment-api.types";
import { CommentAssertor } from "@/utils/test";
import { beforeEach, describe, it } from "vitest";
import { defaultSettings } from "@/utils/config";
import type { Settings } from "@/types/storage/settings.types";
import { CommentAssistFilter } from "./comment-assist-filter";
import { mockComments } from "@/utils/test";

const baseThreads = [
  {
    fork: "owner",
    commentCount: 1,
    comments: mockComments({
      id: "1001",
      commands: [],
      postedAt: "2025-02-27T00:00:00+09:00", // リリースから1日後
    }),
  },
  {
    fork: "main",
    commentCount: 3,
    comments: mockComments(
      {
        id: "1002",
        commands: [],
        postedAt: "2025-02-25T23:59:59+09:00", // リリース直前
      },
      {
        id: "1003",
        commands: [],
        postedAt: "2025-02-26T00:00:00+09:00", // リリース
      },
      {
        id: "1004",
        commands: [],
        postedAt: "2025-02-27T00:00:00+09:00", // リリースから1日後
      },
    ),
  },
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

  describe(`Settings.${"enableCommentAssistFilter" satisfies keyof Settings}`, () => {
    it.each([
      {
        isEnabled: true,
        ids: ["1003", "1004"],
      },
      {
        isEnabled: false,
        ids: [],
      },
    ])("$isEnabled", ({ isEnabled, ids }) => {
      assertor.assert(ids, runFilter(isEnabled));
    });
  });
});
