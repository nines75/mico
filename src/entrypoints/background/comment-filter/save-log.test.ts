import { Thread } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { testLog, testThreads } from "@/utils/test.js";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { filterComment, FilteredData } from "./filter-comment.js";
import { defaultSettings } from "@/utils/config.js";
import { fakeBrowser } from "#imports";
import { getCount, getLog, saveLog } from "./save-log.js";
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

    it("all", () => {
        const settings = {
            ...defaultSettings,
            isEasyCommentHidden: true,
            isScoreFilterEnabled: true,
            scoreFilterCount: -1001,
            ngUserId: "user-id-owner",
            ngCommand: "big",
            ngWord: "コメント",
        } satisfies Partial<Settings>;

        const filteredData = filterComment(
            threads,
            settings,
            [],
            "sm1",
        ) as FilteredData;

        // 処理時間のログは不定なのでそれ以外を確認
        expect(getCount(filteredData, settings)).toEqual(testLog.count);
        expect(getLog(filteredData)).toEqual(testLog.filtering);
    });
});
