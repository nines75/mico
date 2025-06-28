import { beforeEach, describe, expect, it } from "vitest";
import { defaultSettings } from "@/utils/config.js";
import { hasComment, testThreads } from "@/utils/test.js";
import { Thread } from "@/types/api/comment.types.js";
import {
    addNgUserId,
    getNgUserIdSet,
    removeNgUserId,
    UserIdFilter,
} from "./user-id-filter.js";
import { loadSettings, setSettings } from "@/utils/storage.js";
import { fakeBrowser } from "#imports";
import { Settings } from "@/types/storage/settings.types.js";

describe(UserIdFilter.name, () => {
    let testThreadCopy: Thread[];

    beforeEach(() => {
        testThreadCopy = structuredClone(testThreads);
    });

    const filtering = (options: {
        filter: string;
        settings?: Partial<Settings>;
    }) => {
        const userIdFilter = new UserIdFilter(
            {
                ...defaultSettings,
                ...{ ngUserId: options.filter },
                ...options.settings,
            },
            "sm1",
        );
        userIdFilter.filtering(testThreadCopy);

        return userIdFilter;
    };

    it("一般的なフィルター", () => {
        const filter = `
nvc:RpBQf40dpW85ue3CiT8UZ6AUer6
nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk
`;

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([
                ["nvc:RpBQf40dpW85ue3CiT8UZ6AUer6", ["1000", "1001"]],
                ["nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk", ["1002"]],
            ]),
        );
        expect(hasComment(testThreadCopy, ["1000", "1001", "1002"])).toBe(
            false,
        );
    });

    it("部分一致", () => {
        const filter = `
nvc:RpBQf40dpW85ue3CiT8UZ6AUer
`;

        expect(filtering({ filter }).getLog()).toEqual(new Map());
    });

    it("後からフィルターを更新するケース", async () => {
        const userIds = new Set(["nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk"]);

        const userIdFilter = filtering({ filter: "" });
        userIdFilter.updateFilter(userIds);
        userIdFilter.filtering(testThreadCopy);

        await addNgUserId(userIds);
        const settings = await loadSettings();

        // 追加分のユーザーIDを反映してからログを取得しないとソート時に弾かれる
        userIdFilter.setSettings(settings);

        expect(userIdFilter.getLog()).toEqual(
            new Map([["nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk", ["1002"]]]),
        );
        expect(hasComment(testThreadCopy, ["1002"])).toBe(false);
    });

    it("動画限定ルール", () => {
        const filter = `
sm1@nvc:RpBQf40dpW85ue3CiT8UZ6AUer6
sm2@nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk
`;

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([["nvc:RpBQf40dpW85ue3CiT8UZ6AUer6", ["1000", "1001"]]]),
        );
        expect(hasComment(testThreadCopy, ["1000", "1001"])).toBe(false);
    });

    it("通常ルールと動画限定ルールが競合するケース", () => {
        const filter = `
nvc:RpBQf40dpW85ue3CiT8UZ6AUer6
sm1@nvc:RpBQf40dpW85ue3CiT8UZ6AUer6

nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk
sm2@nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk
`;

        expect(filtering({ filter }).getLog()).toEqual(
            new Map([
                ["nvc:RpBQf40dpW85ue3CiT8UZ6AUer6", ["1000", "1001"]],
                ["nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk", ["1002"]],
            ]),
        );
        expect(hasComment(testThreadCopy, ["1000", "1001", "1002"])).toBe(
            false,
        );
    });

    it(`Settings.${"IgnoreByNicoruCount" satisfies keyof Settings}`, () => {
        const filter = `
nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk
nvc:vcG0xFnXKcGl81lWoedT3VOI3Qj
nvc:llNBacJJPE6wbyKKEioq3lO6515
`;

        expect(
            filtering({
                filter,
                settings: { isIgnoreByNicoru: true },
            }).getLog(),
        ).toEqual(new Map([["nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk", ["1002"]]]));
        expect(hasComment(testThreadCopy, ["1002"])).toBe(false);
    });

    it(`${UserIdFilter.prototype.sortLog.name}()`, () => {
        const filter = `
nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk
nvc:RpBQf40dpW85ue3CiT8UZ6AUer6
`;

        const userIdFilter = filtering({
            filter,
        });
        userIdFilter.sortLog();

        expect(userIdFilter.getLog()).toEqual(
            new Map([
                ["nvc:RpBQf40dpW85ue3CiT8UZ6AUer6", ["1000", "1001"]],
                ["nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk", ["1002"]],
            ]),
        );
    });
});

const userIds = [
    "nvc:RpBQf40dpW85ue3CiT8UZ6AUer6",
    "nvc:mkJLLB69n1Kx9ERDlwY23nS6xyk",
];
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
        { name: "コメント", ids: userIds.map((id) => `${id} # comment`) },
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

    it("動画限定ルールを削除しないケース", async () => {
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
