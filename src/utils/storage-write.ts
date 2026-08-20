// -------------------------------------------------------------------------------------------
// ブラウザ拡張ストレージにはIndexedDBと異なりトランザクションの仕組みが存在しないためWeb Locks APIを使用する
// しかし、このAPIのスコープはオリジンのためcontentから呼び出すと正しく排他制御できない
// そのためこのファイルはcontentからはインポートしない
// https://github.com/nines75/mico/issues/33
// -------------------------------------------------------------------------------------------

import type { Settings } from "@/types/storage/settings.types";
import { getSettings, loadSettings, settingsStorage } from "./storage";
import {
  hasPermission,
  notify,
  sendNativeMessage,
  tryWithPermission,
} from "./browser";
import { type AutoRule } from "@/entrypoints/background/rule";
import type { SetOptional, ValueOf } from "type-fest";
import { objectKeys } from "ts-extras";
import { defaultSettings } from "./config";
import type { Video } from "@/types/api/video.types";
import type { PartialComment } from "@/types/storage/log.types";
import type { Tab } from "@/types/storage/tab.types";
import { BodyFilter } from "@/entrypoints/background/comment-filter/filter/body-filter";
import type { NvComment } from "@/types/api/comment.types";

async function lock(callback: () => Promise<void>) {
  await navigator.locks.request("storage", callback);
}

export async function clearStorage() {
  await lock(async () => {
    // WxtStorage.clear()を使用するとバージョン情報まで消えるため個別で削除する
    // -------------------------------------------------------------------
    // removeValue()を使うと次のアクセス時にイニシャライザが実行されるため、
    // 設定のリセット後すぐに設定を変更したときUIに正しく反映されない。
    // そのためsetValue()を使用し削除ではなく上書きを行う。
    await settingsStorage.setValue({});
  });
}

export async function cleanUpStorage() {
  await lock(async () => {
    const settings = await getSettings();

    const newSettings: Record<string, ValueOf<typeof defaultSettings>> = {};
    const keys = Object.keys(defaultSettings);

    // defaultSettingsに存在するキーのみを抽出
    for (const key of objectKeys(settings)) {
      if (!keys.includes(key)) continue;

      const value = settings[key];
      if (value !== undefined) {
        newSettings[key] = value;
      }
    }

    await settingsStorage.setValue({ ...newSettings, storeId: "" });
  });
}

export async function setSettings(
  value: Partial<Settings> | (() => Promise<Partial<Settings>>),
) {
  await lock(async () => {
    const settings = await getSettings();
    const newSettings = typeof value === "function" ? await value() : value;

    await settingsStorage.setValue({
      ...settings,
      ...newSettings,
      ...(newSettings.storeId === undefined && { storeId: "" }), // storeIdを必ず上書き
    });
  });
}

export async function setSettingsMeta(value: Record<string, unknown>) {
  await lock(async () => {
    await settingsStorage.setMeta(value);
  });
}

export async function migrateSettings() {
  await lock(async () => {
    // migrationはsetSettingsを経由せずに書き込みを行うため、
    // 結果が画面に反映されるようにここでstoreIdを上書きする
    const settings = await getSettings();
    await settingsStorage.setValue({ ...settings, storeId: "" });

    await settingsStorage.migrate();
  });
}

export async function addAutoRule(rules: SetOptional<AutoRule, "id">[]) {
  if (rules.length === 0) return;

  const transaction = async (): Promise<Partial<Settings>> => {
    const settings = await loadSettings();

    return {
      autoFilter: [
        ...rules.map((rule) => {
          return {
            ...rule,
            id: rule.id ?? crypto.randomUUID(),
          } satisfies AutoRule;
        }),
        ...settings.autoFilter,
      ],
    };
  };

  await setSettings(transaction);
}

export async function removeAutoRule(ids: string[]) {
  if (ids.length === 0) return;

  const transaction = async (): Promise<Partial<Settings>> => {
    const settings = await loadSettings();

    return {
      autoFilter: settings.autoFilter.filter(
        ({ id }) => id !== undefined && !ids.includes(id),
      ),
    };
  };

  await setSettings(transaction);
}

