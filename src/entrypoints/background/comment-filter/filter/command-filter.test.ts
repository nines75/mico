import { beforeEach, describe, expect, it } from "vitest";
import { CommandFilter } from "./command-filter";
import { defaultSettings } from "@/utils/config";
import { checkComment, testThreads } from "@/utils/test";
import type { Thread } from "@/types/api/comment.types";

describe(CommandFilter.name, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(testThreads);
    });

    const filtering = (options: {
        filter: string;
        isStrictOnly?: boolean;
        ngUserIds?: Set<string>;
    }) => {
        const commandFilter = new CommandFilter(
            { ...defaultSettings, ...{ ngCommand: options.filter } },
            options.ngUserIds ?? new Set(),
        );
        commandFilter.filtering(threads, options.isStrictOnly ?? false);

        return commandFilter;
    };
    const hasCommand = (targets: string[]) =>
        threads.some((thread) =>
            thread.comments.some(({ commands }) =>
                commands.some((command) =>
                    targets.includes(command.toLowerCase()),
                ),
            ),
        );

    // -------------------------------------------------------------------------------------------

    describe("文字列ルール", () => {
        it("基本", () => {
            const filter = "big";

            expect(filtering({ filter }).getLog()).toEqual(
                new Map([["big", ["1002", "1004"]]]),
            );
            checkComment(threads, ["1002", "1004"]);
        });

        it("大小文字が異なる", () => {
            const filter = "BiG";

            expect(filtering({ filter }).getLog()).toEqual(
                new Map([["big", ["1002", "1004"]]]),
            );
            checkComment(threads, ["1002", "1004"]);
        });

        it("部分一致", () => {
            const filter = "bi";

            expect(filtering({ filter }).getLog()).toEqual(new Map());
            checkComment(threads, []);
        });
    });

    it("正規表現ルール", () => {
        const filter = "/big|device:switch/";

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([["/big|device:switch/", ["1002", "1003", "1004"]]]),
        );
        checkComment(threads, ["1002", "1003", "1004"]);
    });

    it("@strict", () => {
        const filter = `
@strict
big
`;
        const commandFilter = filtering({
            filter,
            isStrictOnly: true,
            ngUserIds: new Set(["user-id-main-3"]),
        });

        expect(commandFilter.getLog()).toEqual(new Map());
        expect(commandFilter.getStrictData()).toEqual([
            { userId: "user-id-main-1", context: "command(strict): big" },
        ]);
    });

    describe("@disable", () => {
        it.each([
            {
                name: "文字列ルール",
                filter: `
@disable
big
device:switch
`,
            },
            {
                name: "正規表現ルール",
                filter: `
@disable
/big|device:switch/
`,
            },
        ])("$name", ({ filter }) => {
            expect(filtering({ filter }).getLog()).toEqual(new Map());
            expect(hasCommand(["big", "device:switch"])).toBe(false);
        });
    });

    it("@strictと@disableの競合", () => {
        const filter = `
@strict
@disable
big
`;
        const strictCommandFilter = filtering({ filter, isStrictOnly: true });
        const commandFilter = filtering({ filter });

        checkComment(threads, []);
        expect(strictCommandFilter.getStrictData()).toEqual([]);
        expect(commandFilter.getLog()).toEqual(new Map());
        expect(hasCommand(["big"])).toBe(false);
    });

    // https://github.com/nines75/mico/issues/31
    it("無効化ルールを後から適用", () => {
        const filter = `
@disable
big
@end

big
`;
        expect(filtering({ filter }).getLog()).toEqual(
            new Map([["big", ["1002", "1004"]]]),
        );
        checkComment(threads, ["1002", "1004"]);
    });

    // https://github.com/nines75/mico/issues/61
    it("strictルール適用時の副作用", () => {
        const filter = `
@s
big

device:switch

@disable
184
`;
        const commandFilter = filtering({ filter, isStrictOnly: true });

        expect(commandFilter.getLog()).toEqual(new Map());
        expect(commandFilter.getDisableCount()).toEqual(0);
        expect(hasCommand(["184"])).toBe(true);
        checkComment(threads, []);
    });

    it(CommandFilter.prototype.sortLog.name, () => {
        const filter = `
device:switch
big
`;
        const commandFilter = filtering({
            filter,
        });
        commandFilter.sortLog();

        // 順序を調べるために配列に変換
        expect([...commandFilter.getLog()]).toEqual([
            ["device:switch", ["1003", "1004"]],
            ["big", ["1002"]],
        ]);
    });
});
