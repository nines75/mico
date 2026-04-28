import { beforeEach, describe, expect, it } from "vitest";
import { CommandsFilter } from "./commands-filter";
import { defaultSettings } from "@/utils/config";
import { checkComment, getFilteredIds, testThreads } from "@/utils/test";
import type { Thread } from "@/types/api/comment-api.types";
import type { Settings } from "@/types/storage/settings.types";

describe(CommandsFilter.name, () => {
  let threads: Thread[];

  beforeEach(() => {
    threads = structuredClone(testThreads);
  });

  const runFilter = (options: {
    filter: string;
    strictOnly?: boolean;
    settings?: Partial<Settings>;
  }) => {
    const commandsFilter = new CommandsFilter({
      ...defaultSettings,
      ...options.settings,
      manualFilter: `@comment-commands\n${options.filter}`,
    });
    commandsFilter.apply(threads, options.strictOnly ?? false);

    return commandsFilter;
  };
  const hasCommand = (targets: string[]) =>
    threads.some((thread) =>
      thread.comments.some(({ commands }) =>
        commands.some((command) => targets.includes(command.toLowerCase())),
      ),
    );

  // -------------------------------------------------------------------------------------------

  describe("文字列ルール", () => {
    it("基本", () => {
      const filter = "big";

      expect(getFilteredIds(runFilter({ filter }))).toEqual(["1002", "1004"]);
      checkComment(threads, ["1002", "1004"]);
    });

    it("大小文字が異なる", () => {
      const filter = "BiG";

      expect(getFilteredIds(runFilter({ filter }))).toEqual(["1002", "1004"]);
      checkComment(threads, ["1002", "1004"]);
    });

    it("部分一致", () => {
      const filter = "bi";

      expect(getFilteredIds(runFilter({ filter }))).toEqual([]);
      checkComment(threads, []);
    });
  });

  it("正規表現ルール", () => {
    const filter = "/big|device:switch/";

    expect(getFilteredIds(runFilter({ filter }))).toEqual([
      "1002",
      "1003",
      "1004",
    ]);
    checkComment(threads, ["1002", "1003", "1004"]);
  });

  it("@strict", () => {
    const filter = `
@strict
big
`;
    const commandsFilter = runFilter({
      filter,
      strictOnly: true,
      settings: {
        autoFilter: [
          {
            pattern: "user-id-main-3",
            target: { commentUserId: true },
          },
        ],
      },
    });

    expect(getFilteredIds(commandsFilter)).toEqual([]);
    expect(commandsFilter.getStrictData()).toEqual([
      { userId: "user-id-main-1", context: "comment-commands: big" },
    ]);
    checkComment(threads, []);
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
      expect(getFilteredIds(runFilter({ filter }))).toEqual([]);
      expect(hasCommand(["big", "device:switch"])).toBe(false);
      checkComment(threads, []);
    });
  });

  it("@strictと@disableの競合", () => {
    const filter = `
@strict
@disable
big
`;
    const commandsFilter = runFilter({ filter });
    const strictCommandsFilter = runFilter({ filter, strictOnly: true });

    expect(getFilteredIds(commandsFilter)).toEqual([]);
    expect(strictCommandsFilter.getStrictData()).toEqual([]);
    expect(hasCommand(["big"])).toBe(false);
    checkComment(threads, []);
  });

  // https://github.com/nines75/mico/issues/31
  it("無効化ルールを後から適用", () => {
    const filter = `
@disable
big
@end

big
`;
    expect(getFilteredIds(runFilter({ filter }))).toEqual(["1002", "1004"]);
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
    const commandsFilter = runFilter({ filter, strictOnly: true });

    expect(getFilteredIds(commandsFilter)).toEqual([]);
    expect(commandsFilter.getDisableCount()).toEqual(0);
    expect(hasCommand(["184"])).toBe(true);
    checkComment(threads, []);
  });
});
