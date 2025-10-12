import { LogData } from "../types/storage/log.types.js";
import { Settings } from "../types/storage/settings.types.js";
import { deepmergeCustom, type DeepMergeLeafURI } from "deepmerge-ts";
import { defaultSettings } from "./config.js";
import { storage } from "#imports";
import { parse } from "superjson";

export type LogType = `log-${string}`;
export type StorageType = LogType | "settings";

export const storageArea = "local";

export const customMerge = deepmergeCustom<
    unknown,
    {
        DeepMergeArraysURI: DeepMergeLeafURI;
        DeepMergeMapsURI: DeepMergeLeafURI;
        DeepMergeSetsURI: DeepMergeLeafURI;
    }
>({
    // マージではなく上書きするように変更
    mergeArrays: false,
    mergeMaps: false,
    mergeSets: false,
});

export async function loadSettings(settings?: Partial<Settings>) {
    const data = settings ?? (await getSettingsData());
    return customMerge(defaultSettings, data) as Settings;
}

export async function getAllData() {
    return await storage.snapshot(storageArea);
}

export async function getLogData(
    logId: string | number,
    tabId: number,
    log?: string,
) {
    const key: StorageType = `log-${logId}` as const;
    const res = log ?? (await storage.getItem<string>(`${storageArea}:${key}`));

    return res === null ? undefined : parse<LogData>(res);
}

const settingsStorage = storage.defineItem<Partial<Settings> | null>(
    `${storageArea}:${"settings" satisfies StorageType}`,
);

export async function getSettingsData() {
    const res = await settingsStorage.getValue();

    return res ?? undefined;
}
