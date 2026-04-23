import type { Settings } from "@/types/storage/settings.types";
import type { ConditionalPick } from "type-fest";
import { parseFilter } from "../parse-filter";
import type { Filters } from "./filter-comment";
import { Filter } from "./filter";
import type { Tab } from "@/types/storage/tab.types";
import { objectKeys } from "ts-extras";
import { createRules, type Rule } from "../rule";

export abstract class RuleFilter extends Filter {
    private includeCount = 0;
    private excludeCount = 0;
    protected rules: Rule[];

    constructor(settings: Settings, target: keyof Rule["target"]) {
        super(settings);

        const { rules } = parseFilter(settings);
        this.rules = createRules(settings, target, rules);
    }

    getIncludeCount(): number {
        return this.includeCount;
    }
    getExcludeCount(): number {
        return this.excludeCount;
    }

    filterRules(tab: Tab) {
        const { videoId, ownerId, seriesId } = tab;
        const tags = new Set(tab.tags.map((tag) => tag.toLowerCase()));

        this.rules = this.rules.filter(({ include, exclude }) => {
            // ルールを無効化するか判定
            if (
                matches(exclude.tags, (arg) => tags.has(arg)) ||
                matches(exclude.videoIds, (arg) => arg === videoId) ||
                matches(exclude.userIds, (arg) => arg === ownerId) ||
                matches(exclude.seriesIds, (arg) => arg === seriesId)
            ) {
                this.excludeCount++;
                return false;
            }

            // ルールを有効化するか判定
            if (
                matches(include.tags, (arg) => tags.has(arg)) ||
                matches(include.videoIds, (arg) => arg === videoId) ||
                matches(include.userIds, (arg) => arg === ownerId) ||
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
