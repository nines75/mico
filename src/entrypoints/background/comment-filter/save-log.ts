import type { FilteringResult } from "./filter-comment";
import { sum } from "@/utils/util";
import { mergeCount, setLog } from "@/utils/db";
import type { ConditionalKeys } from "type-fest";
import type { RuleFilter } from "./rule-filter";
import { getRuleFilters } from "./rule-filter";
import { setBadgeState } from "@/utils/browser";
import type { Count, Log } from "@/types/storage/log.types";

export async function saveLog(
  result: FilteringResult,
  logId: string,
  tabId: number,
) {
  const comment = createCommentLog(result);
  const count = createCountLog(result);

  await Promise.all([
    setLog(
      async () => {
        return {
          comment,
          count: await mergeCount(count, logId),
        };
      },
      logId,
      tabId,
    ),
    setBadgeState(count.blockedComment, "comment", tabId),
  ]);
}

export function createCommentLog(
  result: FilteringResult,
): NonNullable<Log["comment"]> {
  const strictRuleIds: string[] = [];
  for (const { ruleId } of result.strictData) {
    if (ruleId !== undefined) strictRuleIds.push(ruleId);
  }

  const filteredComments = Object.values(result.filters).flatMap((filter) =>
    filter.getFilteredComments(),
  );
  const renderedComments = result.threads.flatMap((thread) =>
    thread.comments.map(({ body, userId, score }) => {
      return { body, userId, score };
    }),
  );

  return {
    strictRuleIds,
    filteredComments,
    renderedComments,
  };
}

export function createCountLog(result: FilteringResult) {
  const filters = result.filters;
  const ruleFilters = getRuleFilters(filters);

  const calc = (key: ConditionalKeys<RuleFilter, () => number>) => {
    return sum(Object.values(ruleFilters).map((filter) => filter[key]()));
  };

  return {
    blockedComment: sum(
      Object.values(filters).map(
        (filter) => filter.getFilteredComments().length,
      ),
    ),
    loadedComment: result.loadedCommentCount,
    include: calc("getIncludeCount"),
    exclude: calc("getExcludeCount"),
    disable: filters.commandsFilter.getDisableCount(),
  } satisfies Count;
}
