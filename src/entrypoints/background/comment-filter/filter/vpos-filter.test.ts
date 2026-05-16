import type { Thread } from "@/types/api/comment-api.types";
import { CommentAssertor } from "@/utils/test";
import { beforeEach, describe, it } from "vitest";
import { defaultSettings } from "@/utils/config";
import type { Settings } from "@/types/storage/settings.types";
import { mockComments } from "@/utils/test";
import { VposFilter } from "./vpos-filter";

const baseThreads = [
  {
    fork: "main",
    commentCount: 4,
    comments: mockComments(
      {
        id: "1",
        vposMs: 9000, // 9秒
      },
      {
        id: "2",
        vposMs: 9999, // 9.999秒
      },
      {
        id: "3",
        vposMs: 10_000, // 10秒
      },
      {
        id: "4",
        vposMs: 11_000, // 11秒
      },
    ),
  },
] satisfies Thread[];

describe(VposFilter.name, () => {
  let threads: Thread[];
  let assertor: CommentAssertor;

  beforeEach(() => {
    threads = structuredClone(baseThreads);
    assertor = new CommentAssertor(threads, baseThreads);
  });

  const runFilter = (enableVposFilter: boolean) => {
    const vposFilter = new VposFilter(
      { ...defaultSettings, enableVposFilter },
      9,
    );

    vposFilter.apply(threads);

    return vposFilter;
  };

  // -------------------------------------------------------------------------------------------

  describe(`Settings.${"enableVposFilter" satisfies keyof Settings}`, () => {
    it.each([
      {
        isEnabled: true,
        ids: ["3", "4"],
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
