// -------------------------------------------------------------------------------------------
// このファイルの関数はbackground以外からは呼び出さない
// https://github.com/nines75/mico/issues/33
// -------------------------------------------------------------------------------------------

import { storage } from "#imports";
import type { Settings } from "@/types/storage/settings.types";
import PQueue from "p-queue";
import { getSettingsData, storageArea, loadSettings } from "./storage";
import { messages } from "./config";
import { clearDb } from "./db";
import { sendNotification, tryWithPermission } from "./browser";
import type { AutoRule } from "@/entrypoints/background/rule";
import type { SetOptional } from "type-fest";

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

export async function setSettings(
    value: Partial<Settings> | (() => Promise<Partial<Settings>>),
) {
    await queue.add(async () => {
        const settings = await getSettingsData();
        const newSettings = {
            ...settings,
            ...(typeof value === "function" ? await value() : value),
        };

        await storage.setItem(`${storageArea}:settings`, newSettings);
    });
}

export async function addAutoRule(rules: SetOptional<AutoRule, "id">[]) {
    if (rules.length === 0) return;

    const transaction = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();

        return {
            autoFilter: [
                ...rules.map((rule) => {
                    return {
                        ...rule,
                        id: rule.id ?? crypto.randomUUID(),
                    } satisfies AutoRule;
                }),
                ...settings.autoFilter,
            ],
        };
    };

    await setSettings(transaction);
}

export async function removeAutoRule(ids: string[]) {
    if (ids.length === 0) return;

    const transaction = async (): Promise<Partial<Settings>> => {
        const settings = await loadSettings();

        return {
            autoFilter: settings.autoFilter.filter(
                ({ id }) => id !== undefined && !ids.includes(id),
            ),
        };
    };

    await setSettings(transaction);
}

export async function addNgIdFromUrl(url: string | undefined) {
    const settings = await loadSettings();

    const videoId = url?.match(
        /^https:\/\/www\.nicovideo\.jp\/watch\/([^?]+)/,
    )?.[1];
    if (videoId !== undefined) {
        await addAutoRule([
            {
                pattern: videoId,
                source: "contextMenu",
                target: { videoId: true },
            },
        ]);

        if (settings.isNotifyAddNgId) {
            await sendNotification(
                `以下の動画IDをNG登録しました\n\n${videoId}`,
            );
        }

        return;
    }

    const userId = url?.match(
        /^https:\/\/(?:www\.nicovideo\.jp\/user|ch\.nicovideo\.jp\/channel)\/([^?]+)/,
    )?.[1];
    if (userId !== undefined) {
        await addAutoRule([
            {
                pattern: userId,
                source: "contextMenu",
                target: { videoOwnerId: true },
            },
        ]);

        if (settings.isNotifyAddNgId) {
            await sendNotification(
                `以下のユーザーIDをNG登録しました\n\n${userId}`,
            );
        }

        return;
    }

    await sendNotification(messages.ngId.extractionFailed);
}

export async function importLocalFilter(isManual = false) {
    // 権限があるか確認する前に設定を確認
    // この機能を使用しないユーザーに余計な通知が行くのを防ぐため
    const settings = await loadSettings();
    if (!isManual && !settings.shouldImportLocalFilterOnLoad) return;

    await tryWithPermission("nativeMessaging", async () => {
        if (settings.localFilterPath === "") {
            await sendNotification(messages.settings.pathNotSet);
            return;
        }

        const response = (await browser.runtime.sendNativeMessage(
            "mico.native",
            {
                path: settings.localFilterPath,
                shouldCheckWsl:
                    !isManual && settings.shouldImportOnlyWhenWslRunning,
            },
        )) as { settings?: Partial<Settings> };

        // キャンセルされた場合
        if (response.settings === undefined) return;

        // ファイルが見つからなかった場合
        if (Object.keys(response.settings).length === 0) {
            await sendNotification(messages.settings.localFileNotFound);
            return;
        }

        await setSettings(response.settings);

        if (isManual) {
            await sendNotification(messages.settings.importSuccess);
        }
    });
}
