import type { Thread } from "@/types/api/comment-api.types";
import { checkComment, getFilteredIds } from "@/utils/test";
import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/utils/config";
import type { Settings } from "@/types/storage/settings.types";
import { mockComments } from "@/utils/test";
import { VposFilter } from "./vpos-filter";

export const vposThreads = [
  {
    fork: "main",
    commentCount: 4,
    comments: mockComments(
      {
        id: "1001",
        vposMs: 9000, // 9秒
      },
      {
        id: "1002",
        vposMs: 9999, // 9.999秒
      },
      {
        id: "1003",
        vposMs: 10_000, // 10秒
      },
      {
        id: "1004",
        vposMs: 11_000, // 11秒
      },
    ),
  },
] satisfies Thread[];

describe(VposFilter.name, () => {
  let threads: Thread[];

  beforeEach(() => {
    threads = structuredClone(vposThreads);
  });

  const runFilter = (options: { settings?: Partial<Settings> }) => {
    const vposFilter = new VposFilter(
      {
        ...defaultSettings,
        enableVposFilter: true,
        ...options.settings,
      },
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
        ids: ["1003", "1004"],
      },
      {
        isEnabled: false,
        ids: [],
      },
    ])("$isEnabled", ({ isEnabled, ids }) => {
      expect(
        getFilteredIds(
          runFilter({
            settings: { enableVposFilter: isEnabled },
          }),
        ),
      ).toEqual(ids);
      checkComment(threads, ids, vposThreads);
    });
  });
});
