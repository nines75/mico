import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/utils/config.js";
import { checkComment, testThreads } from "@/utils/test.js";
import type { Thread } from "@/types/api/comment.types.js";
import { WordFilter } from "./word-filter.js";
import type { Settings } from "@/types/storage/settings.types.js";

describe(WordFilter.name, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(testThreads);
    });

    const filtering = (options: {
        filter: string;
        isStrictOnly?: boolean;
        ngUserIds?: Set<string>;
        settings?: Partial<Settings>;
    }) => {
        const wordFilter = new WordFilter(
            {
                ...defaultSettings,
                ...{
                    ngWord: options.filter,
                },
                ...options.settings,
            },
            options.ngUserIds ?? new Set(),
        );
        wordFilter.filtering(threads, options.isStrictOnly ?? false);

        return wordFilter;
    };

    it("一般", () => {
        const filter = "test";

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([["test", new Map([["test", ["1000", "1001"]]])]]),
        );
        checkComment(threads, ["1000", "1001"]);
    });

    it("大小文字が異なる", () => {
        const filter = "TesT";

        expect(filtering({ filter }).getLog()).toEqual(new Map());
        checkComment(threads, []);
    });

    it("正規表現", () => {
        const filter = "/テスト/";

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([
                [
                    "/テスト/",
                    new Map([
                        ["テスト", ["1002"]],
                        ["テストコメント", ["1003"]],
                    ]),
                ],
            ]),
        );
        checkComment(threads, ["1002", "1003"]);
    });

    it("@strict", () => {
        const filter = `
@strict
テスト
`;
        const wordFilter = filtering({
            filter,
            isStrictOnly: true,
            ngUserIds: new Set(["user-id-main-2"]),
        });

        expect(wordFilter.getLog()).toEqual(new Map());
        expect(wordFilter.getStrictData()).toEqual([
            {
                userId: "user-id-main-1",
                context: "body(strict): テスト",
            },
        ]);
    });

    // https://github.com/nines75/mico/issues/61
    it("strictルール適用時の副作用", () => {
        const filter = `
@s
テスト

コメント
`;
        expect(filtering({ filter, isStrictOnly: true }).getLog()).toEqual(
            new Map(),
        );
        checkComment(threads, []);
    });

    it(`${WordFilter.prototype.sortLog.name}()`, () => {
        const filter = `
コメント
テスト
`;
        const wordFilter = filtering({
            filter,
        });
        wordFilter.sortLog();

        // 順序を調べるために配列に変換
        expect(
            [...wordFilter.getLog()].map(([key, map]) => [key, [...map]]),
        ).toEqual([
            [
                "コメント",
                [
                    ["コメント", ["1004"]],
                    ["テストコメント", ["1003"]],
                ],
            ],
            ["テスト", [["テスト", ["1002"]]]],
        ]);
    });
});
