import { NiconicoComment, Thread } from "@/types/api/comment.types.js";
import { LogData } from "@/types/storage/log.types.js";

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

    const createComment = (
        comment: Partial<NiconicoComment>,
    ): NiconicoComment => {
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
                        createComment({}),
                        createComment({ id: "1001", no: 2 }),
                    ],
                };
            case "main":
                return {
                    fork: fork,
                    commentCount: 3,
                    comments: [
                        createComment({
                            id: "1002",
                            no: 3,
                            commands: ["big", "184"],
                            userId: "nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk",
                            score: -1001,
                            body: "テスト",
                            nicoruCount: 29,
                        }),
                        createComment({
                            id: "1003",
                            no: 4,
                            commands: ["184", "device:Switch"],
                            userId: "nvc:vcG0xFnXKcGl81lWoedT3VOI3Qj",
                            score: -1000,
                            body: "テストコメント",
                            nicoruCount: 30,
                        }),
                        createComment({
                            id: "1004",
                            no: 5,
                            commands: ["big", "184", "device:Switch"],
                            userId: "nvc:llNBacJJPE6wbyKKEioq3lO6515",
                            score: -999,
                            body: "コメント",
                            nicoruCount: 31,
                        }),
                    ],
                };
            case "easy":
                return {
                    fork: fork,
                    commentCount: 0,
                    comments: [
                        createComment({
                            id: "1005",
                            no: 6,
                            userId: "nvc:4QhgYaZbMAYEUOdwDQ7a8KeX96p",
                            body: "！？",
                        }),
                        createComment({
                            id: "1006",
                            no: 7,
                            userId: "nvc:4QhgYaZbMAYEUOdwDQ7a8KeX96p",
                            body: "うぽつ",
                        }),
                    ],
                };
        }
    });
})();

export const testLog = {
    processingTime: { filtering: 51, fetchTag: 50, saveVideoLog: 5 },
    videoData: {
        count: {
            items: {
                easyComment: 2,
                ngUserId: 2,
                ngScore: 1,
                ngCommand: 1,
                ngWord: 1,
            },
            blocked: 7,
            loaded: 7,
            include: 0,
            exclude: 0,
            disable: 0,
        },
        log: {
            ngUserId: new Map([
                ["nvc:RpBQf40dpW85ue3CiT8UZ6AUer6", ["1000", "1001"]],
            ]),
            ngScore: ["1002"],
            ngCommand: new Map([["big", ["1004"]]]),
            ngWord: new Map([
                ["/コメント/i", new Map([["テストコメント", ["1003"]]])],
            ]),
            strictNgUserIds: new Set(),
            noToUserId: new Map([
                [1, "nvc:RpBQf40dpW85ue3CiT8UZ6AUer6"],
                [2, "nvc:RpBQf40dpW85ue3CiT8UZ6AUer6"],
                [3, "nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk"],
                [4, "nvc:vcG0xFnXKcGl81lWoedT3VOI3Qj"],
                [5, "nvc:llNBacJJPE6wbyKKEioq3lO6515"],
                [6, "nvc:4QhgYaZbMAYEUOdwDQ7a8KeX96p"],
                [7, "nvc:4QhgYaZbMAYEUOdwDQ7a8KeX96p"],
            ]),
            comments: new Map(
                getComments(["1000", "1001", "1002", "1004", "1003"]) as [
                    string,
                    NiconicoComment,
                ][],
            ),
        },
    },
} as const satisfies LogData;

export function hasComment(threads: Thread[], ids: string[]) {
    return threads.some((thread) =>
        thread.comments.some((comment) => ids.includes(comment.id)),
    );
}

export function replaceInclude(filter: string) {
    return filter.replace(/include/g, "exclude");
}

function getComments(ids: string[]) {
    const comments: [string, NiconicoComment | undefined][] = ids.map((id) => [
        id,
        testThreads
            .flatMap((thread) => thread.comments)
            .find((comment) => comment.id === id),
    ]);
    comments.forEach(([_, comment]) => {
        comment?.commands.forEach(
            (command, i, commands) => (commands[i] = command.toLowerCase()),
        );
    });
    return comments;
}
