import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Settings } from "../types/storage/settings.types";
import { defaultSettings } from "./config";
import { loadSettings } from "./storage";
import type { LogData } from "../types/storage/log.types";
import { catchAsync, isWatchPage } from "./util";
import { getActiveTab, sendMessageToBackground } from "./browser";
import { getLogId } from "./log";

interface StorageState {
    settings: Settings;
    log: LogData | undefined;
    isLoading: boolean;
    isWatchPage: boolean;
    loadSettingsPageData: () => void;
    loadPopupPageData: () => void;
    loadLog: () => void;
    saveSettings: (settings: Partial<Settings>) => void;
}

export const useStorageStore = create<StorageState>()(
    subscribeWithSelector((set) => ({
        settings: defaultSettings,
        log: undefined,
        isLoading: true,
        isWatchPage: false,
        loadSettingsPageData: catchAsync(async () => {
            const settings = await loadSettings();

            set({ settings, isLoading: false });
        }),
        loadPopupPageData: catchAsync(async () => {
            const tab = await getActiveTab();
            const log = (await sendMessageToBackground({
                type: "get-log-data",
                data: await getLogId(tab?.id),
            })) as LogData | undefined;

            set({
                log,
                isWatchPage: isWatchPage(tab?.url),
                isLoading: false,
            });
        }),
        loadLog: catchAsync(async () => {
            const params = new URLSearchParams(location.search);
            const id = params.get("id");

            const log = (await sendMessageToBackground({
                type: "get-log-data",
                data: id,
            })) as LogData | undefined;

            set({ log, isLoading: false });
        }),
        saveSettings: catchAsync(async (settings) => {
            const currentSettings = useStorageStore.getState().settings;

            // 書き込まれる予定の値を生成してstoreに反映
            // browser.storage.onChangedの発火時にstoreに反映させると非同期処理を挟むことになるためinput要素のカーソルが保持されない
            // そのためここで先にstoreに反映させ、書き込みが失敗した場合はロールバックする
            set({
                settings: { ...currentSettings, ...settings },
            });

            // 書き込む
            try {
                await sendMessageToBackground({
                    type: "set-settings",
                    data: settings,
                });
            } catch {
                // ロールバック
                set({ settings: currentSettings });
            }
        }),
    })),
);

// 外部での変更を反映させるために必要
export function storageChangeHandler(
    changes: Record<string, browser.storage.StorageChange>,
    area: string,
) {
    if (area !== "local") return;

    for (const [key, value] of Object.entries(changes)) {
        if (key !== "settings") continue;

        const oldSettings = useStorageStore.getState().settings;
        const newSettings = {
            ...defaultSettings,
            ...(value.newValue as Partial<Settings>),
        };

        // ユーザー入力による発火を弾く
        // settingsはjsonに変換可能なのでJSON.stringifyで比較
        if (JSON.stringify(oldSettings) === JSON.stringify(newSettings))
            continue;

        useStorageStore.setState({ settings: newSettings });
    }
}
