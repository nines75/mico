import type { Settings } from "@/types/storage/settings.types";
import type { ConditionalPick } from "type-fest";
import type { Filters } from "./filter-comment";
import { RuleFilter } from "./rule-filter";
import type { Thread } from "@/types/api/comment-api.types";
import type { Rule } from "../rule";
import { isString } from "@/utils/util";

export interface StrictData {
    ruleId?: string;
    userId: string;
    context: string;
}

export abstract class StrictFilter extends RuleFilter {
    protected userIds: Set<string>;
    protected strictData: StrictData[] = [];

    constructor(settings: Settings, target: keyof Rule["target"]) {
        super(settings, target);

        this.userIds = new Set(
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

    abstract override apply(threads: Thread[], strictOnly?: boolean): void;

    getStrictData() {
        return this.strictData;
    }
}

export function getStrictFilters(
    filters: Filters,
): ConditionalPick<Filters, StrictFilter> {
    return {
        commandsFilter: filters.commandsFilter,
        bodyFilter: filters.bodyFilter,
    };
}
