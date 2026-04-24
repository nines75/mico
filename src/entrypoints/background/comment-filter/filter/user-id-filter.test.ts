import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/utils/config";
import { checkComment, getFilteredIds, testThreads } from "@/utils/test";
import type { Thread } from "@/types/api/comment.types";
import { UserIdFilter } from "./user-id-filter";

describe(UserIdFilter.name, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(testThreads);
    });

    const runFilter = (options: { filter: string }) => {
        const userIdFilter = new UserIdFilter({
            ...defaultSettings,
            manualFilter: `@comment-user-id\n${options.filter}`,
        });
        userIdFilter.apply(threads);

        return userIdFilter;
    };

    // -------------------------------------------------------------------------------------------

    describe("文字列ルール", () => {
        it("基本", () => {
            const filter = "user-id-owner";

            expect(getFilteredIds(runFilter({ filter }))).toEqual([
                "1000",
                "1001",
            ]);
            checkComment(threads, ["1000", "1001"]);
        });

        it("部分一致", () => {
            const filter = "user-id";

            expect(getFilteredIds(runFilter({ filter }))).toEqual([]);
            checkComment(threads, []);
        });
    });

    it("正規表現ルール", () => {
        const filter = "/^user-id-main/";

        expect(getFilteredIds(runFilter({ filter }))).toEqual([
            "1002",
            "1003",
            "1004",
        ]);
        checkComment(threads, ["1002", "1003", "1004"]);
    });

    it(UserIdFilter.prototype.updateFilter.name, () => {
        const userIdFilter = runFilter({ filter: "user-id-main-1" });
        userIdFilter.updateFilter([{ userId: "user-id-main-2", context: "" }]);
        userIdFilter.apply(threads);

        expect(getFilteredIds(userIdFilter)).toEqual(["1002", "1003"]);
        checkComment(threads, ["1002", "1003"]);
    });
});
