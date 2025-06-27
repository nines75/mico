import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Settings } from "../types/storage/settings.types.js";
import { defaultSettings } from "./config.js";
import {
    loadSettings,
    StorageType,
    setSettings,
    getLogData,
} from "./storage.js";
import { LogData } from "../types/storage/log.types.js";
import { extractVideoId } from "./util.js";

interface StorageState {
    settings: Settings;
    log: LogData | undefined;
    tabId: number | undefined;
    isLoading: boolean;
    isNiconico: boolean;
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
        isNiconico: false,
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
            const videoId = extractVideoId(tab?.url);

            const log =
                tabId === undefined ? undefined : await getLogData(tabId);

            set({
                settings,
                log,
                isNiconico: videoId !== undefined,
                tabId,
                isLoading: false,
            });
        },
        saveSettings: async (settings) => {
            try {
                await setSettings(settings);
            } catch (e) {
                console.error(e);
            }
        },
    })),
);

export function storageChangeHandler(
    changes: Record<string, browser.storage.StorageChange>,
    area: string,
) {
    if (area !== "local") return;

    const tabId = useStorageStore.getState().tabId;

    Object.entries(changes).forEach(async ([key, value]) => {
        try {
            const type = key as StorageType;

            if (tabId !== undefined && type === `log-${tabId}`) {
                useStorageStore.setState({
                    log: await getLogData(tabId, value.newValue),
                });
            }
            if (type === "settings") {
                useStorageStore.setState({
                    settings: await loadSettings(value.newValue),
                });
            }
        } catch (e) {
            console.error(e);
        }
    });
}
