import { useEffect, useMemo, useState } from "react";
import { useStorageStore } from "@/utils/store";
import { AgGridReact } from "ag-grid-react";
import type {
    ColDef,
    ICellRendererParams,
    ValueFormatterParams,
} from "ag-grid-community";
import { colorSchemeDark, themeQuartz } from "ag-grid-community";
import { AG_GRID_LOCALE_JP } from "@ag-grid-community/locale";
import type { FilteredComment } from "@/types/storage/log.types";
import type { Merge, OmitIndexSignature } from "type-fest";
import type { NiconicoComment } from "@/types/api/comment.types";
import { catchAsync, escapeNewline, isString } from "@/utils/util";
import { Trash } from "lucide-react";
import { sendMessageToBackground } from "@/utils/browser";

type Row = Merge<
    FilteredComment,
    // column用のプロパティを指定する際に正しく型チェックされるようにインデックスシグネチャを除外
    { comment: OmitIndexSignature<NiconicoComment> }
> & {
    strict: boolean;
};

export function Init() {
    const isLoading = useStorageStore((state) => state.isLoading);

    useEffect(() => {
        useStorageStore.getState().loadLog();
    }, []);

    if (isLoading) return null;

    return <Page />;
}

function Page() {
    const log = useStorageStore((state) => state.log);
    const [filter, setFilter] = useState<FilteredComment["target"]>("user-id");

    const defaultColDef = useMemo(() => ({ filter: true }), []);
    const theme = useMemo(
        () =>
            themeQuartz.withPart(colorSchemeDark).withParams({
                fontFamily: "Consolas, monospace",
                textColor: "var(--dim-white)",
            }),
        [],
    );
    const rows = useMemo<Row[]>(
        () =>
            log?.comment?.filteredComments
                .filter(({ target }) => target === filter)
                .map((comment) => {
                    const pattern = comment.pattern;
                    const strictUserIds = log.comment?.strictUserIds;

                    return {
                        ...comment,
                        strict:
                            comment.target === "user-id" &&
                            isString(pattern) &&
                            strictUserIds?.includes(pattern) === true,
                    };
                }) ?? [],
        [log, filter],
    );
    const cols = useMemo<ColDef<Row>[]>(
        () => [
            {
                field: "strict",
                headerName: "strict",
                width: 150,
                hide: rows.every((row) => !row.strict),
            },
            {
                // ルール列はセルを自前でレンダリングしているためツールチップが正しく動かない
                // そのためツールチップは使わない
                field: "pattern",
                headerName: "ルール",
                width: 300,
                spanRows: true, // 値が同じセルを結合
                sort: "asc",
                sortable: false,
                cellRenderer: RuleCell,
            },
            {
                field: "comment.body",
                tooltipField: "comment.body",
                headerName: "本文",
                width: 350,
                valueFormatter: (params: ValueFormatterParams<Row, string>) =>
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
        <>
            <div>
                <select
                    className="filter-select"
                    value={filter}
                    onChange={(event) => {
                        setFilter(
                            event.target.value as FilteredComment["target"],
                        );
                    }}
                >
                    {[
                        "user-id",
                        "easy-comment",
                        "comment-assist",
                        "score",
                        "commands",
                        "body",
                    ].map((value) => (
                        <option key={value} value={value}>
                            {value}
                        </option>
                    ))}
                </select>
                <span className="blocked">ブロック数:{rows.length}</span>
            </div>
            <div className="log">
                <AgGridReact<Row>
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

function RuleCell(params: ICellRendererParams<Row, string | RegExp>) {
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
