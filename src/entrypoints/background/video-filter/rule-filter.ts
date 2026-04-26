import type { Settings } from "@/types/storage/settings.types";
import type { ConditionalPick } from "type-fest";
import { parseFilter } from "../parse-filter";
import { createRules, type Rule } from "../rule";
import type { Filters } from "./filter-video";
import { Filter } from "./filter";
import type { FilteredVideo } from "@/types/storage/log.types";

export abstract class RuleFilter extends Filter {
    protected rules: Rule[];
    protected target: FilteredVideo["target"];

    constructor(
        settings: Settings,
        target: keyof Rule["target"],
        logTarget: FilteredVideo["target"],
    ) {
        super(settings);

        const { rules } = parseFilter(settings);
        this.rules = createRules(settings, target, rules);

        this.target = logTarget;
    }
}

export function getRuleFilters(
    filters: Filters,
): ConditionalPick<Filters, RuleFilter> {
    return {
        idFilter: filters.idFilter,
        ownerIdFilter: filters.ownerIdFilter,
        ownerNameFilter: filters.ownerNameFilter,
        titleFilter: filters.titleFilter,
    };
}
