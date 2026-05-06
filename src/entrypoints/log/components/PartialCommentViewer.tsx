import { useMemo } from "#imports";
import { escapeNewline } from "@/utils/util";
import type {
  ColDef,
  ITooltipParams,
  ValueFormatterParams,
} from "ag-grid-community";
import { Viewer } from "./Viewer";
import { useStorageStore } from "@/utils/store";
import type { PartialComment } from "@/types/storage/log.types";

type Row = PartialComment;

export function PartialCommentViewer() {
  const log = useStorageStore((state) => state.log);

  const rows = useMemo<Row[]>(
    () =>
      log?.comment?.allComments.filter(
        ({ userId }) => userId === useStorageStore.getState().userId,
      ) ?? [],
    [log],
  );
  const cols = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "body",
        headerName: "本文",
        width: 950,
        valueFormatter: (params: ValueFormatterParams<Row, string>) =>
          escapeNewline(params.value ?? ""),
        tooltipValueGetter: (params: ITooltipParams<Row, string>) =>
          escapeNewline(params.value ?? ""),
      },
      {
        field: "score",
        headerName: "スコア",
        width: 150,
      },
      {
        field: "nicoruCount",
        headerName: "ニコる",
        width: 150,
      },
    ],
    [],
  );

  return <Viewer<Row> {...{ rows, cols }} />;
}
