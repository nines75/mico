import type { Settings } from "@/types/storage/settings.types";
import type { ConditionalPick } from "type-fest";
import { parseFilter } from "../parse-filter";
import { createRules, type Rule } from "../rule";
import type { Filters } from "./filter-video";
import { Filter } from "./filter";
import type { FilteredVideo } from "@/types/storage/log-video.types";

export abstract class RuleFilter extends Filter {
    protected rules: Rule[];
    protected invalidCount = 0;
    protected target: FilteredVideo["target"];

    constructor(
        settings: Settings,
        target: keyof Rule["target"],
        logTarget: FilteredVideo["target"],
    ) {
        super(settings);

        const { rules, invalidCount } = parseFilter(settings);
        this.rules = createRules(settings, target, rules);
        this.invalidCount += invalidCount;

        this.target = logTarget;
    }

    getInvalidCount(): number {
        return this.invalidCount;
    }
}

export function getRuleFilters(
    filters: Filters,
): ConditionalPick<Filters, RuleFilter> {
    return {
        videoIdFilter: filters.videoIdFilter,
        videoOwnerIdFilter: filters.videoOwnerIdFilter,
        userNameFilter: filters.userNameFilter,
        titleFilter: filters.titleFilter,
    };
}
