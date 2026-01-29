import type { Settings } from "../types/storage/settings.types";
import { defaultSettings } from "./config";
import { storage } from "#imports";
import { migrateSettingsToV3 } from "@/types/storage/settings-legacy.types";
import { customMerge } from "./util";

export const storageArea = "local";

export async function loadSettings() {
    const data = await getSettingsData();
    if (data === null) return defaultSettings;

    return customMerge(defaultSettings, data) as Settings;
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
