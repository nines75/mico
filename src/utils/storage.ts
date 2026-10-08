import type { Settings } from "../types/storage/settings.types";
import { defaultSettings } from "./config";
import { storage } from "#imports";
import { migrateSettingsToV5 } from "./settings-legacy";

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
