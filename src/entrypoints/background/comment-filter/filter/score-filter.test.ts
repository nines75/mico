import type { Thread } from "@/types/api/comment-api.types";
import { CommentAssertor, createSettingsName, mockThread } from "@/utils/test";
import { beforeEach, describe, it } from "vitest";
import { ScoreFilter } from "./score-filter";
import { defaultSettings } from "@/utils/config";

const baseThreads = [
  mockThread("main", [
    {
      id: "1",
      score: 0,
    },
    {
      id: "2",
      score: -1000,
    },
    {
      id: "3",
      score: -2400,
    },
  ]),
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

  describe(createSettingsName("enableScoreFilter"), () => {
    it("falseの場合、スコアによるフィルタリングを行わない", () => {
      assertor.assert([], runFilter(false, 0));
    });

    it("trueの場合、スコアによるフィルタリングを行う", () => {
      assertor.assert(["1", "2", "3"], runFilter(true, 0));
    });
  });

  describe(createSettingsName("scoreFilterThreshold"), () => {
    it.each([
      { threshold: 0, ids: ["1", "2", "3"] },
      { threshold: -999, ids: ["2", "3"] },
      { threshold: -1000, ids: ["2", "3"] },
      { threshold: -1001, ids: ["3"] },
      { threshold: -10_000, ids: [] },
    ])(
      "閾値が$thresholdのとき、スコアがそれ以下のコメントをフィルタリングする",
      ({ threshold, ids }) => {
        assertor.assert(ids, runFilter(true, threshold));
      },
    );
  });
});
