import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/utils/config";
import { checkComment, testThreads } from "@/utils/test";
import type { Thread } from "@/types/api/comment.types";
import { UserIdFilter } from "./user-id-filter";

describe(UserIdFilter.name, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(testThreads);
    });

    const filtering = (options: { filter: string }) => {
        const userIdFilter = new UserIdFilter({
            ...defaultSettings,
            ngUserId: options.filter,
        });
        userIdFilter.filtering(threads);

        return userIdFilter;
    };

    // -------------------------------------------------------------------------------------------

    describe("文字列ルール", () => {
        it("基本", () => {
            const filter = "user-id-owner";

            expect(filtering({ filter }).getLog()).toEqual(
                new Map([["user-id-owner", ["1000", "1001"]]]),
            );
            checkComment(threads, ["1000", "1001"]);
        });

        it("部分一致", () => {
            const filter = "user-id";

            expect(filtering({ filter }).getLog()).toEqual(new Map());
            checkComment(threads, []);
        });
    });

    it("正規表現ルール", () => {
        const filter = "/^user-id-main/";

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([["/^user-id-main/", ["1002", "1003", "1004"]]]),
        );
        checkComment(threads, ["1002", "1003", "1004"]);
    });

    it(UserIdFilter.prototype.updateFilter.name, () => {
        const userIdFilter = filtering({ filter: "user-id-main-1" });
        userIdFilter.updateFilter(["user-id-main-2"]);
        userIdFilter.filtering(threads);
        userIdFilter.sortLog();

        // 後から追加したユーザーIDが先にくることを確認
        expect([...userIdFilter.getLog()]).toEqual([
            ["user-id-main-2", ["1003"]],
            ["user-id-main-1", ["1002"]],
        ]);
        checkComment(threads, ["1002", "1003"]);
    });

    it(UserIdFilter.prototype.sortLog.name, () => {
        const filter = `
user-id-main-1
user-id-owner
`;
        const userIdFilter = filtering({
            filter,
        });
        userIdFilter.sortLog();

        // 順序を調べるために配列に変換
        expect([...userIdFilter.getLog()]).toEqual([
            ["user-id-main-1", ["1002"]],
            ["user-id-owner", ["1000", "1001"]],
        ]);
    });
});
