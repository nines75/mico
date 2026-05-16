import type { Filter } from "@/entrypoints/background/comment-filter/filter";
import type { parseFilter } from "@/entrypoints/background/parse-filter";
import { createDefaultRule, type Rule } from "@/entrypoints/background/rule";
import type { Thread } from "@/types/api/comment-api.types";
import type { NvComment } from "@/types/api/comment.types";
import type { Tab } from "@/types/storage/tab.types";
import type { PartialDeep } from "type-fest";
import { expect } from "vitest";
import { merge } from "./util";

export function mockComments(...comments: Partial<NvComment>[]): NvComment[] {
  return comments.map((comment) => {
    return {
      id: "1",
      no: 1,
      vposMs: 0,
      body: "foo",
      commands: [],
      isMyPost: false,
      isPremium: false,
      nicoruCount: 0,
      nicoruId: null,
      postedAt: "2025-05-07T15:00:00+09:00",
      score: 0,
      userId: "user-id",
      ...comment,
    };
  });
}

export const testTab = {
  seriesNext: undefined,
  duration: 1,
  videoId: "sm1",
  seriesId: "1",
  title: "foo",
  ownerId: "1",
  ownerName: "foo",
  tags: [],
} as const satisfies Tab;

export class CommentAssertor {
  private threads: Thread[];
  private baseThreads: Thread[];

  constructor(threads: Thread[], baseThreads: Thread[]) {
    this.threads = threads;
    this.baseThreads = baseThreads;
  }

  assert(filteredIds: string[], filter?: Filter) {
    // -------------------------------------------------------------------------------------------
    // フィルタリング結果の検証
    // -------------------------------------------------------------------------------------------

    // 実際のコメントIDを抽出
    const actualIds = this.threads.flatMap((thread) =>
      thread.comments.map(({ id }) => id),
    );

    // 全てのコメントIDからフィルタリングされた想定のIDを除外
    const expectedIds: string[] = [];
    for (const thread of this.baseThreads) {
      for (const { id } of thread.comments) {
        if (!filteredIds.includes(id)) {
          expectedIds.push(id);
        }
      }
    }

    expect(actualIds.toSorted()).toEqual(expectedIds.toSorted());

    // -------------------------------------------------------------------------------------------
    // ログの検証
    // -------------------------------------------------------------------------------------------

    if (filter !== undefined) {
      expect(
        filter.getFilteredComments().map(({ comment }) => comment.id),
      ).toEqual(filteredIds);
    }
  }
}

export function mockRules(
  ...rules: PartialDeep<Rule>[]
): ReturnType<typeof parseFilter> {
  return {
    rules: rules.map((rule): Rule => {
      return merge({ ...createDefaultRule(), pattern: "rule" }, rule);
    }),
    invalidLines: [],
  };
}
