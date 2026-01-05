import type { Settings } from "@/types/storage/settings.types.js";
import type { ConditionalPick } from "type-fest";
import type { Filters } from "./filter-comment.js";
import { RuleFilter } from "./rule-filter.js";
import type { Thread } from "@/types/api/comment.types.js";

export abstract class StrictFilter<T> extends RuleFilter<T> {
    protected ngUserIds: Set<string>;
    protected strictData: { userId: string; context: string }[] = [];

    constructor(settings: Settings, ngUserIds: Set<string>, filter: string) {
        super(settings, filter);

        this.ngUserIds = ngUserIds;
    }

    abstract override filtering(
        threads: Thread[],
        isStrictOnly?: boolean,
    ): void;

    getStrictData() {
        return this.strictData;
    }
}

export function getStrictFilters(
    filters: Filters,
): ConditionalPick<Filters, StrictFilter<unknown>> {
    return {
        commandFilter: filters.commandFilter,
        wordFilter: filters.wordFilter,
    };
}
