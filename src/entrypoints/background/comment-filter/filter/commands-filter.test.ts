import { beforeEach, describe, expect, it } from "vitest";
import { CommandsFilter } from "./commands-filter";
import { defaultSettings } from "@/utils/config";
import { CommentAssertor, mockThread } from "@/utils/test";
import type { Thread } from "@/types/api/comment-api.types";
import type { Settings } from "@/types/storage/settings.types";

const baseThreads = [
  mockThread("main", [
    {
      id: "1",
      commands: ["184", "big"],
      userId: "user-id-1",
    },
    {
      id: "2",
      commands: ["184", "red"],
      userId: "user-id-2",
    },
  ]),
] satisfies Thread[];

describe(CommandsFilter.name, () => {
  let threads: Thread[];
  let assertor: CommentAssertor;

  beforeEach(() => {
    threads = structuredClone(baseThreads);
    assertor = new CommentAssertor(threads, baseThreads);
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
  const hasCommand = (target: string) =>
    threads.some((thread) =>
      thread.comments.some(({ commands }) =>
        commands.some((command) => command.toLowerCase() === target),
      ),
    );

  // -------------------------------------------------------------------------------------------

  describe("文字列ルール", () => {
    it("完全一致", () => {
      const filter = "big";

      assertor.assert(["1"], runFilter({ filter }));
    });

    it("部分一致", () => {
      const filter = "bi";

      assertor.assert([], runFilter({ filter }));
    });

    it("大小文字が異なる", () => {
      const filter = "BIG";

      assertor.assert(["1"], runFilter({ filter }));
    });
  });

  it("正規表現ルール", () => {
    const filter = "/big/";

    assertor.assert(["1"], runFilter({ filter }));
  });

  it("@strict", () => {
    const filter = `
@strict
big
red
`;
    const commandsFilter = runFilter({
      filter,
      strictOnly: true,
      settings: {
        autoFilter: [{ pattern: "user-id-2", target: { commentUserId: true } }],
      },
    });

    assertor.assert([], commandsFilter);
    expect(commandsFilter.getStrictData()).toEqual([
      { userId: "user-id-1", context: "comment-commands: big" },
    ]);
  });

  describe("@disable", () => {
    it.each([
      {
        name: "文字列ルール",
        filter: `
@disable
big
`,
      },
      {
        name: "正規表現ルール",
        filter: `
@disable
/big/
`,
      },
    ])("$name", ({ filter }) => {
      assertor.assert([], runFilter({ filter }));
      expect(hasCommand("big")).toBe(false);
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

    assertor.assert([], commandsFilter);
    expect(strictCommandsFilter.getStrictData()).toEqual([]);
    expect(hasCommand("big")).toBe(false);
  });

  // https://github.com/nines75/mico/issues/31
  it("無効化ルールを後から適用", () => {
    const filter = `
@disable
big
@end

big
`;

    assertor.assert(["1"], runFilter({ filter }));
  });

  // https://github.com/nines75/mico/issues/61
  it("strictルール適用時の副作用", () => {
    const filter = `
@s
big

@disable
184

red
`;
    const commandsFilter = runFilter({ filter, strictOnly: true });

    assertor.assert([], commandsFilter);
    expect(commandsFilter.getDisableCount()).toEqual(0);
    expect(hasCommand("184")).toBe(true);
  });
});
