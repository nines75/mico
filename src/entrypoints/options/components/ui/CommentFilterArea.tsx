import Editor from "./Editor.js";
import { useShallow } from "zustand/shallow";
import { useStorageStore } from "@/utils/store.js";
import { commentFilterSettings } from "@/utils/config.js";

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
            <div>
                {commentFilterSettings.filter.map((filter) => (
                    <button
                        key={filter.id}
                        className={`filter-button${id === filter.id ? " selected-filter-button" : ""}`}
                        onClick={() =>
                            save({ selectedCommentFilter: filter.id })
                        }
                    >
                        <span>{filter.name}</span>
                    </button>
                ))}
            </div>
            <Editor
                key={id} // idが変わった際に再マウントさせるために必要
                {...{ id }}
                value={text}
                onChange={(str) => save({ [id]: str })}
            />
        </div>
    );
}
