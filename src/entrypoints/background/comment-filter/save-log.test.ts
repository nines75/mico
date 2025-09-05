import { Thread } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { testLog, testThreads } from "@/utils/test.js";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { filterComment, FilteredData } from "./filter-comment.js";
import { defaultSettings } from "@/utils/config.js";
import { getLogData, setSettings } from "@/utils/storage.js";
import { fakeBrowser } from "#imports";
import { saveLog } from "./save-log.js";
import * as util from "@/utils/util.js";

beforeAll(() => {
    vi.spyOn(util, "changeBadgeState").mockResolvedValue();
});

describe(`${saveLog.name}()`, () => {
    let threads: Thread[];

    beforeEach(() => {
        threads = structuredClone(testThreads);
        fakeBrowser.reset();
    });

    it("all", async () => {
        const settings = {
            ...defaultSettings,
            isHideEasyComment: true,
            isScoreFilterEnabled: true,
            scoreFilterCount: -1001,
            ngUserId: "nvc:RpBQf40dpW85ue3CiT8UZ6AUer6",
            ngCommand: "big",
            ngWord: "コメント",
        } satisfies Partial<Settings>;

        const filteredData = filterComment(threads, settings, [], "sm1");

        await setSettings(settings); // ログをソートする際に必要
        await saveLog(filteredData as FilteredData, 1);

        const log = await getLogData(1);

        // 処理時間のログは不定なのでそれ以外を確認
        expect(log?.commentFilterLog?.count).toEqual(testLog.count);
        expect(log?.commentFilterLog?.filtering).toEqual(testLog.filtering);
    });
});
