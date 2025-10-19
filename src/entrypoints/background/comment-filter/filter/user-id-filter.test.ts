import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/utils/config.js";
import { checkComment, testThreads } from "@/utils/test.js";
import { Thread } from "@/types/api/comment.types.js";
import { UserIdFilter } from "./user-id-filter.js";
import { Settings } from "@/types/storage/settings.types.js";

describe(UserIdFilter.name, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(testThreads);
    });

    const filtering = (options: {
        filter: string;
        settings?: Partial<Settings>;
    }) => {
        const userIdFilter = new UserIdFilter(
            {
                ...defaultSettings,
                ...{ ngUserId: options.filter },
                ...options.settings,
            },
            "sm1",
        );
        userIdFilter.filtering(threads);

        return userIdFilter;
    };

    it("一般", () => {
        const filter = `user-id-owner`;

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([["user-id-owner", ["1000", "1001"]]]),
        );
        checkComment(threads, ["1000", "1001"]);
    });

    it("部分一致", () => {
        const filter = "nvc:RpBQf40dpW85ue3CiT8UZ6AUer";

        expect(filtering({ filter }).getLog()).toEqual(new Map());
        checkComment(threads, []);
    });

    it("後からフィルターを更新", () => {
        const userIdFilter = filtering({ filter: "" });
        userIdFilter.updateFilter(new Set(["user-id-main-1"]));
        userIdFilter.filtering(threads);

        expect(userIdFilter.getLog()).toEqual(
            new Map([["user-id-main-1", ["1002"]]]),
        );
        checkComment(threads, ["1002"]);
    });

    it("動画限定ルール", () => {
        const filter = `
sm1@user-id-owner
sm2@user-id-main-1
`;

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([["user-id-owner", ["1000", "1001"]]]),
        );
        checkComment(threads, ["1000", "1001"]);
    });

    it("通常ルールと動画限定ルールが競合", () => {
        const filter = `
sm1@user-id-owner
user-id-owner

sm2@user-id-main-1
user-id-main-1
`;

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([
                ["user-id-owner", ["1000", "1001"]],
                ["user-id-main-1", ["1002"]],
            ]),
        );
        checkComment(threads, ["1000", "1001", "1002"]);
    });

    it(`Settings.${"ignoreByNicoruCount" satisfies keyof Settings}`, () => {
        const filter = `
user-id-main-1
user-id-main-2
user-id-main-3
`;

        expect(
            filtering({
                filter,
                settings: { isIgnoreByNicoru: true },
            }).getLog(),
        ).toEqual(new Map([["user-id-main-1", ["1002"]]]));
        checkComment(threads, ["1002"]);
    });

    it(`${UserIdFilter.prototype.sortLog.name}()`, () => {
        const filter = `
user-id-main-1
user-id-owner
`;
        const userIdFilter = filtering({
            filter,
        });
        userIdFilter.sortLog();

        expect(
            [...userIdFilter.getLog()].map(([key, value]) => [
                key,
                value,
            ]) satisfies [string, string[]][],
        ).toEqual([
            ["user-id-main-1", ["1002"]],
            ["user-id-owner", ["1000", "1001"]],
        ]);
    });
});
