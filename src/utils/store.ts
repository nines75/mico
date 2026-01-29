import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Settings } from "../types/storage/settings.types";
import { defaultSettings } from "./config";
import { loadSettings } from "./storage";
import type { LogData } from "../types/storage/log.types";
import {
    catchAsync,
    customMerge,
    isRankingPage,
    isSearchPage,
    isWatchPage,
} from "./util";
import { sendMessageToBackground } from "./browser";
import { getLogId } from "./log";

interface StorageState {
    settings: Settings;
    log: LogData | undefined;
    tabId: number | undefined;
    isLoading: boolean;
    isWatchPage: boolean;
    isRankingPage: boolean;
    isSearchPage: boolean;
    loadSettingsPageData: () => void;
    loadPopupPageData: () => void;
    saveSettings: (settings: Partial<Settings>) => void;
}

export const useStorageStore = create<StorageState>()(
    subscribeWithSelector((set) => ({
        settings: defaultSettings,
        log: undefined,
        tabId: undefined,
        isLoading: true,
        isWatchPage: false,
        isRankingPage: false,
        isSearchPage: false,
        loadSettingsPageData: catchAsync(async () => {
            const settings = await loadSettings();

            set({ settings, isLoading: false });
        }),
        loadPopupPageData: catchAsync(async () => {
            const [settings, tabs] = await Promise.all([
                loadSettings(),
                browser.tabs.query({
                    active: true,
                    currentWindow: true,
                }),
            ]);
            const tab = tabs[0];
            const tabId = tab?.id;
            const logId = await getLogId(tabId);
            const log =
                logId === undefined
                    ? undefined
                    : ((await sendMessageToBackground({
                          type: "get-log-data",
                          data: logId,
                      })) as LogData | undefined);

            set({
                settings,
                log,
                isWatchPage: isWatchPage(tab?.url),
                isRankingPage: isRankingPage(tab?.url),
                isSearchPage: isSearchPage(tab?.url),
                tabId,
                isLoading: false,
            });
        }),
        saveSettings: catchAsync(async (settings) => {
            const currentSettings = useStorageStore.getState().settings;

            // 書き込まれる予定の値を生成してstoreに反映
            // browser.storage.onChangedの発火時にstoreに反映させると非同期処理を挟むことになるためinput要素のカーソルが保持されない
            // そのためここで先にstoreに反映させ、書き込みが失敗した場合はロールバックする
            set({
                settings: customMerge(currentSettings, settings) as Settings,
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
        const newSettings = customMerge(
            defaultSettings,
            value.newValue,
        ) as Settings;

        // ユーザー入力による発火を弾く
        // settingsはjsonに変換可能なのでJSON.stringifyで比較
        if (JSON.stringify(oldSettings) === JSON.stringify(newSettings))
            continue;

        useStorageStore.setState({ settings: newSettings });
    }
}
