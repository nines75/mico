import type { Thread } from "@/types/api/comment-api.types";
import type { Settings } from "@/types/storage/settings.types";
import { defaultSettings } from "@/utils/config";
import { CommentAssertor } from "@/utils/test";
import { mockComments } from "@/utils/test";
import { describe, beforeEach, it } from "vitest";
import { EasyCommentFilter } from "./easy-comment-filter";

const baseThreads = [
  {
    fork: "main",
    commentCount: 1,
    comments: mockComments({
      id: "1",
    }),
  },
  {
    fork: "easy",
    commentCount: 2,
    comments: mockComments(
      {
        id: "2",
      },
      {
        id: "3",
      },
    ),
  },
] satisfies Thread[];

describe(EasyCommentFilter.name, () => {
  let threads: Thread[];
  let assertor: CommentAssertor;

  beforeEach(() => {
    threads = structuredClone(baseThreads);
    assertor = new CommentAssertor(threads, baseThreads);
  });

  const runFilter = (enableEasyCommentFilter: boolean) => {
    const easyCommentFilter = new EasyCommentFilter({
      ...defaultSettings,
      enableEasyCommentFilter,
    });

    easyCommentFilter.apply(threads);

    return easyCommentFilter;
  };

  // -------------------------------------------------------------------------------------------

  describe(`Settings.${"enableEasyCommentFilter" satisfies keyof Settings}`, () => {
    it.each([
      {
        isEnabled: true,
        ids: ["2", "3"],
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
