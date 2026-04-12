import type { Thread } from "@/types/api/comment.types";
import type { Settings } from "@/types/storage/settings.types";
import { WordFilter } from "./filter/word-filter";
import { UserIdFilter } from "./filter/user-id-filter";
import { ScoreFilter } from "./filter/score-filter";
import { CommandFilter } from "./filter/command-filter";
import { CommentAssistFilter } from "./filter/comment-assist-filter";
import { EasyCommentFilter } from "./filter/easy-comment-filter";
import { getRuleFilters } from "./rule-filter";
import type { StrictData } from "./strict-filter";
import { getStrictFilters } from "./strict-filter";
import type { TabData } from "@/types/storage/tab.types";

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
    strictUserIds: string[];
    strictData: StrictData[];
    threads: Thread[];
}

export function filterComment(
    threads: Thread[],
    settings: Settings,
    tab: TabData,
): FilteredData | undefined {
    if (!settings.isCommentFilterEnabled) return;

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

    // フィルター初期化
    const userIdFilter = new UserIdFilter(settings);
    const easyCommentFilter = new EasyCommentFilter(settings);
    const commentAssistFilter = new CommentAssistFilter(settings);
    const scoreFilter = new ScoreFilter(settings);
    const commandFilter = new CommandFilter(settings);
    const wordFilter = new WordFilter(settings);

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
    for (const filter of Object.values(ruleFilters)) {
        filter.filterRules(tab);
    }

    // -------------------------------------------------------------------------------------------
    // フィルタリング
    // -------------------------------------------------------------------------------------------

    // strictルールのみでフィルタリング
    for (const filter of Object.values(strictFilters)) {
        filter.filtering(threads, true);
    }

    const strictUserIds: string[] = [];
    const strictData: StrictData[] = [];
    for (const filter of Object.values(strictFilters)) {
        for (const data of filter.getStrictData()) {
            if (!strictUserIds.includes(data.userId)) {
                strictUserIds.push(data.userId);
                strictData.push(data);
            }
        }
    }

    // strictルールによってフィルタリングされたユーザーIDを反映
    userIdFilter.updateFilter(strictUserIds);

    // フィルタリング
    for (const filter of Object.values(filters)) {
        filter.filtering(threads);
    }

    return {
        filters,
        loadedCommentCount,
        strictUserIds,
        strictData,
        threads,
    };
}
