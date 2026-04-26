import type { Settings } from "../types/storage/settings.types";
import { defaultSettings } from "./config";
import { storage } from "#imports";
import { migrateSettingsToV4 } from "./settings-legacy";

export const storageArea = "local";

export async function loadSettings() {
    const settings = await getSettings();
    if (settings === null) return defaultSettings;

    return { ...defaultSettings, ...settings };
}

const settingsStorage = storage.defineItem<Partial<Settings>>(
    `${storageArea}:settings`,
    {
        version: 4,
        // TODO: しばらくしたら消す
        migrations: {
            4: migrateSettingsToV4,
        },
    },
);

export async function getSettings() {
    return await settingsStorage.getValue();
}
