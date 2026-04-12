import type { Settings } from "@/types/storage/settings.types";
import type { ConditionalPick } from "type-fest";
import type { Filters } from "./filter-comment";
import { RuleFilter } from "./rule-filter";
import type { Thread } from "@/types/api/comment.types";
import type { Rule } from "../rule";
import { isString } from "@/utils/util";

export interface StrictData {
    userId: string;
    context: string;
}

export abstract class StrictFilter extends RuleFilter {
    protected ngUserIds: Set<string>;
    protected strictData: StrictData[] = [];

    constructor(settings: Settings, target: keyof Rule["target"]) {
        super(settings, target);

        this.ngUserIds = new Set(
            settings.autoFilter
                .filter(
                    (rule) =>
                        rule.target?.commentUserId === true &&
                        rule.include === undefined &&
                        rule.exclude === undefined,
                )
                .map(({ pattern }) => pattern)
                .filter((pattern) => isString(pattern)),
        );
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
): ConditionalPick<Filters, StrictFilter> {
    return {
        commandFilter: filters.commandFilter,
        wordFilter: filters.wordFilter,
    };
}
