import Editor from "./Editor";
import { useShallow } from "zustand/shallow";
import { useStorageStore } from "@/utils/store";
import clsx from "clsx";
import ImportFilterButton from "./ImportFilterButton";

export type CommentFilterId = "ngUserId" | "ngCommand" | "ngWord";

export interface CommentFilterAreaProps {
    id: CommentFilterId;
    name: string;
}

export default function CommentFilterArea() {
    const id = useStorageStore((state) => state.settings.selectedCommentFilter);
    const [text, save] = useStorageStore(
        useShallow((state) => [state.settings[id], state.saveSettings]),
    );

    return (
        <div className="setting">
            <div className="button-container">
                {commentFilterAreaConfig.map((filter) => (
                    <button
                        key={filter.id}
                        className={clsx(
                            "common-button",
                            "filter-button",
                            id === filter.id && "selected-filter-button",
                        )}
                        onClick={() => {
                            save({ selectedCommentFilter: filter.id });
                        }}
                    >
                        {filter.name}
                    </button>
                ))}
                <ImportFilterButton id={id} />
            </div>
            <Editor
                key={id} // idが変わった際に再マウントさせるために必要
                {...{ id }}
                value={text}
                onChange={(str) => {
                    save({ [id]: str });
                }}
            />
        </div>
    );
}

// -------------------------------------------------------------------------------------------
// config
// -------------------------------------------------------------------------------------------

export const commentFilterAreaConfig = [
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
] satisfies CommentFilterAreaProps[];
