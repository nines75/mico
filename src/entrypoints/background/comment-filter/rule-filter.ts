import { Settings } from "@/types/storage/settings.types.js";
import { isString } from "@/utils/util.js";
import { ConditionalPick } from "type-fest";
import { Rule, parseFilter } from "../filter.js";
import { Filters } from "./filter-comment.js";
import { Filter, sortCommentId } from "./filter.js";
import { CommonLog } from "@/types/storage/log.types.js";

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

    filterRuleByTag(tags: string[]) {
        const tagSet = new Set(tags.map((tag) => tag.toLowerCase()));

        this.rules = this.rules.filter(({ include, exclude }) => {
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
