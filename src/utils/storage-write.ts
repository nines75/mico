// -------------------------------------------------------------------------------------------
// このファイルの関数はbackground以外からは呼び出さない
// https://github.com/nines75/mico/issues/33
// -------------------------------------------------------------------------------------------

import { storage } from "#imports";
import type { Settings } from "@/types/storage/settings.types";
import PQueue from "p-queue";
import { getSettingsData, storageArea, loadSettings } from "./storage";
import { parseNgUserId } from "@/entrypoints/background/comment-filter/filter/user-id-filter";
import { parseFilter } from "@/entrypoints/background/parse-filter";
import { messages } from "./config";
import { customMerge, replace } from "./util";
import { clearDb } from "./db";
import { sendNotification } from "./browser";

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

export async function addNgUserId(userIds: string[]) {
    if (userIds.length === 0) return;

    const filter = userIds.join("\n");
    const transaction = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();

        return {
            ngUserId: `${filter}\n${settings.ngUserId}`,
        };
    };

    await setSettings(transaction);
}

export async function removeNgUserId(
    userIds: string[],
    isRemoveSpecific = true,
) {
    if (userIds.length === 0) return;

    const transaction = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();

        const removeLines = parseNgUserId(settings, isRemoveSpecific)
            .filter(({ rule }) => userIds.includes(rule.toString()))
            .map(({ index }) => index as number);
        const lines = settings.ngUserId.split("\n");

        // 自動追加された行の削除判定
        // ループ内で変更するため新しい配列を作る
        removeLines.forEach((index) => {
            const before1 = index - 1;
            const before2 = index - 2;
            const after = index + 1;

            // コンテキスト
            if (
                lines[before1]?.startsWith("# ") === true &&
                lines[after] === ""
            ) {
                removeLines.push(before1, after);
            }
            // コンテキスト + @v
            else if (
                lines[before2]?.startsWith("# ") === true &&
                lines[before1]?.startsWith("@v ") === true &&
                lines[after] === ""
            ) {
                removeLines.push(before2, before1, after);
            }
            // @v
            else if (lines[before1]?.startsWith("@v ") === true) {
                removeLines.push(before1);
            }
        });

        return {
            ngUserId: lines
                .filter((_, index) => !removeLines.includes(index))
                .join("\n"),
        };
    };

    await setSettings(transaction);
}

export async function addNgId(id: string) {
    const transaction = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();

        return {
            ngId: `${id}\n${settings.ngId}`,
        };
    };

    await setSettings(transaction);
}

export async function removeNgId(id: string) {
    const transaction = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();

        const removeLines = parseFilter(settings.ngId, true)
            .rules.filter(({ rule }) => rule === id)
            .map(({ index }) => index as number);
        const lines = settings.ngId.split("\n");

        // ループ内で変更するため新しい配列を作る
        removeLines.forEach((index) => {
            const before = index - 1;
            const after = index + 1;

            // コンテキスト
            if (
                lines[before]?.startsWith("# ") === true &&
                lines[after] === ""
            ) {
                removeLines.push(before, after);
            }
        });

        return {
            ngId: lines
                .filter((_, index) => !removeLines.includes(index))
                .join("\n"),
        };
    };

    await setSettings(transaction);
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
