import type { Settings } from "@/types/storage/settings.types.js";
import { isString } from "@/utils/util.js";
import type { ConditionalPick } from "type-fest";
import { parseFilter } from "../parse-filter.js";
import type { Filters } from "./filter-comment.js";
import { Filter, sortCommentId } from "./filter.js";
import type { CommonLog } from "@/types/storage/log.types.js";
import type { TabData } from "@/types/storage/tab.types.js";
import { objectKeys } from "ts-extras";
import type { Rule } from "../rule.js";

export abstract class RuleFilter<T> extends Filter<T> {
    protected rules: Rule[];
    private includeCount = 0;
    private excludeCount = 0;
    private invalidCount = 0;

    constructor(settings: Settings, filter: string) {
        super(settings);

        const { rules, invalidCount } = parseFilter(filter);
        this.rules = rules;
        this.invalidCount += invalidCount;
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

    filterRule(tab: TabData) {
        const { videoId, userId, seriesId } = tab;
        const tags = tab.tags.map((tag) => tag.toLowerCase());

        const matches = (
            rules: string[][],
            pred: (param: string) => boolean,
        ) => {
            return (
                rules.length > 0 && rules.every((params) => params.some(pred))
            );
        };

        this.rules = this.rules.filter(({ include, exclude }) => {
            // ルールを無効化するか判定
            if (
                matches(exclude.tags, (param) => tags.includes(param)) ||
                matches(exclude.videoIds, (param) => param === videoId) ||
                matches(exclude.userIds, (param) => param === userId) ||
                matches(exclude.seriesIds, (param) => param === seriesId)
            ) {
                this.excludeCount++;
                return false;
            }

            // ルールを有効化するか判定
            if (
                matches(include.tags, (param) => tags.includes(param)) ||
                matches(include.videoIds, (param) => param === videoId) ||
                matches(include.userIds, (param) => param === userId) ||
                matches(include.seriesIds, (param) => param === seriesId)
            ) {
                this.includeCount++;
                return true;
            }

            if (objectKeys(include).every((key) => include[key].length === 0))
                return true;

            return false;
        });
    }

    countRules(): number {
        return this.rules.length;
    }

    createKey(rule: string | RegExp): string {
        return isString(rule) ? rule : rule.toString();
    }

    sortCommonLog(currentLog: CommonLog, keys: (string | RegExp)[]): CommonLog {
        const log: CommonLog = new Map();

        // フィルター順にソート
        keys.forEach((key) => {
            const keyStr = this.createKey(key);
            const value = currentLog.get(keyStr);
            if (value !== undefined) {
                log.set(keyStr, value);
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
}

export function getRuleFilters(
    filters: Filters,
): ConditionalPick<Filters, RuleFilter<unknown>> {
    return {
        userIdFilter: filters.userIdFilter,
        commandFilter: filters.commandFilter,
        wordFilter: filters.wordFilter,
    };
}
