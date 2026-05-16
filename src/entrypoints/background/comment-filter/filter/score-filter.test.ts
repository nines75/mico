import type { Thread } from "@/types/api/comment-api.types";
import { CommentAssertor, mockComments } from "@/utils/test";
import { beforeEach, describe, it } from "vitest";
import { ScoreFilter } from "./score-filter";
import { defaultSettings } from "@/utils/config";
import type { Settings } from "@/types/storage/settings.types";

const baseThreads = [
  {
    fork: "main",
    commentCount: 3,
    comments: mockComments(
      {
        id: "1001",
        score: 0,
      },
      {
        id: "1002",
        score: -1000,
      },
      {
        id: "1003",
        score: -2400,
      },
    ),
  },
] satisfies Thread[];

describe(ScoreFilter.name, () => {
  let threads: Thread[];
  let assertor: CommentAssertor;

  beforeEach(() => {
    threads = structuredClone(baseThreads);
    assertor = new CommentAssertor(threads, baseThreads);
  });

  const runFilter = (enableScoreFilter: boolean, threshold: number) => {
    const scoreFilter = new ScoreFilter({
      ...defaultSettings,
      enableScoreFilter,
      scoreFilterThreshold: threshold,
    });

    scoreFilter.apply(threads);

    return scoreFilter;
  };

  // -------------------------------------------------------------------------------------------

  it(`Settings.${"enableScoreFilter" satisfies keyof Settings}`, () => {
    assertor.assert([], runFilter(false, 0));
  });

  describe(`Settings.${"scoreFilterThreshold" satisfies keyof Settings}`, () => {
    it.each([
      { threshold: 0, ids: ["1001", "1002", "1003"] },
      { threshold: -999, ids: ["1002", "1003"] },
      { threshold: -1000, ids: ["1002", "1003"] },
      { threshold: -1001, ids: ["1003"] },
      { threshold: -10_000, ids: [] },
    ])("閾値: $threshold", ({ threshold, ids }) => {
      assertor.assert(ids, runFilter(true, threshold));
    });
  });
});
