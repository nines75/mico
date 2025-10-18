import { fakeBrowser } from "#imports";
import { defaultSettings } from "@/utils/config.js";
import { customMerge, getSettingsData, loadSettings } from "@/utils/storage.js";
import { describe, expect, it, beforeEach } from "vitest";
import { Settings } from "@/types/storage/settings.types.js";
import { setSettings } from "./storage-write.js";

describe("storage", () => {
    beforeEach(() => {
        fakeBrowser.reset();
    });

    it("customMerge()", () => {
        const oldObj = {
            nest: {
                a: true,
            },
            array: [1],
            map: new Map([["a", 1]]),
            set: new Set([1]),
            undefined: true,
        };
        const newObj = {
            nest: {
                b: false,
            },
            array: [2],
            map: new Map([["b", 2]]),
            set: new Set([2]),
            undefined: undefined,
        };

        expect(customMerge(oldObj, newObj)).toStrictEqual({
            nest: {
                a: true,
                b: false,
            },
            array: [2],
            map: new Map([["b", 2]]),
            set: new Set([2]),
            undefined: undefined,
        });
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
