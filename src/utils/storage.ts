import { Settings } from "../types/storage/settings.types.js";
import {
    deepmergeCustom,
    type DeepMergeLeafURI,
    type DeepMergeNoFilteringURI,
} from "deepmerge-ts";
import { defaultSettings } from "./config.js";
import { storage } from "#imports";

export const storageArea = "local";

export const customMerge = deepmergeCustom<
    unknown,
    {
        DeepMergeArraysURI: DeepMergeLeafURI;
        DeepMergeMapsURI: DeepMergeLeafURI;
        DeepMergeSetsURI: DeepMergeLeafURI;
        DeepMergeFilterValuesURI: DeepMergeNoFilteringURI;
    }
>({
    // マージではなく上書きする
    mergeArrays: false,
    mergeMaps: false,
    mergeSets: false,

    // 値がundefinedでも上書きする
    filterValues: false,
});

export async function loadSettings(settings?: Partial<Settings>) {
    const data = settings ?? (await getSettingsData());
    if (data === undefined) return defaultSettings;

    return customMerge(defaultSettings, data) as Settings;
}

export async function getAllData() {
    return await storage.snapshot(storageArea);
}

const settingsStorage = storage.defineItem<Partial<Settings> | null>(
    `${storageArea}:settings`,
);

export async function getSettingsData() {
    const res = await settingsStorage.getValue();

    return res ?? undefined;
}
