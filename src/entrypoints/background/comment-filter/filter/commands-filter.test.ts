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
    settings?: Partial<Settings> | undefined;
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
    it.each([
      {
        name: "コマンドがルールと完全に一致する場合、そのコメントをフィルタリングする",
        filter: "big", // 完全一致
        filteredIds: ["1"],
      },
      {
        name: "コマンドにルールが部分的に含まれる場合、そのコメントをフィルタリングしない",
        filter: "bi", // 部分一致
        filteredIds: [],
      },
      {
        name: "コマンドにルールが部分的に含まれない場合、そのコメントをフィルタリングしない",
        filter: "small",
        filteredIds: [],
      },
      {
        name: "コマンドが大小文字を変えたルールと完全に一致する場合、そのコメントをフィルタリングする",
        filter: "BIG",
        filteredIds: ["1"],
      },
    ])("$name", ({ filter, filteredIds }) => {
      assertor.assert(filteredIds, runFilter({ filter }));
    });
  });

  describe("正規表現ルール", () => {
    it.each([
      {
        name: "コマンドが正規表現とマッチする場合、そのコメントをフィルタリングする",
        filter: "/big/",
        filteredIds: ["1"],
      },
      {
        name: "コマンドが正規表現とマッチしない場合、そのコメントをフィルタリングしない",
        filter: "/small/",
        filteredIds: [],
      },
    ])("$name", ({ filter, filteredIds }) => {
      assertor.assert(filteredIds, runFilter({ filter }));
    });
  });

  describe(`${CommandsFilter.prototype.apply.name}のstrictOnly引数`, () => {
    it.each([
      {
        name: "falseの場合、strictルール以外を使用してフィルタリングが行われる",
        strictOnly: false,
        filteredIds: ["2"],
        strictData: [],
      },
      {
        name: "trueの場合、strictルールのみを使用してフィルタリングが行われる",
        strictOnly: true,
        filteredIds: [],
        strictData: [{ userId: "user-id-1", context: "comment-commands: big" }],
      },
      {
        name: "trueの場合、ユーザーIDが既存のAutoルールとマッチするコメントに対してはフィルタリングが行われない",
        strictOnly: true,
        filteredIds: [],
        strictData: [],
        settings: {
          autoFilter: [
            { pattern: "user-id-1", target: { commentUserId: true } },
          ],
        },
      },
    ])("$name", ({ strictOnly, filteredIds, strictData, settings }) => {
      const filter = `
@s
big

red
`;
      const commandsFilter = runFilter({ filter, strictOnly, settings });

      assertor.assert(filteredIds, commandsFilter);
      expect(commandsFilter.getStrictData()).toEqual(strictData);
    });

    // https://github.com/nines75/mico/issues/61
    it("trueの場合、コマンドの無効化は行われない", () => {
      const filter = `
@disable
big
`;
      const commandsFilter = runFilter({ filter, strictOnly: true });

      assertor.assert([], commandsFilter);
      expect(hasCommand("big")).toBe(true);
    });
  });

  describe("@disable", () => {
    it("@disableを使用している場合、マッチするコマンドを無効化する", () => {
      const filter = `
@disable
big
`;

      assertor.assert([], runFilter({ filter }));
      expect(hasCommand("big")).toBe(false);
    });

    it("@strictと併用した場合、@strictは無視される", () => {
      const filter = `
@strict
@disable
big
`;

      const strictCommandsFilter = runFilter({ filter, strictOnly: true });
      assertor.assert([], strictCommandsFilter);
      expect(hasCommand("big")).toBe(true);
      expect(strictCommandsFilter.getStrictData()).toEqual([]);

      const commandsFilter = runFilter({ filter });
      assertor.assert([], commandsFilter);
      expect(hasCommand("big")).toBe(false);
    });

    // https://github.com/nines75/mico/issues/31
    it("ルールの順番に関わらず@disableを使用したルールは後から適用される", () => {
      const filter = `
@disable
big
@end

big
`;

      assertor.assert(["1"], runFilter({ filter }));
    });
  });
});
