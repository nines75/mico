import type { Thread } from "@/types/api/comment-api.types";
import type { Settings } from "@/types/storage/settings.types";
import { BodyFilter } from "./filter/body-filter";
import { UserIdFilter } from "./filter/user-id-filter";
import { ScoreFilter } from "./filter/score-filter";
import { CommandsFilter } from "./filter/commands-filter";
import { CommentAssistFilter } from "./filter/comment-assist-filter";
import { EasyCommentFilter } from "./filter/easy-comment-filter";
import { getRuleFilters } from "./rule-filter";
import type { StrictData } from "./strict-filter";
import { getStrictFilters } from "./strict-filter";
import type { Tab } from "@/types/storage/tab.types";
import type { PartialComment } from "@/types/storage/log.types";

export type Filters = FilteringResult["filters"];

export interface FilteringResult {
  filters: {
    userIdFilter: UserIdFilter;
    easyCommentFilter: EasyCommentFilter;
    commentAssistFilter: CommentAssistFilter;
    scoreFilter: ScoreFilter;
    commandsFilter: CommandsFilter;
    bodyFilter: BodyFilter;
  };
  loadedCommentCount: number;
  strictData: StrictData[];
  allComments: PartialComment[];
}

export function filterComment(
  threads: Thread[],
  settings: Settings,
  tab: Tab,
): FilteringResult | undefined {
  if (!settings.enableCommentFilter) return;

  // -------------------------------------------------------------------------------------------
  // フィルタリングと関係ない処理
  // -------------------------------------------------------------------------------------------

  // 動画の総コメント数を取得
  const loadedCommentCount = threads.reduce(
    (sum, thread) => sum + thread.comments.length,
    0,
  );

  // 全てのコメントを保存
  const allComments = threads.flatMap((thread) =>
    thread.comments.map(({ body, userId, score }) => {
      return { body, userId, score };
    }),
  );

  // -------------------------------------------------------------------------------------------
  // フィルタリングの前処理
  // -------------------------------------------------------------------------------------------

  // フィルター初期化
  const userIdFilter = new UserIdFilter(settings);
  const easyCommentFilter = new EasyCommentFilter(settings);
  const commentAssistFilter = new CommentAssistFilter(settings);
  const scoreFilter = new ScoreFilter(settings);
  const commandsFilter = new CommandsFilter(settings);
  const bodyFilter = new BodyFilter(settings);

  const filters: Filters = {
    userIdFilter,
    easyCommentFilter,
    commentAssistFilter,
    scoreFilter,
    commandsFilter,
    bodyFilter,
  };
  const ruleFilters = getRuleFilters(filters);
  const strictFilters = getStrictFilters(filters);

  // 適用するルールを決定
  for (const filter of Object.values(ruleFilters)) {
    filter.filterRules(tab);
  }

  // -------------------------------------------------------------------------------------------
  // フィルタリング
  // -------------------------------------------------------------------------------------------

  // strictルールのみでフィルタリング
  for (const filter of Object.values(strictFilters)) {
    filter.apply(threads, true);
  }

  const strictData: StrictData[] = [];
  for (const filter of Object.values(strictFilters)) {
    for (const data of filter.getStrictData()) {
      if (strictData.some(({ userId }) => userId === data.userId)) continue;

      strictData.push(data);
    }
  }

  // strictルールによってフィルタリングされたユーザーIDをフィルターに反映
  const ruleIds = userIdFilter.updateFilter(strictData);

  // 生成されたルールIDをstrictDataに反映
  for (const [index, ruleId] of ruleIds.entries()) {
    const data = strictData[index];
    if (data === undefined) continue;

    data.ruleId = ruleId;
  }

  // フィルタリング
  for (const filter of Object.values(filters)) {
    filter.apply(threads);
  }

  return {
    filters,
    loadedCommentCount,
    strictData,
    allComments,
  };
}
