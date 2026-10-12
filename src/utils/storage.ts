import type { Settings } from "../types/storage/settings.types";
import { defaultSettings } from "./config";
import { storage } from "#imports";
import { migrateSettingsToV5 } from "./settings-legacy";
import { catchAsync } from "./util";
import { withPermission, notify, sendNativeMessage } from "./browser";
import type { Backup } from "@/types/storage/backup.types";

// -------------------------------------------------------------------------------------------
// ストレージ定義
// -------------------------------------------------------------------------------------------

export const storageArea = "local";

export const settingsStorage = storage.defineItem<Partial<Settings>>(
  `${storageArea}:settings`,
  {
    version: 5,
    migrations: {
      5: migrateSettingsToV5,
    },
    onMigrationComplete: catchAsync(async () => {
      const settings = await loadSettings();
      if (!settings.updateLocalFilterOnMigration) return;

      await withPermission("nativeMessaging", async () => {
        const response = await sendNativeMessage({
          type: "updateLocalFilter",
          path: settings.localFilterPath,
          filter: settings.manualFilter,
        });

        if (response?.status === "completed") {
          await notify("ローカルフィルターを更新しました");
        }
      });
    }),
    // インストール直後など値がない状態で設定を開いたとき、
    // migrationは値が保存されてから初めて再読み込みした際に実行されるため
    // インポート含めそこで書き込んだ値が次の読み込み時にmigrationによって消えることがある
    // そのためイニシャライザを設定することで、値がありバージョンが最新であることが常に保証されるようにして
    // 余計なmigrationの実行を防ぐ
    init: () => {
      return {};
    },
  },
);

// -------------------------------------------------------------------------------------------
// 読み取りを行う汎用的な関数
// -------------------------------------------------------------------------------------------

export async function getSettings() {
  return await settingsStorage.getValue();
}

export async function getSettingsMeta() {
  return await settingsStorage.getMeta();
}

export async function loadSettings(): Promise<Settings> {
  const settings = await getSettings();

  return { ...defaultSettings, ...settings };
}

// -------------------------------------------------------------------------------------------
// その他
// -------------------------------------------------------------------------------------------

// browser.tsに置くと循環参照が発生する
export async function saveBackup(type: "startup" | "button") {
  const settings = await loadSettings();
  if (type === "startup" && !settings.saveBackupOnStartup) return;

  const [rawSettings, settingsMeta] = await Promise.all([
    getSettings(),
    getSettingsMeta(),
  ]);
  const { manualFilter, ...rawSettingsWithoutManualFilter } = rawSettings;

  await withPermission("nativeMessaging", async () => {
    const backup: Required<Backup> = {
      settings: settings.saveBackupWithoutManualFilter
        ? rawSettingsWithoutManualFilter
        : rawSettings,
      settingsMeta,
    };

    const response = await sendNativeMessage({
      type: "saveBackup",
      path: settings.backupPath,
      shouldCheckInterval:
        type === "startup" && settings.saveBackupOnlyAfterInterval,
      intervalThreshold: settings.backupIntervalThreshold,
      backup,
    });

    if (type === "button" && response?.status === "completed") {
      await notify("バックアップを保存しました");
    }
  });
}
