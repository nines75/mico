import { useMemo } from "#imports";
import { sendMessageToBackground } from "@/utils/browser";
import { isString, catchAsync } from "@/utils/util";
import { AG_GRID_LOCALE_JP } from "@ag-grid-community/locale";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { themeQuartz, colorSchemeDark } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Trash } from "lucide-react";

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
    const defaultColDef = useMemo(() => ({ filter: true }), []);
    const theme = useMemo(
        () =>
            themeQuartz.withPart(colorSchemeDark).withParams({
                fontFamily: "Consolas, monospace",
                textColor: "var(--dim-white)",
            }),
        [],
    );

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
                    localeText={AG_GRID_LOCALE_JP}
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
    params: ICellRendererParams<{ id?: string }, string | RegExp>,
) {
    const value = params.value;
    if (value === null || value === undefined) return null;

    const id = params.data?.id;
    if (id === undefined || !isString(value)) return value.toString();

    return (
        <div className="rule">
            <button
                className="remove-rule-button"
                onClick={catchAsync(async () => {
                    if (!confirm(`以下のルールを削除しますか？\n\n${value}`))
                        return;

                    await sendMessageToBackground({
                        type: "remove-auto-rule",
                        data: [id],
                    });
                })}
            >
                <Trash size={16} />
            </button>
            {value}
        </div>
    );
}
