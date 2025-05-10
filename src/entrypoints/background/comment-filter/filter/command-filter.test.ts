import { beforeEach, describe, expect, it } from "vitest";
import { CommandFilter } from "./command-filter.js";
import { defaultSettings } from "@/utils/config.js";
import { testThreads } from "@/utils/data.js";
import { Thread } from "@/types/api/comment.types.js";

describe("command filter", () => {
    let copyTestThread: Thread[];

    beforeEach(() => {
        copyTestThread = structuredClone(testThreads);
    });

    const filtering = (
        filter: string,
        isStrictOnly = false,
        ngUserIds = new Set<string>(),
        tags: string[] = [],
    ) => {
        const commandFilter = new CommandFilter(
            { ...defaultSettings, ...{ ngCommand: filter } },
            ngUserIds,
        );
        commandFilter.filterRuleByTag(tags);
        commandFilter.filtering(copyTestThread, isStrictOnly);

        return commandFilter;
    };

    const hasCommand = () =>
        copyTestThread.some((thread) =>
            thread.comments.some((comment) => comment.commands.length > 0),
        );
    const hasSpecificCommand = (targets: string[]) =>
        copyTestThread.some((thread) =>
            thread.comments.some((comment) =>
                comment.commands.some((command) =>
                    targets.includes(command.toLowerCase()),
                ),
            ),
        );

    it("一般的なフィルター", () => {
        const filter = `
big
device:Switch
`;

        expect(filtering(filter).getLog()).toEqual(
            new Map([
                ["big", ["1002", "1004"]],
                ["device:switch", ["1003"]],
            ]),
        );
    });

    it("大小文字が異なるフィルター", () => {
        const filter = `
BiG
Device:switch
`;

        expect(filtering(filter).getLog()).toEqual(
            new Map([
                ["big", ["1002", "1004"]],
                ["device:switch", ["1003"]],
            ]),
        );
    });

    it("完全に一致していないフィルター", () => {
        const filter = `
bi
device:
`;

        expect(filtering(filter).getLog()).toEqual(new Map());
    });

    it("@strict/!", () => {
        const filter = `
@strict
big
@end

!device:switch
`;

        const commandFilter = filtering(
            filter,
            true,
            new Set(["nvc:vcG0xFnXKcGl81lWoedT3VOI3Qj"]),
        );

        expect(commandFilter.getLog()).toEqual(new Map());
        expect(commandFilter.getStrictNgUserIds()).toEqual([
            "nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk",
            "nvc:llNBacJJPE6wbyKKEioq3lO6515",
        ]);
    });

    it.each([
        ["include", new Map([["big", ["1002", "1004"]]])],
        ["exclude", new Map([["device:switch", ["1003", "1004"]]])],
    ])("@%s", (type, expected) => {
        const isExclude = type === "exclude";

        const filter = `
@include tag0
big
@end

@include tag1
device:switch
@end
`;

        const commandFilter = filtering(
            isExclude ? filter.replace(/include/g, "exclude") : filter,
            false,
            new Set(),
            ["tag0"],
        );

        expect(commandFilter.getLog()).toEqual(expected);
    });

    it("@disable", () => {
        const filter = `
@disable
big
device:switch
`;

        expect(filtering(filter).getLog()).toEqual(new Map());
        expect(hasSpecificCommand(["big", "device:switch"])).toBe(false);
    });

    // ToDo: フィルターにallしかない場合にルールが有効化されないバグがあるため落ちる
    //     it("all", () => {
    //         const filter = `
    // @disable
    // all
    // `;

    //         expect(filtering(filter).getLog()).toEqual(new Map());
    //         expect(hasCommand()).toBe(false);
    //     });

    it("無効なall", () => {
        const filter = `all`;

        expect(filtering(filter).getLog()).toEqual(new Map());
        expect(hasCommand()).toBe(true);
    });

    it("@strictと@disableの競合", () => {
        const filter = `
@strict
@disable
big
`;

        const strictCommandFilter = filtering(filter, true);
        const commandFilter = filtering(filter);

        expect(strictCommandFilter.getStrictNgUserIds()).toEqual([]);
        expect(commandFilter.getLog()).toEqual(new Map());
        expect(hasSpecificCommand(["big"])).toBe(false);
    });
});
