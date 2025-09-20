import { NiconicoComment, Thread } from "@/types/api/comment.types.js";
import { Settings } from "@/types/storage/settings.types.js";
import { ConditionalPick } from "type-fest";
import { FilteredData } from "./filter-comment.js";
import { CommentData } from "@/types/storage/log-comment.types.js";
import { CustomRuleData, CustomRule } from "../filter.js";
import { CommonLog } from "@/types/storage/log.types.js";

export abstract class Filter<T> {
    protected filteredComments: CommentData = new Map();
    protected settings: Settings;
    protected abstract log: T;

    constructor(settings: Settings) {
        this.settings = settings;
    }

    abstract filtering(threads: Thread[], isStrictOnly: boolean): void;
    abstract getCount(): number;
    abstract sortLog(): void;

    getLog() {
        return this.log;
    }

    getComments() {
        return this.filteredComments;
    }

    traverseThreads(
        threads: Thread[],
        callback: (comment: NiconicoComment) => boolean,
    ) {
        threads.forEach((thread) => {
            thread.comments = thread.comments.filter(callback);
        });
    }

    isIgnoreByNicoru(comment: NiconicoComment): boolean {
        return (
            this.settings.isIgnoreByNicoru &&
            comment.nicoruCount >= this.settings.IgnoreByNicoruCount
        );
    }

    sortCommonLog(currentLog: CommonLog, keys: Set<string>): CommonLog {
        const log: CommonLog = new Map();

        // フィルター昇順にソート
        keys.forEach((key) => {
            if (currentLog.has(key)) {
                log.set(key, currentLog.get(key) ?? []);
            }
        });

        // 各ルールのコメントをソート
        log.forEach((ids, key) => {
            log.set(
                key,
                this.settings.isShowNgScoreInLog
                    ? sortCommentId(ids, this.filteredComments, true)
                    : sortCommentId(ids, this.filteredComments),
            );
        });

        return log;
    }
}

export abstract class CustomFilter<T> extends Filter<T> {
    private excludeCount = 0;
    private includeCount = 0;
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

    getRuleCount(): number {
        return this.filter.rules.length;
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
}

type CustomFilterType = ConditionalPick<
    FilteredData["filters"],
    CustomFilter<unknown>
>;

export function getCustomFilters(
    filters: FilteredData["filters"],
): CustomFilterType {
    return {
        commandFilter: filters.commandFilter,
        wordFilter: filters.wordFilter,
    };
}

export function sortCommentId(
    ids: string[],
    comments: CommentData,
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
