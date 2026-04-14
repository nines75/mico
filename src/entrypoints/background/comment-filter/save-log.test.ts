import type { Settings } from "@/types/storage/settings.types";
import { testLog, testTabData, testThreads } from "@/utils/test";
import { beforeAll, expect, it, vi } from "vitest";
import type { FilteredData } from "./filter-comment";
import { filterComment } from "./filter-comment";
import { defaultSettings } from "@/utils/config";
import { createCount, createCommentLog, saveLog } from "./save-log";
import * as util from "@/utils/browser";

beforeAll(() => {
    vi.spyOn(util, "setBadgeState").mockResolvedValue();
});

it(saveLog.name, () => {
    const threads = structuredClone(testThreads);
    const settings = {
        ...defaultSettings,
        isEasyCommentHidden: true,
        isScoreFilterEnabled: true,
        scoreFilterCount: -1001,
        manualFilter: `
@comment-user-id
user-id-owner
@end

@comment-commands
big
@end

@comment-body
コメント
`,
    } satisfies Partial<Settings>;

    const filteredData = filterComment(
        threads,
        settings,
        testTabData,
    ) as FilteredData;

    // 処理時間のログは不定なのでそれ以外を確認
    expect(createCount(filteredData)).toEqual(testLog.count);
    expect(createCommentLog(filteredData)).toEqual(testLog.filtering);
});
