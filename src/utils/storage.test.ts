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
        };
        const newObj = {
            nest: {
                b: false,
            },
            array: [2],
            map: new Map([["b", 2]]),
            set: new Set([2]),
        };

        expect(customMerge(oldObj, newObj)).toEqual({
            nest: {
                a: true,
                b: false,
            },
            array: [2],
            map: new Map([["b", 2]]),
            set: new Set([2]),
        });
    });

    it(`${loadSettings.name}()`, async () => {
        const newSettings = {
            isCommentFilterEnabled: false,
        } satisfies Partial<Settings>;

        await setSettings(newSettings);

        expect(await loadSettings()).toEqual({
            ...defaultSettings,
            ...newSettings,
        });
    });

    it(`${getSettingsData.name}()`, async () => {
        await setSettings(defaultSettings);

        expect(await getSettingsData()).toEqual(defaultSettings);
    });
});
