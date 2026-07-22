import { loadSettings } from "@/utils/storage";
import { describe, expect, it } from "vitest";
import {
  addAutoRule,
  addContextToAutoRule,
  removeAutoRule,
  setSettings,
} from "./storage-write";
import { type AutoRule } from "@/entrypoints/background/rule";
import { testTab } from "./test";
import type { Settings } from "@/types/storage/settings.types";
import type { PartialComment } from "@/types/storage/log.types";
import type { Video } from "@/types/api/video.types";

const expectString = expect.any(String) as string;

describe(addAutoRule.name, () => {
  it.each([
    {
      name: "0",
      rules: [],
    },
    {
      name: "1",
      rules: [
        {
          pattern: "rule",
          source: "dropdown",
        },
      ],
    },
    {
      name: "複数",
      rules: [
        {
          pattern: "rule",
          source: "dropdown",
        },
        {
          pattern: "rule",
          source: "contextMenu",
          target: { commentBody: true },
        },
      ],
    },
  ] satisfies { name: string; rules: Parameters<typeof addAutoRule>[0] }[])(
    "ルール数: $name",
    async ({ rules }) => {
      await addAutoRule(rules);

      const settings = await loadSettings();
      expect(settings.autoFilter).toEqual(
        rules.map((rule) => ({
          id: expectString,
          ...rule,
        })),
      );
    },
  );
});

describe(removeAutoRule.name, () => {
  it.each([
    {
      name: "0",
      rules: [],
    },
    {
      name: "1",
      rules: [
        {
          id: "id",
          pattern: "rule",
          source: "dropdown",
        },
      ],
    },
    {
      name: "複数",
      rules: [
        {
          id: "id",
          pattern: "rule",
          source: "dropdown",
        },
        {
          id: "id2",
          pattern: "rule",
          source: "contextMenu",
          target: { commentBody: true },
        },
      ],
    },
  ] satisfies { name: string; rules: AutoRule[] }[])(
    "ルール数: $name",
    async ({ rules }) => {
      await setSettings({ autoFilter: rules });
      await removeAutoRule(rules.map(({ id }) => id));

      const settings = await loadSettings();
      expect(settings.autoFilter).toEqual([]);
    },
  );
});

describe(addContextToAutoRule.name, () => {
  it.each([
    {
      name: "ターゲットが@comment-user-idの場合、コンテキスト情報が補完される",
      settings: {
        manualFilter: `
@comment-body
foo
`,
        autoFilter: [{ pattern: "user-id", target: { commentUserId: true } }],
      },
      data: {
        type: "comment",
        comments: [{ body: "foo-bar", userId: "user-id" }] as PartialComment[],
        tab: testTab,
      },
      expected: [
        {
          pattern: "user-id",
          target: { commentUserId: true },
          source: "complement",
          context: "comment-body: foo-bar",
        },
      ],
    },
    {
      name: "ターゲットが@comment-user-idの場合、strictルールを考慮してコンテキスト情報が補完される",
      settings: {
        manualFilter: `
@comment-body

foo

@strict
bar
`,
        autoFilter: [{ pattern: "user-id", target: { commentUserId: true } }],
      },
      data: {
        type: "comment",
        comments: [
          // どちらのルールが優先されたか確認するために、両方のルールにマッチするコメントを用意する
          { body: "foo", userId: "user-id" },
          { body: "bar", userId: "user-id" },
        ] as PartialComment[],
        tab: testTab,
      },
      expected: [
        {
          pattern: "user-id",
          target: { commentUserId: true },
          source: "complement",
          context: "comment-body: bar",
        },
      ],
    },
    {
      name: "ターゲットが@video-idの場合、コンテキスト情報が補完される",
      settings: {
        autoFilter: [{ pattern: "sm0", target: { videoId: true } }],
      },
      data: {
        type: "video",
        videos: [{ id: "sm0", title: "foo" }] as Video[],
      },
      expected: [
        {
          pattern: "sm0",
          target: { videoId: true },
          source: "complement",
          context: "video-title: foo",
        },
      ],
    },
    {
      name: "ターゲットが@video-owner-idの場合、コンテキスト情報が補完される",
      settings: {
        autoFilter: [{ pattern: "0", target: { videoOwnerId: true } }],
      },
      data: {
        type: "video",
        videos: [{ owner: { id: "0", name: "foo" } }] as Video[],
      },
      expected: [
        {
          pattern: "0",
          target: { videoOwnerId: true },
          source: "complement",
          context: "owner-name: foo",
        },
      ],
    },
    {
      name: "コンテキスト情報が登録済みの場合、コンテキスト情報が補完されない",
      settings: {
        autoFilter: [
          {
            pattern: "0",
            target: { videoOwnerId: true },
            context: "owner-name: bar",
          },
        ],
      },
      data: {
        type: "video",
        videos: [{ owner: { id: "0", name: "foo" } }] as Video[],
      },
      expected: [
        {
          pattern: "0",
          target: { videoOwnerId: true },
          context: "owner-name: bar", // fooに更新されていないことを確認
        },
      ],
    },
  ] satisfies {
    name: string;
    settings: Partial<Settings>;
    data: Parameters<typeof addContextToAutoRule>[0];
    expected: Partial<AutoRule>[];
  }[])("$name", async ({ settings, data, expected }) => {
    await setSettings(settings);
    await addContextToAutoRule(data);

    const newSettings = await loadSettings();
    expect(newSettings.autoFilter).toEqual(expected);
  });
});
