import type { Filter } from "@/entrypoints/background/comment-filter/filter";
import type { parseFilter } from "@/entrypoints/background/parse-filter";
import type { Toggle } from "@/entrypoints/background/rule";
import {
    createDefaultRule,
    createDefaultToggle,
    type Rule,
} from "@/entrypoints/background/rule";
import type { NiconicoComment, Thread } from "@/types/api/comment.types";
import type { TabData } from "@/types/storage/tab.types";
import { expect } from "vitest";

export function mockComments(
    ...comments: Partial<NiconicoComment>[]
): NiconicoComment[] {
    return comments.map((comment) => {
        return {
            id: "1000",
            no: 1,
            vposMs: 0,
            body: "test",
            commands: ["184"],
            isMyPost: false,
            isPremium: false,
            nicoruCount: 0,
            nicoruId: null,
            postedAt: "2025-05-07T15:00:00+09:00",
            score: 0,
            source: "trunk",
            userId: "user-id-owner",
            ...comment,
        };
    });
}

export const testThreads = [
    {
        fork: "owner",
        commentCount: 2,
        comments: mockComments(
            {
                commands: [], // 投稿者コメントは184コマンドが付与されない
            },
            {
                id: "1001",
                commands: [],
            },
        ),
    },
    {
        fork: "main",
        commentCount: 3,
        comments: mockComments(
            {
                id: "1002",
                commands: ["big", "184"],
                userId: "user-id-main-1",
                score: -1001,
                body: "テスト",
                nicoruCount: 29,
            },
            {
                id: "1003",
                commands: ["184", "device:Switch"],
                userId: "user-id-main-2",
                score: -1000,
                body: "テストコメント",
                nicoruCount: 30,
            },
            {
                id: "1004",
                commands: ["big", "184", "device:Switch"],
                userId: "user-id-main-3",
                score: -999,
                body: "コメント",
                nicoruCount: 31,
            },
        ),
    },
    {
        fork: "easy",
        commentCount: 2,
        comments: mockComments(
            {
                id: "1005",
                userId: "user-id-easy",
                body: "！？",
            },
            {
                id: "1006",
                userId: "user-id-easy",
                body: "うぽつ",
            },
        ),
    },
] satisfies Thread[];

export const testTabData = {
    series: {
        hasNext: false,
    },
    videoId: "sm1",
    seriesId: "1",
    title: "title",
    ownerId: "1",
    ownerName: "user-name",
    tags: [],
} as const satisfies TabData;

export function checkComment(
    threads: Thread[],
    filteredIds: string[],
    baseThreads?: Thread[],
) {
    // 実際のコメントIDを抽出
    const actualIds = threads.flatMap((thread) =>
        thread.comments.map(({ id }) => id),
    );

    // 全てのコメントIDからフィルタリングされた想定のIDを除外したものを抽出
    const expectedIds: string[] = [];
    for (const thread of baseThreads ?? testThreads) {
        for (const { id } of thread.comments) {
            if (!filteredIds.includes(id)) {
                expectedIds.push(id);
            }
        }
    }

    expect(actualIds.toSorted()).toEqual(expectedIds.toSorted());
}

export function mockRules(
    ...rules: Partial<Rule>[]
): ReturnType<typeof parseFilter> {
    return {
        rules: rules.map((rule): Rule => {
            return {
                pattern: "rule",
                ...createDefaultRule(),
                ...rule,
            };
        }),
        invalidCount: 0,
    };
}

export function mockToggle(toggle: Partial<Toggle>): Toggle {
    return {
        ...createDefaultToggle(),
        ...toggle,
    };
}

export function getFilteredIds(filter: Filter | undefined) {
    return filter?.getFilteredComments().map(({ comment }) => comment.id);
}
