// -------------------------------------------------------------------------------------------
// ブラウザ拡張ストレージにはIndexedDBと異なりトランザクションの仕組みが存在しない。
// そのためロストアップデートを避けるために全ての書き込みは単一のqueueを通して行うようにしたいが、
// options_uiなど別のコンテキストからこのファイルをインポートすると複数のqueueが生成されてしまうため、
// このファイルはbackground以外からはインポートしない
// https://github.com/nines75/mico/issues/33
// -------------------------------------------------------------------------------------------

import type { Settings } from "@/types/storage/settings.types";
import PQueue from "p-queue";
import { getSettings, loadSettings, settingsStorage } from "./storage";
import { cleanUpDb, clearDb, getLog } from "./db";
import {
  getActiveTab,
  hasPermission,
  notify,
  sendNativeMessage,
  tryWithPermission,
} from "./browser";
import type { AutoRule } from "@/entrypoints/background/rule";
import type { SetOptional, ValueOf } from "type-fest";
import { getLogIdViaMessage } from "./messaging";
import { isString } from "./util";
import { objectKeys } from "ts-extras";
import { defaultSettings } from "./config";

const queue = new PQueue({ concurrency: 1 });

export async function reset() {
  await Promise.all([
    queue.add(async () => {
      // clear()を使用するとバージョン情報まで消えるため個別で削除
      // -----------------------------------------------------------
      // removeItem()を使うと次のアクセス時にイニシャライザが実行されるため、
      // 設定のリセット後すぐに設定を変更したときUIに正しく反映されない。
      // そのためsetItem()を使用し削除ではなく上書きを行う
      await settingsStorage.setValue({});
    }),
    clearDb(),
  ]);
}

export async function cleanUp() {
  await Promise.all([
    queue.add(async () => {
      const settings = await getSettings();

      const newSettings: Record<string, ValueOf<typeof defaultSettings>> = {};
      const keys = Object.keys(defaultSettings);

      // defaultSettingsに存在するキーのみを抽出
      for (const key of objectKeys(settings)) {
        if (keys.includes(key)) {
          const value = settings[key];

          if (value !== undefined) {
            newSettings[key] = value;
          }
        }
      }

      await settingsStorage.setValue({ ...newSettings, storeId: "" });
    }),
    cleanUpDb(),
  ]);
}

export async function setSettings(
  value: Partial<Settings> | (() => Promise<Partial<Settings>>),
) {
  await queue.add(async () => {
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
  await queue.add(async () => {
    await settingsStorage.setMeta(value);
  });
}

export async function migrateSettings() {
  await queue.add(async () => {
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

export async function addRuleFromUrl(url: string | undefined, memo?: string) {
  const settings = await loadSettings();

  const tab = await getActiveTab();
  const logId = await getLogIdViaMessage(tab?.id);
  const log = logId === undefined ? undefined : await getLog(logId);

  const videoId = url?.match(
    /^https:\/\/www\.nicovideo\.jp\/watch\/([^?]+)/,
  )?.[1];
  if (videoId !== undefined) {
    const videoTitle = log?.video?.allVideos.find(
      (video) => video.id === videoId,
    )?.title;

    await addAutoRule([
      {
        pattern: videoId,
        source: "contextMenu",
        target: { videoId: true },
        ...(videoTitle !== undefined && {
          context: `video-title: ${videoTitle}`,
        }),
        ...(memo !== undefined && memo !== "" && { memo }),
      },
    ]);

    if (settings.notifyOnManualNg) {
      const context = videoTitle === undefined ? "" : ` (${videoTitle})`;

      await notify(`以下の動画IDをNG登録しました\n\n${videoId}${context}`);
    }

    return;
  }

  const ownerId = url?.match(
    /^https:\/\/(?:www\.nicovideo\.jp\/user|ch\.nicovideo\.jp\/channel)\/([^?]+)/,
  )?.[1];
  if (ownerId !== undefined) {
    const ownerName = log?.video?.allVideos.find(
      (video) => video.owner.id === ownerId,
    )?.owner.name;

    await addAutoRule([
      {
        pattern: ownerId,
        source: "contextMenu",
        target: { videoOwnerId: true },
        ...(isString(ownerName) && { context: `owner-name: ${ownerName}` }),
        ...(memo !== undefined && memo !== "" && { memo }),
      },
    ]);

    if (settings.notifyOnManualNg) {
      const context = isString(ownerName) ? ` (${ownerName})` : "";

      await notify(`以下のユーザーIDをNG登録しました\n\n${ownerId}${context}`);
    }

    return;
  }

  await notify("NG登録に失敗しました");
}

export async function importLocalFilter(type: "load" | "shortcut") {
  // 不要な設定のロードを避けるため最初に権限を確認
  if (!(await hasPermission("nativeMessaging"))) {
    // 本来はSettings.importLocalFilterOnLoadを有効にしているユーザーが
    // 権限を持っていない場合のみ通知したいがロード回避との両立はできない。
    // この設定に関わらず通知を送信すると邪魔になるため送信しない

    // ショートカット経由なら設定に関わらず常に通知する
    if (type === "shortcut")
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

      if (type === "shortcut") {
        await notify("ローカルフィルターをインポートしました");
      }
    }
  });
}
