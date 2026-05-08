import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { Settings } from "../types/storage/settings.types";
import { defaultSettings } from "./config";
import { loadSettings } from "./storage";
import type { Log } from "../types/storage/log.types";
import { catchAsync, isWatchPage } from "./util";
import { getActiveTab } from "./browser";
import { proxy } from "./proxy";
import { getLogIdViaMessage } from "./messaging";

// -------------------------------------------------------------------------------------------
// settings
// -------------------------------------------------------------------------------------------

export interface SettingsState {
  storeId: string;
  settings: Settings;
  isLoading: boolean;
  load: () => void;
  saveSettings: (
    settings: Partial<Settings>,
    onSuccess?: () => Promise<void>,
  ) => void;
}

export const useSettingsStore = create<SettingsState>()(
  subscribeWithSelector((set, get) => ({
    storeId: crypto.randomUUID(),
    settings: defaultSettings,
    isLoading: true,
    load: catchAsync(async () => {
      const settings = await loadSettings();

      set({ settings, isLoading: false });
    }),
    saveSettings: catchAsync(async (settings, onSuccess) => {
      const { settings: currentSettings, storeId } = get();

      // 書き込まれる予定の値を生成してstoreに反映
      // browser.storage.onChangedの発火時にstoreに反映させると非同期処理を挟むことになるためinput要素のカーソルが保持されない
      // そのためここで先にstoreに反映させ、書き込みが失敗した場合はロールバックする
      set({
        settings: { ...currentSettings, ...settings },
      });

      // 書き込む
      try {
        await proxy.setSettings({ ...settings, storeId });
        await onSuccess?.();
      } catch {
        // ロールバック
        set({ settings: currentSettings });
      }
    }),
  })),
);

// -------------------------------------------------------------------------------------------
// popup
// -------------------------------------------------------------------------------------------

interface PopupState {
  log?: Log | undefined;
  isWatchPage: boolean;
  isLoading: boolean;
  load: () => void;
}

export const usePopupStore = create<PopupState>()(
  subscribeWithSelector((set) => ({
    isWatchPage: false,
    isLoading: true,
    load: catchAsync(async () => {
      const tab = await getActiveTab();
      const logId = await getLogIdViaMessage(tab?.id);

      const log = logId === undefined ? undefined : await proxy.getLog(logId);

      set({
        log,
        isWatchPage: isWatchPage(tab?.url),
        isLoading: false,
      });
    }),
  })),
);

// -------------------------------------------------------------------------------------------
// log
// -------------------------------------------------------------------------------------------

interface LogState {
  log?: Log | undefined;
  userId?: string;
  isLoading: boolean;
  load: () => void;
}

export const useLogStore = create<LogState>()(
  subscribeWithSelector((set) => ({
    isLoading: true,
    load: catchAsync(async () => {
      const params = new URLSearchParams(location.search);
      const id = params.get("id");
      const userId = params.get("userId");

      const log = id === null ? undefined : await proxy.getLog(id);

      set({
        log,
        isLoading: false,
        ...(userId !== null && { userId }),
      });
    }),
  })),
);
