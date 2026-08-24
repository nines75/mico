import type { Thread } from "@/types/api/comment-api.types";
import { defaultSettings } from "@/utils/config";
import { CommentAssertor, createSettingsName } from "@/utils/test";
import { mockThread } from "@/utils/test";
import { describe, beforeEach, it } from "vitest";
import { EasyCommentFilter } from "./easy-comment-filter";

const baseThreads = [
  mockThread("main", [
    {
      id: "1",
    },
  ]),
  mockThread("easy", [
    {
      id: "2",
    },
    {
      id: "3",
    },
  ]),
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

  describe(createSettingsName("enableEasyCommentFilter"), () => {
    it("falseの場合、かんたんコメントをフィルタリングしない", () => {
      assertor.assert([], runFilter(false));
    });

    it("trueの場合、かんたんコメントをフィルタリングする", () => {
      assertor.assert(["2", "3"], runFilter(true));
    });
  });
});
