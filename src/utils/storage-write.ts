// -------------------------------------------------------------------------------------------
// このファイルの関数はbackground以外からは呼び出さない
// https://github.com/nines75/mico/issues/33
// -------------------------------------------------------------------------------------------

import { storage } from "#imports";
import type { Settings } from "@/types/storage/settings.types.js";
import PQueue from "p-queue";
import { getSettingsData, storageArea, loadSettings } from "./storage.js";
import { parseNgUserId } from "@/entrypoints/background/comment-filter/filter/user-id-filter.js";
import { parseFilter } from "@/entrypoints/background/parse-filter.js";
import { messages } from "./config.js";
import { customMerge, replace, sendNotification } from "./util.js";
import { clearDb } from "./db.js";

// ストレージへ書き込みをする際、ロストアップデートを避けるためにキューを使用する
const queue = new PQueue({ concurrency: 1 });

export async function removeAllData() {
    await Promise.all([
        queue.add(async () => {
            // すべてのデータを削除するとバージョン情報まで消えるため単体で削除
            await storage.removeItem(`${storageArea}:settings`);
        }),
        clearDb(),
    ]);
}

export async function removeData(keys: string[]) {
    await queue.add(async () => {
        const target = keys.map((key) => `${storageArea}:${key}` as const);

        await storage.removeItems(target);
    });
}

export async function setSettings(
    value: Partial<Settings> | (() => Promise<Partial<Settings>>),
) {
    await queue.add(async () => {
        const settings = await getSettingsData();
        const newSettings = customMerge(
            settings,
            typeof value === "function" ? await value() : value,
        );

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

        const removeLines = new Set(
            parseNgUserId(settings, isRemoveSpecific)
                .filter(({ rule }) => userIds.has(rule.toString()))
                .map(({ index }) => index as number),
        );
        const lines = settings.ngUserId.split("\n");

        // 自動追加された行の削除判定
        removeLines.forEach((index) => {
            const before1 = index - 1;
            const before2 = index - 2;
            const after = index + 1;

            // コンテキスト
            if (
                lines[before1]?.startsWith("# ") === true &&
                lines[after] === ""
            ) {
                removeLines.add(before1);
                removeLines.add(after);
            }
            // コンテキスト + @v
            else if (
                lines[before2]?.startsWith("# ") === true &&
                lines[before1]?.startsWith("@v ") === true &&
                lines[after] === ""
            ) {
                removeLines.add(before2);
                removeLines.add(before1);
                removeLines.add(after);
            }
            // @v
            else if (lines[before1]?.startsWith("@v ") === true) {
                removeLines.add(before1);
            }
        });

        return {
            ngUserId: lines
                .filter((_, index) => !removeLines.has(index))
                .join("\n"),
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

        const removeLines = new Set(
            parseFilter(settings.ngId, true)
                .rules.filter(({ rule }) => rule === id)
                .map(({ index }) => index as number),
        );
        const lines = settings.ngId.split("\n");

        removeLines.forEach((index) => {
            const before = index - 1;
            const after = index + 1;

            // コンテキスト
            if (
                lines[before]?.startsWith("# ") === true &&
                lines[after] === ""
            ) {
                removeLines.add(before);
                removeLines.add(after);
            }
        });

        return {
            ngId: lines
                .filter((_, index) => !removeLines.has(index))
                .join("\n"),
        };
    };

    await setSettings(func);
}

export async function addNgIdFromUrl(url: string | undefined) {
    const settings = await loadSettings();
    const id = url?.match(
        /^https:\/\/(?:www\.nicovideo\.jp\/user|www\.nicovideo\.jp\/watch|ch\.nicovideo\.jp\/channel)\/([^?]+)/,
    )?.[1];

    if (id === undefined) {
        await sendNotification(messages.ngId.extractionFailed);
        return;
    }

    await addNgId(id);

    if (settings.isNotifyAddNgId) {
        await sendNotification(replace(messages.ngId.additionSuccess, [id]));
    }
}
