import PQueue from "p-queue";
import { LogData } from "../types/storage/log.types.js";
import { Settings } from "../types/storage/settings.types.js";
import { deepmergeCustom, type DeepMergeLeafURI } from "deepmerge-ts";
import { PartialDeep } from "type-fest";
import { defaultSettings } from "./config.js";
import { storage } from "#imports";
import { stringify, parse } from "superjson";

export type LogType = `log-${number}`;
export type StorageType = LogType | "settings";

const storageArea = "local";

// ストレージへ書き込みをする際、データの整合性を保つためにキューを使用する
const queue = new PQueue({ concurrency: 1 });

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

export async function loadSettings() {
    const data = await getSettingsData();
    return customMerge(defaultSettings, data) as Settings;
}

export async function removeAllData() {
    await queue.add(async () => {
        await storage.clear(storageArea);
    });
}

export async function removeData(type: StorageType[]) {
    await queue.add(async () => {
        const keys = type.map((key) => `${storageArea}:${key}` as const);

        await storage.removeItems(keys);
    });
}

export async function getAllData() {
    return await storage.snapshot(storageArea);
}

async function setValue(
    value: object | (() => Promise<object>),
    type: StorageType,
    tabId?: number,
    isStringify = false,
) {
    await queue.add(async () => {
        if (typeof value === "function") {
            value = await value();
        }

        const data = await (() => {
            if (tabId !== undefined && type === `log-${tabId}`) {
                return getLogData(tabId);
            }
            if (type === "settings") {
                return getSettingsData();
            }
        })();
        const mergedValue = customMerge(data, value);

        await storage.setItem(
            `${storageArea}:${type}`,
            isStringify ? stringify(mergedValue) : mergedValue,
        );
    });
}

export async function getLogData(tabId: number) {
    const key: StorageType = `log-${tabId}` as const;
    const res = await storage.getItem<string>(`${storageArea}:${key}`);

    return res === null ? undefined : parse<LogData>(res);
}

export async function setLog(
    value: PartialDeep<LogData> | (() => Promise<PartialDeep<LogData>>),
    tabId: number,
) {
    await setValue(value, `log-${tabId}`, tabId, true);
}

const settingsStorage = storage.defineItem<PartialDeep<Settings> | null>(
    `${storageArea}:${"settings" satisfies StorageType}`,
);

export async function getSettingsData() {
    const res = await settingsStorage.getValue();

    return res ?? undefined;
}

export async function setSettings(
    value: PartialDeep<Settings> | (() => Promise<PartialDeep<Settings>>),
) {
    await setValue(value, "settings");
}
