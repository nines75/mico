import { NiconicoComment, Thread } from "@/types/api/comment.types.js";
import {
    CommentMap,
    CommentFilterLog,
} from "@/types/storage/log-comment.types.js";
import { expect } from "vitest";

export function createComments(
    ...comments: Partial<NiconicoComment>[]
): NiconicoComment[] {
    return comments.map((comment) => {
        return {
            ...{
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
            },
            ...comment,
        };
    });
}

export const testThreads = [
    {
        fork: "owner",
        commentCount: 2,
        comments: createComments(
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
        comments: createComments(
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
        comments: createComments(
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

export const testComments: CommentMap = new Map(
    testThreads.flatMap((thread) =>
        thread.comments.map((comment) => [comment.id, comment]),
    ),
);

function getComments(ids: string[]) {
    const comments: [string, NiconicoComment][] = ids.map((id) => [
        id,
        testThreads
            .flatMap((thread) => thread.comments)
            .find((comment) => comment.id === id) as NiconicoComment,
    ]);
    comments.forEach(([_, comment]) => {
        comment.commands.forEach(
            (command, i, commands) => (commands[i] = command.toLowerCase()),
        );
    });

    return comments;
}

export const testLog = {
    count: {
        rule: {
            ngUserId: 1,
            ngCommand: 1,
            ngWord: 1,
        },
        blocked: {
            easyComment: 2,
            commentAssist: 0,
            ngUserId: 2,
            ngScore: 1,
            ngCommand: 1,
            ngWord: 1,
        },
        totalBlocked: 7,
        loaded: 7,
        include: 0,
        exclude: 0,
        disable: 0,
        invalid: 0,
    },
    filtering: {
        commentAssist: new Map(),
        ngUserId: new Map([["user-id-owner", ["1000", "1001"]]]),
        ngScore: ["1002"],
        ngCommand: new Map([["big", ["1004"]]]),
        ngWord: new Map([
            ["コメント", new Map([["テストコメント", ["1003"]]])],
        ]),
        strictNgUserIds: new Set(),
        filteredComments: new Map(
            getComments(["1000", "1001", "1002", "1004", "1003"]),
        ),
        renderedComments: [],
    },
    processingTime: { filtering: 1, saveLog: 5 },
} as const satisfies CommentFilterLog;

export function checkComment(
    threads: Thread[],
    filteredIds: string[],
    baseThreads?: Thread[],
) {
    // 実際のコメントIDを抽出
    const actualIds = threads.flatMap((thread) =>
        thread.comments.map((comment) => comment.id),
    );

    // 全てのコメントIDからフィルタリングされた想定のIDを除外したものを抽出
    const expectedIds: string[] = [];
    (baseThreads ?? testThreads).forEach((thread) =>
        thread.comments.forEach((comment) => {
            const targetId = comment.id;
            if (!filteredIds.includes(targetId)) {
                expectedIds.push(targetId);
            }
        }),
    );

    expect(actualIds.sort()).toEqual(expectedIds.sort());
}

export function replaceInclude(filter: string) {
    return filter.replace(/include/g, "exclude");
}
