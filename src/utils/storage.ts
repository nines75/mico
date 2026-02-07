import type { Settings } from "../types/storage/settings.types";
import { defaultSettings } from "./config";
import { storage } from "#imports";
import { migrateSettingsToV3 } from "@/types/storage/settings-legacy.types";

export const storageArea = "local";

export async function loadSettings() {
    const settings = await getSettingsData();
    if (settings === null) return defaultSettings;

    return { ...defaultSettings, ...settings };
}

const settingsStorage = storage.defineItem<Partial<Settings>>(
    `${storageArea}:settings`,
    {
        version: 3,
        // TODO: しばらくしたら消す
        migrations: {
            3: migrateSettingsToV3,
        },
    },
);

export async function getSettingsData() {
    return await settingsStorage.getValue();
}
