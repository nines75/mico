import { fakeBrowser } from "#imports";
import { defaultSettings } from "@/utils/config.js";
import { getSettingsData, loadSettings } from "@/utils/storage.js";
import { describe, expect, it, beforeEach } from "vitest";
import type { Settings } from "@/types/storage/settings.types.js";
import { setSettings } from "./storage-write.js";

describe("storage", () => {
    beforeEach(() => {
        fakeBrowser.reset();
    });

    it.each([
        {
            name: "設定なし",
            expected: defaultSettings,
        },
        {
            name: "設定あり",
            settings: { isCommentFilterEnabled: false },
            expected: { ...defaultSettings, isCommentFilterEnabled: false },
        },
    ] satisfies {
        name: string;
        settings?: Partial<Settings>;
        expected: Settings;
    }[])(`${loadSettings.name}():$name`, async ({ settings, expected }) => {
        if (settings !== undefined) await setSettings(settings);

        expect(await loadSettings()).toEqual(expected);
    });

    it(`${getSettingsData.name}()`, async () => {
        await setSettings(defaultSettings);

        expect(await getSettingsData()).toEqual(defaultSettings);
    });
});