export async function addContextToAutoRule(
  data:
    | {
        type: "comment";
        comments: PartialComment[];
        tab: Tab;
        settings: Settings;
      }
    | {
        type: "video";
        videos: Video[];
        settings: Settings;
      },
) {
  if (!data.settings.complementContext) return;

  const transaction = async (): Promise<Partial<Settings>> => {
    const settings = await loadSettings();
    const source = "complement";

    return {
      autoFilter: settings.autoFilter.map((rule) => {
        if (rule.context !== undefined) return rule;

        if (rule.target?.commentUserId === true && data.type === "comment") {
          // strictルールによるフィルタリング時に除外されないようにAutoFilterを空にする
          const bodyFilter = new BodyFilter({ ...settings, autoFilter: [] });
          bodyFilter.filterRules(data.tab);

          const comments = data.comments.filter(
            (comment) => comment.userId === rule.pattern,
          ) as NvComment[];
          const commentCount = comments.length;

          // strictルールによるフィルタリングを優先
          bodyFilter.apply([{ fork: "main", commentCount, comments }], true);

          const strictData = bodyFilter.getStrictData()[0];
          if (strictData === undefined) {
            // strictルールによってフィルタリングされなかった場合は通常のルールを適用
            bodyFilter.apply([{ fork: "main", commentCount, comments }]);

            const filteredComment = bodyFilter.getFilteredComments()[0];
            if (filteredComment !== undefined) {
              return {
                ...rule,
                source,
                context: `comment-body: ${filteredComment.comment.body}`,
              };
            }
          } else {
            return {
              ...rule,
              source,
              context: strictData.context,
            };
          }
        }

        if (rule.target?.videoId === true && data.type === "video") {
          const title = data.videos.find(
            (video) => video.id === rule.pattern,
          )?.title;
          if (title !== undefined) {
            return {
              ...rule,
              source,
              context: `video-title: ${title}`,
            };
          }
        }

        if (rule.target?.videoOwnerId === true && data.type === "video") {
          const ownerName = data.videos.find(
            (video) => video.owner.id === rule.pattern,
          )?.owner.name;
          if (ownerName !== undefined && ownerName !== null) {
            return {
              ...rule,
              source,
              context: `owner-name: ${ownerName}`,
            };
          }
        }

        return rule;
      }),
    };
  };

  await setSettings(transaction);
}

export async function importLocalFilter(type: "load" | "button") {
  // 不要な設定のロードを避けるため最初に権限を確認
  if (!(await hasPermission("nativeMessaging"))) {
    // 本来はSettings.importLocalFilterOnLoadを有効にしているユーザーが
    // 権限を持っていない場合のみ通知したいがロード回避との両立はできない。
    // この設定に関わらず通知を送信すると邪魔になるため送信しない

    // ボタン経由なら設定に関わらず常に通知する
    if (type === "button")
      await notify("以下の権限が必要です\n\nnativeMessaging");

    return;
  }

  // この関数は設定を更新するため、呼び出し元でロードした設定を流用する意味がない
  // なぜならこの関数を呼び出した後に設定を読み込まないと設定の更新が後続の処理に反映されないから
  const settings = await loadSettings();

  // 権限があるか確認する前に設定を確認
  // この機能を使用しないユーザーに余計な通知が行くのを防ぐため
  if (type === "load" && !settings.importLocalFilterOnLoad) return;

  await tryWithPermission("nativeMessaging", async () => {
    if (settings.localFilterPath === "") {
      await notify("パスが設定されていません");
      return;
    }

    const response = await sendNativeMessage({
      type: "importLocalFilter",
      path: settings.localFilterPath,
      shouldCheckWsl: type === "load" && settings.importOnlyWhenWslRunning,
    });

    if (response?.status === "completed") {
      await setSettings(response.data as Partial<Settings>);

      if (type === "button") {
        await notify("ローカルフィルターをインポートしました");
      }
    }
  });
}
