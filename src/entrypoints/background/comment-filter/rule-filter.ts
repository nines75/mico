import type { Settings } from "@/types/storage/settings.types";
import { isString } from "@/utils/util";
import type { ConditionalPick } from "type-fest";
import { parseFilter } from "../parse-filter";
import type { Filters } from "./filter-comment";
import { Filter } from "./filter";
import type { TabData } from "@/types/storage/tab.types";
import { objectKeys } from "ts-extras";
import { createRules, type Rule } from "../rule";

export abstract class RuleFilter extends Filter {
    private includeCount = 0;
    private excludeCount = 0;
    private invalidCount = 0;
    protected rules: Rule[];

    constructor(settings: Settings, target: keyof Rule["target"]) {
        super(settings);

        const { rules, invalidCount } = parseFilter(settings);
        this.rules = createRules(settings, target, rules);
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
        const tags = new Set(tab.tags.map((tag) => tag.toLowerCase()));

        this.rules = this.rules.filter(({ include, exclude }) => {
            // ルールを無効化するか判定
            if (
                matches(exclude.tags, (arg) => tags.has(arg)) ||
                matches(exclude.videoIds, (arg) => arg === videoId) ||
                matches(exclude.userIds, (arg) => arg === userId) ||
                matches(exclude.seriesIds, (arg) => arg === seriesId)
            ) {
                this.excludeCount++;
                return false;
            }

            // ルールを有効化するか判定
            if (
                matches(include.tags, (arg) => tags.has(arg)) ||
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

    createKey(pattern: string | RegExp): string {
        return isString(pattern) ? pattern : pattern.toString();
    }
}

export function getRuleFilters(
    filters: Filters,
): ConditionalPick<Filters, RuleFilter> {
    return {
        userIdFilter: filters.userIdFilter,
        commandFilter: filters.commandFilter,
        wordFilter: filters.wordFilter,
    };
}

function matches(rules: string[][], pred: (arg: string) => boolean) {
    return (
        rules.length > 0 && rules.every((args) => args.some((arg) => pred(arg)))
    );
}
