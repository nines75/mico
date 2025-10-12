/**
 * このファイルの関数はbackground以外からは呼び出さない
 */

import { storage } from "#imports";
import { LogData } from "@/types/storage/log.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import PQueue from "p-queue";
import { stringify } from "superjson";
import { PartialDeep } from "type-fest";
import {
    StorageType,
    getLogData,
    getSettingsData,
    customMerge,
    storageArea,
    loadSettings,
} from "./storage.js";
import { getNgUserId } from "@/entrypoints/background/comment-filter/filter/user-id-filter.js";
import { parseFilter } from "@/entrypoints/background/filter.js";
import { pattern, messages } from "./config.js";
import { sendNotification } from "./util.js";

// ストレージへ書き込みをする際、ロストアップデートを避けるためにキューを使用する
const queue = new PQueue({ concurrency: 1 });

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

async function setValue(
    value: object | (() => Promise<object>),
    type: StorageType,
    logId?: string | number,
    tabId?: number,
    isStringify = false,
) {
    await queue.add(async () => {
        if (typeof value === "function") {
            value = await value();
        }

        const data = await (() => {
            if (
                logId !== undefined &&
                tabId !== undefined &&
                type === `log-${logId}`
            ) {
                return getLogData(logId, tabId);
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

export async function setLog(
    value: PartialDeep<LogData> | (() => Promise<PartialDeep<LogData>>),
    logId: string | number,
    tabId: number,
) {
    await setValue(value, `log-${logId}`, logId, tabId, true);
}

export async function setSettings(
    value: Partial<Settings> | (() => Promise<Partial<Settings>>),
) {
    await setValue(value, "settings");
}

export async function addNgUserId(userIds: Set<string>) {
    if (userIds.size === 0) return;

    const str = [...userIds].join("\n");
    const func = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();

        return {
            ngUserId: `${str}\n${settings.ngUserId}`,
        };
    };

    await setSettings(func);
}

export async function removeNgUserId(
    userIds: Set<string>,
    isRemoveSpecific = true,
) {
    if (userIds.size === 0) return;

    const func = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();

        const toRemoveLines = new Set(
            getNgUserId(settings, isRemoveSpecific ? undefined : "")
                .filter((data) => userIds.has(data.rule))
                .map((data) => data.index),
        );
        const value = settings.ngUserId
            .split("\n")
            .filter((_, index) => !toRemoveLines.has(index))
            .join("\n");

        return {
            ngUserId: value,
        };
    };

    await setSettings(func);
}

export async function addNgId(id: string) {
    const func = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();

        return {
            ngId: `${id}\n${settings.ngId}`,
        };
    };

    await setSettings(func);
}

export async function removeNgId(id: string) {
    const func = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();

        const toRemoveLines = new Set(
            parseFilter(settings.ngId)
                .filter((data) => id === data.rule)
                .map((data) => data.index),
        );
        const value = settings.ngId
            .split("\n")
            .filter((_, index) => !toRemoveLines.has(index))
            .join("\n");

        return {
            ngId: value,
        };
    };

    await setSettings(func);
}

export async function addNgIdFromUrl(url: string | undefined) {
    const settings = await loadSettings();
    const id = url?.match(pattern.regex.extractId)?.[1];

    if (id === undefined) {
        await sendNotification(messages.ngId.extractionFailed);
        return;
    }

    await addNgId(id);

    if (settings.isNotifyAddNgId) {
        await sendNotification(
            messages.ngId.additionSuccess.replace("{target}", id),
        );
    }
}

// export async function cleanupStorage() {
//     const [tabs, data] = await Promise.all([
//         browser.tabs.query({}),
//         getAllData(),
//     ]);
//     const aliveTabKeys = new Set(
//         tabs
//             .map((tab) => tab.id)
//             .filter((id) => id !== undefined)
//             .map((id) => `log-${id}`),
//     );

//     const keys: LogType[] = [];
//     for (const key of Object.keys(data)) {
//         if (key.startsWith("log-") && !aliveTabKeys.has(key)) {
//             keys.push(key as LogType);
//         }
//     }

//     await removeData(keys);
// }
