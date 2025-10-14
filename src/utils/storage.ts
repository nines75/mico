import { Settings } from "../types/storage/settings.types.js";
import { deepmergeCustom, type DeepMergeLeafURI } from "deepmerge-ts";
import { defaultSettings } from "./config.js";
import { storage } from "#imports";

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

const settingsStorage = storage.defineItem<Partial<Settings> | null>(
    `${storageArea}:settings`,
);

export async function getSettingsData() {
    const res = await settingsStorage.getValue();

    return res ?? undefined;
}
