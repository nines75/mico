import type { CommonLog } from "@/types/storage/log.types";
import type { Settings } from "@/types/storage/settings.types";
import { isString } from "@/utils/util";
import type { ConditionalPick } from "type-fest";
import { parseFilter } from "../parse-filter";
import type { Rule } from "../rule";
import type { Filters } from "./filter-video";
import { Filter, sortVideoId } from "./filter";

export abstract class RuleFilter<T> extends Filter<T> {
    protected rules: Rule[];
    protected invalidCount = 0;

    constructor(settings: Settings, filter: string) {
        super(settings);

        const { rules, invalidCount } = parseFilter(filter);
        this.rules = rules;
        this.invalidCount += invalidCount;
    }

    getInvalidCount(): number {
        return this.invalidCount;
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
        for (const key of keys) {
            const keyStr = this.createKey(key);
            const value = currentLog.get(keyStr);
            if (value !== undefined) {
                log.set(keyStr, value);
            }
        }

        // 各キーの動画IDをソート
        for (const [key, ids] of log) {
            log.set(key, sortVideoId(ids, this.filteredVideos));
        }

        return log;
    }
}

export function getRuleFilters(
    filters: Filters,
): ConditionalPick<Filters, RuleFilter<unknown>> {
    return {
        idFilter: filters.idFilter,
        userNameFilter: filters.userNameFilter,
        titleFilter: filters.titleFilter,
    };
}
