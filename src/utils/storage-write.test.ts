import { defaultSettings } from "@/utils/config";
import { loadSettings } from "@/utils/storage";
import { describe, expect, it } from "vitest";
import { setSettings, addNgUserId, removeNgUserId } from "./storage-write";

const userIds = ["user-id-owner", "user-id-main-1"];

it(addNgUserId.name, async () => {
    await addNgUserId(userIds);

    const settings = await loadSettings();
    expect(settings.ngUserId).toBe(`${userIds.join("\n")}\n`);
});

describe(removeNgUserId.name, () => {
    it.each([
        {
            name: "基本",
            ids: userIds,
        },
        {
            name: "コンテキスト",
            ids: userIds.map((id) => `# context\n${id}\n`),
        },
        {
            name: "@v",
            ids: userIds.map((id) => `@v sm1\n${id}`),
        },
        {
            name: "@v + コンテキスト",
            ids: userIds.map((id) => `# context\n@v sm1\n${id}\n`),
        },
    ])("$name", async ({ ids }) => {
        await setSettings({
            ...defaultSettings,

            ngUserId: ids.join("\n"),
        });
        await removeNgUserId(userIds);

        const settings = await loadSettings();
        expect(settings.ngUserId).toBe("");
    });

    it("コンテキストに応じて無効化されるルールを削除しない", async () => {
        const ids = userIds.join("\n");
        const specificIds = userIds.map((id) => `@v sm1\n${id}`).join("\n");
        await setSettings({
            ...defaultSettings,

            ngUserId: `${ids}\n${specificIds}`,
        });
        await removeNgUserId(userIds, false);

        const settings = await loadSettings();
        expect(settings.ngUserId).toBe(specificIds);
    });
});
