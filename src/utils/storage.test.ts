import { defaultSettings } from "@/utils/config";
import { getSettingsData, loadSettings } from "@/utils/storage";
import { describe, expect, it } from "vitest";
import type { Settings } from "@/types/storage/settings.types";
import { setSettings } from "./storage-write";

describe(loadSettings.name, () => {
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
    }[])(`$name`, async ({ settings, expected }) => {
        if (settings !== undefined) await setSettings(settings);

        expect(await loadSettings()).toEqual(expected);
    });
});

it(getSettingsData.name, async () => {
    await setSettings(defaultSettings);

    expect(await getSettingsData()).toEqual(defaultSettings);
});
