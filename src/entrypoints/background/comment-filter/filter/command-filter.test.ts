import { beforeEach, describe, expect, it } from "vitest";
import { CommandFilter } from "./command-filter.js";
import { defaultSettings } from "@/utils/config.js";
import { hasComment, replaceInclude, testThreads } from "@/utils/test.js";
import { Thread } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";

describe(CommandFilter.name, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(testThreads);
    });

    const filtering = (options: {
        filter: string;
        tags?: string[];
        isStrictOnly?: boolean;
        ngUserIds?: Set<string>;
        settings?: Partial<Settings>;
    }) => {
        const commandFilter = new CommandFilter(
            {
                ...defaultSettings,
                ...{
                    ngCommand: options.filter,
                },
                ...options.settings,
            },
            options.ngUserIds ?? new Set(),
        );
        commandFilter.filterRuleByTag(options.tags ?? []);
        commandFilter.filtering(threads, options.isStrictOnly ?? false);

        return commandFilter;
    };

    const hasAnyCommand = () =>
        threads.some((thread) =>
            thread.comments.some((comment) => comment.commands.length > 0),
        );
    const hasCommand = (targets: string[]) =>
        threads.some((thread) =>
            thread.comments.some((comment) =>
                comment.commands.some((command) =>
                    targets.includes(command.toLowerCase()),
                ),
            ),
        );

    it("一般", () => {
        const filter = `
big
device:Switch
`;

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([
                ["big", ["1002", "1004"]],
                ["device:switch", ["1003"]],
            ]),
        );
        expect(hasComment(threads, ["1002", "1003", "1004"])).toBe(false);
    });

    it("大小文字が異なる", () => {
        const filter = `
BiG
Device:switch
`;

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([
                ["big", ["1002", "1004"]],
                ["device:switch", ["1003"]],
            ]),
        );
        expect(hasComment(threads, ["1002", "1003", "1004"])).toBe(false);
    });

    it("部分一致", () => {
        const filter = `
bi
device:
`;

        expect(filtering({ filter }).getLog()).toEqual(new Map());
    });

    it.each([
        {
            name: "@strict",
            filter: `
@strict
big
@end
`,
            expected: "nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk",
        },
        {
            name: "!",
            filter: "!device:switch",
            expected: "nvc:vcG0xFnXKcGl81lWoedT3VOI3Qj",
        },
    ])("$name", ({ filter, expected }) => {
        const commandFilter = filtering({
            filter,
            isStrictOnly: true,
            ngUserIds: new Set(["nvc:llNBacJJPE6wbyKKEioq3lO6515"]),
        });

        expect(commandFilter.getLog()).toEqual(new Map());
        expect(commandFilter.getStrictNgUserIds()).toEqual([expected]);
    });

    it.each([
        {
            name: "@include",
            expected: new Map([["big", ["1002", "1004"]]]),
            ids: ["1002", "1004"],
        },
        {
            name: "@exclude",
            expected: new Map([["device:switch", ["1003", "1004"]]]),
            ids: ["1003", "1004"],
        },
    ])("$name", ({ name, expected, ids }) => {
        const isExclude = name === "@exclude";
        const filter = `
@include example-tag
big
@end

@include tag
device:switch
@end
`;
        const commandFilter = filtering({
            filter: isExclude ? replaceInclude(filter) : filter,
            tags: ["example-TAG"],
        });

        expect(commandFilter.getLog()).toEqual(expected);
        expect(hasComment(threads, ids)).toBe(false);
    });

    it("@disable", () => {
        const filter = `
@disable
big
device:switch
`;

        expect(filtering({ filter }).getLog()).toEqual(new Map());
        expect(hasCommand(["big", "device:switch"])).toBe(false);
    });

    it("all", () => {
        const filter = `
@disable
all
`;

        expect(filtering({ filter }).getLog()).toEqual(new Map());
        expect(hasAnyCommand()).toBe(false);
    });

    it("無効なall", () => {
        const filter = "all";

        expect(filtering({ filter }).getLog()).toEqual(new Map());
        expect(hasAnyCommand()).toBe(true);
    });

    it("@strictと@disableの競合", () => {
        const filter = `
@strict
@disable
big
`;
        const strictCommandFilter = filtering({ filter, isStrictOnly: true });
        const commandFilter = filtering({ filter });

        expect(strictCommandFilter.getStrictNgUserIds()).toEqual([]);
        expect(commandFilter.getLog()).toEqual(new Map());
        expect(hasCommand(["big"])).toBe(false);
    });

    it("動画タグが存在しないときのtagルール判定", () => {
        const filter = `
@include tag0
big
@end

@exclude tag1
device:switch
@end
`;

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([["device:switch", ["1003", "1004"]]]),
        );
        expect(hasComment(threads, ["1003", "1004"])).toBe(false);
    });

    it(`Settings.${"isIgnoreByNicoru" satisfies keyof Settings}`, () => {
        const filter = `
big
device:switch
`;

        expect(
            filtering({
                filter,
                settings: { isIgnoreByNicoru: true },
            }).getLog(),
        ).toEqual(new Map([["big", ["1002"]]]));
        expect(hasComment(threads, ["1002"])).toBe(false);
    });

    it(`${CommandFilter.prototype.sortLog.name}()`, () => {
        const filter = `
device:switch
big
`;
        const commandFilter = filtering({
            filter,
        });
        commandFilter.sortLog();

        expect(commandFilter.getLog()).toEqual(
            new Map([
                ["device:switch", ["1003", "1004"]],
                ["big", ["1002"]],
            ]),
        );
    });
});
