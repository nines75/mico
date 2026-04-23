import type { Settings } from "@/types/storage/settings.types";
import { testTab, testThreads } from "@/utils/test";
import { beforeAll, expect, it, vi } from "vitest";
import type { FilteringResult } from "./filter-comment";
import { filterComment } from "./filter-comment";
import { defaultSettings } from "@/utils/config";
import { createCount, createCommentLog, saveLog } from "./save-log";
import * as util from "@/utils/browser";
import type { NiconicoComment } from "@/types/api/comment.types";
import type { FilteredComment, Log } from "@/types/storage/log.types";

beforeAll(() => {
    vi.spyOn(util, "setBadgeState").mockResolvedValue();
});

const log = {
    count: {
        blockedComment: 7,
        loadedComment: 7,
        include: 0,
        exclude: 0,
        disable: 0,
    },
    comment: {
        strictRuleIds: [],
        filteredComments: [
            ...getComments(["1000", "1001"], "user-id", "user-id-owner"),
            ...getComments(["1005", "1006"], "easy-comment"),
            ...getComments(["1002"], "score"),
            ...getComments(["1004"], "commands", "big"),
            ...getComments(["1003"], "body", "コメント"),
        ],
        renderedComments: [],
    },
} as const satisfies Log;

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

    const result = filterComment(threads, settings, testTab) as FilteringResult;

    expect(createCommentLog(result)).toEqual(log.comment);
    expect(createCount(result)).toEqual(log.count);
});

function getComments(
    ids: string[],
    target: FilteredComment["target"],
    pattern?: string,
): FilteredComment[] {
    const comments: FilteredComment[] = ids.map((id) => {
        return {
            target,
            comment: testThreads
                .flatMap((thread) => thread.comments)
                .find((comment) => comment.id === id) as NiconicoComment,
            ...(pattern !== undefined && { pattern }),
        };
    });

    // コマンドを小文字化
    for (const { comment } of comments) {
        comment.commands = comment.commands.map((command) =>
            command.toLowerCase(),
        );
    }

    return comments;
}
