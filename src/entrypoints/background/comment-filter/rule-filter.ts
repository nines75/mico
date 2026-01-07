import type { Settings } from "@/types/storage/settings.types";
import { isString } from "@/utils/util";
import type { ConditionalPick } from "type-fest";
import { parseFilter } from "../parse-filter";
import type { Filters } from "./filter-comment";
import { Filter, sortCommentId } from "./filter";
import type { CommonLog } from "@/types/storage/log.types";
import type { TabData } from "@/types/storage/tab.types";
import { objectKeys } from "ts-extras";
import type { Rule } from "../rule";

export abstract class RuleFilter<T> extends Filter<T> {
    private includeCount = 0;
    private excludeCount = 0;
    private invalidCount = 0;
    protected rules: Rule[];

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

    filterRules(tab: TabData) {
        const { videoId, userId, seriesId } = tab;
        const tags = tab.tags.map((tag) => tag.toLowerCase());

        const matches = (rules: string[][], pred: (arg: string) => boolean) => {
            return rules.length > 0 && rules.every((args) => args.some(pred));
        };

        this.rules = this.rules.filter(({ include, exclude }) => {
            // ルールを無効化するか判定
            if (
                matches(exclude.tags, (arg) => tags.includes(arg)) ||
                matches(exclude.videoIds, (arg) => arg === videoId) ||
                matches(exclude.userIds, (arg) => arg === userId) ||
                matches(exclude.seriesIds, (arg) => arg === seriesId)
            ) {
                this.excludeCount++;
                return false;
            }

            // ルールを有効化するか判定
            if (
                matches(include.tags, (arg) => tags.includes(arg)) ||
                matches(include.videoIds, (arg) => arg === videoId) ||
                matches(include.userIds, (arg) => arg === userId) ||
                matches(include.seriesIds, (arg) => arg === seriesId)
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
