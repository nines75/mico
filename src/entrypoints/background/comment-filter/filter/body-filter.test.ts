import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/utils/config";
import { checkComment, getFilteredIds, testThreads } from "@/utils/test";
import type { Thread } from "@/types/api/comment-api.types";
import { BodyFilter } from "./body-filter";
import type { Settings } from "@/types/storage/settings.types";

describe(BodyFilter.name, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(testThreads);
    });

    const runFilter = (options: {
        filter: string;
        strictOnly?: boolean;
        settings?: Partial<Settings>;
    }) => {
        const bodyFilter = new BodyFilter({
            ...defaultSettings,
            ...options.settings,
            manualFilter: `@comment-body\n${options.filter}`,
        });
        bodyFilter.apply(threads, options.strictOnly ?? false);

        return bodyFilter;
    };

    // -------------------------------------------------------------------------------------------

    describe("文字列ルール", () => {
        it("基本", () => {
            const filter = "test";

            expect(getFilteredIds(runFilter({ filter }))).toEqual([
                "1000",
                "1001",
            ]);
            checkComment(threads, ["1000", "1001"]);
        });

        it("部分一致", () => {
            const filter = "tes";

            expect(getFilteredIds(runFilter({ filter }))).toEqual([
                "1000",
                "1001",
            ]);
            checkComment(threads, ["1000", "1001"]);
        });

        it("大小文字が異なる", () => {
            const filter = "TesT";

            expect(getFilteredIds(runFilter({ filter }))).toEqual([]);
            checkComment(threads, []);
        });
    });

    it("正規表現ルール", () => {
        const filter = "/テスト/";

        expect(getFilteredIds(runFilter({ filter }))).toEqual(["1002", "1003"]);
        checkComment(threads, ["1002", "1003"]);
    });

    it("@strict", () => {
        const filter = `
@strict
テスト
`;
        const bodyFilter = runFilter({
            filter,
            strictOnly: true,
            settings: {
                autoFilter: [
                    {
                        pattern: "user-id-main-2",
                        target: { commentUserId: true },
                    },
                ],
            },
        });

        expect(getFilteredIds(bodyFilter)).toEqual([]);
        expect(bodyFilter.getStrictData()).toEqual([
            {
                userId: "user-id-main-1",
                context: "comment-body: テスト",
            },
        ]);
        checkComment(threads, []);
    });

    // https://github.com/nines75/mico/issues/61
    it("strictルール適用時の副作用", () => {
        const filter = `
@s
テスト

コメント
`;
        expect(getFilteredIds(runFilter({ filter, strictOnly: true }))).toEqual(
            [],
        );
        checkComment(threads, []);
    });
});
