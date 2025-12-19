import { Thread } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { WordFilter } from "./filter/word-filter.js";
import {
    formatNgUserId,
    getNgUserIdSet,
    UserIdFilter,
} from "./filter/user-id-filter.js";
import { ScoreFilter } from "./filter/score-filter.js";
import { getCustomFilters } from "./filter.js";
import { CommandFilter } from "./filter/command-filter.js";
import { CommentAssistFilter } from "./filter/comment-assist-filter.js";
import { EasyCommentFilter } from "./filter/easy-comment-filter.js";

export type Filters = FilteredData["filters"];

export interface FilteredData {
    filters: {
        userIdFilter: UserIdFilter;
        easyCommentFilter: EasyCommentFilter;
        commentAssistFilter: CommentAssistFilter;
        scoreFilter: ScoreFilter;
        commandFilter: CommandFilter;
        wordFilter: WordFilter;
    };
    loadedCommentCount: number;
    filteringTime: number;
    strictNgUserIds: Set<string>;
    strictNgUserIdsWithContext: Set<string>;
    threads: Thread[];
}

export function filterComment(
    threads: Thread[],
    settings: Settings,
    tags: string[],
    videoId: string,
): FilteredData | undefined {
    if (!settings.isCommentFilterEnabled) return;

    const start = performance.now();

    // -------------------------------------------------------------------------------------------
    // フィルタリングと関係ない処理
    // -------------------------------------------------------------------------------------------

    // 動画の総コメント数を取得
    const loadedCommentCount = threads.reduce(
        (sum, thread) => sum + thread.comments.length,
        0,
    );

    // -------------------------------------------------------------------------------------------
    // フィルタリングの前処理
    // -------------------------------------------------------------------------------------------

    // strictルールで追加するユーザーID(動画限定ルールでないもの)が、既にフィルターに存在するか確認するために必要
    const ngUserIds = getNgUserIdSet(settings, "");

    // フィルター初期化
    const userIdFilter = new UserIdFilter(settings, videoId);
    const easyCommentFilter = new EasyCommentFilter(settings);
    const commentAssistFilter = new CommentAssistFilter(settings);
    const scoreFilter = new ScoreFilter(settings);
    const commandFilter = new CommandFilter(settings, ngUserIds);
    const wordFilter = new WordFilter(settings, ngUserIds);

    const filters: Filters = {
        userIdFilter,
        easyCommentFilter,
        commentAssistFilter,
        scoreFilter,
        commandFilter,
        wordFilter,
    };
    const customFilters = getCustomFilters(filters);

    // tagルール適用
    Object.values(customFilters).forEach((filter) => {
        filter.filterRuleByTag(tags);
    });

    // -------------------------------------------------------------------------------------------
    // フィルタリング
    // -------------------------------------------------------------------------------------------

    // strictルールのみでフィルタリング
    Object.values(customFilters).forEach((filter) => {
        filter.filtering(threads, true);
    });

    const strictNgUserIds = new Set<string>();
    const strictNgUserIdsWithContext = new Set<string>();
    Object.values(customFilters).forEach((filter) => {
        filter.getStrictData().forEach(({ userId, context }) => {
            if (!strictNgUserIds.has(userId)) {
                strictNgUserIdsWithContext.add(
                    formatNgUserId(userId, context, settings),
                );
            }
            strictNgUserIds.add(userId);
        });
    });

    // strictルールによってフィルタリングされたユーザーIDを反映
    userIdFilter.updateFilter(strictNgUserIds);

    // フィルタリング
    Object.values(filters).forEach((filter) => {
        filter.filtering(threads);
    });

    const end = performance.now();

    return {
        filters,
        loadedCommentCount,
        filteringTime: end - start,
        strictNgUserIds,
        strictNgUserIdsWithContext,
        threads,
    };
}
