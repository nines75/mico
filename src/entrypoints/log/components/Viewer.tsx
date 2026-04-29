import { useMemo } from "#imports";
import { sendMessage } from "@/utils/browser";
import { isString, catchAsync } from "@/utils/util";
import { AG_GRID_LOCALE_JP } from "@ag-grid-community/locale";
import type {
  ColDef,
  ICellRendererParams,
  LocaleText,
  Theme,
} from "ag-grid-community";
import { themeQuartz, colorSchemeDark } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Trash } from "lucide-react";
import type { Row as CommentRow } from "./CommentViewer";
import type { Row as VideoRow } from "./VideoViewer";

interface ViewerProps<T> {
  filter: string;
  filters: string[];
  setFilter: (filter: string) => void;
  rows: T[];
  cols: ColDef<T>[];
}

export function Viewer<T>({
  filter,
  filters,
  setFilter,
  rows,
  cols,
}: ViewerProps<T>) {
  // コンポーネントに渡すプロパティのうちobjectであるものにはuseMemoを使う
  // https://www.ag-grid.com/react-data-grid/react-hooks/#object-properties
  const defaultColDef = useMemo<ColDef>(() => ({ filter: true }), []);
  const theme = useMemo<Theme>(
    () =>
      themeQuartz.withPart(colorSchemeDark).withParams({
        fontFamily: "Consolas, monospace",
        textColor: "var(--dim-white)",
      }),
    [],
  );
  const localeText = useMemo<LocaleText>(() => {
    return AG_GRID_LOCALE_JP;
  }, []);

  return (
    <>
      <div>
        <select
          className="filter-select"
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value);
          }}
        >
          {filters.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <span className="blocked">ブロック数:{rows.length}</span>
      </div>
      <div className="log">
        <AgGridReact<T>
          rowData={rows}
          columnDefs={cols}
          defaultColDef={defaultColDef}
          theme={theme}
          localeText={localeText}
          // テキストの選択を有効化
          enableCellTextSelection={true}
          // セルの値が同じ場合に結合する
          enableCellSpan={true}
          // 常にマルチソートを有効にする
          alwaysMultiSort={true}
          // 文字列がセル幅を超えたときツールチップを表示
          tooltipShowMode="whenTruncated"
          tooltipShowDelay={500}
          // ツールチップを選択可能にする
          tooltipInteraction={true}
        />
      </div>
    </>
  );
}

export function RuleCell(
  params: ICellRendererParams<CommentRow | VideoRow, string | RegExp>,
) {
  const value = params.value;
  if (value === null || value === undefined) return null;

  const ruleId = params.data?.ruleId;
  if (ruleId === undefined || !isString(value)) return value.toString();

  return (
    <div className="rule">
      <button
        className="rule-remove-button"
        onClick={catchAsync(async () => {
          if (!confirm(`以下のルールを削除しますか？\n\n${value}`)) return;

          await sendMessage({ type: "remove-auto-rule", data: [ruleId] });
        })}
      >
        <Trash size={16} />
      </button>
      {value}
    </div>
  );
}
