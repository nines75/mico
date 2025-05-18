import { fakeBrowser } from "#imports";
import { defaultSettings } from "@/utils/config.js";
import {
    customMerge,
    getAllData,
    getLogData,
    getSettingsData,
    loadSettings,
    removeAllData,
    removeData,
    setLog,
    setSettings,
} from "@/utils/storage.js";
import { describe, expect, it, beforeEach } from "vitest";
import { testLog } from "./test.js";
import { stringify } from "superjson";
import { Settings } from "@/types/storage/settings.types.js";
import { PartialDeep } from "type-fest";

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

    it("loadSettings()", async () => {
        const newSettings = {
            isCommentFilterEnabled: false,
        } satisfies PartialDeep<Settings>;

        await setSettings(newSettings);

        expect(await loadSettings()).toEqual({
            ...defaultSettings,
            ...newSettings,
        });
    });

    it("removeAllData()", async () => {
        await setSettings(defaultSettings);
        await setLog(testLog, 1);

        await removeAllData();

        expect(await getAllData()).toEqual({});
    });

    it("removeData()", async () => {
        await setSettings(defaultSettings);
        await setLog(testLog, 1);

        await removeData(["log-1"]);

        expect(await getAllData()).toEqual({ settings: defaultSettings });
    });

    it("getAllData()", async () => {
        await setSettings(defaultSettings);
        await setLog(testLog, 1);

        expect(await getAllData()).toEqual({
            settings: defaultSettings,
            "log-1": stringify(testLog),
        });
    });

    it("getLogData()", async () => {
        await setLog(testLog, 1);

        expect(await getLogData(1)).toEqual(testLog);
    });

    it("getSettingsData()", async () => {
        await setSettings(defaultSettings);

        expect(await getSettingsData()).toEqual(defaultSettings);
    });
});
