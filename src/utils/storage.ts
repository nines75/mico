import type { Settings } from "../types/storage/settings.types.js";
import { defaultSettings } from "./config.js";
import { storage } from "#imports";
import {
    migrateSettingsToV3,
    migrateSettingsToV2,
} from "@/types/storage/settings-legacy.types.js";
import { customMerge } from "./util.js";

export const storageArea = "local";

export async function loadSettings(settings?: Partial<Settings>) {
    const data = settings ?? (await getSettingsData());
    if (data === null) return defaultSettings;

    return customMerge(defaultSettings, data) as Settings;
}

export async function getAllData() {
    return await storage.snapshot(storageArea);
}

const settingsStorage = storage.defineItem<Partial<Settings>>(
    `${storageArea}:settings`,
    {
        version: 3,
        // TODO: しばらくしたら消す
        migrations: {
            2: migrateSettingsToV2,
            3: migrateSettingsToV3,
        },
    },
);

export async function getSettingsData() {
    return await settingsStorage.getValue();
}
