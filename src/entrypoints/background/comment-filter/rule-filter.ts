import type { Settings } from "@/types/storage/settings.types";
import type { ConditionalPick } from "type-fest";
import { parseFilter } from "../parse-filter";
import type { Filters } from "./filter-comment";
import { Filter } from "./filter";
import type { Tab } from "@/types/storage/tab.types";
import { objectKeys } from "ts-extras";
import { createRules, type Rule } from "../rule";

export abstract class RuleFilter extends Filter {
  private enabledCount = 0;
  private disabledCount = 0;
  protected rules: Rule[];

  constructor(settings: Settings, target: keyof Rule["target"]) {
    super(settings);

    const { rules } = parseFilter(settings.manualFilter);
    this.rules = createRules(settings, target, rules);
  }

  getEnabledCount(): number {
    return this.enabledCount;
  }
  getDisabledCount(): number {
    return this.disabledCount;
  }

  filterRules(tab: Tab) {
    const { videoId, ownerId, seriesId } = tab;
    const tags = new Set(tab.tags.map((tag) => tag.toLowerCase()));

    this.rules = this.rules.filter(({ enable, disable }) => {
      // ルールを無効化するか判定
      if (
        matches(disable.tags, (arg) => tags.has(arg)) ||
        matches(disable.videoIds, (arg) => arg === videoId) ||
        matches(disable.userIds, (arg) => arg === ownerId) ||
        matches(disable.seriesIds, (arg) => arg === seriesId)
      ) {
        this.disabledCount++;
        return false;
      }

      // ルールを有効化するか判定
      if (
        matches(enable.tags, (arg) => tags.has(arg)) ||
        matches(enable.videoIds, (arg) => arg === videoId) ||
        matches(enable.userIds, (arg) => arg === ownerId) ||
        matches(enable.seriesIds, (arg) => arg === seriesId)
      ) {
        this.enabledCount++;
        return true;
      }

      return objectKeys(enable).every((key) => enable[key].length === 0);
    });
  }
}

export function getRuleFilters(
  filters: Filters,
): ConditionalPick<Filters, RuleFilter> {
  return {
    userIdFilter: filters.userIdFilter,
    commandsFilter: filters.commandsFilter,
    bodyFilter: filters.bodyFilter,
  };
}

function matches(rules: string[][], pred: (arg: string) => boolean) {
  return (
    rules.length > 0 && rules.every((args) => args.some((arg) => pred(arg)))
  );
}
