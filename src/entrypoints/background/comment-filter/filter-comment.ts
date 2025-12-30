import type { Thread } from "@/types/api/comment.types.js";
import type { Settings } from "@/types/storage/settings.types.js";
import { WordFilter } from "./filter/word-filter.js";
import {
    formatNgUserId,
    getBasicNgUserIdSet,
    UserIdFilter,
} from "./filter/user-id-filter.js";
import { ScoreFilter } from "./filter/score-filter.js";
import { CommandFilter } from "./filter/command-filter.js";
import { CommentAssistFilter } from "./filter/comment-assist-filter.js";
import { EasyCommentFilter } from "./filter/easy-comment-filter.js";
import { getRuleFilters } from "./rule-filter.js";
import { getStrictFilters } from "./strict-filter.js";
import type { TabData } from "@/types/storage/tab.types.js";

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
    strictUserIds: Set<string>;
    strictUserIdsWithContext: Set<string>;
    threads: Thread[];
}

export function filterComment(
    threads: Thread[],
    settings: Settings,
    tab: TabData,
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

    // strictルールによってNG登録されるユーザーIDが既にフィルターに存在するか確認するために使う
    const ngUserIds = getBasicNgUserIdSet(settings);

    // フィルター初期化
    const userIdFilter = new UserIdFilter(settings);
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
    const ruleFilters = getRuleFilters(filters);
    const strictFilters = getStrictFilters(filters);

    // 適用するルールを決定
    Object.values(ruleFilters).forEach((filter) => {
        filter.filterRule(tab);
    });

    // -------------------------------------------------------------------------------------------
    // フィルタリング
    // -------------------------------------------------------------------------------------------

    // strictルールのみでフィルタリング
    Object.values(strictFilters).forEach((filter) => {
        filter.filtering(threads, true);
    });

    const strictUserIds = new Set<string>();
    const strictUserIdsWithContext = new Set<string>();
    Object.values(strictFilters).forEach((filter) => {
        filter.getStrictData().forEach(({ userId, context }) => {
            if (!strictUserIds.has(userId)) {
                strictUserIdsWithContext.add(
                    formatNgUserId(userId, context, settings),
                );
            }
            strictUserIds.add(userId);
        });
    });

    // strictルールによってフィルタリングされたユーザーIDを反映
    userIdFilter.updateFilter(strictUserIds);

    // フィルタリング
    Object.values(filters).forEach((filter) => {
        filter.filtering(threads);
    });

    const end = performance.now();

    return {
        filters,
        loadedCommentCount,
        filteringTime: end - start,
        strictUserIds,
        strictUserIdsWithContext,
        threads,
    };
}
