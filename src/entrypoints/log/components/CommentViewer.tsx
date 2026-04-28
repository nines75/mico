import { useMemo, useState } from "#imports";
import { escapeNewline } from "@/utils/util";
import type {
  ColDef,
  ITooltipParams,
  ValueFormatterParams,
} from "ag-grid-community";
import { RuleCell, Viewer } from "./Viewer";
import { useStorageStore } from "@/utils/store";
import type { Comment } from "@/types/api/comment.types";
import type { FilteredComment } from "@/types/storage/log.types";
import type { Merge, OmitIndexSignature } from "type-fest";

export type Row = Merge<
  FilteredComment,
  // column用のプロパティを指定する際に正しく型チェックされるようにインデックスシグネチャを除外
  { comment: OmitIndexSignature<Comment> }
> & {
  strict: boolean;
};

const filters = [
  "user-id",
  "easy-comment",
  "comment-assist",
  "score",
  "commands",
  "body",
] as const satisfies FilteredComment["target"][];

export function CommentViewer() {
  const [filter, setFilter] = useState<string>(filters[0]);
  const log = useStorageStore((state) => state.log);

  const rows = useMemo<Row[]>(
    () =>
      log?.comment?.filteredComments
        .filter(({ target }) => target === filter)
        .map((comment) => {
          const ruleId = comment.ruleId;
          const ruleIds = log.comment?.strictRuleIds;

          return {
            ...comment,
            strict: ruleId !== undefined && ruleIds?.includes(ruleId) === true,
          };
        }) ?? [],
    [log, filter],
  );
  const cols = useMemo<ColDef<Row>[]>(
    () => [
      {
        // ルール列はセルを自前でレンダリングしているためツールチップが正しく動かない
        // そのためツールチップは使わない
        field: "pattern",
        headerName: "ルール",
        width: 300,
        spanRows: true, // 値が同じセルを結合
        sort: "asc",
        sortable: false, // ルール別にソートするために、マルチソートを常に有効化させたうえでルール列のソートを固定する
        cellRenderer: RuleCell,
      },
      // ルールの左に置くとspanRowsの影響で横スクロールバーが途切れるので右に置く
      {
        field: "strict",
        headerName: "strict",
        sortable: false, // ルールでソート済みなのでソートしても変わらない
        width: 100,
        hide: rows.every((row) => !row.strict),
      },
      {
        field: "comment.body",
        headerName: "本文",
        width: 350,
        valueFormatter: (params: ValueFormatterParams<Row, string>) =>
          escapeNewline(params.value ?? ""),
        tooltipValueGetter: (params: ITooltipParams<Row, string>) =>
          escapeNewline(params.value ?? ""),
      },
      {
        field: "comment.score",
        headerName: "スコア",
        width: 150,
      },
      {
        field: "comment.nicoruCount",
        headerName: "ニコる",
        width: 150,
      },
      {
        field: "comment.commands",
        tooltipField: "comment.commands",
        headerName: "コマンド",
        width: 220,
      },
    ],
    [rows],
  );

  return (
    <Viewer<Row>
      filter={filter}
      filters={filters}
      setFilter={setFilter}
      rows={rows}
      cols={cols}
    />
  );
}
