import { useMemo, useState } from "#imports";
import type {
  ColDef,
  ICellRendererParams,
  SpanRowsParams,
} from "ag-grid-community";
import { RuleCell, Viewer } from "./Viewer";
import type { FilteredVideo } from "@/types/storage/log.types";
import type { Merge, OmitIndexSignature } from "type-fest";
import type { Video } from "@/types/api/video.types";
import { Select } from "./Select";
import { useLogStore } from "../store";
import { createVideoUrl } from "@/utils/util";

export type Row = Merge<FilteredVideo, { video: OmitIndexSignature<Video> }>;

const rawFilters = [
  "id",
  "owner-id",
  "paid",
  "shorts",
  "view-count",
  "owner-name",
  "title",
] as const satisfies FilteredVideo["target"][];

export function VideoViewer() {
  const filteredVideos = useLogStore(
    (state) => state.log?.video?.filteredVideos,
  );

  const filters = rawFilters.filter((filter) => {
    const count = filteredVideos?.filter(
      ({ target }) => target === filter,
    ).length;
    if (count === undefined) return false;

    return count > 0;
  });
  const [filter, setFilter] = useState<string | undefined>(filters[0]);

  const rows = useMemo<Row[]>(
    () => filteredVideos?.filter(({ target }) => target === filter) ?? [],
    [filteredVideos, filter],
  );
  const cols = useMemo<ColDef<Row>[]>(
    () => [
      {
        field: "pattern",
        headerName: "ルール",
        width: 150,
        sort: "asc",
        sortable: false,
        cellRenderer: RuleCell,
        // レコメンドAPIはログを複数回保存するためパターンの値が同じでも参照が異なることがあり、
        // そのとき結合が行われないため文字列に変換してから比較する
        spanRows: ({ valueA, valueB }: SpanRowsParams<Row, string | RegExp>) =>
          valueA?.toString() === valueB?.toString(),
      },
      {
        field: "video.id",
        headerName: "ID",
        width: 150,
        cellRenderer: (params: ICellRendererParams<Row, string>) => {
          const videoId = params.value;
          if (videoId === null || videoId === undefined) return null;

          return (
            <a href={createVideoUrl(videoId)} target="_blank">
              {videoId}
            </a>
          );
        },
      },
      {
        field: "video.title",
        headerName: "タイトル",
        width: 350,
        tooltip: true,
      },
      {
        field: "video.owner.name",
        headerName: "投稿者",
        width: 220,
        tooltip: true,
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
