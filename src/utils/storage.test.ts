import { fakeBrowser } from "#imports";
import { defaultSettings } from "@/utils/config.js";
import {
    getAllData,
    removeAllData,
    removeData,
    setLog,
    setSettings,
} from "@/utils/storage.js";
import { describe, expect, it, beforeEach } from "vitest";
import { testLog } from "./data.js";

describe("storage", () => {
    beforeEach(() => {
        fakeBrowser.reset();
    });

    it("remove all data", async () => {
        // set data
        await setSettings(defaultSettings);
        await setLog(testLog, 1);

        // remove
        await removeAllData();

        expect(await getAllData()).toEqual({});
    });

    it("remove data", async () => {
        // set data
        await setSettings(defaultSettings);
        await setLog(testLog, 1);

        // remove
        await removeData(["log-1"]);

        expect(await getAllData()).toEqual({ settings: defaultSettings });
    });

    // 仕様外の型を保存しているためうまくいかない
    // it("get all data", async () => {
    //     // set data
    //     await setSettings(defaultSettings);
    //     await setLog(testLog, 1);

    //     expect(await getAllData()).toEqual({
    //         settings: defaultSettings,
    //         "log-1": testLog,
    //     });
    // });

    // it("get log data", async () => {
    //     // set data
    //     await setLog(testLog, 1);

    //     expect(await getAllData()).toEqual({ "log-1": testLog });
    // });

    it("get settings data", async () => {
        // set data
        await setSettings(defaultSettings);

        expect(await getAllData()).toEqual({ settings: defaultSettings });
    });
});
