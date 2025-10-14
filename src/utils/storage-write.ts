/**
 * このファイルの関数はbackground以外からは呼び出さない
 */

import { storage } from "#imports";
import { Settings } from "@/types/storage/settings.types.js";
import PQueue from "p-queue";
import {
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

export async function setSettings(
    value: Partial<Settings> | (() => Promise<Partial<Settings>>),
) {
    await queue.add(async () => {
        if (typeof value === "function") {
            value = await value();
        }

        const settings = await getSettingsData();
        const newSettings = customMerge(settings, value);

        await storage.setItem(`${storageArea}:settings`, newSettings);
    });
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
