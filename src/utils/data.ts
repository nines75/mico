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
