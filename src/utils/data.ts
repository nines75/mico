import { NiconicoComment, Thread } from "@/types/api/comment.types.js";
import { LogData } from "@/types/storage/log.types.js";

export const testLog = {
    processingTime: { filtering: 51, fetchTag: 50, saveVideoLog: 5 },
    videoData: {
        count: {
            items: {
                easyComment: 0,
                ngUserId: 0,
                ngScore: 0,
                ngCommand: 0,
                ngWord: 2,
            },
            blocked: 2,
            loaded: 2,
            include: 0,
            exclude: 0,
            disable: 2,
        },
        log: {
            ngUserId: new Map(),
            ngScore: [],
            ngCommand: new Map(),
            ngWord: new Map([
                [
                    "/test/i",
                    new Map([
                        ["test", ["1000"]],
                        ["test2", ["1001"]],
                    ]),
                ],
            ]),
            strictNgUserIds: new Set(),
            noToUserId: new Map([
                [1, "nvc:RpBQf40dpW85ue3CiT8UZ6AUer6"],
                [3, "nvc:RpBQf40dpW85ue3CiT8UZ6AUer6"],
            ]),
            comments: new Map([
                [
                    "1000",
                    {
                        id: "1000",
                        no: 1,
                        vposMs: 0,
                        body: "test",
                        commands: ["big", "ue", "184"],
                        isMyPost: false,
                        isPremium: false,
                        nicoruCount: 0,
                        nicoruId: null,
                        postedAt: "2025-05-07T15:00:00+09:00",
                        score: 0,
                        source: "trunk",
                        userId: "nvc:RpBQf40dpW85ue3CiT8UZ6AUer6",
                    },
                ],
                [
                    "1001",
                    {
                        id: "1001",
                        no: 3,
                        vposMs: 2000,
                        body: "test2",
                        commands: ["big", "shita", "184"],
                        isMyPost: false,
                        isPremium: false,
                        nicoruCount: 0,
                        nicoruId: null,
                        postedAt: "2025-05-07T15:00:01+09:00",
                        score: 0,
                        source: "trunk",
                        userId: "nvc:RpBQf40dpW85ue3CiT8UZ6AUer6",
                    },
                ],
            ]),
        },
    },
} as const satisfies LogData;

export const testThreads = (() => {
    const base = {
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
        userId: "nvc:RpBQf40dpW85ue3CiT8UZ6AUer6",
    } satisfies NiconicoComment;
    const forks = ["owner", "main", "easy"] as const;

    const getComment = (comment: Partial<NiconicoComment>): NiconicoComment => {
        return {
            ...base,
            ...comment,
        };
    };

    return forks.map((fork): Thread => {
        switch (fork) {
            case "owner":
                return {
                    fork: fork,
                    commentCount: 2,
                    comments: [
                        getComment({}),
                        getComment({ id: "1001", no: 2 }),
                    ],
                };
            case "main":
                return {
                    fork: fork,
                    commentCount: 3,
                    comments: [
                        getComment({
                            id: "1002",
                            no: 3,
                            commands: ["big", "184"],
                            userId: "nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk",
                            score: -1001,
                            body: "テスト",
                        }),
                        getComment({
                            id: "1003",
                            no: 4,
                            commands: ["184", "device:Switch"],
                            userId: "nvc:vcG0xFnXKcGl81lWoedT3VOI3Qj",
                            score: -1000,
                            body: "テストコメント",
                        }),
                        getComment({
                            id: "1004",
                            no: 5,
                            commands: ["big", "184", "device:Switch"],
                            userId: "nvc:llNBacJJPE6wbyKKEioq3lO6515",
                            score: -999,
                            body: "コメント",
                        }),
                    ],
                };
            case "easy":
                return {
                    fork: fork,
                    commentCount: 0,
                    comments: [],
                };
        }
    });
})();

export function hasComment(threads: Thread[], ids: string[]) {
    return threads.some((thread) =>
        thread.comments.some((comment) => ids.includes(comment.id)),
    );
}
