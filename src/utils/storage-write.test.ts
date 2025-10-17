import { fakeBrowser } from "#imports";
import { defaultSettings } from "@/utils/config.js";
import { loadSettings } from "@/utils/storage.js";
import { describe, expect, it, beforeEach } from "vitest";
import { setSettings, addNgUserId, removeNgUserId } from "./storage-write.js";
import { getNgUserIdSet } from "@/entrypoints/background/comment-filter/filter/user-id-filter.js";

const userIds = ["user-id-owner", "user-id-main-1"];
const videoUserIds = userIds.map((id) => `sm1@${id}`);

describe(`${addNgUserId.name}()`, () => {
    beforeEach(() => {
        fakeBrowser.reset();
    });

    it.each([
        { name: "通常", ids: userIds },
        { name: "動画限定ルール", ids: videoUserIds },
    ])("$name", async ({ ids }) => {
        await addNgUserId(new Set(ids));

        const settings = await loadSettings();
        const ngUserIds = getNgUserIdSet(settings, "sm1");

        expect(userIds.every((id) => ngUserIds.has(id))).toBe(true);
    });
});

describe(`${removeNgUserId.name}()`, () => {
    beforeEach(() => {
        fakeBrowser.reset();
    });

    it.each([
        { name: "通常", ids: userIds },
        { name: "動画限定ルール", ids: videoUserIds },
        { name: "コメントあり", ids: userIds.map((id) => `${id} # comment`) },
    ])("$name", async ({ ids }) => {
        await setSettings({
            ...defaultSettings,
            ...{
                ngUserId: ids.join("\n"),
            },
        });
        await removeNgUserId(new Set(userIds));

        const settings = await loadSettings();
        const ngUserIds = getNgUserIdSet(settings, "sm1");

        expect(userIds.some((id) => ngUserIds.has(id))).toBe(false);
    });

    it("動画限定ルールを削除対象から除外", async () => {
        await setSettings({
            ...defaultSettings,
            ...{
                ngUserId: [...userIds, ...videoUserIds].join("\n"),
            },
        });
        await removeNgUserId(new Set(userIds), false);

        const settings = await loadSettings();
        const ngUserIds = getNgUserIdSet(settings, "");
        const videoNgUserIds = getNgUserIdSet(settings, "sm1");

        expect(userIds.some((id) => ngUserIds.has(id))).toBe(false);
        expect(userIds.every((id) => videoNgUserIds.has(id))).toBe(true);
    });
});
