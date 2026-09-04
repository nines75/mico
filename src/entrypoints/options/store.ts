import type { Settings } from "@/types/storage/settings.types";
import { defaultSettings } from "@/utils/config";
import { loadSettings } from "@/utils/storage";
import { setSettings } from "@/utils/storage-write";
import { catchAsync } from "@/utils/util";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface SettingsState {
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
      set({ settings: { ...currentSettings, ...settings } });

      // 書き込む
      try {
        await setSettings({ ...settings, storeId });
        await onSuccess?.();
      } catch (error) {
        // ロールバック
        set({ settings: currentSettings });
        console.error(error);
      }
    }),
  })),
);
