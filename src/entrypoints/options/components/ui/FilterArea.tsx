import Editor from "./Editor";
import { useShallow } from "zustand/shallow";
import { useStorageStore } from "@/utils/store";
import clsx from "clsx";
import ImportFilterButton from "./ImportFilterButton";
import H2 from "./H2";

export type FilterId =
    | "ngUserId"
    | "ngCommand"
    | "ngWord"
    | "ngId"
    | "ngTitle"
    | "ngUserName";

export interface FilterAreaProps {
    id: FilterId;
    name: string;
}

export default function FilterArea() {
    const id = useStorageStore((state) => state.settings.selectedFilter);
    const [text, save] = useStorageStore(
        useShallow((state) => [state.settings[id], state.saveSettings]),
    );

    return (
        <>
            {config.map(({ name, buttons, hasImportButton }) => (
                <H2 name={name} key={name}>
                    <div className="button-container">
                        {buttons.map((filter) => (
                            <button
                                key={filter.id}
                                className={clsx(
                                    "common-button",
                                    "filter-button",
                                    id === filter.id &&
                                        "selected-filter-button",
                                )}
                                onClick={() => {
                                    save({ selectedFilter: filter.id });
                                }}
                            >
                                {filter.name}
                            </button>
                        ))}
                        {hasImportButton && <ImportFilterButton id={id} />}
                    </div>
                </H2>
            ))}
            <Editor
                key={id} // idが変わった際に再マウントさせるために必要
                {...{ id }}
                value={text}
                onChange={(value) => {
                    save({ [id]: value });
                }}
            />
        </>
    );
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

const config = [
    {
        name: "コメントフィルター",
        buttons: [
            {
                id: "ngUserId",
                name: "NGユーザーID",
            },
            {
                id: "ngCommand",
                name: "NGコマンド",
            },
            {
                id: "ngWord",
                name: "NGワード",
            },
        ],
    },
    {
        name: "動画フィルター",
        hasImportButton: true,
        buttons: [
            {
                id: "ngId",
                name: "NGユーザーID・NG動画ID",
            },
            {
                id: "ngUserName",
                name: "NGユーザー名",
            },
            {
                id: "ngTitle",
                name: "NGタイトル",
            },
        ],
    },
] satisfies {
    name: string;
    hasImportButton?: boolean;
    buttons: FilterAreaProps[];
}[];
