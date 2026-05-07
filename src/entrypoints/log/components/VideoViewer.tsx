import { useMemo, useState } from "#imports";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { RuleCell, Viewer } from "./Viewer";
import { useLogStore } from "@/utils/store";
import type { FilteredVideo } from "@/types/storage/log.types";
import type { Merge, OmitIndexSignature } from "type-fest";
import type { Video } from "@/types/api/video.types";
import { Select } from "./Select";

export type Row = Merge<FilteredVideo, { video: OmitIndexSignature<Video> }>;

const filters = [
  "id",
  "owner-id",
  "paid",
  "view-count",
  "owner-name",
  "title",
] as const satisfies FilteredVideo["target"][];

export function VideoViewer() {
  const [filter, setFilter] = useState<string>(filters[0]);
  const log = useLogStore((state) => state.log);

  const rows = useMemo<Row[]>(
    () =>
      log?.video?.filteredVideos.filter(({ target }) => target === filter) ??
      [],
    [log, filter],
  );
  const cols = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "pattern",
        headerName: "ルール",
        width: 150,
        spanRows: true, // 値が同じセルを結合
        sort: "asc",
        sortable: false,
        cellRenderer: RuleCell,
      },
      {
        field: "video.id",
        headerName: "ID",
        width: 150,
        cellRenderer: (params: ICellRendererParams<Row, string>) => {
          const videoId = params.value;
          if (videoId === null || videoId === undefined) return null;

          return (
            <a
              href={`https://www.nicovideo.jp/watch/${videoId}`}
              target="_blank"
              rel="noreferrer"
            >
              {videoId}
            </a>
          );
        },
      },
      {
        field: "video.title",
        tooltipField: "video.title",
        headerName: "タイトル",
        width: 350,
      },
      {
        field: "video.owner.name",
        tooltipField: "video.owner.name",
        headerName: "投稿者",
        width: 220,
      },
      {
        field: "video.count.view",
        headerName: "再生回数",
        width: 160,
      },
    ],
    [],
  );

  return (
    <>
      <Select {...{ filter, filters, setFilter, blockedCount: rows.length }} />
      <Viewer<Row> {...{ rows, cols }} />
    </>
  );
}
