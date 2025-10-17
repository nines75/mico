import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Settings } from "../types/storage/settings.types.js";
import { defaultSettings } from "./config.js";
import { loadSettings } from "./storage.js";
import { LogData } from "../types/storage/log.types.js";
import { getLogId, isRankingPage, isSearchPage, isWatchPage } from "./util.js";
import { sendMessageToBackground } from "@/entrypoints/background/message.js";
import { getLogData } from "./db.js";

interface StorageState {
    settings: Settings;
    log: LogData | undefined;
    tabId: number | undefined;
    isLoading: boolean;
    isWatchPage: boolean;
    isRankingPage: boolean;
    isSearchPage: boolean;
    loadSettingsPageData: () => Promise<void>;
    loadPopupPageData: () => Promise<void>;
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
        loadSettingsPageData: async () => {
            const settings = await loadSettings();

            set({ settings, isLoading: false });
        },
        loadPopupPageData: async () => {
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
                logId === undefined ? undefined : await getLogData(logId);

            set({
                settings,
                log,
                isWatchPage: isWatchPage(tab?.url),
                isRankingPage: isRankingPage(tab?.url),
                isSearchPage: isSearchPage(tab?.url),
                tabId,
                isLoading: false,
            });
        },
        saveSettings: async (settings) => {
            await sendMessageToBackground({
                type: "set-settings",
                data: settings,
            });
        },
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
                settings: await loadSettings(value.newValue),
            });
        }
    }
}
