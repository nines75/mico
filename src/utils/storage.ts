import type { Settings } from "../types/storage/settings.types";
import { defaultSettings } from "./config";
import { storage } from "#imports";
import { migrateSettingsToV5 } from "./settings-legacy";
import { catchAsync } from "./util";
import { tryWithPermission, notify, sendNativeMessage } from "./browser";
import type { Backup } from "@/types/storage/backup.types";

export const storageArea = "local";

export async function loadSettings(): Promise<Settings> {
  const settings = await getSettings();

  return { ...defaultSettings, ...settings };
}

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

      await tryWithPermission("nativeMessaging", async () => {
        if (settings.localFilterPath === "") {
          await notify("パスが設定されていません");
          return;
        }

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

export async function getSettings() {
  return await settingsStorage.getValue();
}

export async function getSettingsMeta() {
  return await settingsStorage.getMeta();
}

export async function saveBackup(type: "startup" | "button") {
  const settings = await loadSettings();
  if (type === "startup" && !settings.saveBackupOnStartup) return;

  const [rawSettings, meta] = await Promise.all([
    getSettings(),
    getSettingsMeta(),
  ]);
  const { manualFilter, ...rawSettingsWithoutManualFilter } = rawSettings;

  await tryWithPermission("nativeMessaging", async () => {
    if (settings.backupPath === "") {
      await notify("パスが設定されていません");
      return;
    }

    const backup: Required<Backup> = {
      settings: settings.saveBackupWithoutManualFilter
        ? rawSettingsWithoutManualFilter
        : rawSettings,
      settingsMeta: meta,
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
