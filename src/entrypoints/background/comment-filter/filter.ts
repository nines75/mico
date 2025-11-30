import { NiconicoComment, Thread } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { ConditionalPick } from "type-fest";
import { Filters } from "./filter-comment.js";
import { CommentMap } from "@/types/storage/log-comment.types.js";
import { CustomRuleData, CustomRule, CountableFilter } from "../filter.js";
import { CommonLog } from "@/types/storage/log.types.js";

export abstract class Filter<T> {
    protected blockedCount = 0;
    protected filteredComments: CommentMap = new Map();
    protected settings: Settings;
    protected abstract log: T;

    constructor(settings: Settings) {
        this.settings = settings;
    }

    abstract filtering(threads: Thread[], isStrictOnly: boolean): void;
    abstract sortLog(): void;

    getBlockedCount(): number {
        return this.blockedCount;
    }
    getFilteredComments() {
        return this.filteredComments;
    }
    getLog() {
        return this.log;
    }

    traverseThreads(
        threads: Thread[],
        callback: (comment: NiconicoComment, thread: Thread) => boolean,
    ) {
        threads.forEach((thread) => {
            thread.comments = thread.comments.filter((comment): boolean => {
                if (this.settings.isMyCommentIgnored && comment.isMyPost)
                    return true;
                if (
                    this.settings.isIgnoreByNicoru &&
                    comment.nicoruCount >= this.settings.ignoreByNicoruCount
                )
                    return true;

                return callback(comment, thread);
            });
        });
    }

    sortCommonLog(currentLog: CommonLog, keys: Set<string>): CommonLog {
        const log: CommonLog = new Map();

        // フィルター順にソート
        keys.forEach((key) => {
            const value = currentLog.get(key);
            if (value !== undefined) {
                log.set(key, value);
            }
        });

        // 各ルールのコメントをソート
        log.forEach((ids, key) => {
            log.set(
                key,
                this.settings.isNgScoreVisible
                    ? sortCommentId(ids, this.filteredComments, true)
                    : sortCommentId(ids, this.filteredComments),
            );
        });

        return log;
    }

    sortDuplicateLog(currentLog: CommonLog): CommonLog {
        const log: CommonLog = new Map();

        // 重複回数降順にソート
        [...currentLog]
            .sort((a, b) => b[1].length - a[1].length)
            .forEach(([key, value]) => {
                log.set(key, value);
            });

        return log;
    }
}

export abstract class CustomFilter<T>
    extends Filter<T>
    implements CountableFilter
{
    private includeCount = 0;
    private excludeCount = 0;
    protected invalidCount = 0;
    protected ngUserIds: Set<string>;
    protected strictNgUserIds: string[] = [];
    protected abstract filter: CustomRuleData<CustomRule>;

    constructor(settings: Settings, ngUserIds: Set<string>) {
        super(settings);
        this.ngUserIds = ngUserIds;
    }

    getIncludeCount(): number {
        return this.includeCount;
    }
    getExcludeCount(): number {
        return this.excludeCount;
    }
    getInvalidCount(): number {
        return this.invalidCount;
    }
    getStrictNgUserIds(): string[] {
        return this.strictNgUserIds;
    }

    filterRuleByTag(tags: string[]) {
        const tagSet = new Set(tags.map((tag) => tag.toLowerCase()));

        this.filter.rules = this.filter.rules.filter(({ include, exclude }) => {
            if (
                include.length > 0 &&
                include.every((rule) => !tagSet.has(rule))
            ) {
                return false;
            }
            if (
                exclude.length > 0 &&
                exclude.some((rule) => tagSet.has(rule))
            ) {
                // 除外されたかどうか(exclude)はこの時点で確定するので、ここでカウントする
                this.excludeCount++;
                return false;
            }

            // 除外されなかったどうか(include)はこの時点まで確定しないため、ここでカウントする
            if (include.length > 0) this.includeCount++;

            return true;
        });
    }

    countRules(): number {
        return this.filter.rules.length;
    }
}

export function getCountableFilters(
    filters: Filters,
): ConditionalPick<Filters, CountableFilter> {
    return {
        userIdFilter: filters.userIdFilter,
        commandFilter: filters.commandFilter,
        wordFilter: filters.wordFilter,
    };
}

export function getCustomFilters(
    filters: Filters,
): ConditionalPick<Filters, CustomFilter<unknown>> {
    return {
        commandFilter: filters.commandFilter,
        wordFilter: filters.wordFilter,
    };
}

export function sortCommentId(
    ids: string[],
    comments: CommentMap,
    isSortByScore = false,
): string[] {
    // ソートによって元のデータが破壊されないようにシャローコピーを行う
    // そのままだと元の配列自体の参照が渡されるが、コピーすることで個々のオブジェクトの参照が新たな配列に入るため元のデータが破壊されない
    const idsCopy = [...ids];

    idsCopy.sort((idA, idB) => {
        const a = comments.get(idA) as NiconicoComment;
        const b = comments.get(idB) as NiconicoComment;

        return a.body.localeCompare(b.body);
    });

    if (isSortByScore) {
        idsCopy.sort((idA, idB) => {
            const a = comments.get(idA) as NiconicoComment;
            const b = comments.get(idB) as NiconicoComment;

            return a.score - b.score;
        });
    }

    return idsCopy;
}
