import { getSettings, loadSettings } from "@/utils/storage";
import { describe, expect, it } from "vitest";
import {
  addAutoRule,
  addContextToCommentRule,
  addContextToVideoRule,
  cleanUpStorage,
  clearStorage,
  removeAutoRule,
  setSettings,
} from "./storage-write";
import { type AutoRule } from "@/entrypoints/background/rule";
import { expectString, testTab } from "./test";
import type { Settings } from "@/types/storage/settings.types";
import type { PartialComment } from "@/types/storage/log.types";
import type { Video } from "@/types/api/video.types";

describe(clearStorage.name, () => {
  it("設定に空のオブジェクトが保存される", async () => {
    await setSettings({ enableCommentFilter: true });
    await clearStorage();

    expect(await getSettings()).toEqual({});
  });
});

describe(cleanUpStorage.name, () => {
  it("設定に存在しないキーがある場合、削除される", async () => {
    await setSettings({ foo: true } as Partial<Settings>);
    await cleanUpStorage();

    expect(await getSettings()).toEqual({ storeId: "" });
  });

  it("設定に存在しないキーがない場合、設定は変化しない", async () => {
    await setSettings({ enableCommentFilter: true });
    await cleanUpStorage();

    expect(await getSettings()).toEqual({
      enableCommentFilter: true,
      storeId: "",
    });
  });
});

describe(setSettings.name, () => {
  it("設定を渡した場合、保存される", async () => {
    await setSettings({ enableCommentFilter: true });

    expect(await getSettings()).toEqual({
      enableCommentFilter: true,
      storeId: "",
    });
  });

  it("設定を返す関数を渡した場合、その関数の戻り値が保存される", async () => {
    // eslint-disable-next-line @typescript-eslint/require-await
    await setSettings(async () => {
      return { enableCommentFilter: true };
    });

    expect(await getSettings()).toEqual({
      enableCommentFilter: true,
      storeId: "",
    });
  });
});

describe(addAutoRule.name, () => {
  it("Autoルールを渡した場合、保存される", async () => {
    await addAutoRule([{ pattern: "rule", source: "dropdown" }]);

    const settings = await loadSettings();
    expect(settings.autoFilter).toEqual([
      { id: expectString, pattern: "rule", source: "dropdown" },
    ]);
  });
});

describe(removeAutoRule.name, () => {
  it("保存されているルールID渡した場合、そのルールが削除される", async () => {
    await setSettings({
      autoFilter: [{ id: "id", pattern: "rule", source: "dropdown" }],
    });
    await removeAutoRule(["id"]);

    const settings = await loadSettings();
    expect(settings.autoFilter).toEqual([]);
  });

  it("保存されていないルールID渡した場合、設定は変化しない", async () => {
    const rules = [{ id: "id", pattern: "rule", source: "dropdown" as const }];

    await setSettings({ autoFilter: rules });
    await removeAutoRule(["id2"]);

    const settings = await loadSettings();
    expect(settings.autoFilter).toEqual(rules);
  });
});

describe(addContextToCommentRule.name, () => {
  it.each([
    {
      name: "対象のコメントにマッチするManualルールがある場合、コンテキスト情報が補完される",
      settings: {
        manualFilter: `
@comment-body
foo
`,
        autoFilter: [{ pattern: "user-id", target: { commentUserId: true } }],
      },
      comments: [{ body: "foo-bar", userId: "user-id" }], // bodyをfooにするとルールと区別がつかないためfoo-barにする
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
      name: "strictルールが存在する場合、優先してコンテキスト情報の補完に使用される",
      settings: {
        manualFilter: `
@comment-body

foo

@strict
bar
`,
        autoFilter: [{ pattern: "user-id", target: { commentUserId: true } }],
      },
      comments: [
        // どちらのルールが優先されたか確認するために、両方のルールにマッチするコメントを用意する
        { body: "foo", userId: "user-id" },
        { body: "bar", userId: "user-id" },
      ],
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
      name: "コンテキスト情報が登録済みの場合、コンテキスト情報が補完されない",
      settings: {
        manualFilter: `
@comment-body
foo
`,
        autoFilter: [
          {
            pattern: "user-id",
            target: { commentUserId: true },
            context: "baz",
          },
        ],
      },
      comments: [{ body: "foo-bar", userId: "user-id" }],
      expected: [
        {
          pattern: "user-id",
          target: { commentUserId: true },
          context: "baz", // foo-barに更新されていないことを確認
        },
      ],
    },
    {
      name: "設定が無効になっている場合、コンテキスト情報が補完されない",
      settings: {
        complementContext: false,
        manualFilter: `
@comment-body
foo
`,
        autoFilter: [{ pattern: "user-id", target: { commentUserId: true } }],
      },
      comments: [{ body: "foo-bar", userId: "user-id" }],
      expected: [{ pattern: "user-id", target: { commentUserId: true } }],
    },
  ] satisfies {
    name: string;
    settings: Partial<Settings>;
    comments: Partial<PartialComment>[];
    expected: Partial<AutoRule>[];
  }[])("$name", async ({ settings, comments, expected }) => {
    await setSettings(settings);
    await addContextToCommentRule(comments as PartialComment[], testTab, {
      complementContext: true,
      ...settings,
    } as Settings);

    const newSettings = await loadSettings();
    expect(newSettings.autoFilter).toEqual(expected);
  });
});

describe(addContextToVideoRule.name, () => {
  it.each([
    {
      name: "ターゲットが@video-idのAutoルールにマッチする動画がある場合、コンテキスト情報が補完される",
      settings: {
        autoFilter: [{ pattern: "sm0", target: { videoId: true } }],
      },
      videos: [{ id: "sm0", title: "foo" }],
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
      name: "ターゲットが@video-owner-idのAutoルールにマッチする動画がある場合、コンテキスト情報が補完される",
      settings: {
        autoFilter: [{ pattern: "0", target: { videoOwnerId: true } }],
      },
      videos: [{ owner: { id: "0", name: "foo" } }],
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
      videos: [{ owner: { id: "0", name: "foo" } }],
      expected: [
        {
          pattern: "0",
          target: { videoOwnerId: true },
          context: "owner-name: bar", // fooに更新されていないことを確認
        },
      ],
    },
    {
      name: "設定が無効になっている場合、コンテキスト情報が補完されない",
      settings: {
        complementContext: false,
        autoFilter: [{ pattern: "0", target: { videoOwnerId: true } }],
      },
      videos: [{ owner: { id: "0", name: "foo" } }],
      expected: [{ pattern: "0", target: { videoOwnerId: true } }],
    },
  ] satisfies {
    name: string;
    settings: Partial<Settings>;
    videos: Partial<Video>[];
    expected: Partial<AutoRule>[];
  }[])("$name", async ({ settings, videos, expected }) => {
    await setSettings(settings);
    await addContextToVideoRule(
      videos as Video[],
      { complementContext: true, ...settings } as Settings,
    );

    const newSettings = await loadSettings();
    expect(newSettings.autoFilter).toEqual(expected);
  });
});
