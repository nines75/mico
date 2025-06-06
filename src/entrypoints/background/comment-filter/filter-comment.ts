import { Thread } from "@/types/api/comment.types.js";
import { NoToUserId } from "@/types/storage/log.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { texts } from "@/utils/config.js";
import { WordFilter } from "./filter/word-filter.js";
import { getNgUserIdSet, UserIdFilter } from "./filter/user-id-filter.js";
import { ScoreFilter } from "./filter/score-filter.js";
import { getCustomFilters } from "./filter.js";
import { CommandFilter } from "./filter/command-filter.js";

export interface FilteredData {
    filters: {
        userIdFilter: UserIdFilter;
        scoreFilter: ScoreFilter;
        commandFilter: CommandFilter;
        wordFilter: WordFilter;
    };
    easyCommentCount: number;
    loadedCommentCount: number;
    filteringTime: number;
    fetchTagTime?: number;
    noToUserId: NoToUserId;
    strictNgUserIds: Set<string>;
}

export async function filterComment(
    threads: Thread[],
    settings: Settings,
    videoId: string | undefined,
): Promise<FilteredData | undefined> {
    if (!settings.isCommentFilterEnabled || videoId === undefined) return;

    const start = performance.now();

    // -------------------------------------------------------------------------------------------
    // フィルタリングと関係ない処理
    // -------------------------------------------------------------------------------------------

    const noToUserId = new Map(
        threads.flatMap((thread) =>
            thread.comments.map((comment) => [comment.no, comment.userId]),
        ),
    );

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
    const scoreFilter = new ScoreFilter(settings);
    const commandFilter = new CommandFilter(settings, ngUserIds);
    const wordFilter = new WordFilter(settings, ngUserIds);

    const filters: FilteredData["filters"] = {
        userIdFilter,
        scoreFilter,
        commandFilter,
        wordFilter,
    };
    const customFilters = getCustomFilters(filters);

    // タグ取得
    const { tags, fetchTagTime } = await getTags(
        videoId,
        Object.values(customFilters).some((filter) => filter.getHasTagRule()),
    );

    // tagルール適用
    Object.values(customFilters).forEach((filter) => {
        filter.filterRuleByTag(tags);
    });

    // -------------------------------------------------------------------------------------------
    // フィルタリング
    // -------------------------------------------------------------------------------------------

    // かんたんコメントを非表示
    const easyCommentCount = threads
        .map((thread) => {
            if (settings.isHideEasyComment && thread.fork === "easy") {
                const count = thread.comments.length;
                thread.comments = [];

                return count;
            }

            return 0;
        })
        .reduce((sum, current) => sum + current, 0);

    // strictルールのみでフィルタリング
    Object.values(customFilters).forEach((filter) =>
        filter.filtering(threads, true),
    );

    // strictルールによって追加されたユーザーIDを反映
    const strictNgUserIds = new Set(
        Object.values(customFilters).flatMap((filter) =>
            filter.getStrictNgUserIds(),
        ),
    );
    userIdFilter.updateFilter(strictNgUserIds);

    // フィルタリング
    Object.values(filters).forEach((filter) => filter.filtering(threads));

    const end = performance.now();

    return {
        filters,
        easyCommentCount,
        loadedCommentCount,
        filteringTime: end - start,
        fetchTagTime,
        noToUserId,
        strictNgUserIds,
    };
}

async function getTags(
    videoId: string,
    hasTagRule: boolean,
): Promise<{
    tags: string[];
    fetchTagTime?: number;
}> {
    if (!hasTagRule) {
        return { tags: [] };
    }

    const start = performance.now();
    const res = await fetch(
        `https://ext.nicovideo.jp/api/getthumbinfo/${videoId}`,
    );
    const end = performance.now();

    if (!res.ok) throw new Error(texts.background.errorMessageGetTags);

    const parser = new DOMParser();
    const xmlStr = await res.text();
    const xml = parser.parseFromString(xmlStr, "text/xml");

    const tags: string[] = [];
    xml.querySelectorAll("tag").forEach((element) => {
        const tag = element.textContent;
        if (tag !== null) tags.push(tag);
    });

    return { tags, fetchTagTime: end - start };
}
