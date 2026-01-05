import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Settings } from "../types/storage/settings.types.js";
import { defaultSettings } from "./config.js";
import { loadSettings } from "./storage.js";
import type { LogData } from "../types/storage/log.types.js";
import {
    catchAsync,
    isRankingPage,
    isSearchPage,
    isWatchPage,
} from "./util.js";
import { sendMessageToBackground } from "./browser.js";
import { getLogId } from "./log.js";

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
            await sendMessageToBackground({
                type: "set-settings",
                data: settings,
            });
        }),
    })),
);

export async function storageChangeHandler(
    changes: Record<string, browser.storage.StorageChange>,
    area: string,
) {
    if (area !== "local") return;

    for (const [key, value] of Object.entries(changes)) {
        if (key === "settings") {
            useStorageStore.setState({
                settings: await loadSettings(
                    value.newValue as Partial<Settings>,
                ),
            });
        }
    }
}

export const syncStorageChangeHandler = catchAsync(storageChangeHandler);
