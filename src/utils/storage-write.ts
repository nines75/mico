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

export async function importLocalFilter(isManual = false) {
  // 不要な設定のロードを避けるため最初に権限を確認
  if (!(await hasPermission("nativeMessaging"))) return;

  // この関数は設定を更新するため、呼び出し元でロードした設定を流用できない
  const settings = await loadSettings();

  // 権限があるか確認する前に設定を確認
  // この機能を使用しないユーザーに余計な通知が行くのを防ぐため
  if (!isManual && !settings.importLocalFilterOnLoad) return;

  await tryWithPermission("nativeMessaging", async () => {
    if (settings.localFilterPath === "") {
      await notify("パスが設定されていません");
      return;
    }

    const response = (await browser.runtime.sendNativeMessage("mico.native", {
      path: settings.localFilterPath,
      shouldCheckWsl: !isManual && settings.importOnlyWhenWslRunning,
    })) as { settings?: Partial<Settings> };

    // キャンセルされた場合
    if (response.settings === undefined) return;

    // ファイルが見つからなかった場合
    if (Object.keys(response.settings).length === 0) {
      await notify("ローカルフィルターが見つかりませんでした");
      return;
    }

    await setSettings(response.settings);

    if (isManual) {
      await notify("ローカルフィルターをインポートしました");
    }
  });
}
